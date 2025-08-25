# Authentication Debugging Guide for ClockTower SOS Service

## Overview
This guide helps you debug the authentication issues that are preventing the SOS service from working properly. The errors you're seeing are related to user authentication and database permissions.

## 🔍 **Current Errors Analysis**

### 1. 400 Bad Request: `id=eq.undefined`
**Problem**: The user ID is `undefined` when querying the `app_users` table
**Root Cause**: `this.currentUser?.id` is null, indicating the user is not properly authenticated

### 2. 401 Unauthorized: SOS Alert Creation
**Problem**: The request to create an SOS alert is unauthorized
**Root Cause**: The user's authentication token is invalid or expired

### 3. Row-Level Security Policy Violation
**Problem**: Database security policies are blocking the insert operation
**Root Cause**: The user doesn't have proper permissions to insert into the `sos_alerts` table

## ✅ **Fixes Applied**

### 1. Enhanced Authentication Handling
- Added proper error handling for authentication failures
- Added authentication status checking before operations
- Added re-authentication capabilities

### 2. Improved Error Handling
- Better error messages for debugging
- Graceful fallbacks when authentication fails
- Comprehensive logging for troubleshooting

### 3. Added Debug Methods
- `getAuthStatus()` - Check authentication state
- `debugAuth()` - Detailed authentication debugging
- `reAuthenticate()` - Force re-authentication
- `isAuthenticated()` - Check if service is ready

## 🧪 **Testing Your Fix**

### Option 1: Use the Authentication Test Page
1. Open `auth-test.html` in your browser
2. Click "Check Auth Status" to see current authentication state
3. Use "Debug Auth" to get detailed information
4. Test SOS service functionality

### Option 2: Use Browser Console
If you have access to the SOS service instance in your app:

```javascript
// Check authentication status
const authStatus = sosService.getAuthStatus();
console.log(authStatus);

// Debug authentication
sosService.debugAuth();

// Force re-authentication
await sosService.reAuthenticate();

// Check if authenticated
const isReady = sosService.isAuthenticated();
console.log('Service ready:', isReady);
```

## 🔧 **Common Issues and Solutions**

### Issue 1: User Not Authenticated
**Symptoms**: 
- `id=eq.undefined` in database queries
- 401 Unauthorized errors
- `this.currentUser` is null

**Solutions**:
1. **Check if user is logged in**: Ensure the user has completed the authentication flow
2. **Verify session validity**: Check if the authentication token has expired
3. **Re-authenticate**: Use the `reAuthenticate()` method to refresh the session

### Issue 2: Database Permissions
**Symptoms**:
- Row-level security policy violations
- 403 Forbidden errors
- Database operations blocked

**Solutions**:
1. **Check user role**: Ensure the user has the correct permissions in the database
2. **Verify RLS policies**: Check if the database has proper row-level security policies
3. **Check table access**: Ensure the user can access the required tables

### Issue 3: Supabase Configuration
**Symptoms**:
- Authentication errors
- Service unavailable errors
- Configuration mismatch

**Solutions**:
1. **Verify API keys**: Check that the Supabase URL and keys are correct
2. **Check environment**: Ensure you're using the right environment (dev/prod)
3. **Verify project settings**: Check Supabase project configuration

## 🚀 **Step-by-Step Debugging**

### Step 1: Check Authentication Status
```javascript
// In browser console
const authStatus = sosService.getAuthStatus();
console.log('Auth Status:', authStatus);

// Look for:
// - isAuthenticated: true/false
// - hasUser: true/false
// - userId: actual ID or null
```

### Step 2: Check User Session
```javascript
// Check if user is properly logged in
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('Auth error:', error);
```

### Step 3: Test Database Access
```javascript
// Test if user can access their profile
const { data: profile, error } = await supabase
  .from('app_users')
  .select('*')
  .eq('id', 'YOUR_USER_ID')
  .single();

console.log('Profile:', profile);
console.log('Profile error:', error);
```

### Step 4: Check Database Policies
The row-level security error suggests the database has policies that need to be configured. You may need to:

1. **Check RLS policies** in your Supabase dashboard
2. **Verify user permissions** for the `sos_alerts` table
3. **Ensure proper authentication** before database operations

## 🔐 **Authentication Flow**

### Expected Flow:
1. User logs in through the app
2. Authentication token is stored
3. SOS service initializes with user context
4. User operations use the authenticated context
5. Database operations succeed with proper permissions

### Common Breakpoints:
1. **Login failure**: User never gets authenticated
2. **Token expiration**: Authentication token becomes invalid
3. **Service initialization**: SOS service fails to get user context
4. **Database permissions**: User lacks required database access

## 🛠️ **Troubleshooting Commands**

### Check Service Status
```javascript
// Check if SOS service is ready
console.log('Service ready:', sosService.isAuthenticated());
console.log('User ID:', sosService.getCurrentUserId());
```

### Force Re-authentication
```javascript
// Try to re-authenticate the user
const success = await sosService.reAuthenticate();
console.log('Re-auth success:', success);
```

### Debug Complete State
```javascript
// Get comprehensive debug information
sosService.debugAuth();
```

## 📋 **Checklist for Resolution**

- [ ] User is properly logged in
- [ ] Authentication token is valid
- [ ] SOS service has user context
- [ ] Database permissions are correct
- [ ] RLS policies allow the operation
- [ ] User ID is available in requests
- [ ] Supabase configuration is correct

## 🆘 **If Problems Persist**

1. **Check browser console** for detailed error messages
2. **Use the test pages** to isolate the issue
3. **Verify Supabase dashboard** for project configuration
4. **Check database logs** for permission issues
5. **Test with a different user** to see if it's user-specific

## 🔍 **Advanced Debugging**

### Enable Verbose Logging
The enhanced SOS service now includes comprehensive logging. Check the browser console for:
- 🔐 Authentication events
- ❌ Error details
- 🔄 Re-authentication attempts
- 📊 Service status updates

### Monitor Network Requests
Use browser DevTools to monitor:
- Authentication requests
- Database queries
- Error responses
- Request headers and tokens

The enhanced authentication handling should now provide much clearer guidance on what's causing the SOS service issues.
