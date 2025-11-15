# Firebase Setup Instructions for PantryPal AI v2.0

## Important: Complete These Steps in Firebase Console

To make Version 2.0 work properly, you need to enable authentication and Firestore in your Firebase Console.

### 1. Enable Email/Password Authentication

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project: **pantrypal-ai-351e0**
3. Navigate to **Authentication** (from left sidebar)
4. Click the **Sign-in method** tab
5. Click on **Email/Password**
6. Toggle **Enable** to ON
7. Click **Save**

### 2. Enable Google Sign-In (Optional but Recommended)

1. Still in **Authentication** → **Sign-in method**
2. Click on **Google**
3. Toggle **Enable** to ON
4. Select a support email
5. Click **Save**

### 3. Create Firestore Database

1. Navigate to **Firestore Database** (from left sidebar)
2. Click **Create database**
3. Select **Start in test mode** (for development)
   - Note: Test mode allows all reads/writes. We'll add security rules later.
4. Choose a location (select closest to your users)
5. Click **Enable**

### 4. Set Up Firestore Security Rules (IMPORTANT - Do This After Testing)

Once your app is working, update Firestore rules to secure user data:

1. Go to **Firestore Database** → **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own recipe collections
    match /users/{userId}/recipes/{recipeId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

### 5. Verify Firebase Configuration

Your app is already configured with these settings:
- **Project ID**: pantrypal-ai-351e0
- **API Key**: AIzaSyBRKRFNW3U18LmknNegwDDcSYk7TQJn0Oc
- **Auth Domain**: pantrypal-ai-351e0.firebaseapp.com

## Testing Your Setup

1. **Visit your deployed app**: https://pantrypal-ai-delta.vercel.app
   - Or test locally at http://localhost:3000

2. **Sign Up**:
   - Click "Sign In" button in the header
   - Click "Sign up" link
   - Enter name, email, and password (min 6 characters)
   - Submit

3. **Generate and Save a Recipe**:
   - After signing in, generate a recipe
   - Click "Save to library"
   - Recipe should appear in "Your saved recipes" column

4. **Test Cloud Sync**:
   - Sign out
   - Sign in again
   - Your saved recipes should still be there (loaded from Firestore)

5. **Test Cross-Device Sync**:
   - Sign in on a different browser or device with the same account
   - Recipes should sync across devices

## Firestore Data Structure

Your recipes are stored in Firestore with this structure:

```
users (collection)
  └── {userId} (document)
      └── recipes (subcollection)
          └── {recipeId} (document)
              ├── id: string
              ├── title: string
              ├── ingredients: array
              ├── steps: array
              ├── dietaryPreference: string
              ├── mealType: string
              ├── cuisineFocus: string
              ├── moodVibe: string
              ├── userId: string
              ├── createdAt: timestamp
              └── updatedAt: timestamp
```

## Troubleshooting

### "User must be authenticated" Error
- Make sure Email/Password authentication is enabled in Firebase Console
- Check that you're signed in (header should show your name)

### Recipes Not Saving
- Verify Firestore database is created
- Check browser console for errors (F12 → Console tab)
- Make sure Firestore rules allow writes (test mode or user-specific rules)

### Google Sign-In Not Working
- Verify Google provider is enabled in Authentication
- Make sure you selected a support email
- Check that your domain is authorized in Firebase

### CORS or Domain Errors
- Add your Vercel domain to Firebase authorized domains:
  - Go to **Authentication** → **Settings** → **Authorized domains**
  - Add: `pantrypal-ai-delta.vercel.app`

## Next Steps

After completing the setup above:

1. ✅ Test authentication with email/password
2. ✅ Test Google sign-in
3. ✅ Save some recipes and verify they sync
4. ✅ Update Firestore security rules (see step 4 above)
5. 🔮 Optional: Add more auth providers (GitHub, Twitter, etc.)
6. 🔮 Optional: Set up email verification
7. 🔮 Optional: Add user profile photos with Firebase Storage

## Important Security Notes

- **API Key**: The Firebase API key in your code is safe to expose publicly. It identifies your Firebase project but doesn't grant access without proper authentication.
- **Test Mode**: Change Firestore from test mode to production rules (step 4) before launching to real users.
- **Email Verification**: Consider adding email verification for production use.

## Support

If you encounter issues:
1. Check the Firebase Console for error messages
2. Check browser console (F12) for JavaScript errors
3. Verify all steps above are completed
4. Check that Vercel deployment succeeded

---

**Ready to test!** Visit https://pantrypal-ai-delta.vercel.app and try signing up! 🎉
