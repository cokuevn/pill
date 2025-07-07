# Deployment Guide for Render.com

## Backend Deployment

### Step 1: Create Backend Service on Render
1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `pill-reminder-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

### Step 2: Set Environment Variables
Add these environment variables in Render dashboard:
```
MONGO_URL=mongodb+srv://cokuevn:Test123456@cluster0.85abc7p.mongodb.net/?retryWrites=true&w=majority&authSource=admin
DB_NAME=pill_reminder
OPENAI_API_KEY=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
```

### Step 3: Deploy
- Click "Create Web Service"
- Backend will be available at: `https://backend-kxgf.onrender.com`

## Frontend Deployment

### Step 1: Create Frontend Service on Render
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `pill-reminder-frontend`
   - **Build Command**: `yarn install && yarn build`
   - **Publish Directory**: `build`
   - **Root Directory**: `frontend`

### Step 2: Set Environment Variables
Add these environment variables:
```
REACT_APP_BACKEND_URL=https://backend-kxgf.onrender.com
REACT_APP_ADSENSE_ENABLED=false
```

### Step 3: Deploy
- Click "Create Static Site"
- Frontend will be available at: `https://pill-c93d.onrender.com`

## Database Setup

### MongoDB Atlas
Database is already configured with the provided connection string:
- **Cluster**: `cluster0.85abc7p.mongodb.net`
- **Database**: `pill_reminder`
- **Username**: `cokuevn`
- **Collections**: Will be created automatically

## Health Checks

### Backend Health Check
Visit: `https://backend-kxgf.onrender.com/health`
Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-..."
}
```

### Frontend Health Check
Visit: `https://pill-c93d.onrender.com`
Should load the PWA application.

## Features Enabled

✅ **PWA Version**: 1.4.0 (Full Featured)
✅ **AI Assistant**: GPT-4o powered with personalized insights
✅ **Push Notifications**: Smart medication reminders
✅ **Offline Support**: IndexedDB local storage
✅ **MongoDB Atlas**: Cloud database
✅ **CORS**: Configured for Render domains
✅ **Health Checks**: For monitoring
✅ **Mobile Ready**: PWA with install prompt

## Troubleshooting

### Backend Issues
- Check logs in Render dashboard
- Verify environment variables
- Test health endpoint: `/health`

### Frontend Issues
- Check build logs
- Verify environment variables
- Test API connection in browser console

### Database Issues
- Verify MongoDB Atlas connection
- Check IP whitelist (0.0.0.0/0 for Render)
- Test connection string

## URLs Summary
- **Frontend**: https://pill-c93d.onrender.com
- **Backend**: https://backend-kxgf.onrender.com
- **API**: https://backend-kxgf.onrender.com/api
- **Health**: https://backend-kxgf.onrender.com/health

## Next Steps
1. Deploy backend first
2. Wait for backend to be healthy
3. Deploy frontend
4. Test full application
5. Configure custom domain (optional)
6. Set up monitoring (optional)