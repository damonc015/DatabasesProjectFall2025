import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # MySQL Database Configuration
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD') or ''  # Use empty string if not set
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'pantry_app')
    # XAMPP socket path (optional - leave empty to use TCP/IP)
    MYSQL_UNIX_SOCKET = os.getenv('MYSQL_UNIX_SOCKET', '')
    
    @staticmethod
    def init_app(app):
        """Initialize app configuration"""
        pass


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


# class ProductionConfig(Config):
#     """Production configuration"""
#     DEBUG = False


config = {
    'development': DevelopmentConfig,
    # 'production': ProductionConfig,
    # 'default': DevelopmentConfig
}

