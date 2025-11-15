/**
 * auth.js
 * Firebase Authentication logic for PantryPal AI
 */

/**
 * Sign up new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<firebase.User>}
 */
async function signUpUser(email, password, displayName) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Update user profile with display name
    if (displayName) {
      await user.updateProfile({
        displayName: displayName
      });
    }

    console.log('User signed up successfully:', user.uid);
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Sign in existing user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<firebase.User>}
 */
async function signInUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    console.log('User signed in successfully:', user.uid);
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
async function signOutUser() {
  try {
    await auth.signOut();
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
async function resetPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Sign in with Google
 * @returns {Promise<firebase.User>}
 */
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    console.log('User signed in with Google:', user.uid);
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged((user) => {
    callback(user);
  });
}

/**
 * Get user friendly error message
 * @param {string} errorCode - Firebase error code
 * @returns {string} User friendly error message
 */
function getAuthErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-closed-by-user': 'Sign in was cancelled.',
    'auth/cancelled-popup-request': 'Sign in was cancelled.'
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<void>}
 */
async function updateUserProfile(profileData) {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user is currently signed in');
    }

    await user.updateProfile(profileData);
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Delete user account
 * @returns {Promise<void>}
 */
async function deleteUserAccount() {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Delete user data from Firestore first
    await deleteUserData(user.uid);

    // Delete the user account
    await user.delete();
    console.log('User account deleted successfully');
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

/**
 * Delete all user data from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteUserData(userId) {
  try {
    // Delete all user recipes
    const recipesRef = db.collection('users').doc(userId).collection('recipes');
    const snapshot = await recipesRef.get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('User data deleted successfully');
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
}
