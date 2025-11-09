from app import create_app
import os


config_name = os.getenv('FLASK_ENV', 'production')
if config_name == 'production':
    config_name = 'production'
else:
    config_name = 'development'

app = create_app(config_name)

if __name__ == "__main__":
    app.run()

