# Pantry Manager API

Flask REST API backend for managing pantry inventory, shopping lists, and households.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Database

Create a `.env` file in the `backend` directory:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=pantry_app
```

### 3. Start the Server

```bash
python app.py
```

The API will be available at `http://localhost:5001`

## API Endpoints

### Health Check

**GET** `/`
```bash
curl http://localhost:5001/
```

Response:
```json
{
  "status": "ok",
  "message": "Stocker API running"
}
```

### Food Items

#### Get a single food item by ID

**GET** `/api/food-items/{food_item_id}`

Example:
```bash
curl http://localhost:5001/api/food-items/1
```

Response:
```json
{
  "FoodItemID": 1,
  "Name": "Milk",
  "Type": "perishable",
  "Category": "dairy",
  "BaseUnitID": 2,
  "HouseholdID": 1,
  "PreferredPackageID": null,
  "BaseUnit": "g"
}
```

#### Get all food items for a household

**GET** `/api/food-items?household_id={household_id}`

Example:
```bash
curl http://localhost:5001/api/food-items?household_id=1
```

Response:
```json
[
  {
    "FoodItemID": 1,
    "Name": "Milk",
    "Type": "perishable",
    "Category": "dairy",
    "BaseUnit": "g"
  },
  {
    "FoodItemID": 2,
    "Name": "Bread",
    "Type": "perishable",
    "Category": "bakery",
    "BaseUnit": "each"
  }
]
```

#### Create a new food item

**POST** `/api/food-items`

Example:
```bash
curl -X POST http://localhost:5001/api/food-items \
  -H "Content-Type: application/json" \
  -d '{
    "HouseholdID": 1,
    "BaseUnitID": 1,
    "Name": "Eggs",
    "Type": "perishable",
    "Category": "dairy"
  }'
```

### Households

#### Get all households

**GET** `/api/households`

Example:
```bash
curl http://localhost:5001/api/households
```

#### Get a single household by ID

**GET** `/api/households/{household_id}`

Example:
```bash
curl http://localhost:5001/api/households/1
```

#### Create a new household

**POST** `/api/households`

Example:
```bash
curl -X POST http://localhost:5001/api/households \
  -H "Content-Type: application/json" \
  -d '{
    "HouseholdName": "Smith Family"
  }'
```

### Shopping Lists

#### Get shopping lists for a household

**GET** `/api/shopping-lists?household_id={household_id}`

Example:
```bash
curl http://localhost:5001/api/shopping-lists?household_id=1
```

#### Create a new shopping list

**POST** `/api/shopping-lists`

Example:
```bash
curl -X POST http://localhost:5001/api/shopping-lists \
  -H "Content-Type: application/json" \
  -d '{
    "HouseholdID": 1,
    "Status": "active"
  }'
```

#### Get items for a shopping list

**GET** `/api/shopping-lists/{shopping_list_id}/items`

Example:
```bash
curl http://localhost:5001/api/shopping-lists/1/items
```

## Testing in Browser

You can test GET endpoints directly in your browser:

- Health check: http://localhost:5001/
- Get food item: http://localhost:5001/api/food-items/1
- Get household: http://localhost:5001/api/households/1

## Error Responses

All endpoints return JSON error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing required fields)
- `404` - Not Found
- `500` - Internal Server Error

## Database Schema

The API uses MySQL/MariaDB with the following main tables:
- `Household` - Household information
- `Users` - User accounts
- `FoodItem` - Food items in inventory
- `BaseUnit` - Measurement units (g, cup, each, etc.)
- `ShoppingList` - Shopping lists
- `ShoppingListItem` - Items in shopping lists
- `Location` - Storage locations
- `Package` - Product packaging information
- `InventoryTransaction` - Inventory change history
- `PriceLog` - Price tracking
- `StockLevel` - Target stock levels

## Notes

- All table names use PascalCase (e.g., `FoodItem`, not `food_items`)
- The API uses raw SQL queries (not an ORM)
- Stored procedures can be used for complex operations
- Make sure your MySQL database is running and accessible

