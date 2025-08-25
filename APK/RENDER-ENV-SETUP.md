# 🔧 Render Environment Variables Setup

## 📋 Required Environment Variables for Your Backend

When deploying to Render, you need to set these environment variables in your Render dashboard:

### 1. **NEWS_API_KEY** (Required)

- **Value**: `pub_a48ee6eb1f014b57a406188f05877ea3`
- **Description**: Your news API key for fetching crime/safety news
- **Type**: String

### 2. **ENVIRONMENT** (Optional)

- **Value**: `production`
- **Description**: Environment identifier for health checks
- **Type**: String

### 3. **PYTHON_VERSION** (Optional)

- **Value**: `3.9.16`
- **Description**: Python version for Render to use
- **Type**: String

## 🎯 How to Set Environment Variables in Render

### Step 1: Access Your Render Dashboard

1. Go to [render.com](https://render.com)
2. Sign in to your account
3. Find your `redzone-backend` service

### Step 2: Navigate to Environment Variables

1. Click on your service name
2. Go to **Environment** tab
3. Click **Add Environment Variable**

### Step 3: Add Each Variable

#### Variable 1: NEWS_API_KEY

- **Key**: `NEWS_API_KEY`
- **Value**: `pub_a48ee6eb1f014b57a406188f05877ea3`
- **Description**: News API key

#### Variable 2: ENVIRONMENT

- **Key**: `ENVIRONMENT`
- **Value**: `production`
- **Description**: Environment identifier

#### Variable 3: PYTHON_VERSION

- **Key**: `PYTHON_VERSION`
- **Value**: `3.9.16`
- **Description**: Python version

### Step 4: Save and Deploy

1. Click **Save Changes**
2. Render will automatically redeploy your service
3. Wait for deployment to complete

## 🧪 Testing Your Environment Variables

After deployment, test your environment variables:

### Health Check

```bash
curl https://your-render-url.onrender.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "message": "Backend is running",
  "environment": "production"
}
```

### News API Test

```bash
curl https://your-render-url.onrender.com/api/news
```

Should return news articles if the API key is working correctly.

## 🔒 Security Best Practices

### 1. **Never Commit API Keys to Git**

- Your current API key is hardcoded in the app
- In production, always use environment variables
- Consider rotating API keys regularly

### 2. **Environment-Specific Variables**

- Use different API keys for development and production
- Set `ENVIRONMENT=development` for local testing
- Set `ENVIRONMENT=production` for Render deployment

### 3. **CORS Configuration**

- Current CORS allows all origins (`*`)
- In production, restrict to your Netlify domain:

```python
CORS(app, origins=["https://your-netlify-site.netlify.app"])
```

## 🚨 Troubleshooting

### Common Issues:

1. **API Key Not Working**

   - Verify the API key is correct
   - Check if the API key has usage limits
   - Test the API key directly with the news service

2. **Environment Variables Not Loading**

   - Make sure variable names match exactly (case-sensitive)
   - Redeploy after adding environment variables
   - Check Render logs for errors

3. **CORS Errors**
   - Update CORS origins to your specific frontend domain
   - Test with browser developer tools

## 📝 Example .env File (Local Development)

Create a `.env` file in your project root for local development:

```env
NEWS_API_KEY=pub_a48ee6eb1f014b57a406188f05877ea3
ENVIRONMENT=development
```

## 🔄 Updating Environment Variables

To update environment variables in Render:

1. Go to your service dashboard
2. Navigate to **Environment** tab
3. Edit existing variables or add new ones
4. Click **Save Changes**
5. Render will automatically redeploy

## 📊 Monitoring

After deployment, monitor your app:

1. **Health Check**: `/api/health` endpoint
2. **Render Logs**: Check deployment and runtime logs
3. **API Usage**: Monitor your news API usage
4. **Performance**: Check Render metrics

---

**✅ Your backend is now configured to use environment variables properly!**

Set these variables in Render and your app will be production-ready with proper security practices.
