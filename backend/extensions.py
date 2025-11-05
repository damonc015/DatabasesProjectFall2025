"""Flask extensions"""
import mysql.connector
from flask import current_app


def get_db():
    """Get database connection - simple version"""
    conn = mysql.connector.connect(
        host=current_app.config['MYSQL_HOST'],
        port=current_app.config['MYSQL_PORT'],
        user=current_app.config['MYSQL_USER'],
        password=current_app.config.get('MYSQL_PASSWORD') or '',
        database=current_app.config['MYSQL_DATABASE']
    )
    return conn
