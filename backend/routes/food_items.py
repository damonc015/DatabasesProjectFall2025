from flask import jsonify
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
