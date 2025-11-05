from flask import Flask, jsonify
from config import config
from routes import food_items_bp, shopping_lists_bp, households_bp


def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Store MySQL config for get_db() function
    app.config['MYSQL_HOST'] = config[config_name].MYSQL_HOST
    app.config['MYSQL_PORT'] = config[config_name].MYSQL_PORT
    app.config['MYSQL_USER'] = config[config_name].MYSQL_USER
    app.config['MYSQL_PASSWORD'] = config[config_name].MYSQL_PASSWORD
    app.config['MYSQL_DATABASE'] = config[config_name].MYSQL_DATABASE
    app.config['MYSQL_UNIX_SOCKET'] = config[config_name].MYSQL_UNIX_SOCKET
    
    # Register blueprints
    app.register_blueprint(food_items_bp)
    app.register_blueprint(shopping_lists_bp)
    app.register_blueprint(households_bp)
    
    @app.route('/')
    def index():
        """Health check endpoint"""
        return jsonify({'status': 'ok', 'message': 'Stocker API running'})
    
    return app


if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, port=5001)
