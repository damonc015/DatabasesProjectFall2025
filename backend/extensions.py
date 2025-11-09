from contextlib import contextmanager
import mysql.connector
from flask import current_app


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
