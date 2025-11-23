from flask import jsonify, request
from extensions import db_cursor, get_db, create_api_blueprint, document_api_route, handle_db_error

bp = create_api_blueprint('food_items', '/api/food-items')


@document_api_route(bp, 'get', '/', 'Get all food items', 'Returns a list of food items (limited to 50)')
@handle_db_error
def db_test_get_food_items():
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
                bu.Abbreviation AS BaseUnit
            FROM FoodItem fi
            JOIN BaseUnit bu ON fi.BaseUnitID = bu.UnitID
            LIMIT 50
        """
        cursor.execute(query)
        results = cursor.fetchall()
        return jsonify(results), 200


@document_api_route(bp, 'get', '/<int:food_item_id>', 'Get food item by ID', 'Returns a single food item by its ID')
@handle_db_error
def get_food_item(food_item_id):
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
                bu.Abbreviation AS BaseUnit
            FROM FoodItem fi
            JOIN BaseUnit bu ON fi.BaseUnitID = bu.UnitID
            WHERE fi.FoodItemID = %s
        """
        cursor.execute(query, (food_item_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Food item not found'}), 404
        
        return jsonify(result), 200

# get items below thresh using household id 
@document_api_route(bp, 'get', '/below-target', 'Get items below target level', 'Returns food items where current stock is below target level')
@handle_db_error
def get_items_below_target():
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
                (sl.TargetLevel - getCurrentStock(fi.FoodItemID)) AS NeededQty,
                (sl.TargetLevel - getCurrentStock(fi.FoodItemID)) * IFNULL(pl.PriceTotal, 0) AS TotalPrice,
                'active' AS Status,
                getCurrentStock(fi.FoodItemID) AS CurrentStock,
                loc.LocationID AS LocationID,
                pp.PackageID AS PackageID
            FROM StockLevel sl
            JOIN FoodItem fi ON sl.FoodItemID = fi.FoodItemID
            LEFT JOIN Package pp ON fi.PreferredPackageID = pp.PackageID
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
                AND getCurrentStock(fi.FoodItemID) < sl.TargetLevel
            ORDER BY (sl.TargetLevel - getCurrentStock(fi.FoodItemID)) DESC
        """
        
        cursor.execute(query, (household_id,))
        results = cursor.fetchall()
        
        return jsonify(results), 200

# get items at or above thresh using household id
@document_api_route(bp, 'get', '/at-or-above-target', 'Get items at or above target', 'Returns food items where current stock is at or above target level')
@handle_db_error  
def get_items_at_or_above_target():
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
                getCurrentStock(fi.FoodItemID) AS CurrentStock,
                loc.LocationID AS LocationID,
                pp.PackageID AS PackageID
            FROM StockLevel sl
            JOIN FoodItem fi ON sl.FoodItemID = fi.FoodItemID
            LEFT JOIN Package pp ON fi.PreferredPackageID = pp.PackageID
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
                AND getCurrentStock(fi.FoodItemID) >= sl.TargetLevel
            ORDER BY fi.Name
        """
        
        cursor.execute(query, (household_id,))
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
            data.get('expiration_date'),
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
