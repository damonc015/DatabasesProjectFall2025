from flask import jsonify, request
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error

bp = create_api_blueprint('shopping_lists', '/api/shopping-lists')

# Shopping List 
#TODO: 1.1
@document_api_route(bp, 'post', '/', 'Create shopping list', 'Creates a new shopping list for a household')
@handle_db_error
def create_shopping_list():
    data = request.get_json()
    household_id = data.get('household_id')
    
    if not household_id:
        return jsonify({'error': 'household_id is required'}), 400
    
    with db_cursor() as cursor:
        cursor.callproc('createShoppingList', [household_id])
        cursor.execute("SELECT LAST_INSERT_ID() as shopping_list_id")
        result = cursor.fetchone()
        return jsonify(result), 201

#TODO: 1.2 - needs to filter out household id
@document_api_route(bp, 'get', '/', 'Get shopping lists', 'Get paginated shopping lists with sorting')
@handle_db_error
def get_shopping_lists():
    param = int(request.args.get('param', 0))
    order = request.args.get('order', 'asc')
    order_bool = 1 if order == 'asc' else 0
    page = int(request.args.get('page', 1))
    
    with db_cursor() as cursor:
        cursor.callproc('getShoppingListByParam', [param, order_bool, page])
        results = []
        for result in cursor.stored_results():
            results = result.fetchall()
        return jsonify(results), 200

#TODO: 1.3
@document_api_route(bp, 'patch', '/<int:shopping_list_id>/complete', 'Complete shopping list', 'Marks a shopping list as completed')
@handle_db_error
def complete_shopping_list(shopping_list_id):
    with db_cursor() as cursor:
        cursor.callproc('completeShoppingList', [shopping_list_id])
        cursor.execute("SELECT ROW_COUNT() as affected_rows")
        result = cursor.fetchone()
        
        if result['affected_rows'] == 0:
            return jsonify({'error': 'Shopping list not found'}), 404
            
        return jsonify({'message': 'Shopping list completed', 'shopping_list_id': shopping_list_id}), 200

#TODO: 1.4
@document_api_route(bp, 'get', '/completed', 'Get completed lists', 'Returns all completed shopping lists')
@handle_db_error
def get_completed_shopping_lists():
    with db_cursor() as cursor:
        cursor.callproc('getCompletedShoppingLists')
        results = []
        for result in cursor.stored_results():
            results = result.fetchall()
        return jsonify(results), 200

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

# Shopping List Items
#TODO: 2.1
@document_api_route(bp, 'post', '/<int:shopping_list_id>/items', 'Add shopping list items', 'Adds multiple items to a shopping list')
@handle_db_error
def add_shopping_list_items(shopping_list_id):
    data = request.get_json()
    items = data.get('items', [])
    
    if not items:
        return jsonify({'error': 'items array is required'}), 400
    
    with db_cursor() as cursor:
        import json
        items_json = json.dumps(items)
        cursor.callproc('AddShoppingListItemsJSON', [shopping_list_id, items_json])
        
        cursor.execute("""
            SELECT TotalCost 
            FROM ShoppingList 
            WHERE ShoppingListID = %s
        """, (shopping_list_id,))
        result = cursor.fetchone()
        
        return jsonify({
            'message': 'Items added successfully',
            'shopping_list_id': shopping_list_id,
            'total_cost': result['TotalCost']
        }), 201

#TODO: 2.2
@document_api_route(bp, 'patch', '/<int:shopping_list_id>/items/<int:item_id>', 'Mark item status', 'Updates the status of a shopping list item')
@handle_db_error
def mark_shopping_list_item(shopping_list_id, item_id):
    data = request.get_json()
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({'error': 'status is required'}), 400
    
    with db_cursor() as cursor:
        cursor.callproc('markShoppingListItems', [shopping_list_id, item_id, new_status])
        cursor.execute("SELECT ROW_COUNT() as affected_rows")
        result = cursor.fetchone()
        
        if result['affected_rows'] == 0:
            return jsonify({'error': 'Shopping list item not found'}), 404
            
        return jsonify({
            'message': 'Item status updated',
            'shopping_list_id': shopping_list_id,
            'item_id': item_id,
            'status': new_status
        }), 200

#TODO: 2.3
@document_api_route(bp, 'delete', '/<int:shopping_list_id>/items/<int:item_id>', 'Remove shopping list item', 'Removes an item from a shopping list')
@handle_db_error
def remove_shopping_list_item(shopping_list_id, item_id):
    with db_cursor() as cursor:
        cursor.callproc('removeShoppingListItem', [shopping_list_id, item_id])
        cursor.execute("SELECT ROW_COUNT() as affected_rows")
        result = cursor.fetchone()
        
        if result['affected_rows'] == 0:
            return jsonify({'error': 'Shopping list item not found'}), 404
            
        return jsonify({
            'message': 'Item removed successfully',
            'shopping_list_id': shopping_list_id,
            'item_id': item_id
        }), 200