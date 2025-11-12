from datetime import datetime
import pytz
from flask import jsonify, request
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error

bp = create_api_blueprint('transactions', '/api/transactions')

@document_api_route(bp, 'get', '/<int:household_id>', 'Get transactions by household and page', 'Returns a list of transactions (paged)')
@handle_db_error
def db_get_transactions_paged(household_id):
    page = int(request.args.get('page', 0))
    limit = int(request.args.get('limit', 5))
    offset = page * limit
    
    with db_cursor() as cursor:
        # Get total count
        count_query = """
            SELECT COUNT(*) as total
            FROM InventoryTransaction tx
            INNER JOIN Users u ON tx.UserID = u.UserID
            WHERE u.HouseholdID = %s
        """
        cursor.execute(count_query, (household_id,))
        total = cursor.fetchone()['total']

        # Get paged data
        query = """
            SELECT 
                fi.Name,
                u.DisplayName,
                tx.QtyInBaseUnits,
                tx.TransactionType,
                tx.CreatedAt,
                l.LocationName,
                bu.Abbreviation
            FROM InventoryTransaction tx
            INNER JOIN FoodItem fi ON tx.FoodItemID = fi.FoodItemID
            INNER JOIN Users u ON tx.UserID = u.UserID
            INNER JOIN Location l ON tx.LocationID = l.LocationID
            INNER JOIN BaseUnit bu ON fi.BaseUnitID = bu.UnitID
            WHERE u.HouseholdID = %s
            ORDER BY tx.CreatedAt DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (household_id, limit, offset))
        results = cursor.fetchall()
        
        # set New York Time Zone
        tz = pytz.timezone("America/New_York")
        for row in results:
            if isinstance(row['CreatedAt'], datetime):
                local_time = row['CreatedAt'].astimezone(tz)
                row['CreatedAt'] = local_time.strftime("%a, %d %b %Y %H:%M:%S GMT%z")

        return jsonify({
            'data': results,
            'total': total,
            'page': page,
            'limit': limit
        }), 200