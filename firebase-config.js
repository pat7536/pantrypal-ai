/**
 * firebase-config.js
 * Firebase initialization and configuration for PantryPal AI
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRKRFNW3U18LmknNegwDDcSYk7TQJn0Oc",
  authDomain: "pantrypal-ai-351e0.firebaseapp.com",
  projectId: "pantrypal-ai-351e0",
  storageBucket: "pantrypal-ai-351e0.firebasestorage.app",
  messagingSenderId: "717329680044",
  appId: "1:717329680044:web:188eba4288a1d7b06f0109",
  measurementId: "G-W2QE8PVZGP"
};

// Initialize Firebase (will be done after importing Firebase SDK)
let app;
let auth;
let db;
let analytics;

/**
 * Initialize Firebase services
 * Called after Firebase SDK is loaded
 */
function initializeFirebase() {
  try {
    // Initialize Firebase
    app = firebase.initializeApp(firebaseConfig);

    // Initialize services
    auth = firebase.auth();
    db = firebase.firestore();

    // Initialize Analytics (optional)
    if (typeof firebase.analytics !== 'undefined') {
      analytics = firebase.analytics();
    }

    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
}

/**
 * Get Firebase Auth instance
 * @returns {firebase.auth.Auth}
 */
function getAuth() {
  return auth;
}

/**
 * Get Firestore instance
 * @returns {firebase.firestore.Firestore}
 */
function getFirestore() {
  return db;
}

/**
 * Get current user
 * @returns {firebase.User|null}
 */
function getCurrentUser() {
  return auth ? auth.currentUser : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
  return auth && auth.currentUser !== null;
}
