# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### Backend (Render)

- [ ] **Environment Variables Set**

  - [ ] `NEWS_API_KEY` = Your production API key
  - [ ] `ENVIRONMENT` = `production`
  - [ ] `FLASK_DEBUG` = `false`
  - [ ] `FRONTEND_URL` = Your actual Netlify URL
  - [ ] `PYTHON_VERSION` = `3.9.16`

- [ ] **Security Configuration**

  - [ ] CORS origins updated to your actual frontend domain
  - [ ] Debug mode disabled
  - [ ] Proper error handling implemented
  - [ ] Request timeouts configured

- [ ] **Monitoring Setup**
  - [ ] Health check endpoint: `/api/health`
  - [ ] Status endpoint: `/api/status`
  - [ ] Logging configured for production

### Frontend (Netlify)

- [ ] **Environment Variables**

  - [ ] `VITE_API_URL` = Your Render backend URL
  - [ ] Build optimization enabled
  - [ ] Code splitting configured

- [ ] **Security Headers**
  - [ ] HTTPS enforced
  - [ ] Security headers configured in `netlify.toml`
  - [ ] CSP headers if needed

## 🎯 Production Deployment Steps

### Step 1: Deploy Backend to Render

1. **Go to [Render.com](https://render.com)**
2. **Create new Web Service**
3. **Connect your GitHub repository**
4. **Configure:**

   - **Name**: `redzone-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

5. **Set Environment Variables:**

   ```
   NEWS_API_KEY=your_production_api_key
   ENVIRONMENT=production
   FLASK_DEBUG=false
   FRONTEND_URL=https://your-netlify-site.netlify.app
   PYTHON_VERSION=3.9.16
   ```

6. **Deploy and get your backend URL**

### Step 2: Deploy Frontend to Netlify

1. **Go to [Netlify.com](https://netlify.com)**
2. **Create new site from Git**
3. **Connect your GitHub repository**
4. **Configure:**

   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

5. **Set Environment Variables:**

   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com
   ```

6. **Deploy and get your frontend URL**

### Step 3: Update CORS Configuration

1. **Get your Netlify URL**
2. **Update Render environment variable:**
   ```
   FRONTEND_URL=https://your-actual-netlify-url.netlify.app
   ```
3. **Redeploy backend**

## 🧪 Production Testing

### Backend Tests

```bash
# Health check
curl https://your-render-url.onrender.com/api/health

# Status check
curl https://your-render-url.onrender.com/api/status

# News API test
curl https://your-render-url.onrender.com/api/news
```

### Frontend Tests

- [ ] Visit your Netlify URL
- [ ] Test news functionality
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Verify HTTPS is working

## 🔒 Security Checklist

### Backend Security

- [ ] CORS restricted to your frontend domain
- [ ] Debug mode disabled
- [ ] Proper error handling (no sensitive info leaked)
- [ ] Request timeouts configured
- [ ] API key stored in environment variables
- [ ] HTTPS enforced

### Frontend Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] No sensitive data in client-side code
- [ ] API calls use HTTPS
- [ ] Environment variables properly configured

## 📊 Monitoring Setup

### Render Monitoring

- [ ] Enable logging
- [ ] Set up alerts for downtime
- [ ] Monitor resource usage
- [ ] Check deployment logs

### Netlify Monitoring

- [ ] Enable form notifications
- [ ] Set up deployment notifications
- [ ] Monitor build logs
- [ ] Check performance metrics

## 🚨 Production Issues to Watch

### Common Production Issues

1. **CORS Errors**: Make sure frontend URL is correct in backend CORS
2. **API Timeouts**: Check if news API is responding
3. **Build Failures**: Verify all dependencies are in requirements.txt
4. **Environment Variables**: Ensure all variables are set correctly
5. **HTTPS Issues**: Verify both services use HTTPS

### Performance Monitoring

- [ ] Backend response times
- [ ] Frontend load times
- [ ] API call success rates
- [ ] Error rates and types

## 🔄 Post-Deployment Tasks

### Immediate Tasks

- [ ] Test all functionality
- [ ] Verify environment variables
- [ ] Check logs for errors
- [ ] Test on different devices/browsers

### Ongoing Tasks

- [ ] Monitor application performance
- [ ] Set up error tracking
- [ ] Plan for scaling
- [ ] Regular security updates

## 📞 Emergency Contacts

- **Render Support**: [support@render.com](mailto:support@render.com)
- **Netlify Support**: [support@netlify.com](mailto:support@netlify.com)
- **Your API Provider**: Check your news API documentation

---

**🎉 Your app is now production-ready!**

Follow this checklist to ensure a smooth production deployment.
