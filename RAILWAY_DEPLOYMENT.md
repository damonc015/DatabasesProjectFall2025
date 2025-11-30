# Railway Deployment Guide

## 🚀 Quick Start

Your app is now configured for Railway deployment!

## 📋 Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Configure for Railway production deployment"
git push
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose: `DatabasesProjectFall2025`

### 3. Add MySQL Database

1. In Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will provision the database

### 4. Set Environment Variables

Click your **web service** → **"Variables"** → **"+ New Variable"**

#### Required Variables:

```bash
FLASK_ENV=production
```

```bash
# Generate with: python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-generated-secret-key-here
```

```bash
MYSQL_DATABASE=stocker
MYSQL_PORT=3306
MYSQL_USER=root
```

#### Reference MySQL Service:

```bash
MYSQL_HOST=${{MySQL.MYSQL_PRIVATE_URL}}
MYSQL_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
```

#### Add after first deployment:

```bash
FRONTEND_URL=https://your-actual-railway-url.up.railway.app
```

### 5. Initialize Database

Use Railway CLI or MySQL client to run your schema:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# Connect to MySQL
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD

# Run schema
CREATE DATABASE stocker;
USE stocker;
# Copy/paste from SQL/sql.sql
```

### 6. Monitor Deployment

- Go to **"Deployments"** tab
- Watch build logs
- Wait for **"Success"**
- Copy your Railway URL

### 7. Update FRONTEND_URL

- Update the `FRONTEND_URL` variable with your actual Railway URL
- Railway will auto-redeploy

## ✅ Test Your App

Visit your Railway URL and test:
- Registration
- Login (sessions should work perfectly!)
- All features

## 🔧 What Was Changed

1. **CORS Configuration** - Only allows your Railway domain in production
2. **Cookie Security** - `secure=True` for HTTPS in production
3. **Environment Detection** - Uses `FLASK_ENV` to determine mode

## 🎯 Why Railway?

- ✅ Sessions/cookies work perfectly (same domain)
- ✅ Automatic HTTPS
- ✅ Managed MySQL database
- ✅ Auto-deploy from GitHub
- ✅ Free tier for projects

## 📞 Support

If you encounter issues:
- Check deployment logs in Railway
- Verify environment variables are set
- Ensure database schema is loaded
- Check CORS settings match your URL

---

Happy deploying! 🎉

