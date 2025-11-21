import { Injectable, signal } from '@angular/core';
import { auth, db, functions } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  type User as FirebaseAuthUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);

  constructor() {
    // Listen to Firebase Auth state changes and populate internal user
    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        this.isAuthenticated.set(true);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const u = userDoc.data() as any;
          this.currentUser.set({ uid: fbUser.uid, name: u.name || fbUser.displayName || '', email: u.email || fbUser.email || '', phone: u.phone || '', role: u.role || 'user', avatarUrl: u.avatarUrl || fbUser.photoURL || '' });
        } else {
          // Create a user document on first sign-in
          await setDoc(userDocRef, {
            name: fbUser.displayName || '',
            email: fbUser.email || '',
            phone: fbUser.phoneNumber || '',
            avatarUrl: fbUser.photoURL || '',
            role: 'user',
            createdAt: serverTimestamp()
          });
          this.currentUser.set({ uid: fbUser.uid, name: fbUser.displayName || '', email: fbUser.email || '', phone: fbUser.phoneNumber || '', role: 'user', avatarUrl: fbUser.photoURL || '' });
        }
      } else {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
      }
    });
  }

  // Sign up using email/password and send verification email
  async signup(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user as FirebaseAuthUser, { displayName: name });
    await setDoc(doc(db, 'users', credential.user.uid), { name, email, role: 'user', createdAt: serverTimestamp() });
    await sendEmailVerification(credential.user);
    return credential.user;
  }

  // Basic email sign-in (consider requiring emailVerified for production-critical flows)
  async login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (!credential.user.emailVerified) {
      // Production: enforce verification if needed
      console.warn('User email not verified. Consider enforcing verification for production accounts.');
    }
    return credential.user;
  }

  // Social login (Google as example)
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    return res.user;
  }

  async sendResetEmail(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async logout() {
    await signOut(auth);
  }

  // Use a callable Cloud Function to set custom claims (requires admin credentials server-side)
  async setRole(uid: string, role: string) {
    const setClaims = httpsCallable(functions, 'setCustomClaims');
    return setClaims({ uid, role });
  }

  getCurrentUser() {
    return this.currentUser();
  }

  isLoggedIn() {
    return this.isAuthenticated();
  }
}
