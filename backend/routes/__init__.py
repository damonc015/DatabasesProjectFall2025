"""Routes package initialization"""
from routes.food_items import bp as food_items_bp
from routes.shopping_lists import bp as shopping_lists_bp
from routes.households import bp as households_bp
from routes.auth import bp as auth_bp
from routes.transactions import bp as transactions_bp

__all__ = ['food_items_bp', 'shopping_lists_bp', 'households_bp', 'auth_bp', 'transactions_bp']
