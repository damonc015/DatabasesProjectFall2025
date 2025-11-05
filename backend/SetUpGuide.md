# How to Start the Backend

## Prerequisites
- Python 3.8+
- MySQL database running
- MySQL database created (default name: `pantry_app`)

## Steps

### 1. Install Dependencies

**Option A: Using virtual environment (recommended)**
```bash
cd DatabasesProjectFall2025/backend

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
cd DatabasesProjectFall2025/backend
pip install -r requirements.txt
```

### 2. Set Up MySQL Connection

Create a `.env` file in the backend directory (or set environment variables):

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=your_username
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=pantry_app
```

Or create a `.env` file:
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=pantry_app
```

### 3. Make Sure MySQL Database Exists

Connect to MySQL and create the database:
```sql
CREATE DATABASE IF NOT EXISTS pantry_app;
```

### 4. Run the Flask App

```bash
python app.py
```

The server will start on `http://localhost:5001`

### 5. Test It

Open your browser or curl:
```bash
curl http://localhost:5001/
```

You should see: `{"status":"ok","message":"Pantry Manager API"}`

## Troubleshooting

- **MySQL connection error**: Make sure MySQL is running and credentials are correct
- **Port 5001 already in use**: Change the port in `app.py` line 40
- **Module not found**: Make sure you activated the virtual environment and installed dependencies

