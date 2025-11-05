"""Shopping lists routes using raw SQL"""
from flask import Blueprint, jsonify, request
from extensions import get_db

bp = Blueprint('shopping_lists', __name__, url_prefix='/api/shopping-lists')


@bp.route('/<int:shopping_list_id>/items', methods=['GET'])
def get_shopping_list_items(shopping_list_id):
    """Get items for a specific shopping list"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
