from contextlib import contextmanager
from functools import wraps
import mysql.connector
from flask import current_app, jsonify
from flask_socketio import SocketIO
from apiflask import APIBlueprint

socketio = SocketIO(cors_allowed_origins="*")

def get_db():
    conn = mysql.connector.connect(
        host=current_app.config['MYSQL_HOST'],
        port=current_app.config['MYSQL_PORT'],
        user=current_app.config['MYSQL_USER'],
        password=current_app.config.get('MYSQL_PASSWORD') or '',
        database=current_app.config['MYSQL_DATABASE']
    )
    return conn

# A simple SQL sniffer to detect inventorytransaction modifications
class SqlSniffer:
    def __init__(self, cursor):
        self.cursor = cursor
        self.is_transaction_modified = False

    def execute(self, operation, params=None, multi=False):
        res = self.cursor.execute(operation, params, multi)
        try:
            sql = operation.lower().strip()
            
            if 'inventorytransaction' in sql and \
                any(action in sql for action in ['insert ', 'update ', 'delete ']):
                    self.is_transaction_modified = True
        except Exception:
            pass # Ignore sniffer errors
            
        return res

    def callproc(self, procname, args=()):
        res = self.cursor.callproc(procname, args)
        try:
            target_procedures = ['add_new_food_item', 'addremoveexistingfooditem']
            if procname.lower() in target_procedures:
                self.is_transaction_modified = True
        except Exception:
            pass
        
        return res

    def __getattr__(self, attr):
        return getattr(self.cursor, attr)
    
    def __iter__(self):
        return iter(self.cursor)


@contextmanager
def db_cursor():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sniffer_cursor = SqlSniffer(cursor)
        yield sniffer_cursor
        conn.commit()
        # Emit socket event if inventorytransaction was modified
        if sniffer_cursor.is_transaction_modified:
            socketio.emit('transaction_update', {
                'table': 'inventorytransaction',
                'action': 'modified'
            })
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f'Database connection failed: {str(e)}')
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def create_api_blueprint(name, url_prefix, import_name=None):
    if import_name is None:
        import inspect
        frame = inspect.currentframe().f_back
        import_name = frame.f_globals.get('__name__', name)
    return APIBlueprint(name, import_name, url_prefix=url_prefix)


def document_api_route(bp, method, path, summary, description=None, **kwargs):
    def decorator(f):
        route_decorator = getattr(bp, method.lower())
        doc_decorator = bp.doc(summary=summary, description=description or summary)
        return route_decorator(path, **kwargs)(doc_decorator(f))
    return decorator


def handle_db_error(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return decorated_function
