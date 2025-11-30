from flask import jsonify, request, Response, render_template
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error, get_db
import json

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
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.callproc('createShoppingList', [household_id])
        
        for result in cursor.stored_results():
            result.fetchall()
        
        conn.commit()
        
        cursor.execute("""
            SELECT ShoppingListID as shopping_list_id 
            FROM ShoppingList 
            WHERE HouseholdID = %s 
            ORDER BY ShoppingListID DESC 
            LIMIT 1
        """, (household_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Failed to create shopping list'}), 500
        
        return jsonify(result), 201
    finally:
        cursor.close()
        conn.close()


# Get active shopping list
@document_api_route(bp, 'get', '/active', 'Get active shopping list', 'Returns the active shopping list for a household')
@handle_db_error
def get_active_shopping_list():
    household_id = request.args.get('household_id')
    
    if not household_id:
        return jsonify({'error': 'household_id is required'}), 400
        
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT 
                ShoppingListID,
                HouseholdID,
                Status,
                LastUpdated,
                TotalCost
            FROM ShoppingList 
            WHERE HouseholdID = %s AND Status = 'active'
            ORDER BY LastUpdated DESC
            LIMIT 1
        """, (household_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify(None), 200
            
        return jsonify(result), 200

@document_api_route(bp, 'post', '/complete-active', 'Complete active list and create new', 'Marks active list as completed, creates a new one, and generates inventory transactions')
@handle_db_error
def complete_active_shopping_list():
    data = request.get_json()
    household_id = data.get('household_id')
    user_id = data.get('user_id')
    
    if not household_id:
        return jsonify({'error': 'household_id is required'}), 400
    if not user_id:
        return jsonify({'error': 'user_id is required for inventory transactions'}), 400
        
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Finds active list
        cursor.execute("""
            SELECT ShoppingListID 
            FROM ShoppingList 
            WHERE HouseholdID = %s AND Status = 'active'
            ORDER BY ShoppingListID DESC
            LIMIT 1
        """, (household_id,))
        active_list = cursor.fetchone()
        
        completed_list_id = None
        if active_list:
            completed_list_id = active_list['ShoppingListID']
            # Marks active list as completed
            cursor.execute("""
                UPDATE ShoppingList 
                SET Status = 'completed', LastUpdated = NOW() 
                WHERE ShoppingListID = %s
            """, (completed_list_id,))
            
        # Creates new active list
        cursor.execute("""
            INSERT INTO ShoppingList (HouseholdID, Status, LastUpdated)
            VALUES (%s, 'active', NOW())
        """, (household_id,))
        new_list_id = cursor.lastrowid
        
        # Process Inventory Transactions for purchased items
        if completed_list_id:
            cursor.execute("""
                SELECT sli.FoodItemID, sli.LocationID, sli.PackageID, sli.PurchasedQty, p.BaseUnitAmt
                FROM ShoppingListItem sli
                JOIN Package p ON sli.PackageID = p.PackageID
                WHERE sli.ShoppingListID = %s AND sli.PurchasedQty > 0
            """, (completed_list_id,))
            purchased_items = cursor.fetchall()
            
            for item in purchased_items:
                qty_in_base_units = float(item['PurchasedQty']) * float(item['BaseUnitAmt'])
                
                cursor.execute("""
                    INSERT INTO InventoryTransaction 
                    (FoodItemID, LocationID, UserID, QtyInBaseUnits, TransactionType, CreatedAt)
                    VALUES (%s, %s, %s, %s, 'purchase', NOW())
                """, (
                    item['FoodItemID'], 
                    item['LocationID'], 
                    user_id,
                    qty_in_base_units
                ))
        
        conn.commit()
        
        return jsonify({
            'message': 'Active list completed, inventory updated, and new list created',
            'completed_list_id': completed_list_id,
            'new_active_list_id': new_list_id
        }), 201
    finally:
        cursor.close()
        conn.close()


#TODO: 1.2 - needs to filter out household id
@document_api_route(bp, 'get', '/', 'Get shopping lists', 'Get paginated shopping lists with sorting')
@handle_db_error
def get_shopping_lists():
    param = int(request.args.get('param', 0))
    order = request.args.get('order', 'asc')
    order_bool = 1 if order == 'asc' else 0
    
    with db_cursor() as cursor:
        cursor.callproc('getShoppingListByParam', [param, order_bool])
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
                CEILING(sli.NeededQty / p.BaseUnitAmt) AS NeededQty,
                sli.PurchasedQty,
                sli.TotalPrice,
                sli.Status,
                ROUND(GetCurrentStock(sli.FoodItemID) / p.BaseUnitAmt, 2) as CurrentStock,
                IFNULL(pl.PriceTotal, 0) as PricePerUnit,
                ROUND(IFNULL(sl.TargetLevel, 0) / p.BaseUnitAmt, 2) as TargetLevel
            FROM ShoppingListItem sli
            JOIN FoodItem fi ON sli.FoodItemID = fi.FoodItemID
            LEFT JOIN Location l ON sli.LocationID = l.LocationID
            LEFT JOIN Package p ON sli.PackageID = p.PackageID
            LEFT JOIN StockLevel sl ON sli.FoodItemID = sl.FoodItemID
            LEFT JOIN (
                SELECT pl1.PackageID, pl1.PriceTotal
                FROM PriceLog pl1
                INNER JOIN (
                    SELECT PackageID, MAX(CreatedAt) AS MaxCreatedAt
                    FROM PriceLog
                    GROUP BY PackageID
                ) pl2 ON pl1.PackageID = pl2.PackageID AND pl1.CreatedAt = pl2.MaxCreatedAt
            ) pl ON sli.PackageID = pl.PackageID
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
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        items_json = json.dumps(items)
        cursor.callproc('AddShoppingListItemsJSON', [shopping_list_id, items_json])
        
        for result in cursor.stored_results():
            result.fetchall()
        
        conn.commit()
        
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
    finally:
        cursor.close()
        conn.close()

@document_api_route(bp, 'put', '/active/items', 'Update active shopping list items', 'Updates items in the currently active shopping list for a household')
@handle_db_error
def update_active_shopping_list_items():
    data = request.get_json()
    household_id = data.get('household_id')
    items = data.get('items', [])
    
    if not household_id:
        return jsonify({'error': 'household_id is required'}), 400
    if not items:
        return jsonify({'error': 'items array is required'}), 400
        
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Find the active list ID
        cursor.execute("""
            SELECT ShoppingListID 
            FROM ShoppingList 
            WHERE HouseholdID = %s AND Status = 'active'
            ORDER BY ShoppingListID DESC
            LIMIT 1
        """, (household_id,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({'error': 'No active shopping list found for this household'}), 404
            
        shopping_list_id = row['ShoppingListID']
        
        items_json = json.dumps(items)
        cursor.callproc('UpdateShoppingListItemsJSON', [shopping_list_id, items_json])
        
        for result in cursor.stored_results():
            result.fetchall()
            
        conn.commit()
        
        cursor.execute("SELECT TotalCost FROM ShoppingList WHERE ShoppingListID = %s", (shopping_list_id,))
        result = cursor.fetchone()
        
        return jsonify({
            'message': 'Items updated successfully',
            'shopping_list_id': shopping_list_id,
            'total_cost': result['TotalCost']
        }), 200
    finally:
        cursor.close()
        conn.close()

@document_api_route(bp, 'put', '/<int:shopping_list_id>/items', 'Update shopping list items', 'Updates multiple items in a shopping list using JSON')
@handle_db_error
def update_shopping_list_items(shopping_list_id):
    data = request.get_json()
    items = data.get('items', [])
    
    if not items:
        return jsonify({'error': 'items array is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        items_json = json.dumps(items)
        cursor.callproc('UpdateShoppingListItemsJSON', [shopping_list_id, items_json])
        
        for result in cursor.stored_results():
            result.fetchall()
        
        conn.commit()
        
        cursor.execute("""
            SELECT TotalCost 
            FROM ShoppingList 
            WHERE ShoppingListID = %s
        """, (shopping_list_id,))
        result = cursor.fetchone()
        
        return jsonify({
            'message': 'Items updated successfully',
            'shopping_list_id': shopping_list_id,
            'total_cost': result['TotalCost']
        }), 200
    finally:
        cursor.close()
        conn.close()

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


# Export shopping list
@document_api_route(bp, 'get', '/<int:shopping_list_id>/export', 'Export shopping list', 'Export shopping list data in JSON or HTML format')
@handle_db_error
def export_shopping_list(shopping_list_id):
    format_type = request.args.get('format', 'json').lower()
    
    if format_type not in ['json', 'html']:
        return jsonify({'error': f'Unsupported format: {format_type}. Supported formats: json, html'}), 400
    
    with db_cursor() as cursor:
        # sl attributes
        cursor.execute("""
            SELECT 
                sl.ShoppingListID,
                sl.HouseholdID,
                sl.LastUpdated,
                sl.Status,
                sl.TotalCost
            FROM ShoppingList sl
            WHERE sl.ShoppingListID = %s
        """, (shopping_list_id,))
        list_info = cursor.fetchone()
        
        if not list_info:
            return jsonify({'error': 'Shopping list not found'}), 404
        
        # sli attributes
        cursor.execute("""
            SELECT 
                sli.ShoppingListItemID,
                fi.Name AS FoodItemName,
                sli.NeededQty,
                sli.PurchasedQty,
                sli.TotalPrice,
                sli.Status,
                l.LocationName,
                p.Label AS PackageLabel
            FROM ShoppingListItem sli
            JOIN FoodItem fi ON sli.FoodItemID = fi.FoodItemID
            LEFT JOIN Location l ON sli.LocationID = l.LocationID
            LEFT JOIN Package p ON sli.PackageID = p.PackageID
            WHERE sli.ShoppingListID = %s
        """, (shopping_list_id,))
        items = cursor.fetchall()
        
        # JSON export
        if format_type == 'json':
            data = {
                'shopping_list': list_info,
                'items': items
            }
            return Response(
                json.dumps(data, indent=2, default=str),
                mimetype='application/json',
                headers={'Content-Disposition': f'attachment; filename=shopping_list_{shopping_list_id}.json'}
            )
        
        # Html export
        elif format_type == 'html':
            html = render_template(
                'shopping_list_export.html',
                list_info=list_info,
                items=items
            )
            return Response(
                html,
                mimetype='text/html',
                headers={'Content-Disposition': f'attachment; filename=shopping_list_{shopping_list_id}.html'}
            )