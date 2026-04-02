import crashlytics from '@react-native-firebase/crashlytics';

class CrashReportingService {
  static initialize() {
    // Enable crashlytics collection
    crashlytics().setCrashlyticsCollectionEnabled(true);
    
    // Set user email for crash reports
    this.setUserEmail('vasunthara@dinamalarbiz.com');
    
    // Set additional crash reporting context
    crashlytics().setAttribute('app_version', '1.0.0');
    crashlytics().setAttribute('environment', __DEV__ ? 'development' : 'production');
  }

  static setUserEmail(email) {
    try {
      crashlytics().setUserId(email);
      crashlytics().setAttribute('user_email', email);
      console.log('Crash reporting email set to:', email);
    } catch (error) {
      console.error('Failed to set crash reporting email:', error);
    }
  }

  static log(message) {
    try {
      crashlytics().log(message);
    } catch (error) {
      console.error('Failed to log to crashlytics:', error);
    }
  }

  static recordError(error, context = '') {
    try {
      if (context) {
        crashlytics().log(context);
      }
      crashlytics().recordError(error);
    } catch (recordError) {
      console.error('Failed to record error to crashlytics:', recordError);
    }
  }

  static setCustomKey(key, value) {
    try {
      crashlytics().setAttribute(key, value);
    } catch (error) {
      console.error('Failed to set custom key:', error);
    }
  }

  static testCrash() {
    crashlytics().crash();
  }
}

export default CrashReportingService;
