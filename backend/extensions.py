from contextlib import contextmanager
from functools import wraps
import mysql.connector
from flask import current_app, jsonify
from apiflask import APIBlueprint


def get_db():
    conn = mysql.connector.connect(
        host=current_app.config['MYSQL_HOST'],
        port=current_app.config['MYSQL_PORT'],
        user=current_app.config['MYSQL_USER'],
        password=current_app.config.get('MYSQL_PASSWORD') or '',
        database=current_app.config['MYSQL_DATABASE']
    )
    return conn


@contextmanager
def db_cursor():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        yield cursor
    except Exception as e:
        raise Exception(f'Database connection failed: {str(e)}')
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
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
