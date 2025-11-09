### APIFlask Usage

Here's how to use APIFlask for our API docs.

#### Creating Routes

1. **First, create a blueprint:**
```python
from extensions import create_api_blueprint

bp = create_api_blueprint('my_resource', '/api/my-resource')
```

2. **Then document your route:**
```python
from extensions import document_api_route, db_cursor, handle_db_error
from flask import jsonify

@document_api_route(bp, 'get', '/', 'Get all items', 'Returns a list of items')
@handle_db_error
def get_items():
    with db_cursor() as cursor:
        # QUERY HERE
        return jsonify(results), 200
```

#### Viewing Documentation

Once the app is running, check out the docs at:
- **Swagger UI:** `http://localhost:5001/docs`
- **OpenAPI JSON:** `http://localhost:5001/openapi.json`

#### Important: Use document_api_route()

If you want your endpoint to show up in Swagger UI, use `document_api_route()`
(Helper created in `extensions.py`). Regular Flask decorators like `@bp.get()` or `@bp.post()` won't create docs automatically - `document_api_route()` is what adds the OpenAPI documentation.

#### Use document_api_route() Example

```python
from flask import jsonify
from extensions import create_api_blueprint, document_api_route, db_cursor, handle_db_error

bp = create_api_blueprint('items', '/api/items')

@document_api_route(bp, 'get', '/<int:id>', 'Get item by ID', 'Returns a single item')
@handle_db_error
def get_item(id):
    with db_cursor() as cursor:
        # query database
        return jsonify(result), 200
```

