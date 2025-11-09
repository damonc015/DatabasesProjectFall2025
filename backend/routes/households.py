from flask import jsonify
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error

bp = create_api_blueprint('households', '/api/households')


@document_api_route(bp, 'get', '/<int:household_id>', 'Get household by ID', 'Returns household information including member and food item counts')
@handle_db_error
def get_household(household_id):
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
