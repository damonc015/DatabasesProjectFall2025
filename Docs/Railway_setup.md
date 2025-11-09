### Railway Single Service Deployment 

This setup deploys both frontend and backend as a single service on Railway.

  - Backend serves API at `/api/*` routes
  - Frontend is built during deployment and Flask serves those files

#### Deployment Steps

##### 1. Check required files

- `start.sh` 
- `build.sh` 
- `railway.json` 
- `package.json`
- `backend/wsgi.py`
- `backend/requirements.txt`

##### 2. Push to GitHub (updates etc)

```bash
git add .
git commit -m "Configure for Railway single service deployment"
git push
```

##### 3. Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Click "New" → "GitHub Repo"


##### 4. Add MySQL Database
1. In Railway project, click "New" → "Database" → "MySQL"
3. Copy these for Environment Variables (next step)

##### 5. Configure Environment Variables
Service → "Variables" and add:

**Required:**
- `FLASK_ENV=production`
- `MYSQL_HOST` (from Railway MySQL service)
- `MYSQL_PORT=3306`
- `MYSQL_USER=root`
- `MYSQL_PASSWORD` (from Railway MySQL service)
- `MYSQL_DATABASE` (Actual Database Name (ie: stocker))
- `SECRET_KEY` (secure random key)

**Example:**
```
FLASK_ENV=production
MYSQL_DATABASE=stocker
MYSQL_HOST=mysql.railway.internal
MYSQL_PASSWORD=password.from.railway.mysql
MYSQL_PORT=3306
MYSQL_USER=root
SECRET_KEY=secret-key-here
```

##### 6. Deploy