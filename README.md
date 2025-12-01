
## Database Fall 2025
### Prerequisites
- MySQL 
- Python 3.8+
- Node.js and pnpm
- MySQL database (default name: `stocker`)

#### Configure Database
- Create the database 'stocker'
- Import the file SQL/stockerMySQL.sql in phpMyAdmin

- Create a `.env` file in the `backend` directory:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=stocker_app
MYSQL_PASSWORD=2zC4ngpg2b6F
MYSQL_DATABASE=stocker
``` 

### Backend Setup (Flask)

#### Create virtual environment
python3 -m venv venv
```
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate  # Windows
```
#### Install dependencies
```
pip install -r requirements.txt
```
#### Run the app
```
python app.py
```
The server will start on `http://localhost:5001`


### Frontend Setup

#### Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

#### Install dependencies:
   ```bash
   pnpm install
   ```

#### Make sure you're on the right node version
    ```bash
    nvm use
    ```

#### Start the development server:
   ```bash
   pnpm dev
   ```

#### Build for production:
   ```bash
   pnpm build
   ```

#### Preview production build:
   ```bash
   pnpm preview
   ```

