# Deployment Guide - RedZone Safety App

## Overview

This guide covers deploying the RedZone Safety App to Netlify using Supabase as the backend.

## Prerequisites

- GitHub repository with your code
- Netlify account
- Supabase project configured

## Step 1: Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Database Tables**
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Create app_users table
   CREATE TABLE app_users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     phone TEXT,
     email TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create admin_users table
   CREATE TABLE admin_users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     email TEXT NOT NULL,
     role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create red_zones table
   CREATE TABLE red_zones (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     latitude DECIMAL(10, 8) NOT NULL,
     longitude DECIMAL(11, 8) NOT NULL,
     radius INTEGER DEFAULT 100,
     crime_rate INTEGER DEFAULT 0,
     risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create sos_alerts table
   CREATE TABLE sos_alerts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     latitude DECIMAL(10, 8) NOT NULL,
     longitude DECIMAL(11, 8) NOT NULL,
     alert_type TEXT NOT NULL,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
     user_message TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create emergency_contacts table
   CREATE TABLE emergency_contacts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     contact_id UUID REFERENCES auth.users(id) NOT NULL,
     relationship TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create emergency_contact_requests table
   CREATE TABLE emergency_contact_requests (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     requester_id UUID REFERENCES auth.users(id) NOT NULL,
     target_id UUID REFERENCES auth.users(id) NOT NULL,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
     relationship TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Row Level Security (RLS)**
   Enable RLS and create policies:

   ```sql
   -- Enable RLS on all tables
   ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE red_zones ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE emergency_contact_requests ENABLE ROW LEVEL SECURITY;

   -- Create policies (example for app_users)
   CREATE POLICY "Users can view own profile" ON app_users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON app_users
     FOR UPDATE USING (auth.uid() = id);
   ```

## Step 2: Environment Variables

1. **Local Development**
   Create `.env.local` in your project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. **Netlify Environment Variables**
   - Go to your Netlify site settings
   - Navigate to Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Step 3: Netlify Deployment

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

3. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at a Netlify URL

## Step 4: Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Domain management in Netlify
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Netlify automatically provides SSL certificates
   - Force HTTPS redirect if needed

## Step 5: Testing

1. **Test Authentication**
   - Try user registration and login
   - Verify Supabase connection

2. **Test Safety Features**
   - Test SOS functionality
   - Verify red zone detection
   - Test safety monitoring

3. **Test Admin Features**
   - Verify admin dashboard access
   - Test SOS alert management

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (use 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Supabase Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Verify RLS policies

3. **Authentication Issues**
   - Check Supabase Auth settings
   - Verify redirect URLs
   - Check browser console for errors

### Debug Commands

```bash
# Check build locally
npm run build

# Check for TypeScript errors
npm run lint

# Test development server
npm run dev
```

## Monitoring

1. **Netlify Analytics**
   - Monitor site performance
   - Track build success/failure rates

2. **Supabase Dashboard**
   - Monitor database performance
   - Check authentication logs
   - Review error logs

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use Netlify environment variables
   - Rotate Supabase keys regularly

2. **RLS Policies**
   - Review and test all policies
   - Ensure user data isolation
   - Regular security audits

## Support

- **Netlify Support**: [support.netlify.com](https://support.netlify.com)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **GitHub Issues**: Use your repository's issue tracker
