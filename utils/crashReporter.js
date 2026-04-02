import crashlytics from '@react-native-firebase/crashlytics';

// ─── Log user actions (breadcrumbs) ──────────────────────
export const logAction = (action) => {
  crashlytics().log(action);
};

// ─── Log non-fatal errors (won't crash app, but reports to Firebase) ──
export const logError = (error, context = '') => {
  if (context) {
    crashlytics().setAttribute('context', context);
  }
  crashlytics().recordError(error);
};

// ─── Set user info (helps identify which user crashed) ───────────
export const setUser = (userId, email, name) => {
  crashlytics().setUserId(userId);
  crashlytics().setAttribute('email', email);
  crashlytics().setAttribute('name', name);
};

// ─── Install global JS crash handler ─────────────────────────────
export const installCrashReporter = () => {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler(async (error, isFatal) => {
    try {
      crashlytics().log(`Fatal: ${isFatal} — ${error?.message}`);
      crashlytics().setAttribute('is_fatal', String(isFatal));
      crashlytics().recordError(error);
    } catch (_) {}

    originalHandler?.(error, isFatal);
  });

  console.log('✅ Firebase Crashlytics installed');
};
