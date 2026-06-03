import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    User,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase config is valid before initializing
const hasFirebaseConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (hasFirebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
} else {
    console.warn('Firebase config missing — auth features will be disabled until credentials are provided.');
}

const authError = (msg = 'Auth not configured') => {
    console.error(msg);
    throw new Error(msg);
};

export const authService = {
    // Email/Password Authentication
    signUpWithEmail: async (email: string, password: string) => {
        if (!auth) return authError('Cannot sign up: Firebase auth not configured');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return userCredential.user;
    },

    signInWithEmail: async (email: string, password: string) => {
        if (!auth) return authError('Cannot sign in: Firebase auth not configured');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return userCredential.user;
    },

    // Google Authentication
    signInWithGoogle: async () => {
        if (!auth || !googleProvider) return authError('Cannot sign in with Google: Firebase auth not configured');
        const userCredential = await signInWithPopup(auth, googleProvider);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return userCredential.user;
    },

    // Sign Out
    signOut: async () => {
        if (auth) {
            await signOut(auth);
        }
        localStorage.removeItem('firebaseToken');
    },

    // Get Current User
    getCurrentUser: (): User | null => {
        return auth?.currentUser ?? null;
    },

    // Get ID Token
    getIdToken: async (): Promise<string | null> => {
        if (!auth) {
            const cached = localStorage.getItem('firebaseToken');
            return cached;
        }
        if (typeof auth.authStateReady === 'function') {
            await auth.authStateReady();
        }
        const user = auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    },

    // Auth State Observer
    onAuthStateChange: (callback: (user: User | null) => void) => {
        if (!auth) {
            // Simulate auth state with localStorage fallback
            const cachedToken = localStorage.getItem('firebaseToken');
            callback(null);
            return () => {};
        }
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdToken();
                localStorage.setItem('firebaseToken', token);
            } else {
                localStorage.removeItem('firebaseToken');
            }
            callback(user);
        });
    },
};

export { auth };
export default authService;
