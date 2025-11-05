# API Endpoints Documentation

Complete API reference for the Pantry Manager backend.

Base URL: `http://localhost:5001`

## Health Check

**GET** `/`

Check if the API is running.

```bash
curl http://localhost:5001/
```

**Response:**
```json
{
  "status": "ok",
  "message": "Stocker API running"
}
```

---

## Food Items

### Get a single food item by ID

**GET** `/api/food-items/{food_item_id}`

Example:
```bash
curl http://localhost:5001/api/food-items/1
```

**Response:**
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

**Error Response (404):**
```json
{
  "error": "Food item not found"
}
```

---

### Get all food items for a household

**GET** `/api/food-items?household_id={household_id}`

Example:
```bash
curl http://localhost:5001/api/food-items?household_id=1
```

**Response:**
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

**Error Response (400):**
```json
{
  "error": "household_id required"
}
```

---

### Create a new food item

**POST** `/api/food-items`

**Request Body:**

**Required Fields:**

**Optional Fields:**

**Response (201):**

---

## Households

### Get a single household by ID

**GET** `/api/households/{household_id}`

Example:
```bash
curl http://localhost:5001/api/households/1
```

**Response:**
```json
{
  "HouseholdID": 1,
  "HouseholdName": "Smith Family",
  "JoinCode": "ABC123",
  "MemberCount": 3,
  "FoodItemCount": 15
}
```

**Error Response (404):**
```json
{
  "error": "Household not found"
}
```

---

### Create a new household

**POST** `/api/households`

**Request Body:**


**Required Fields:**

**Response (201):**


---

## Shopping Lists

### Get items for a shopping list

**GET** `/api/shopping-lists/{shopping_list_id}/items`

Example:
```bash
curl http://localhost:5001/api/shopping-lists/1/items
```

**Response:**
```json
[
  {
    "ShoppingListItemID": 1,
    "FoodItemID": 1,
    "FoodItemName": "Milk",
    "LocationID": 1,
    "LocationName": "Refrigerator",
    "PackageID": 1,
    "PackageLabel": "1 gallon",
    "NeededQty": 2.0,
    "PurchasedQty": 0.0,
    "TotalPrice": 0.0,
    "Status": "needed"
  }
]
```

---

## Error Responses

All endpoints return JSON error responses:

```json
{
  "error": "Error message here"
}
```

## Examples

You can test GET endpoints directly in browser:

- Health check: http://localhost:5001/
- Get food item: http://localhost:5001/api/food-items/1
- Get household: http://localhost:5001/api/households/1
- Get shopping list items: http://localhost:5001/api/shopping-lists/1/items

