from datetime import datetime,time
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
                fi.Name AS FoodName,
                u.DisplayName AS UserName,
                tx.QtyInBaseUnits AS QtyInTotal,
                p.BaseUnitAmt AS QtyPerPackage,
                tx.TransactionType,
                tx.CreatedAt,
                l.LocationName,
                bu.Abbreviation AS BaseUnitAbbr,
                p.Label AS PackageLabel
            FROM InventoryTransaction tx
            INNER JOIN FoodItem fi ON tx.FoodItemID = fi.FoodItemID
            INNER JOIN Users u ON tx.UserID = u.UserID
            INNER JOIN Location l ON tx.LocationID = l.LocationID
            INNER JOIN BaseUnit bu ON fi.BaseUnitID = bu.UnitID
            INNER JOIN Package p ON fi.PreferredPackageID = p.PackageID
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
    with db_cursor() as cursor:
        cursor.callproc('GetHouseholdInventory', (household_id,))
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
    with db_cursor() as cursor:
        cursor.callproc('GetInventoryByLocation', (household_id, location_id))
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


def _format_packages(whole_packages, remainder, package_label, base_unit, total_qty):
    # Format package: ie 2 Bags + 100g.
    if whole_packages > 0 and remainder > 0:
        plural = 's' if whole_packages > 1 else ''
        return f"{whole_packages} {package_label}{plural} + {round(remainder)}{base_unit}"
    elif whole_packages > 0:
        plural = 's' if whole_packages > 1 else ''
        return f"{whole_packages} {package_label}{plural}"
    else:
        return f"{round(total_qty)}{base_unit}"