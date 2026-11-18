import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim().length > 0,
);

let authInstance = null;
let authConfigurationError = '';

if (hasFirebaseConfig) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = getAuth(app);
    }
  } catch (error) {
    authConfigurationError =
      'Firebase Authentication could not initialize. Check the Firebase values in .env and restart the app.';
    console.error(authConfigurationError, error);
  }
} else {
  authConfigurationError =
    'Firebase Authentication is not configured. Add the Firebase values to .env and restart the app.';
}

export const auth = authInstance;
export { authConfigurationError };