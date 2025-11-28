from flask import jsonify, request
from extensions import (
    db_cursor,
    create_api_blueprint,
    document_api_route,
    handle_db_error,
    get_db,
)

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


@document_api_route(bp, 'get', '/<int:household_id>/locations', 'Get locations by household', 'Returns all locations for a household')
@handle_db_error
def get_household_locations(household_id):
    with db_cursor() as cursor:
        query = """
            SELECT LocationID, LocationName
            FROM Location
            WHERE HouseholdID = %s AND IsArchived = 0
            ORDER BY LocationName
        """
        cursor.execute(query, (household_id,))
        results = cursor.fetchall()
        
        return jsonify(results), 200


@document_api_route(bp, 'post', '/<int:household_id>/locations', 'Create household location', 'Adds a new storage location for a household')
@handle_db_error
def create_household_location(household_id):
    data = request.get_json() or {}
    location_name = (data.get('location_name') or '').strip()

    if not location_name:
        return jsonify({'error': 'location_name is required'}), 400

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT LocationID
            FROM Location
            WHERE HouseholdID = %s
              AND LOWER(LocationName) = LOWER(%s)
              AND IsArchived = 0
            LIMIT 1
        """, (household_id, location_name))
        existing = cursor.fetchone()

        if existing:
            return jsonify({'error': 'Location already exists'}), 409

        cursor.execute("""
            INSERT INTO Location (HouseholdID, LocationName)
            VALUES (%s, %s)
        """, (household_id, location_name))
        location_id = cursor.lastrowid

        cursor.execute("""
            SELECT LocationID, LocationName
            FROM Location
            WHERE LocationID = %s
        """, (location_id,))
        new_location = cursor.fetchone()

        conn.commit()

        return jsonify(new_location), 201
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


@document_api_route(bp, 'put', '/<int:household_id>/locations/<int:location_id>', 'Rename household location', 'Updates the name of a storage location')
@handle_db_error
def update_household_location(household_id, location_id):
    data = request.get_json() or {}
    new_name = (data.get('location_name') or '').strip()

    if not new_name:
        return jsonify({'error': 'location_name is required'}), 400

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT LocationID
            FROM Location
            WHERE LocationID = %s
              AND HouseholdID = %s
              AND IsArchived = 0
        """, (location_id, household_id))
        current = cursor.fetchone()

        if not current:
            return jsonify({'error': 'Location not found'}), 404

        cursor.execute("""
            SELECT 1
            FROM Location
            WHERE HouseholdID = %s
              AND LOWER(LocationName) = LOWER(%s)
              AND LocationID <> %s
              AND IsArchived = 0
            LIMIT 1
        """, (household_id, new_name, location_id))
        duplicate = cursor.fetchone()

        if duplicate:
            return jsonify({'error': 'Another location already uses that name'}), 409

        cursor.execute("""
            UPDATE Location
            SET LocationName = %s
            WHERE LocationID = %s
        """, (new_name, location_id))

        cursor.execute("""
            SELECT LocationID, LocationName
            FROM Location
            WHERE LocationID = %s
        """, (location_id,))
        updated = cursor.fetchone()

        conn.commit()

        return jsonify(updated), 200
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
0