# Speech Recognition Debugging Guide

## Overview
This guide helps you debug speech recognition issues in the ClockTower app. The live map transcription feature relies on the Web Speech API, which can encounter various network and configuration issues.

## Quick Fixes Applied

### 1. Removed Invalid `serviceURI` Property
- **Problem**: The code was trying to set `serviceURI` to Google's speech recognition API, which is not a standard property and causes network errors.
- **Fix**: Removed the problematic `serviceURI` setting that was causing the "network" error.
- **Location**: `src/utils/safetyMonitor.ts` lines 155-157

### 2. Enhanced Error Handling
- **Added**: Better error categorization and handling for different error types
- **Added**: Specific guidance for network errors
- **Added**: Automatic restart logic with exponential backoff
- **Added**: Prevention of infinite restart loops

### 3. Added Debugging Tools
- **New Method**: `getSpeechRecognitionHealth()` - Comprehensive health check
- **New Method**: `debugSpeechRecognition()` - Detailed console debugging
- **New Method**: `reEnableSpeechRecognition()` - Reset after failures

## Testing Your Fix

### Option 1: Use the Test Page
1. Open `speech-test.html` in your browser
2. Click "Check Health" to see system status
3. Click "Start Recognition" to test speech recognition
4. Check the console log for detailed information

### Option 2: Use Browser Console
If you have access to the SafetyMonitor instance in your app:

```javascript
// Get comprehensive health status
const health = safetyMonitor.getSpeechRecognitionHealth();
console.log(health);

// Get detailed debug info
safetyMonitor.debugSpeechRecognition();

// Re-enable if disabled
safetyMonitor.reEnableSpeechRecognition();
```

## Common Issues and Solutions

### Network Error ("network")
**Symptoms**: `❌ Speech recognition error: network`

**Causes**:
- Poor internet connection
- Firewall blocking speech recognition service
- Corporate network restrictions
- Browser speech recognition service unavailable

**Solutions**:
1. Check internet connection
2. Try on a different network (mobile hotspot)
3. Check if corporate firewall is blocking the service
4. Try a different browser (Chrome, Edge, Safari)
5. Ensure you're on HTTPS (required for production)

### Service Not Allowed Error
**Symptoms**: `❌ Speech recognition error: service-not-allowed`

**Causes**:
- Corporate network policy
- Firewall restrictions
- Browser security settings

**Solutions**:
1. Check with IT department about speech recognition policies
2. Try on a different network
3. Check browser security settings

### Microphone Access Denied
**Symptoms**: `❌ Speech recognition error: not-allowed`

**Causes**:
- User denied microphone permission
- Browser security settings
- Not running in secure context

**Solutions**:
1. Grant microphone permission in browser
2. Ensure app is running on HTTPS or localhost
3. Check browser security settings

## Browser Compatibility

### Supported Browsers
- **Chrome**: Full support (webkitSpeechRecognition)
- **Edge**: Full support (webkitSpeechRecognition)
- **Safari**: Full support (webkitSpeechRecognition)
- **Firefox**: Limited support (SpeechRecognition)

### Requirements
- **HTTPS**: Required for production (localhost works for development)
- **Secure Context**: Required for microphone access
- **Network**: Internet connection required
- **Permissions**: Microphone access must be granted

## Debugging Steps

### Step 1: Check Basic Requirements
```javascript
// Run this in browser console
console.log('Secure Context:', window.isSecureContext);
console.log('Network Online:', navigator.onLine);
console.log('HTTPS/Localhost:', location.protocol === 'https:' || location.hostname === 'localhost');
console.log('Speech Recognition:', !!(window.webkitSpeechRecognition || window.SpeechRecognition));
```

### Step 2: Check SafetyMonitor Status
```javascript
// If you have access to the instance
safetyMonitor.getSpeechRecognitionHealth();
```

### Step 3: Test Speech Recognition
1. Open the test page
2. Check health status
3. Try starting recognition
4. Look for specific error messages

### Step 4: Check Network
1. Try on different network
2. Check firewall settings
3. Test with different browser
4. Verify HTTPS requirement

## Advanced Debugging

### Enable Verbose Logging
The SafetyMonitor already includes comprehensive logging. Check the browser console for:
- 🎤 Speech recognition events
- ❌ Error details
- 🔄 Restart attempts
- 🌐 Network status

### Monitor Restart Behavior
The system automatically restarts speech recognition with exponential backoff:
- First few errors: 2-5 second delays
- Multiple errors: 10-15 second delays
- Excessive errors: Automatic disable to prevent loops

### Reset After Failures
If speech recognition gets disabled:
```javascript
safetyMonitor.reEnableSpeechRecognition();
```

## Performance Optimization

### Reduce Network Load
- `maxAlternatives` is set to 1 to minimize data transfer
- Continuous mode with automatic restart for reliability
- Interim results enabled for real-time feedback

### Error Recovery
- Automatic restart for recoverable errors
- Exponential backoff to prevent overwhelming the service
- Graceful degradation when service is unavailable

## Support

If you continue to experience issues:

1. **Check the test page** (`speech-test.html`) for detailed diagnostics
2. **Use console debugging** methods in the SafetyMonitor
3. **Verify network requirements** (HTTPS, firewall, corporate policy)
4. **Test with different browsers** and networks
5. **Check browser console** for specific error messages

The enhanced error handling should now provide much clearer guidance on what's causing the speech recognition issues.
