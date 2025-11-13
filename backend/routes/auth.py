from flask import jsonify, request
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error
import mysql.connector
from flask import current_app

bp = create_api_blueprint('auth', '/api/auth')

def get_write_conn():
    return mysql.connector.connect(
        host=current_app.config['MYSQL_HOST'],
        port=current_app.config['MYSQL_PORT'],
        user=current_app.config['MYSQL_USER'],
        password=current_app.config.get('MYSQL_PASSWORD') or '',
        database=current_app.config['MYSQL_DATABASE'],
        unix_socket=current_app.config.get('MYSQL_UNIX_SOCKET')
    )


@document_api_route(bp, 'post', '/login', 'Login user', 'Validate user credentials')
@handle_db_error
def login_user():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    with db_cursor() as cursor:
        query = """
            SELECT 
                u.UserID,
                u.UserName,
                u.DisplayName,
                u.RoleName,
                u.HouseholdID,
                h.HouseholdName
            FROM Users u
            LEFT JOIN Household h ON u.HouseholdID = h.HouseholdID
            WHERE u.UserName = %s
              AND u.PasswordHash = %s
              AND u.IsArchived = 0
            LIMIT 1
        """ 
        cursor.execute(query, (username, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["UserID"],
            "username": user["UserName"],
            "display_name": user["DisplayName"],
            "role": user["RoleName"],
            "household_id": user["HouseholdID"],
            "household": user["HouseholdName"]
        }
    }), 200


@document_api_route(bp, 'post', '/register', 'Register new user', 'Create user and optionally join a household')
@handle_db_error
def register_user():
    data = request.get_json() or {}
    username = data.get('username')
    display_name = data.get('display_name')
    password = data.get('password')
    join_code = data.get('join_code')

    if not username or not display_name or not password:
        return jsonify({'error': 'Username, display name, and password required'}), 400

    conn = get_write_conn()
    cursor = conn.cursor(dictionary=True)

    # check if username exists
    cursor.execute("SELECT UserID FROM Users WHERE UserName=%s", (username,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({'error': 'Username already exists'}), 409

    # validate join code (optional)
    household_id = None
    if join_code:
        cursor.execute("SELECT HouseholdID FROM Household WHERE JoinCode=%s", (join_code,))
        h = cursor.fetchone()
        if not h:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid join code'}), 404
        household_id = h["HouseholdID"]

    # insert new user
    cursor.execute("""
        INSERT INTO Users (HouseholdID, UserName, DisplayName, RoleName, PasswordHash, IsArchived)
        VALUES (%s, %s, %s, %s, %s, 0)
    """, (household_id, username, display_name, 'member', password))

    conn.commit()

    # get user info
    cursor.execute("""
        SELECT u.UserID, u.UserName, u.DisplayName, u.RoleName, h.HouseholdName
        FROM Users u
        LEFT JOIN Household h ON u.HouseholdID = h.HouseholdID
        WHERE u.UserName=%s
    """, (username,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Registration successful",
        "user": {
            "id": user["UserID"],
            "username": user["UserName"],
            "display_name": user["DisplayName"],
            "role": user["RoleName"],
            "household": user["HouseholdName"]
        }
    }), 200


@document_api_route(bp, 'get', '/members/<int:household_id>',
                    'Get household members',
                    'Return all users in this household')
@handle_db_error
def get_household_members(household_id):
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT UserID, UserName, DisplayName
            FROM Users
            WHERE HouseholdID=%s AND IsArchived=0
        """, (household_id,))
        members = cursor.fetchall()

    return jsonify({"members": members}), 200

@document_api_route(
    bp, 'post', '/join-household',
    'Join a household',
    'User enters join code to join household'
)
@handle_db_error
def join_household():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    join_code = data.get("join_code")

    if not user_id or not join_code:
        return jsonify({"error": "user_id and join_code required"}), 400

    conn = get_write_conn()
    cursor = conn.cursor(dictionary=True)

    # validate household
    cursor.execute("SELECT HouseholdID FROM Household WHERE JoinCode=%s", (join_code,))
    h = cursor.fetchone()
    if not h:
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid join code"}), 404

    # update user
    cursor.execute("""
        UPDATE Users
        SET HouseholdID=%s
        WHERE UserID=%s
    """, (h["HouseholdID"], user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Joined household successfully",
        "household_id": h["HouseholdID"]
    }), 200

@document_api_route(bp, 'post', '/remove-member',
                    'Remove user from household',
                    'Remove an existing household member')
@handle_db_error
def remove_member():
    data = request.get_json() or {}
    username = data.get("username")

    if not username:
        return jsonify({"error": "username required"}), 400

    conn = get_write_conn()
    cursor = conn.cursor(dictionary=True)

    # validate user exists
    cursor.execute("""
        SELECT UserID, HouseholdID
        FROM Users
        WHERE UserName=%s AND IsArchived=0
    """, (username,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    # remove household binding
    cursor.execute("""
        UPDATE Users
        SET HouseholdID=NULL
        WHERE UserID=%s
    """, (user["UserID"],))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "User removed from household",
        "removed_username": username
    }), 200


@document_api_route(
    bp, 'post', '/update-profile',
    'Update user profile',
    'User updates their own display name or password'
)
@handle_db_error
def update_profile():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    new_name = data.get("display_name")
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    if not new_name and not new_password:
        return jsonify({"error": "Nothing to update"}), 400

    conn = get_write_conn()
    cursor = conn.cursor(dictionary=True)

    # validate user exists
    cursor.execute("""
        SELECT UserID, PasswordHash
        FROM Users
        WHERE UserID=%s AND IsArchived=0
    """, (user_id,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    # If password change requested, verify old password
    if new_password:
        if not old_password:
            cursor.close()
            conn.close()
            return jsonify({"error": "old_password required to change password"}), 400
        
        if user["PasswordHash"] != old_password:
            cursor.close()
            conn.close()
            return jsonify({"error": "Old password incorrect"}), 401

    updates = []
    params = []

    if new_name:
        updates.append("DisplayName=%s")
        params.append(new_name)

    if new_password:
        updates.append("PasswordHash=%s")
        params.append(new_password)

    params.append(user_id)

    cursor.execute(f"""
        UPDATE Users
        SET {', '.join(updates)}
        WHERE UserID=%s
    """, tuple(params))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Profile updated successfully"}), 200