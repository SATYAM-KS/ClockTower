# RedZone Authentication System

## Overview

The RedZone app has been redesigned with a comprehensive authentication system built on Supabase. This system provides secure user authentication, registration, and session management with a modern, responsive UI.

## Features

### 🔐 Authentication Features
- **User Registration**: Email/password registration with validation
- **User Login**: Secure email/password authentication
- **Google OAuth**: Social login integration
- **Session Management**: Automatic session handling and refresh
- **Route Protection**: Protected routes with automatic redirects
- **Logout**: Secure session termination

### 🎨 UI Components
- **Modern Design**: Clean, responsive interface with Tailwind CSS
- **Tab-based Navigation**: Seamless switching between login and registration
- **Form Validation**: Real-time input validation and error handling
- **Loading States**: Visual feedback during authentication operations
- **Error Handling**: User-friendly error messages and recovery

### 🛡️ Security Features
- **Password Requirements**: Minimum 6 characters with confirmation
- **Input Sanitization**: Prevents malicious input in forms
- **Session Security**: Secure token management
- **Route Guards**: Prevents unauthorized access to protected pages

## Architecture

### Components Structure
```
sign/
├── components/
│   ├── AuthPage.tsx          # Main auth container with tabs
│   ├── LoginForm.tsx         # Login form component
│   ├── SignupForm.tsx        # Registration form component
│   ├── AuthHeader.tsx        # Branded header component
│   ├── FeaturePreview.tsx    # Feature showcase
│   └── ui/                   # Reusable UI components
└── App.tsx                   # Standalone auth app

src/
├── context/
│   └── AuthContext.tsx       # Global auth state management
├── components/
│   ├── AuthGuard.tsx         # Route protection component
│   ├── AuthStatus.tsx        # User status display
│   └── ProtectedRoute.tsx    # Legacy route protection
├── pages/
│   ├── AuthCallback.tsx      # OAuth callback handler
│   └── AuthTest.tsx          # Authentication testing page
└── App.tsx                   # Main application with auth integration
```

### Context Providers
- **AuthProvider**: Manages authentication state globally
- **NotificationProvider**: Handles app-wide notifications
- **ZoneProvider**: Manages safety zone functionality

## Usage

### Basic Authentication Flow

1. **User visits app** → Redirected to `/login` if not authenticated
2. **User registers/logs in** → Credentials validated via Supabase
3. **Success** → User redirected to `/home` with active session
4. **Protected routes** → Automatically guarded by AuthGuard
5. **Session expiry** → Automatic logout and redirect to login

### Route Protection

```tsx
// Protect a route
<Route path="/admin" element={
  <AuthGuard>
    <AdminDashboard />
  </AuthGuard>
} />

// Public route (no auth required)
<Route path="/login" element={
  <AuthGuard requireAuth={false}>
    <AuthPage />
  </AuthGuard>
} />
```

### Using Auth Context

```tsx
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, session, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};
```

## Configuration

### Supabase Setup

1. **Environment Variables**: Configure Supabase URL and keys
2. **Database Tables**: Ensure `app_users` table exists
3. **OAuth Providers**: Configure Google OAuth in Supabase dashboard
4. **Row Level Security**: Configure RLS policies for user data

### Required Database Schema

```sql
-- Users table for additional user data
CREATE TABLE app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  username TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own data" ON app_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON app_users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON app_users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Testing

### Test Routes
- `/auth-test` - Comprehensive authentication testing page
- `/login` - Login form testing
- `/register` - Registration form testing

### Test Features
- **User Registration**: Test form validation and user creation
- **User Login**: Test authentication and session creation
- **Route Protection**: Verify unauthorized access prevention
- **Session Management**: Test logout and session expiry
- **OAuth Flow**: Test Google authentication integration

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Supabase configuration
   - Verify database connection
   - Check RLS policies

2. **Route Protection Issues**
   - Ensure AuthGuard wraps protected routes
   - Check AuthProvider is at the top level
   - Verify user state in context

3. **OAuth Issues**
   - Check Google OAuth configuration
   - Verify redirect URLs
   - Check browser console for errors

### Debug Mode

Enable debug logging in the browser console:
```tsx
// In AuthContext.tsx
console.log('Auth state changed:', event, session?.user?.id);
```

## Security Considerations

### Best Practices
- **Password Requirements**: Enforce strong password policies
- **Input Validation**: Sanitize all user inputs
- **Session Management**: Implement proper session expiry
- **Route Protection**: Protect all sensitive routes
- **Error Handling**: Don't expose sensitive information in errors

### OAuth Security
- **Redirect URLs**: Validate OAuth redirect URLs
- **State Parameter**: Implement CSRF protection
- **Token Storage**: Secure token storage and transmission

## Future Enhancements

### Planned Features
- **Multi-factor Authentication**: SMS/email verification
- **Password Reset**: Secure password recovery
- **Account Linking**: Link multiple OAuth providers
- **Role-based Access**: Admin/user role management
- **Audit Logging**: Authentication event logging

### Performance Optimizations
- **Session Caching**: Implement session caching
- **Lazy Loading**: Lazy load authentication components
- **Bundle Optimization**: Reduce authentication bundle size

## Support

For authentication-related issues:
1. Check browser console for errors
2. Verify Supabase configuration
3. Test with the `/auth-test` route
4. Review authentication flow logs

## License

This authentication system is part of the RedZone Safety App and follows the same licensing terms.
