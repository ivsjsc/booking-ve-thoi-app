import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
// analytics is optional and requires browser support; import when running in browser
import { firebaseConfig } from "./environments/firebaseConfig";

export const firebaseApp = initializeApp(firebaseConfig);

// Re-export commonly used firebase services
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);

// Initialize analytics only when available in the browser
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    // isSupported may return a Promise depending on sdk version
    Promise.resolve(isSupported()).then((supported: boolean) => {
      if (supported) {
        try { getAnalytics(firebaseApp); } catch (e) { console.warn('Analytics not available', e); }
      }
    }).catch(() => { /* analytics not supported */ });
  }).catch(() => { /* ignore if analytics fails to load */ });
}
