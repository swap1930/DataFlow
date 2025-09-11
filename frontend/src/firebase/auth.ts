import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
 
  User
} from 'firebase/auth';
import { firebaseConfig } from './config';

export type AuthResult = { success: true; user: User } | { success: false; error: string };
export type SetupTestResult = { success: true; missingFields: string[] } | { success: false; error: string };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Test Firebase initialization
export const testFirebaseSetup = (): SetupTestResult => {
  try {
    console.log('=== Firebase Setup Test ===');
    console.log('Firebase app initialized:', !!app);
    console.log('Firebase auth initialized:', !!auth);
    console.log('Google provider:', googleProvider);
    console.log('GitHub provider:', githubProvider);
    console.log('Firebase config:', firebaseConfig);
    
    // Check if required config fields are present
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
    const missingFields = (requiredFields as readonly string[]).filter(field => !(firebaseConfig as any)[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing Firebase config fields:', missingFields);
      console.error('Please complete your Firebase configuration!');
    } else {
      console.log('✅ Firebase configuration looks complete');
    }
    
    return { success: true, missingFields };
  } catch (error: any) {
    console.error('Firebase setup test failed:', error);
    return { success: false, error: error?.message ?? 'Unknown error' };
  }
};

// Initialize OAuth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Add scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');
githubProvider.addScope('user:email');

// Sign Up Function
export const signUp = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Sign up failed' };
  }
};

// Sign In Function
export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Sign in failed' };
  }
};

// Google Sign In
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    let errorMessage = 'Google sign-in failed. Please try again.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in was cancelled. Please try again.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// GitHub Sign In
export const signInWithGitHub = async (): Promise<AuthResult> => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('GitHub sign-in error:', error);
    let errorMessage = 'GitHub sign-in failed. Please try again.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in was cancelled. Please try again.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Sign Out Function
export const signOutUser = async (): Promise<{ success: true } | { success: false; error: string }> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Sign out failed' };
  }
};

// Get Current User Token (Backend API calls साठी)
export const getCurrentUserToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) return await user.getIdToken();
  return null;
};

// Get Current User
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Auth State Listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
