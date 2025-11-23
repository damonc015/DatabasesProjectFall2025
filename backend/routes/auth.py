from flask import jsonify, request
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error
import mysql.connector
from flask import current_app
import uuid
import bcrypt

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
                u.PasswordHash,
                h.HouseholdName,
                h.JoinCode
            FROM Users u
            LEFT JOIN Household h ON u.HouseholdID = h.HouseholdID
            WHERE u.UserName = %s
              AND u.IsArchived = 0
            LIMIT 1
        """ 
        cursor.execute(query, (username,))
        user = cursor.fetchone()

        if not user or not user.get("PasswordHash"):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Verify password using bcrypt
        try:
            password_hash = user["PasswordHash"]
            if isinstance(password_hash, str):
                password_hash = password_hash.encode('utf-8')
            if not bcrypt.checkpw(password.encode('utf-8'), password_hash):
                return jsonify({'error': 'Invalid username or password'}), 401
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid username or password'}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["UserID"],
            "username": user["UserName"],
            "display_name": user["DisplayName"],
            "role": user["RoleName"],
            "household_id": user["HouseholdID"],
            "household": user["HouseholdName"],
            "join_code": user["JoinCode"]
        }
    }), 200


@document_api_route(bp, 'post', '/register', 'Register new user', 'Create user and automatically create household if no join_code provided') 
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

    # Hash password using bcrypt
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    household_id = None
    role = 'member'
    
    # If joining existing household
    if join_code:
        cursor.execute("SELECT HouseholdID FROM Household WHERE JoinCode=%s", (join_code,))
        h = cursor.fetchone()
        if not h:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid join code'}), 404
        household_id = h["HouseholdID"]
        role = 'member'
    else:
        # Auto-create household if no join_code
        # Generate unique join code
        while True:
            new_join_code = str(uuid.uuid4())[:6].upper()
            cursor.execute("SELECT HouseholdID FROM Household WHERE JoinCode=%s", (new_join_code,))
            if not cursor.fetchone():
                break
        
        # Use display name for household name
        household_name = f"{display_name}'s Household"
        
        # Create household
        cursor.execute("""
            INSERT INTO Household (HouseholdName, JoinCode)
            VALUES (%s, %s)
        """, (household_name, new_join_code))
        
        household_id = cursor.lastrowid
        role = 'owner'
    
    # Insert new user
    cursor.execute("""
        INSERT INTO Users (HouseholdID, UserName, DisplayName, RoleName, PasswordHash, IsArchived)
        VALUES (%s, %s, %s, %s, %s, 0)
    """, (household_id, username, display_name, role, password_hash))

    conn.commit()

    # Get user info
    cursor.execute("""
        SELECT u.UserID, u.UserName, u.DisplayName, u.RoleName, u.HouseholdID, h.HouseholdName, h.JoinCode
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
            "household_id": user["HouseholdID"],
            "household": user["HouseholdName"],
            "join_code": user["JoinCode"]
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
    cursor.execute("SELECT HouseholdID, HouseholdName FROM Household WHERE JoinCode=%s", (join_code,))
    h = cursor.fetchone()
    if not h:
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid join code"}), 404

    # check if user is already in this household
    cursor.execute("SELECT HouseholdID FROM Users WHERE UserID=%s", (user_id,))
    u = cursor.fetchone()

    if u and u["HouseholdID"] == h["HouseholdID"]:
        cursor.close()
        conn.close()
        return jsonify({"error": "You are already in this household"}), 400
    
    # If user is owner of old household, promote first member to owner
    old_household_id = u.get("HouseholdID") if u else None
    if old_household_id:
        cursor.execute("SELECT RoleName FROM Users WHERE UserID=%s", (user_id,))
        old_user_info = cursor.fetchone()
        if old_user_info and old_user_info.get("RoleName") == "owner":
            cursor.execute("""
                SELECT UserID FROM Users 
                WHERE HouseholdID=%s AND UserID!=%s AND IsArchived=0
                LIMIT 1
            """, (old_household_id, user_id))
            other_member = cursor.fetchone()
            if other_member:
                cursor.execute("UPDATE Users SET RoleName='owner' WHERE UserID=%s", (other_member["UserID"],))
    
    # update user - set role to member when joining
    cursor.execute("""
        UPDATE Users
        SET HouseholdID=%s, RoleName='member'
        WHERE UserID=%s
    """, (h["HouseholdID"], user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Joined household successfully",
        "household_id": h["HouseholdID"],
        "household_name": h["HouseholdName"]
    }), 200


@document_api_route(
    bp, 'post', '/create-household',
    'Create a new household',
    'User creates a new household and becomes owner. If user is already in a household, they will be removed from it.'
)
@handle_db_error
def create_household():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    household_name = data.get("household_name", "")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_write_conn()
    cursor = conn.cursor(dictionary=True)

    # check if user exists
    cursor.execute("""
        SELECT UserID, HouseholdID, DisplayName
        FROM Users
        WHERE UserID=%s AND IsArchived=0
    """, (user_id,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    # If user is owner of old household, promote first member to owner
    old_household_id = user.get("HouseholdID")
    if old_household_id:
        cursor.execute("SELECT RoleName FROM Users WHERE UserID=%s", (user_id,))
        old_user_info = cursor.fetchone()
        if old_user_info and old_user_info.get("RoleName") == "owner":
            cursor.execute("""
                SELECT UserID FROM Users 
                WHERE HouseholdID=%s AND UserID!=%s AND IsArchived=0
                LIMIT 1
            """, (old_household_id, user_id))
            other_member = cursor.fetchone()
            if other_member:
                cursor.execute("UPDATE Users SET RoleName='owner' WHERE UserID=%s", (other_member["UserID"],))

    # generate unique join code
    while True:
        join_code = str(uuid.uuid4())[:6].upper()
        cursor.execute("SELECT HouseholdID FROM Household WHERE JoinCode=%s", (join_code,))
        if not cursor.fetchone():
            break  

    # Use provided name or generate default name
    if not household_name or household_name.strip() == "":
        household_name = f"{user['DisplayName']}'s Household"

    # create household
    cursor.execute("""
        INSERT INTO Household (HouseholdName, JoinCode)
        VALUES (%s, %s)
    """, (household_name, join_code))
    
    household_id = cursor.lastrowid

    # update user - set as owner (this automatically removes them from old household)
    cursor.execute("""
        UPDATE Users
        SET HouseholdID=%s, RoleName='owner'
        WHERE UserID=%s
    """, (household_id, user_id))

    conn.commit()

    # get household info
    cursor.execute("""
        SELECT HouseholdID, HouseholdName, JoinCode
        FROM Household
        WHERE HouseholdID=%s
    """, (household_id,))
    household = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Household created successfully",
        "household": {
            "household_id": household["HouseholdID"],
            "household_name": household["HouseholdName"],
            "join_code": household["JoinCode"]
        }
    }), 200


@document_api_route(bp, 'post', '/remove-member',
                    'Remove user from household',
                    'Remove an existing household member and auto-create a new household for them')
@handle_db_error
def remove_member():
    data = request.get_json() or {}
    username = data.get("username")

    if not username:
        return jsonify({"error": "username required"}), 400

    conn = get_write_conn()
    cursor = conn.cursor(dictionary=True)

    # validate user exists and get display name
    cursor.execute("""
        SELECT UserID, HouseholdID, DisplayName
        FROM Users
        WHERE UserName=%s AND IsArchived=0
    """, (username,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    user_id = user["UserID"]
    
    # Auto-create household for removed user
    # Generate unique join code
    while True:
        join_code = str(uuid.uuid4())[:6].upper()
        cursor.execute("SELECT HouseholdID FROM Household WHERE JoinCode=%s", (join_code,))
        if not cursor.fetchone():
            break
    
    # Use display name for household name
    household_name = f"{user['DisplayName']}'s Household"
    
    # Create household
    cursor.execute("""
        INSERT INTO Household (HouseholdName, JoinCode)
        VALUES (%s, %s)
    """, (household_name, join_code))
    
    household_id = cursor.lastrowid

    # Update user - set as owner of new household
    cursor.execute("""
        UPDATE Users
        SET HouseholdID=%s, RoleName='owner'
        WHERE UserID=%s
    """, (household_id, user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "User removed from household and assigned to new household",
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
        
        # Verify old password using bcrypt
        try:
            password_hash = user["PasswordHash"]
            if isinstance(password_hash, str):
                password_hash = password_hash.encode('utf-8')
            if not bcrypt.checkpw(old_password.encode('utf-8'), password_hash):
                cursor.close()
                conn.close()
                return jsonify({"error": "Old password incorrect"}), 401
            
            # Verify new password is different from old password using bcrypt
            if bcrypt.checkpw(new_password.encode('utf-8'), password_hash):
                cursor.close()
                conn.close()
                return jsonify({"error": "New password cannot be the same as old password"}), 400
        except (ValueError, TypeError):
            cursor.close()
            conn.close()
            return jsonify({"error": "Old password incorrect"}), 401
        
        # password length check
        if len(new_password) < 6:
            cursor.close()
            conn.close()
            return jsonify({"error": "Password must be at least 6 characters"}), 400

    updates = []
    params = []

    if new_name:
        updates.append("DisplayName=%s")
        params.append(new_name)

    if new_password:
        # Hash new password using bcrypt
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        updates.append("PasswordHash=%s")
        params.append(new_password_hash)

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

