# Stationary User Detection & Admin Dashboard

## Overview

This feature implements an advanced safety monitoring system that detects when users remain stationary for extended periods in red zones, automatically sending SOS alerts to administrators. This is designed to catch situations where users may be in distress but unable to move or respond.

## Features Implemented

### 1. Stationary User Detection
- **Automatic Monitoring**: Continuously tracks user movement when in red zones
- **10-Minute Threshold**: Triggers SOS alert after 10 minutes of stationary behavior
- **Location Tracking**: Monitors user coordinates with 10-meter precision
- **Speed Analysis**: Combines GPS and accelerometer data for accurate detection

### 2. SOS Alert System
- **Real-time Alerts**: Immediate notification to admin users
- **Rich Data**: Includes location, duration, user details, and geocoded addresses
- **Status Management**: Three-tier status system (pending → acknowledged → resolved)
- **Admin Notes**: Ability to add context and resolution notes

### 3. Admin Dashboard
- **Comprehensive View**: All SOS alerts in one centralized interface
- **Real-time Updates**: Live status changes and new alert notifications
- **Search & Filter**: Find specific alerts by status, user, or location
- **Map Integration**: Direct links to Google Maps for location verification
- **Mobile Responsive**: Works seamlessly on all device sizes

## Technical Implementation

### Database Schema

#### New Tables Required

```sql
-- Table for SOS alerts sent to admins
CREATE TABLE sos_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_address TEXT,
  alert_type TEXT DEFAULT 'stationary_user',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  user_message TEXT,
  stationary_duration_minutes INTEGER,
  last_movement_time TIMESTAMP WITH TIME ZONE,
  red_zone_id BIGINT REFERENCES public.red_zones(id)
);

-- Table for admin users
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for movement tracking (future facial recognition)
CREATE TABLE user_movement_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  acceleration DOUBLE PRECISION,
  is_moving BOOLEAN,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  red_zone_id BIGINT REFERENCES public.red_zones(id),
  safety_status TEXT DEFAULT 'normal'
);
```

#### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_movement_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own alerts, admins can see all
CREATE POLICY "Users can view own SOS alerts" ON sos_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all SOS alerts" ON sos_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

### Core Components

#### 1. SafetyMonitor Class (`src/utils/safetyMonitor.ts`)
- **Enhanced Monitoring**: Added stationary user detection
- **Configurable Thresholds**: 10-minute stationary detection
- **Callback System**: Notifies ZoneContext when stationary users detected
- **Performance Optimized**: Checks every minute, not continuously

#### 2. SOS Service (`src/utils/sosService.ts`)
- **Alert Management**: Creates, updates, and retrieves SOS alerts
- **Admin Communication**: Notifies admin users of new alerts
- **Geocoding Integration**: Converts coordinates to readable addresses
- **Permission Management**: Ensures only admins can access admin functions

#### 3. Admin Dashboard (`src/pages/AdminDashboard.tsx`)
- **Real-time Interface**: Live updates of SOS alert status
- **Action Management**: Acknowledge and resolve alerts
- **Search & Filter**: Find specific alerts quickly
- **Responsive Design**: Works on all device sizes

#### 4. ZoneContext Integration (`src/context/ZoneContext.tsx`)
- **Seamless Integration**: Works with existing red zone detection
- **Automatic Triggering**: Starts monitoring when entering red zones
- **Callback Handling**: Processes stationary user detection events

## User Experience Flow

### For Regular Users
1. **Enter Red Zone**: User enters a red zone, safety monitoring activates
2. **Normal Movement**: If user continues moving, no alerts triggered
3. **Stationary Detection**: After 10 minutes of no movement, SOS alert sent
4. **User Notification**: User receives alert that admin has been notified
5. **Movement Resets**: Any movement resets the stationary timer

### For Admin Users
1. **Real-time Alerts**: Receive immediate notifications of new SOS alerts
2. **Dashboard Access**: View all alerts in organized, searchable interface
3. **Alert Management**: Acknowledge alerts and add notes
4. **Location Verification**: Click to view exact location on Google Maps
5. **Resolution Tracking**: Mark alerts as resolved with completion notes

## Setup Instructions

### 1. Database Setup
Run the SQL commands above in your Supabase SQL editor to create the required tables and policies.

### 2. Admin User Creation
```sql
-- Insert yourself as the first admin (replace with your actual user ID)
INSERT INTO admin_users (user_id, email, role, is_active)
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with your actual auth.users.id
  'your-email@example.com', -- Replace with your email
  'super_admin',
  true
);
```

### 3. Application Integration
The feature is automatically integrated and will start working once:
- Database tables are created
- Admin users are configured
- User enters a red zone

## Configuration Options

### Stationary Detection Thresholds
```typescript
// In SafetyMonitor class
private stationaryThreshold = 10; // minutes
private movementThreshold = 10; // meters (within this distance = stationary)
private speedThreshold = 0.5; // m/s (below this = not moving)
```

### Alert Types Supported
- `stationary_user`: User remains in one location for threshold time
- `facial_recognition`: Future feature for distress detection
- `manual_sos`: User manually triggers SOS

### Admin Roles
- `admin`: Can view and manage SOS alerts
- `super_admin`: Can manage other admin users

## Future Enhancements

### 1. Facial Recognition Integration
- **Distress Detection**: Analyze facial expressions for signs of distress
- **Video Analysis**: Process camera feed for safety assessment
- **AI Integration**: Machine learning for improved detection accuracy

### 2. Advanced Notifications
- **Push Notifications**: Real-time alerts to admin devices
- **Email Integration**: Automated email notifications
- **SMS Alerts**: Emergency SMS to admin phones
- **Escalation System**: Automatic escalation if no response

### 3. Enhanced Analytics
- **Pattern Recognition**: Identify common stationary locations
- **Risk Assessment**: Predict potential danger zones
- **Response Metrics**: Track admin response times
- **Historical Data**: Analyze trends and patterns

### 4. Emergency Response Integration
- **911 Integration**: Direct emergency service notification
- **Contact Management**: Emergency contact notification system
- **Location Sharing**: Real-time location updates to responders
- **Medical Information**: Access to user medical details

## Security Considerations

### Data Privacy
- **User Consent**: All monitoring requires explicit permission
- **Data Minimization**: Only collect necessary safety data
- **Encryption**: All data encrypted in transit and at rest
- **Access Control**: Strict admin-only access to sensitive data

### Permission Management
- **Role-based Access**: Different admin levels with appropriate permissions
- **Audit Logging**: Track all admin actions and data access
- **Session Management**: Secure admin authentication
- **API Security**: Rate limiting and request validation

## Troubleshooting

### Common Issues

#### 1. SOS Alerts Not Sending
- Check database table creation
- Verify admin user configuration
- Check browser console for errors
- Ensure user has granted location permissions

#### 2. Admin Dashboard Access Denied
- Verify admin user status in database
- Check user authentication
- Ensure proper RLS policies
- Clear browser cache and cookies

#### 3. Stationary Detection Not Working
- Check device motion sensor permissions
- Verify GPS accuracy settings
- Check browser compatibility
- Review console logs for errors

### Debug Mode
Enable debug logging by setting:
```typescript
console.log('Stationary user detected:', location, durationMinutes);
```

## Performance Considerations

### Optimization Features
- **Efficient Monitoring**: Checks every minute, not continuously
- **Data Cleanup**: Automatic cleanup of old sensor data
- **Lazy Loading**: Admin dashboard loads data on demand
- **Caching**: Intelligent caching of frequently accessed data

### Scalability
- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Non-blocking alert processing
- **Rate Limiting**: Prevent abuse of monitoring systems

## Testing

### Manual Testing
1. **Enter Red Zone**: Navigate to a red zone area
2. **Stay Stationary**: Remain in one location for 10+ minutes
3. **Check Alerts**: Verify SOS alert appears in admin dashboard
4. **Test Resolution**: Acknowledge and resolve the alert

### Automated Testing
- Unit tests for SafetyMonitor class
- Integration tests for SOS service
- E2E tests for admin dashboard workflow
- Performance tests for monitoring systems

## Support

For technical support or feature requests:
- Check console logs for error messages
- Verify database configuration
- Test with different devices and browsers
- Review browser permission settings

---

**Note**: This feature is designed to enhance user safety and should be used responsibly. Always respect user privacy and ensure compliance with local regulations regarding location tracking and emergency notifications.
