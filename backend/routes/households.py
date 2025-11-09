from flask import Blueprint, jsonify
from extensions import db_cursor

bp = Blueprint('households', __name__, url_prefix='/api/households')


@bp.route('/<int:household_id>', methods=['GET'])
def get_household(household_id):
    try:
        with db_cursor() as cursor:
            query = """
                SELECT 
                    h.HouseholdID,
                    h.HouseholdName,
                    h.JoinCode,
                    COUNT(DISTINCT u.UserId) AS MemberCount,
                    COUNT(DISTINCT fi.FoodItemID) AS FoodItemCount
                FROM Household h
                LEFT JOIN Users u ON h.HouseholdID = u.HouseholdID AND u.IsArchived = 0
                LEFT JOIN FoodItem fi ON h.HouseholdID = fi.HouseholdID AND fi.IsArchived = 0
                WHERE h.HouseholdID = %s
                GROUP BY h.HouseholdID
            """
            cursor.execute(query, (household_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({'error': 'Household not found'}), 404
            
            return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
