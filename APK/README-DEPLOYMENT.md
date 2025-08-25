# 🚀 RedZone Safety App - Deployment Guide

Your RedZone Safety App is now **fully configured** for deployment on Render (backend) and Netlify (frontend)!

## ✅ What's Ready

### Backend (Flask + Python)

- ✅ Production-ready Flask app with CORS
- ✅ Gunicorn server configuration
- ✅ Environment variable handling
- ✅ Health check endpoint
- ✅ Render deployment configuration

### Frontend (React + Vite)

- ✅ Production build configuration
- ✅ API utility for environment switching
- ✅ Netlify deployment configuration
- ✅ Optimized build settings
- ✅ Environment variable support

## 🎯 Quick Deployment Steps

### Step 1: Deploy Backend to Render

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure the service:**

   - **Name**: `redzone-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free (or choose paid plan)

6. **Add Environment Variables:**

   - `NEWS_API_KEY`: Your news API key
   - `PYTHON_VERSION`: `3.9.16`

7. **Deploy!** Render will provide a URL like: `https://your-app-name.onrender.com`

### Step 2: Deploy Frontend to Netlify

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New site from Git"**
4. **Connect your GitHub repository**
5. **Configure build settings:**

   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

6. **Deploy!** Netlify will provide a URL like: `https://your-site-name.netlify.app`

### Step 3: Connect Frontend to Backend

1. **Get your Render backend URL** (from Step 1)
2. **Update the API URL** in your code:
   - Edit `src/utils/api.ts`
   - Replace `'https://your-render-backend-url.onrender.com'` with your actual Render URL
3. **Set environment variable in Netlify:**
   - Go to Site settings → Environment variables
   - Add: `VITE_API_URL` = your Render backend URL

## 🧪 Testing Your Deployment

### Backend Health Check

Visit: `https://your-render-backend-url.onrender.com/api/health`
Should return: `{"status": "healthy", "message": "Backend is running"}`

### Frontend

Visit your Netlify URL and test the news functionality.

## 📁 Key Files for Deployment

```
├── app.py                    # Flask backend (production-ready)
├── requirements.txt          # Python dependencies + gunicorn
├── render.yaml              # Render deployment config
├── package.json             # Node.js dependencies
├── vite.config.ts          # Vite build config
├── netlify.toml            # Netlify deployment config
├── src/utils/api.ts        # API utility (handles dev/prod)
└── DEPLOYMENT.md           # Detailed deployment guide
```

## 🔧 Local Development

### Backend

```bash
python app.py
# Runs on http://localhost:5000
```

### Frontend

```bash
npm run dev
# Runs on http://localhost:5173
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Backend CORS is configured to allow all origins (`*`). In production, you can restrict this to your Netlify domain.

2. **API Not Found**: Make sure you've updated the API URL in `src/utils/api.ts` with your actual Render backend URL.

3. **Build Failures**:

   - Check build logs in both Render and Netlify
   - Ensure all dependencies are in `requirements.txt` and `package.json`

4. **Environment Variables**: Make sure `VITE_API_URL` is set in Netlify with your Render backend URL.

### Local Testing

```bash
# Test backend
curl http://localhost:5000/api/health

# Test frontend build
npm run build
```

## 🔒 Security Notes

- In production, consider restricting CORS origins to your specific domains
- Use environment variables for sensitive data
- Both Render and Netlify provide HTTPS by default

## 📞 Support

If you encounter issues:

1. Check the build logs in Render/Netlify dashboards
2. Verify all environment variables are set correctly
3. Test the API endpoints manually
4. Check the browser console for frontend errors

---

**🎉 Your RedZone Safety App is ready for deployment!**

Follow the steps above to get your app live on the internet. The backend will serve your API endpoints, and the frontend will provide a beautiful user interface for your safety application.
