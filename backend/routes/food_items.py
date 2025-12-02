from datetime import datetime, timedelta
from flask import jsonify, request, g
from extensions import db_cursor, get_db, create_api_blueprint, document_api_route, handle_db_error

bp = create_api_blueprint('food_items', '/api/food-items')


def _get_current_user_household():
    user = getattr(g, 'current_user', None)
    if not user:
        return None, (jsonify({"error": "Not authenticated"}), 401)
    household_id = user.get("HouseholdID")
    if household_id is None:
        return None, (jsonify({"error": "Forbidden"}), 403)
    return household_id, None


def _ensure_food_item_access(food_item_id):
    household_id, error = _get_current_user_household()
    if error:
        return error

    with db_cursor() as cursor:
        cursor.execute("""
            SELECT HouseholdID
            FROM FoodItem
            WHERE FoodItemID = %s
              AND IsArchived = 0
            LIMIT 1
        """, (food_item_id,))
        row = cursor.fetchone()

    if not row:
        return jsonify({'error': 'Food item not found'}), 404

    item_household_id = row.get("HouseholdID")
    if item_household_id is None or household_id is None:
        return jsonify({"error": "Forbidden"}), 403
    if item_household_id != household_id:
        return jsonify({"error": "Forbidden"}), 403

    return None



@document_api_route(bp, 'get', '/<int:food_item_id>', 'Get food item by ID', 'Returns a single food item by its ID')
@handle_db_error
def get_food_item(food_item_id):
    unauthorized = _ensure_food_item_access(food_item_id)
    if unauthorized:
        return unauthorized

    with db_cursor() as cursor:
        query = """
            SELECT 
                fi.FoodItemID,
                fi.Name,
                fi.Type,
                fi.Category,
                fi.BaseUnitID,
                fi.HouseholdID,
                fi.PreferredPackageID,
                bu.Abbreviation AS BaseUnit,
                p.Label AS PackageLabel,
                p.BaseUnitAmt AS PackageBaseUnitAmt,

                (
                    SELECT sl.TargetLevel
                    FROM StockLevel sl
                    WHERE sl.FoodItemID = fi.FoodItemID
                    LIMIT 1
                ) AS TargetLevel,

                (
                    SELECT pl.PriceTotal
                    FROM PriceLog pl
                    WHERE pl.PackageID = fi.PreferredPackageID
                    ORDER BY pl.CreatedAt DESC
                    LIMIT 1
                ) AS LatestPrice,

                (
                    SELECT pl.Store
                    FROM PriceLog pl
                    WHERE pl.PackageID = fi.PreferredPackageID
                    ORDER BY pl.CreatedAt DESC
                    LIMIT 1
                ) AS LatestStore

            FROM FoodItem fi
            JOIN BaseUnit bu ON fi.BaseUnitID = bu.UnitID
            LEFT JOIN Package p ON fi.PreferredPackageID = p.PackageID
                AND (p.IsArchived = 0 OR p.IsArchived IS NULL)
            WHERE fi.FoodItemID = %s
              AND fi.IsArchived = 0
        """
        cursor.execute(query, (food_item_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Food item not found'}), 404
        
        return jsonify(result), 200

# get items not on active list
@document_api_route(bp, 'get', '/not-on-active-list', 'Get items not on active list', 'Returns food items that are not currently on the active shopping list')
@handle_db_error
def get_items_not_on_active_list():
    household_id = request.args.get('household_id')
    
    if not household_id:
        return jsonify({'error': 'household_id is required'}), 400
    
    with db_cursor() as cursor:
        query = """
            SELECT 
                fi.FoodItemID AS FoodItemID,
                fi.Name AS FoodItemName,
                IFNULL(pl.PriceTotal, 0) AS PricePerUnit,
                0 AS PurchasedQty,
                0 AS NeededQty,
                0 AS TotalPrice,
                'active' AS Status,
                ROUND(getCurrentStock(fi.FoodItemID) / IFNULL(pp.BaseUnitAmt, 1), 2) AS CurrentStock,
                loc.LocationID AS LocationID,
                pp.PackageID AS PackageID,
                pp.BaseUnitAmt AS PackageBaseUnitAmt,
                ROUND(IFNULL(sl.TargetLevel, 0) / IFNULL(pp.BaseUnitAmt, 1), 2) AS TargetLevel
            FROM FoodItem fi
            LEFT JOIN StockLevel sl ON fi.FoodItemID = sl.FoodItemID
            LEFT JOIN Package pp ON fi.PreferredPackageID = pp.PackageID
                AND (pp.IsArchived = 0 OR pp.IsArchived IS NULL)
            LEFT JOIN (
                SELECT pl1.PackageID, pl1.PriceTotal
                FROM PriceLog pl1
                INNER JOIN (
                    SELECT PackageID, MAX(CreatedAt) AS MaxCreatedAt
                    FROM PriceLog
                    GROUP BY PackageID
                ) pl2 ON pl1.PackageID = pl2.PackageID AND pl1.CreatedAt = pl2.MaxCreatedAt
            ) pl ON pp.PackageID = pl.PackageID
            LEFT JOIN (
                SELECT l1.LocationID, l1.HouseholdID
                FROM Location l1
                INNER JOIN (
                    SELECT HouseholdID, MIN(LocationID) AS MinLocationID
                    FROM Location
                    GROUP BY HouseholdID
                ) l2 ON l1.HouseholdID = l2.HouseholdID AND l1.LocationID = l2.MinLocationID
            ) loc ON fi.HouseholdID = loc.HouseholdID
            WHERE fi.HouseholdID = %s
                AND fi.IsArchived = 0
                AND fi.FoodItemID NOT IN (
                    SELECT sli.FoodItemID
                    FROM ShoppingList sl
                    JOIN ShoppingListItem sli ON sl.ShoppingListID = sli.ShoppingListID
                    WHERE sl.HouseholdID = %s
                      AND sl.Status = 'active'
                )
            ORDER BY fi.Name
        """
        
        cursor.execute(query, (household_id, household_id))
        results = cursor.fetchall()
        
        return jsonify(results), 200


@document_api_route(bp, 'get', '/base-units', 'Get all base units', 'Returns a list of all available base units')
@handle_db_error
def get_base_units():
    with db_cursor() as cursor:
        query = """
            SELECT UnitID, MeasurementType, Abbreviation
            FROM BaseUnit
            ORDER BY MeasurementType
        """
        cursor.execute(query)
        results = cursor.fetchall()
        return jsonify(results), 200


@document_api_route(bp, 'get', '/package-labels', 
                    'Get unique package labels by household', 'Returns a list of unique package labels for a specific household')
@handle_db_error
def get_package_labels():
    household_id = request.args.get('household_id')
    
    if not household_id:
        return jsonify({'error': 'household_id is required'}), 400
    
    with db_cursor() as cursor:
        query = """
            SELECT DISTINCT p.Label
            FROM Package p
            JOIN FoodItem f ON p.FoodItemID = f.FoodItemID
            WHERE f.HouseholdID = %s
              AND f.IsArchived = 0
              AND (p.IsArchived = 0 OR p.IsArchived IS NULL)
              AND p.Label IS NOT NULL AND p.Label != ''
            ORDER BY p.Label
        """
        cursor.execute(query, (household_id,))
        results = cursor.fetchall()
        labels = [row['Label'].capitalize() for row in results if row.get('Label')]
        return jsonify(labels), 200


@document_api_route(bp, 'post', '/add', 'Add new food item', 'Creates a new food item with package, stock level, and inventory transaction')
@handle_db_error
def add_new_food_item():
    data = request.get_json()

    expiration_date = data.get('expiration_date')
    if not expiration_date:
        expiration_date = (datetime.utcnow() + timedelta(days=14)).date().isoformat()
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.callproc('AddNewFoodItem', [
            data.get('food_name'),
            data.get('type') or '',
            data.get('category'),
            data.get('base_unit_id'),
            data.get('household_id'),
            data.get('package_label'),
            data.get('package_base_unit_amt'),
            data.get('location_id'),
            data.get('target_level'),
            data.get('quantity'),
            data.get('user_id'),
            expiration_date,
            data.get('price_per_item'),
            data.get('store')
        ])
        cursor.fetchall()
        conn.commit()
        
        return jsonify({'message': 'Added to inventory!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@document_api_route(bp, 'put', '/<int:food_item_id>', 'Update food item metadata', 'Updates basic fields for an existing food item and its preferred package')
@handle_db_error
def update_food_item(food_item_id):
    unauthorized = _ensure_food_item_access(food_item_id)
    if unauthorized:
        return unauthorized

    data = request.get_json()

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            UPDATE FoodItem
            SET Name = %s,
                Type = %s,
                Category = %s
            WHERE FoodItemID = %s
        """, (
            data.get('food_name'),
            data.get('type') or '',
            data.get('category'),
            food_item_id
        ))

        cursor.execute("""
            SELECT PreferredPackageID
            FROM FoodItem
            WHERE FoodItemID = %s
        """, (food_item_id,))
        row = cursor.fetchone()
        preferred_package_id = row['PreferredPackageID'] if row else None

        new_label = data.get('package_label')
        new_base_amt = data.get('package_base_unit_amt')

        effective_package_id = preferred_package_id
        effective_base_amt = None

        if new_label is not None and new_base_amt is not None:
            current_label = None
            current_base_amt = None
            if preferred_package_id:
                cursor.execute("""
                    SELECT Label, BaseUnitAmt
                    FROM Package
                    WHERE PackageID = %s
                """, (preferred_package_id,))
                pkg_row = cursor.fetchone()
                if pkg_row:
                    current_label = pkg_row.get('Label')
                    current_base_amt = pkg_row.get('BaseUnitAmt')
                    
            if current_label != new_label or float(current_base_amt or 0) != float(new_base_amt):
                cursor.execute("""
                    INSERT INTO Package (FoodItemID, Label, BaseUnitAmt)
                    VALUES (%s, %s, %s)
                """, (food_item_id, new_label, new_base_amt))
                new_package_id = cursor.lastrowid

                cursor.execute("""
                    UPDATE FoodItem
                    SET PreferredPackageID = %s
                    WHERE FoodItemID = %s
                """, (new_package_id, food_item_id))

                effective_package_id = new_package_id
                effective_base_amt = float(new_base_amt)
            else:
                effective_package_id = preferred_package_id
                effective_base_amt = float(current_base_amt) if current_base_amt is not None else None
        else:
            if preferred_package_id:
                cursor.execute("""
                    SELECT BaseUnitAmt
                    FROM Package
                    WHERE PackageID = %s
                """, (preferred_package_id,))
                pkg_row = cursor.fetchone()
                if pkg_row:
                    effective_base_amt = float(pkg_row.get('BaseUnitAmt') or 0)

        target_level_packages = data.get('target_level')
        if target_level_packages is not None and effective_base_amt:
            try:
                target_level_packages = float(target_level_packages)
                target_level_base_units = target_level_packages * effective_base_amt

                cursor.execute("""
                    SELECT 1 FROM StockLevel WHERE FoodItemId = %s
                """, (food_item_id,))
                exists = cursor.fetchone()

                if exists:
                    cursor.execute("""
                        UPDATE StockLevel
                        SET TargetLevel = %s
                        WHERE FoodItemId = %s
                    """, (target_level_base_units, food_item_id))
                else:
                    cursor.execute("""
                        INSERT INTO StockLevel (FoodItemId, TargetLevel)
                        VALUES (%s, %s)
                    """, (food_item_id, target_level_base_units))
            except (TypeError, ValueError):
                pass

        price_per_item = data.get('price_per_item')
        store = data.get('store')
        if price_per_item is not None and effective_package_id is not None:
            try:
                price_value = float(price_per_item)
            except (TypeError, ValueError):
                price_value = None

            normalized_store = (store or '').strip().lower() or None

            if price_value is not None:
                cursor.execute("""
                    SELECT PriceTotal, Store
                    FROM PriceLog
                    WHERE PackageID = %s
                    ORDER BY CreatedAt DESC
                    LIMIT 1
                """, (effective_package_id,))
                price_log_row = cursor.fetchone() or {}

                latest_price = price_log_row.get('PriceTotal')
                latest_store = (price_log_row.get('Store') or '').strip().lower() or None

                price_changed = latest_price is None or latest_price != price_value
                store_changed = latest_store != normalized_store

                if price_changed or store_changed:
                    cursor.execute("""
                        INSERT INTO PriceLog (PackageID, PriceTotal, Store)
                        VALUES (%s, %s, %s)
                    """, (effective_package_id, price_value, normalized_store))

        conn.commit()

        return jsonify({'message': 'Food item updated successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@document_api_route(bp, 'delete', '/<int:food_item_id>', 'Archive food item', 'Soft deletes a food item and packages')
@handle_db_error
def archive_food_item(food_item_id):
    unauthorized = _ensure_food_item_access(food_item_id)
    if unauthorized:
        return unauthorized

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            UPDATE FoodItem
            SET IsArchived = 1
            WHERE FoodItemID = %s
              AND IsArchived = 0
        """, (food_item_id,))

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({'error': 'Item not found'}), 404

        cursor.execute("""
            UPDATE Package
            SET IsArchived = 1
            WHERE FoodItemID = %s
              AND (IsArchived = 0 OR IsArchived IS NULL)
        """, (food_item_id,))

        conn.commit()

        return jsonify({'message': 'Item archived.'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
