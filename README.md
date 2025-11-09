
# Database Fall 2025
## Prerequisites

### Backend Setup (Flask)

- Python 3.8+
- MySQL database (default name: `stocker`)

#### Quick Start

##### 1. Install Dependencies

**Using virtual environment**
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

#### 2. Configure Database

Create a `.env` file in the `backend` directory:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=stocker 
``` 
**Note:** 
MYSQL_DATABASE is your local db name
(if you didn't set a pw, leave `MYSQL_PASSWORD=` blank).

### 3. Connect/Create Database

Connect to MySQL
```sql
CREATE DATABASE IF NOT EXISTS stocker;
```

### 4. Start the Server

```bash
source venv/bin/activate 

# Run the app
python app.py
```

The server will start on `http://localhost:5001`

You should see: `{"status":"ok","message":"Stocker API running"}`

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── config.py              # Configuration settings
├── extensions.py          # Database connection helper
├── routes/                # API route
│   ├── food_items.py
│   ├── households.py
│   └── shopping_lists.py
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (git ignored)
└── README.md
```

## Troubleshooting
- **MySQL connection error**: Make sure MySQL is running and credentials are correct
- **Port 5001 already in use**: Change the port in `app.py` line 34

## API Documentation
See [API.md](API.md) for API endpoint documentation.

### Frontend Setup (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Make sure you're on the right node version
    ```bash
    nvm use
    ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Build for production:
   ```bash
   pnpm build
   ```

6. Preview production build:
   ```bash
   pnpm preview
   ```

