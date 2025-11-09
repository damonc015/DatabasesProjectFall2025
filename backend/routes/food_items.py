from flask import Blueprint, jsonify
from extensions import db_cursor

bp = Blueprint('food_items', __name__, url_prefix='/api/food-items')


@bp.route('/<int:food_item_id>', methods=['GET'])
def get_food_item(food_item_id):
    try:
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500
