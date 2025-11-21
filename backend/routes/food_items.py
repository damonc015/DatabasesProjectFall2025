from flask import jsonify, request
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error

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
                getCurrentStock(fi.FoodItemID) AS CurrentStock
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
                getCurrentStock(fi.FoodItemID) AS CurrentStock
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
            WHERE fi.HouseholdID = %s
                AND getCurrentStock(fi.FoodItemID) >= sl.TargetLevel
            ORDER BY fi.Name
        """
        
        cursor.execute(query, (household_id,))
        results = cursor.fetchall()
        
        return jsonify(results), 200
