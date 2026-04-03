import { Platform } from 'react-native';

// ─── Safe Firebase import (works in Expo Go + APK) ───────────────
let crashlytics = null;
try {
  crashlytics = require('@react-native-firebase/crashlytics').default;
} catch (e) {
  console.log('ℹ️ Crashlytics not available in Expo Go — skipping');
}

// ─── Set device context on app start ─────────────────────────────
export const setDeviceContext = async () => {
  if (!crashlytics) return;
  try {
    const Device = require('expo-device');
    const Application = require('expo-application');

    const androidId = await Application.getAndroidId();
    crashlytics().setUserId(androidId || 'unknown-device');

    await crashlytics().setAttributes({
      device_brand:   Device.brand || 'unknown',
      device_model:   Device.modelName || 'unknown',
      device_os:      `Android ${Device.osVersion}`,
      app_version:    Application.nativeApplicationVersion || 'unknown',
      build_number:   String(Application.nativeBuildVersion || ''),
      is_real_device: String(Device.isDevice),
      device_type:    Device.deviceType === 1 ? 'phone' : 'tablet',
    });

    console.log('✅ Crashlytics device context set');
  } catch (error) {
    console.warn('Crashlytics setDeviceContext error:', error);
  }
};

// ─── Log user actions (breadcrumbs) ──────────────────────────────
export const logAction = (action) => {
  if (!crashlytics) return;
  try {
    crashlytics().log(action);
  } catch (_) {}
};

// ─── Log non-fatal errors ─────────────────────────────────────────
export const logError = (error, context = '') => {
  if (!crashlytics) return;
  try {
    if (context) crashlytics().setAttribute('error_context', context);
    crashlytics().recordError(error);
  } catch (_) {}
};

// ─── Track current screen ─────────────────────────────────────────
export const logScreen = (screenName) => {
  if (!crashlytics) return;
  try {
    crashlytics().setAttribute('current_screen', screenName);
    crashlytics().log(`Screen: ${screenName}`);
  } catch (_) {}
};

// ─── Track API errors ─────────────────────────────────────────────
export const logApiError = (endpoint, statusCode, message) => {
  if (!crashlytics) return;
  try {
    crashlytics().log(`API Error: ${endpoint} → ${statusCode}: ${message}`);
    crashlytics().setAttribute('last_api_error', endpoint);
  } catch (_) {}
};

// ─── Install global JS crash handler ─────────────────────────────
export const installCrashReporter = () => {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler(async (error, isFatal) => {
    try {
      if (crashlytics) {
        crashlytics().setAttribute('is_fatal', String(isFatal));
        crashlytics().log(`CRASH — Fatal:${isFatal} — ${error?.message}`);
        crashlytics().recordError(error);
      }
    } catch (_) {}
    originalHandler?.(error, isFatal);
  });

  console.log('✅ Crash reporter installed');
};