import os
from datetime import timedelta
from apiflask import APIFlask
from flask import jsonify, send_from_directory, request
from flask_cors import CORS
from config import config
from extensions import login_manager
from routes import food_items_bp, shopping_lists_bp, households_bp, auth_bp, transactions_bp
from routes.auth import authorize_request, AUTH_EXEMPT_ENDPOINTS


def create_app(config_name='development'):
    if config_name == 'production':
        frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
        app = APIFlask(__name__, static_folder=frontend_dist, static_url_path='')
    else:
        app = APIFlask(__name__, static_folder=None)
    
    app.config.from_object(config[config_name])
    app.config.setdefault('REMEMBER_COOKIE_DURATION', timedelta(days=30))
    app.config.setdefault('REMEMBER_COOKIE_HTTPONLY', True)
    app.config.setdefault('REMEMBER_COOKIE_SAMESITE', 'Lax')
    
    app.title = "Pantry App API"
    app.version = "1.0.0"
  
    app.url_map.strict_slashes = False
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    login_manager.init_app(app)
    login_manager.session_protection = 'strong'
    login_manager.login_view = 'auth.login_user'
    
    app.register_blueprint(food_items_bp)
    app.register_blueprint(shopping_lists_bp)
    app.register_blueprint(households_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)

    @app.before_request
    def enforce_authorization():
        if request.method == 'OPTIONS':
            return None
        if not request.path.startswith('/api/'):
            return None
        endpoint = request.endpoint
        if endpoint is None or endpoint in AUTH_EXEMPT_ENDPOINTS:
            return None
        return authorize_request()
    
    if config_name == 'production':
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_frontend(path):
            file_path = os.path.join(app.static_folder, path)
            if path and os.path.isfile(file_path):
                return send_from_directory(app.static_folder, path)
            return send_from_directory(app.static_folder, 'index.html')
    
    return app

if __name__ == '__main__':
    config_name = os.getenv('FLASK_ENV', 'development')
    app = create_app(config_name)
    app.run(debug=(config_name == 'development'), port=5001)
