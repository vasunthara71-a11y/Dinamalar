# Crash Reporting Setup

This document explains how crash reporting is configured in the Dinamalar app to send crash reports to vasunthara@dinamalarbiz.com.

## Overview

The app uses Firebase Crashlytics for crash reporting with a custom service wrapper that includes email configuration and enhanced logging.

## Configuration

### 1. CrashReportingService

Location: `services/CrashReportingService.js`

This service provides:
- Automatic email configuration (vasunthara@dinamalarbiz.com)
- Enhanced error logging with context
- Custom attributes and keys
- Test crash functionality

### 2. Initialization

The service is automatically initialized in `App.js`:
```javascript
useEffect(() => {
  CrashReportingService.initialize();
}, []);
```

### 3. Email Configuration

The service automatically sets:
- User ID: vasunthara@dinamalarbiz.com
- Custom attribute: user_email = vasunthara@dinamalarbiz.com

### 4. Error Boundary Integration

The `ErrorBoundary` component automatically reports caught errors to Crashlytics with detailed context.

## Usage Examples

### Manual Error Reporting
```javascript
import CrashReportingService from '../services/CrashReportingService';

// Log a message
CrashReportingService.log('User performed action');

// Record an error with context
try {
  // risky code
} catch (error) {
  CrashReportingService.recordError(error, 'Context about what happened');
}

// Set custom attributes
CrashReportingService.setCustomKey('user_action', 'clicked_button');
```

### Test Crash
```javascript
// This will crash the app and send a report
CrashReportingService.testCrash();
```

## Firebase Console Configuration

To receive email notifications:
1. Go to Firebase Console
2. Select your project
3. Navigate to Crashlytics
4. Set up email alerts for vasunthara@dinamalarbiz.com
5. Configure notification preferences

## Notes

- Crashlytics is automatically enabled in production and development
- All crashes include the configured email address
- Custom attributes provide additional context for debugging
- Error boundaries automatically report React component errors
