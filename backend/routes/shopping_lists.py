from flask import jsonify
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error

bp = create_api_blueprint('shopping_lists', '/api/shopping-lists')


@document_api_route(bp, 'get', '/<int:shopping_list_id>/items', 'Get shopping list items', 'Returns all items in a shopping list')
@handle_db_error
def get_shopping_list_items(shopping_list_id):
    with db_cursor() as cursor:
        query = """
            SELECT 
                sli.ShoppingListItemID,
                sli.FoodItemID,
                fi.Name AS FoodItemName,
                sli.LocationID,
                l.LocationName,
                sli.PackageID,
                p.Label AS PackageLabel,
                sli.NeededQty,
                sli.PurchasedQty,
                sli.TotalPrice,
                sli.Status
            FROM ShoppingListItem sli
            JOIN FoodItem fi ON sli.FoodItemID = fi.FoodItemID
            LEFT JOIN Location l ON sli.LocationID = l.LocationID
            LEFT JOIN Package p ON sli.PackageID = p.PackageID
            WHERE sli.ShoppingListID = %s
        """
        cursor.execute(query, (shopping_list_id,))
        results = cursor.fetchall()
        return jsonify(results), 200
