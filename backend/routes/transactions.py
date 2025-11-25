from datetime import datetime,time
import pytz
from flask import jsonify, request
from extensions import db_cursor, get_db, create_api_blueprint, document_api_route, handle_db_error

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
              AND tx.TransactionType != 'transfer_in'
        """
        cursor.execute(count_query, (household_id,))
        total = cursor.fetchone()['total']

        # Get paged data
        query = """
            SELECT 
                fi.Name AS FoodName,
                u.DisplayName AS UserName,
                tx.QtyInBaseUnits AS QtyInTotal,
                p.BaseUnitAmt AS QtyPerPackage,
                tx.TransactionType,
                tx.CreatedAt,
                l.LocationName,
                CASE
                    WHEN tx.TransactionType = 'transfer_out' THEN l_pair.LocationName
                    ELSE NULL
                END AS CounterLocationName,
                bu.Abbreviation AS BaseUnitAbbr,
                p.Label AS PackageLabel
            FROM InventoryTransaction tx
            INNER JOIN FoodItem fi ON tx.FoodItemID = fi.FoodItemID
            INNER JOIN Users u ON tx.UserID = u.UserID
            INNER JOIN Location l ON tx.LocationID = l.LocationID
            INNER JOIN BaseUnit bu ON fi.BaseUnitID = bu.UnitID
            INNER JOIN Package p ON fi.PreferredPackageID = p.PackageID
            LEFT JOIN InventoryTransaction tx_pair
                ON tx.TransactionType = 'transfer_out'
                AND tx_pair.TransactionType = 'transfer_in'
                AND tx_pair.UserID = tx.UserID
                AND tx_pair.FoodItemID = tx.FoodItemID
                AND tx_pair.QtyInBaseUnits = tx.QtyInBaseUnits
                AND tx_pair.CreatedAt BETWEEN tx.CreatedAt AND DATE_ADD(tx.CreatedAt, INTERVAL 5 SECOND)
            LEFT JOIN Location l_pair ON tx_pair.LocationID = l_pair.LocationID
            WHERE u.HouseholdID = %s
              AND tx.TransactionType != 'transfer_in'
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
            
            # Format packages
            total_qty = float(row['QtyInTotal'])
            qty_per_package = float(row['QtyPerPackage']) if row['QtyPerPackage'] else 0
            package_label = row['PackageLabel']
            base_unit = row['BaseUnitAbbr']
            
            whole_packages = 0
            remainder = 0
            
            if qty_per_package > 0:
                whole_packages = int(total_qty // qty_per_package)
                remainder = total_qty % qty_per_package
            
            row['FormattedPackages'] = _format_packages(whole_packages, remainder, package_label, base_unit, total_qty)

        return jsonify({
            'data': results,
            'total': total,
            'page': page,
            'limit': limit
        }), 200

@document_api_route(bp,'get','/expiring/<int:household_id>','Get transactions expiring in 7 days by household','Returns a list of expiring transactions (paged)')
@handle_db_error
def db_get_expiring_transactions(household_id):
    page = int(request.args.get('page', 0))
    limit = int(request.args.get('limit', 5))
    offset = page * limit

    with db_cursor() as cursor:
        # Get total count
        count_query = """
            SELECT COUNT(*) as total
            FROM InventoryTransaction tx
            INNER JOIN Users u ON tx.UserID = u.UserID
            WHERE 
                u.HouseholdID = %s AND 
                DATE(tx.ExpirationDate) > CURDATE() AND 
                DATE(tx.ExpirationDate) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        """
        cursor.execute(count_query, (household_id,))
        total = cursor.fetchone()['total']

        # Get paged data
        query = """
            SELECT 
                fi.Name AS FoodName,
                tx.QtyInBaseUnits AS QtyInTotal,
                p.BaseUnitAmt AS QtyPerPackage,
                tx.ExpirationDate,
                l.LocationName,
                bu.Abbreviation AS BaseUnitAbbr,
                p.Label AS PackageLabel 
            FROM InventoryTransaction tx
            INNER JOIN FoodItem fi ON tx.FoodItemID = fi.FoodItemID
            INNER JOIN Location l ON tx.LocationID = l.LocationID
            INNER JOIN BaseUnit bu ON fi.BaseUnitID = bu.UnitID
            INNER JOIN Package p ON fi.PreferredPackageID = p.PackageID
            WHERE 
                l.HouseholdID = %s AND 
                DATE(tx.ExpirationDate) > CURDATE() AND 
                DATE(tx.ExpirationDate) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ORDER BY tx.ExpirationDate
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (household_id, limit, offset))
        results = cursor.fetchall()

        # set New York Time Zone
        tz = pytz.timezone("America/New_York")
        for row in results:
            exp_date = row.get("ExpirationDate")
            if exp_date:
                # convert date into datetime
                if not isinstance(exp_date, datetime):
                    exp_date = datetime.combine(exp_date, time.min)
                local_time = exp_date.astimezone(tz) 
                row["ExpirationDate"] = local_time.strftime("%a, %d %b %Y %H:%M:%S GMT%z")

            # Format packages
            total_qty = float(row['QtyInTotal'])
            qty_per_package = float(row['QtyPerPackage']) if row['QtyPerPackage'] else 0
            package_label = row['PackageLabel']
            base_unit = row['BaseUnitAbbr']
            
            whole_packages = 0
            remainder = 0
            
            if qty_per_package > 0:
                whole_packages = int(total_qty // qty_per_package)
                remainder = total_qty % qty_per_package
            
            row['FormattedPackages'] = _format_packages(whole_packages, remainder, package_label, base_unit, total_qty)

        return jsonify({
            'data': results,
            'total': total,
            'page': page,
            'limit': limit
        }), 200

@document_api_route(bp, 'get', '/inventory/<int:household_id>', 
                        'Get current inventory totals',
                        'Returns inventory totals for all food items in household')
@handle_db_error
def get_inventory_totals(household_id):
    search_query = request.args.get('search', None)

    if search_query == '':
        search_query = None
    
    with db_cursor() as cursor:
        cursor.callproc('GetHouseholdInventory', (household_id, search_query))
        results = []
        for result in cursor.stored_results():
            results = result.fetchall()
            break
        
        for item in results:
            total_qty = float(item['TotalQtyInBaseUnits'])
            whole_packages = int(item['WholePackages']) if item['WholePackages'] else 0
            remainder = float(item['Remainder']) if item['Remainder'] else 0
            package_label = item['PackageLabel']
            base_unit = item['BaseUnitAbbr']
            
            item['FormattedBaseUnits'] = f"{round(total_qty)}{base_unit}"
            item['FormattedPackages'] = _format_packages(whole_packages, remainder, package_label, base_unit, total_qty)
        
        return jsonify(results), 200

@document_api_route(bp, 'get', '/inventory/<int:household_id>/location/<int:location_id>', 
                        'Get inventory by location', 
                        'Returns food items filtered by location')
@handle_db_error
def get_inventory_by_location(household_id, location_id):
    search_query = request.args.get('search', None)

    if search_query == '':
        search_query = None
    
    with db_cursor() as cursor:
        cursor.callproc('GetInventoryByLocation', (household_id, location_id, search_query))
        results = []
        for result in cursor.stored_results():
            results = result.fetchall()
            break
        
        for item in results:
            total_qty = float(item['TotalQtyInBaseUnits'])
            whole_packages = int(item['WholePackages']) if item['WholePackages'] else 0
            remainder = float(item['Remainder']) if item['Remainder'] else 0
            package_label = item['PackageLabel']
            base_unit = item['BaseUnitAbbr']
            
            item['FormattedBaseUnits'] = f"{round(total_qty)}{base_unit}"
            item['FormattedPackages'] = _format_packages(whole_packages, remainder, package_label, base_unit, total_qty)
        
        return jsonify(results), 200


@document_api_route(bp, 'post', '/inventory/transaction', 
                        'Create inventory transaction',
                        'Creates an inventory transaction to add or remove food items')
@handle_db_error
def create_inventory_transaction():
    data = request.get_json()
    
    required_fields = ['food_item_id', 'location_id', 'user_id', 'transaction_type', 'quantity']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    food_item_id = data['food_item_id']
    location_id = data['location_id']
    user_id = data['user_id']
    transaction_type = data['transaction_type']
    quantity = float(data['quantity'])
    expiration_date = data.get('expiration_date')
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.callproc('AddRemoveExistingFoodItem', (
            food_item_id,
            location_id,
            user_id,
            transaction_type,
            quantity,
            expiration_date
        ))
        cursor.fetchall() 
        conn.commit()
        
        return jsonify({
            'message': 'Transaction created successfully',
            'food_item_id': food_item_id,
            'transaction_type': transaction_type,
            'quantity': quantity
        }), 201
    finally:
        cursor.close()
        conn.close()


def _format_packages(whole_packages, remainder, package_label, base_unit, total_qty):
    # Formats package: ie 2 Bags + 100g.
    plural_label = package_label if whole_packages == 1 else package_label + '(s)'
    
    if whole_packages > 0 and remainder > 0:
        return f"{whole_packages} {plural_label} + {round(remainder)}{base_unit}"
    elif whole_packages > 0:
        return f"{whole_packages} {plural_label}"
    else:
        return f"{round(total_qty)}{base_unit}"