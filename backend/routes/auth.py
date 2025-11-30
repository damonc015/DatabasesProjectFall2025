from functools import wraps
from dataclasses import dataclass
from flask import jsonify, request, current_app, g
from extensions import db_cursor, create_api_blueprint, document_api_route, handle_db_error
import mysql.connector
import uuid
import bcrypt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

SESSION_COOKIE_NAME = "session"
SESSION_MAX_AGE = 60 * 60 * 24 * 30  # 30 days
SESSION_SALT = 'auth-session'

bp = create_api_blueprint('auth', '/api/auth')


@dataclass
class SessionData:
    user: dict
    remember: bool = True


class SessionError(Exception):
    def __init__(self, message, status=401, clear_cookie=False):
        super().__init__(message)
        self.message = message
        self.status = status
        self.clear_cookie = clear_cookie


class SessionManager:
    cookie_name = SESSION_COOKIE_NAME
    max_age = SESSION_MAX_AGE

    @staticmethod
    def _serializer():
        return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt=SESSION_SALT)

    @classmethod
    def create_token(cls, user_id: int, remember: bool = True) -> str:
        return cls._serializer().dumps({"user_id": user_id, "remember": bool(remember)})

    @classmethod
    def parse_token(cls, token: str):
        try:
            return cls._serializer().loads(token, max_age=cls.max_age)
        except (BadSignature, SignatureExpired):
            raise SessionError("Session expired", 401, clear_cookie=True)

    @classmethod
    def set_cookie(cls, response, token: str, persistent: bool = True):
        response.set_cookie(
            cls.cookie_name,
            token,
            max_age=cls.max_age if persistent else None,
            httponly=True,
            samesite='Strict',
            secure=bool(current_app.config.get('SESSION_COOKIE_SECURE', False)),
            path='/'
        )
        return response

    @classmethod
    def clear_cookie(cls, response):
        response.delete_cookie(
            cls.cookie_name,
            samesite='Strict',
            path='/'
        )
        return response

    @classmethod
    def attach_user_session(cls, response, user_id: int, remember: bool = True):
        token = cls.create_token(user_id, remember=remember)
        return cls.set_cookie(response, token, persistent=remember)

    @classmethod
    def resolve_session(cls) -> SessionData:
        token = request.cookies.get(cls.cookie_name)
        if not token:
            raise SessionError("Not authenticated", 401)
        data = cls.parse_token(token)
        user_id = data.get("user_id")
        if not user_id:
            raise SessionError("Session expired", 401, clear_cookie=True)
        user = _get_user_by_id(user_id)
        if not user:
            raise SessionError("User not found", 404, clear_cookie=True)
        remember = bool(data.get("remember", True))
        return SessionData(user=user, remember=remember)

    @classmethod
    def ensure_context(cls) -> SessionData:
        session = cls.resolve_session()
        g.current_user = session.user
        g.session_remember = session.remember
        return session

    @classmethod
    def error_response(cls, exc: SessionError):
        response = jsonify({"error": exc.message})
        if exc.clear_cookie:
            cls.clear_cookie(response)
        return response, exc.status


def get_write_conn():
    return mysql.connector.connect(
        host=current_app.config['MYSQL_HOST'],
        port=current_app.config['MYSQL_PORT'],
        user=current_app.config['MYSQL_USER'],
        password=current_app.config.get('MYSQL_PASSWORD') or '',
        database=current_app.config['MYSQL_DATABASE'],
        unix_socket=current_app.config.get('MYSQL_UNIX_SOCKET')
    )


def authorize_request():
    if getattr(g, 'current_user', None):
        return None

    try:
        SessionManager.ensure_context()
    except SessionError as exc:
        return SessionManager.error_response(exc)

    return None


def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_error = authorize_request()
        if auth_error:
            return auth_error
        return func(*args, **kwargs)

    return wrapper


def get_current_user():
    return getattr(g, 'current_user', None)


def get_current_user_id():
    user = get_current_user()
    return user.get("UserID") if user else None


def get_current_household_id():
    user = get_current_user()
    return user.get("HouseholdID") if user else None


def require_household(target_household_id=None):
    household_id = get_current_household_id()
    if not household_id:
        return None, (jsonify({'error': 'User is not associated with a household'}), 403)

    if target_household_id is not None:
        try:
            requested = int(target_household_id)
        except (TypeError, ValueError):
            return None, (jsonify({'error': 'Invalid household_id'}), 400)

        if int(household_id) != requested:
            return None, (jsonify({'error': 'Error 403'}), 403)

        return requested, None

    return int(household_id), None


def _serialize_user(user):
    if not user:
        return None

    return {
        "id": user["UserID"],
        "username": user["UserName"],
        "display_name": user["DisplayName"],
        "role": user["RoleName"],
        "household_id": user["HouseholdID"],
        "household": user["HouseholdName"],
        "join_code": user["JoinCode"]
    }


@document_api_route(bp, 'post', '/login', 'Login user', 'Validate user credentials')
@handle_db_error
def login_user():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    remember = bool(data.get('remember', True))

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

    response = jsonify({
        "message": "Login successful",
        "user": _serialize_user(user)
    })
    SessionManager.attach_user_session(response, user["UserID"], remember=remember)

    return response, 200


@document_api_route(bp, 'post', '/register', 'Register new user', 'Create user and automatically create household if no join_code provided') 
@handle_db_error
def register_user():
    data = request.get_json() or {}
    username = data.get('username')
    display_name = data.get('display_name')
    password = data.get('password')
    join_code = data.get('join_code')
    remember = bool(data.get('remember', True))

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

    response = jsonify({
        "message": "Registration successful",
        "user": _serialize_user(user)
    })
    SessionManager.attach_user_session(response, user["UserID"], remember=remember)

    return response, 200


@document_api_route(bp, 'get', '/members/<int:household_id>',
                    'Get household members',
                    'Return all users in this household')
@handle_db_error
@require_auth
def get_household_members(household_id):
    user = get_current_user()
    if not user or not user.get("HouseholdID") or int(user["HouseholdID"]) != int(household_id):
        return jsonify({"error": "Error 403"}), 403

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
@require_auth
def join_household():
    data = request.get_json() or {}
    join_code = data.get("join_code")

    if not join_code:
        return jsonify({"error": "join_code required"}), 400

    current_user = get_current_user()
    user_id = current_user["UserID"]

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

    updated_user = _get_user_by_id(user_id)
    if updated_user:
        g.current_user = updated_user

    return jsonify({
        "message": "Joined household successfully",
        "household_id": h["HouseholdID"],
        "household_name": h["HouseholdName"],
        "user": _serialize_user(updated_user)
    }), 200


@document_api_route(
    bp, 'post', '/create-household',
    'Create a new household',
    'User creates a new household and becomes owner. If user is already in a household, they will be removed from it.'
)
@handle_db_error
@require_auth
def create_household():
    data = request.get_json() or {}
    household_name = data.get("household_name", "")

    current_user = get_current_user()
    user_id = current_user["UserID"]

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

    updated_user = _get_user_by_id(user_id)
    if updated_user:
        g.current_user = updated_user

    return jsonify({
        "message": "Household created successfully",
        "household": {
            "household_id": household["HouseholdID"],
            "household_name": household["HouseholdName"],
            "join_code": household["JoinCode"]
        },
        "user": _serialize_user(updated_user)
    }), 200


@document_api_route(bp, 'post', '/remove-member',
                    'Remove user from household',
                    'Remove an existing household member and auto-create a new household for them')
@handle_db_error
@require_auth
def remove_member():
    data = request.get_json() or {}
    username = data.get("username")

    if not username:
        return jsonify({"error": "username required"}), 400

    current_user = get_current_user()
    if current_user.get("RoleName") != "owner":
        return jsonify({"error": "Only household owners can remove members"}), 403

    owner_household_id = current_user.get("HouseholdID")
    if not owner_household_id:
        return jsonify({"error": "Owner must belong to a household"}), 400

    conn = get_write_conn()
    cursor = conn.cursor(dictionary=True)

    # validate user exists and get display name
    cursor.execute("""
        SELECT UserID, HouseholdID, DisplayName
        FROM Users
        WHERE UserName=%s AND IsArchived=0
    """, (username,))
    user = cursor.fetchone()

    if not user or user.get("HouseholdID") != owner_household_id:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found in your household"}), 404

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
@require_auth
def update_profile():
    data = request.get_json() or {}
    new_name = data.get("display_name")
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    current_user = get_current_user()
    user_id = current_user["UserID"]

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

    updated_user = _get_user_by_id(user_id)
    if updated_user:
        g.current_user = updated_user

    return jsonify({
        "message": "Profile updated successfully",
        "user": _serialize_user(updated_user)
    }), 200


@document_api_route(
    bp, 'delete', '/account/<int:user_id>',
    'Delete user account',
    'Remove a user account and clean up associated ownership/transaction references'
)
@handle_db_error
@require_auth
def delete_account(user_id: int):
    data = request.get_json() or {}
    confirm_username = (data.get("confirm_username") or "").strip()

    if not confirm_username:
        return jsonify({"error": "confirm_username required"}), 400

    current_user = get_current_user()
    if not current_user or current_user["UserID"] != user_id:
        return jsonify({"error": "You can only delete your own account"}), 403

    conn = get_write_conn()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT UserID, UserName, HouseholdID, RoleName
            FROM Users
            WHERE UserID=%s AND IsArchived=0
            LIMIT 1
        """, (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        if confirm_username != user["UserName"]:
            return jsonify({"error": "Confirmation username does not match"}), 400

        household_id = user.get("HouseholdID")
        role = user.get("RoleName")

        placeholder_user_id = add_deleted_user_placeholder(cursor, household_id)

        cursor.execute("""
            UPDATE InventoryTransaction
            SET UserID = %s
            WHERE UserID = %s
        """, (placeholder_user_id, user_id))

        if household_id and role == 'owner':
            cursor.execute("""
                SELECT UserID
                FROM Users
                WHERE HouseholdID=%s
                  AND UserID!=%s
                  AND IsArchived=0
                ORDER BY UserID ASC
                LIMIT 1
            """, (household_id, user_id))
            successor = cursor.fetchone()
            if successor:
                cursor.execute("""
                    UPDATE Users
                    SET RoleName='owner'
                    WHERE UserID=%s
                """, (successor["UserID"],))

        cursor.execute("DELETE FROM Users WHERE UserID=%s", (user_id,))

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    response = jsonify({"message": "Account deleted"})
    SessionManager.clear_cookie(response)
    return response, 200


def _get_user_by_id(user_id: int):
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT 
                u.UserID,
                u.UserName,
                u.DisplayName,
                u.RoleName,
                u.HouseholdID,
                h.HouseholdName,
                h.JoinCode
            FROM Users u
            LEFT JOIN Household h ON u.HouseholdID = h.HouseholdID
            WHERE u.UserID = %s
              AND u.IsArchived = 0
            LIMIT 1
        """, (user_id,))
        return cursor.fetchone()


def add_deleted_user_placeholder(cursor, household_id):
    target_household_id = household_id or _ensure_deleted_user_household(cursor)
    username = f"deleted_user_{target_household_id}"

    cursor.execute("""
        SELECT UserID
        FROM Users
        WHERE UserName=%s
        LIMIT 1
    """, (username,))
    existing = cursor.fetchone()
    if existing:
        return existing["UserID"]

    placeholder_password = bcrypt.hashpw(b"deleted-user-placeholder", bcrypt.gensalt()).decode('utf-8')

    cursor.execute("""
        INSERT INTO Users (HouseholdID, UserName, DisplayName, RoleName, PasswordHash, IsArchived)
        VALUES (%s, %s, %s, %s, %s, 1)
    """, (
        target_household_id,
        username,
        "Deleted User",
        "system",
        placeholder_password
    ))

    return cursor.lastrowid


def _ensure_deleted_user_household(cursor):
    cursor.execute("""
        SELECT HouseholdID
        FROM Household
        WHERE HouseholdName=%s
        LIMIT 1
    """, ("Deleted Users Household",))
    existing = cursor.fetchone()
    if existing:
        return existing["HouseholdID"]

    while True:
        join_code = str(uuid.uuid4())[:6].upper()
        cursor.execute("""
            SELECT HouseholdID
            FROM Household
            WHERE JoinCode=%s
            LIMIT 1
        """, (join_code,))
        if not cursor.fetchone():
            break

    cursor.execute("""
        INSERT INTO Household (HouseholdName, JoinCode)
        VALUES (%s, %s)
    """, ("Deleted Users Household", join_code))

    return cursor.lastrowid


@document_api_route(
    bp, 'get', '/session',
    'Get current session',
    'Return the current authenticated user based on the session cookie'
)
@handle_db_error
def get_session():
    auth_error = authorize_request()
    if auth_error:
        return auth_error

    user = get_current_user()
    remember = bool(getattr(g, 'session_remember', True))
    response = jsonify({
        "message": "Session active",
        "user": _serialize_user(user)
    })
    SessionManager.attach_user_session(response, user["UserID"], remember=remember)
    return response, 200


@document_api_route(
    bp, 'post', '/logout',
    'Logout user',
    'Clear session cookie and log user out'
)
def logout_user():
    response = jsonify({"message": "Logged out"})
    SessionManager.clear_cookie(response)
    return response, 200
