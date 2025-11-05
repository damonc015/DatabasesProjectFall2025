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

### Shopping Lists

#### Get items for a shopping list

**GET** `/api/shopping-lists/{shopping_list_id}/items`

Example:
```bash
curl http://localhost:5001/api/shopping-lists/1/items
```

## Test GET endpoints


- Health check: http://localhost:5001/
- Get food item: http://localhost:5001/api/food-items/1
- Get household: http://localhost:5001/api/households/1