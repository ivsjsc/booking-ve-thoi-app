// Firebase configuration for vethoi app
// Use Vite env variables when available (prefixed with VITE_) or fallback to process.env for other setups.
const env = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : process.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || "AIzaSyAOxCF0PhA6s3DtvETux-kXGTXRTlpL4vs",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || "ivs-159a7.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || "ivs-159a7",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || "ivs-159a7.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || "452959273724",
  appId: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || "1:452959273724:web:193cf2e16fa0447f040d79",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENT_ID || "G-P2ZZ9LS2VX"
};
