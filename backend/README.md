# Pantry Manager API

Flask REST API backend for Stocker.

## Prerequisites

- Python 3.8+
- MySQL database running (XAMPP recommended)
- MySQL database created (default name: `pantry_app`)

## Quick Start

### 1. Install Dependencies

**Option A: Using virtual environment**
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

**Option B: Install globally**
```bash
cd backend
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
**Note:** (if you didn't set a pw, leave `MYSQL_PASSWORD=` blank).

### 3. Create Database

Connect to MySQL and create the database:
```sql
CREATE DATABASE IF NOT EXISTS pantry_app;
```

### 4. Start the Server

```bash
# Make sure virtual environment is activated
source venv/bin/activate 

# Run the app
python app.py
```

The server will start on `http://localhost:5001`

### 5. Test It

```bash
curl http://localhost:5001/
```

You should see: `{"status":"ok","message":"Stocker API running"}`

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── config.py              # Configuration settings
├── extensions.py          # Database connection helper
├── routes/                # API route files
│   ├── food_items.py
│   ├── households.py
│   └── shopping_lists.py
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not in git)
└── README.md              # This file
```

## Troubleshooting

- **MySQL connection error**: Make sure MySQL is running and credentials are correct
- **Port 5001 already in use**: Change the port in `app.py` line 34
- **Module not found**: Make sure you activated the virtual environment and installed dependencies
- **Table doesn't exist**: Make sure your database tables are created

## API Documentation

See [API.md](API.md) for API endpoint documentation.
