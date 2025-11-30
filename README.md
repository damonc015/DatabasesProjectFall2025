
# Database Fall 2025
## Prerequisites
- MySQL 
- Python 3.8+
- Node.js and pnpm
- MySQL database (default name: `stocker`)

### Backend Setup (Flask)



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
MYSQL_USER=stocker_app
MYSQL_PASSWORD=2zC4ngpg2b6F
MYSQL_DATABASE=stocker
``` 


### 3. Connect/Create Database

Connect to MySQL
```sql
CREATE DATABASE IF NOT EXISTS stocker;
```

### 4. Backend Setup

```bash
source venv/bin/activate 

# Run the app
python app.py
```

The server will start on `http://localhost:5001`





### Frontend Setup

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

