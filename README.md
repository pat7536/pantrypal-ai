# PantryPal AI

**Version 2.0 - Cloud-Enabled with Firebase** 🔥

Discover dinner in seconds with AI-powered recipe suggestions based on your pantry ingredients.

![PantryPal AI](assets/placeholder-pantrypal.png)

**Live Demo**: https://pantrypal-ai-delta.vercel.app

## Overview

PantryPal AI is a modern cooking application that helps you transform your pantry ingredients into delicious meals. Version 2.0 adds **Firebase Authentication** and **Firestore cloud sync**, allowing you to create an account, sign in, and access your recipes from any device.

### Key Features

- 🔐 **User Authentication** - Sign up with email/password or Google account
- ☁️ **Cloud Sync** - Your recipes sync across all devices via Firestore
- 🍳 **AI-assisted recipe ideas** - Generate custom recipes based on your ingredients and preferences
- 📸 **Pantry vision** - Upload photos of your pantry to detect ingredients (placeholder functionality)
- 💾 **Personal recipe library** - Save and manage your favorite recipes in the cloud
- 🎨 **Modern UI** - Beautiful pastel-themed interface with smooth animations
- 📱 **Responsive design** - Works seamlessly on mobile, tablet, and desktop devices
- 🔄 **Offline fallback** - Works with localStorage when not signed in

## Project Structure

```
pantrypal-ai/
├── index.html              # Main HTML structure with auth modal and Firebase SDK
├── styles.css              # Styling with pastel aesthetic, responsive design, and auth UI
├── app.js                  # Main controller with Firebase authentication orchestration
├── ui.js                   # DOM manipulation, UI updates, and auth UI rendering
├── recipes.js              # Mock recipe generation logic
├── storage.js              # Firestore and localStorage management with cloud sync
├── firebase-config.js      # Firebase initialization and configuration
├── auth.js                 # Authentication logic (sign in/up/out, Google OAuth)
├── pantry-vision.js        # Image upload and placeholder ingredient detection
├── assets/
│   ├── logo.svg           # PantryPal AI logo
│   └── placeholder-pantrypal.png  # Placeholder image
└── README.md              # This file
```

## Module Responsibilities

### index.html
Contains the complete UI structure including:
- Header with logo
- Hero section with gradient background and feature badges
- Three-column layout for recipe generation, pantry scanning, and saved recipes
- All form elements and interactive components

### styles.css
Provides all visual styling:
- CSS custom properties for consistent theming
- Pastel color palette with soft gradients
- Responsive grid layouts
- Card components with hover effects
- Smooth animations and transitions
- Mobile-first responsive breakpoints

### app.js
Main application controller that:
- Initializes the app
- Sets up all event listeners
- Manages application state
- Coordinates between UI and logic modules
- Handles recipe generation, saving, and deletion
- Orchestrates pantry scanning workflow

### ui.js
Handles all DOM manipulation:
- Rendering generated recipes
- Displaying saved recipes with expand/collapse
- Showing detected ingredients
- Managing image previews
- Toast notifications
- Loading states and animations

### recipes.js
Mock recipe generator that:
- Takes user ingredients and preferences
- Generates 2-4 placeholder recipes
- Includes recipe templates for various cuisines
- Creates unique IDs for each recipe
- Formats recipes with ingredients and steps

### storage.js
localStorage management providing:
- `saveRecipe(recipe)` - Save or update a recipe
- `loadRecipes()` - Load all saved recipes
- `deleteRecipe(id)` - Remove a recipe by ID
- `getRecipeById(id)` - Retrieve a specific recipe
- `exportRecipes()` - Export recipes as JSON
- `importRecipes(json)` - Import recipes from JSON

### pantry-vision.js
Image upload handling with:
- File upload and validation
- Image preview generation
- Placeholder ingredient detection
- Mock confidence scores
- Simulated ML processing delay

## How to Run Locally

1. **Clone or download this repository**

2. **Open the project folder**
   ```bash
   cd pantrypal-ai
   ```

3. **Open `index.html` in your browser**
   - Simply double-click `index.html`, or
   - Right-click and select "Open with" your preferred browser, or
   - Use a local development server:
     ```bash
     # Using Python
     python -m http.server 8000

     # Using Node.js (http-server)
     npx http-server
     ```

4. **Start using the app!**
   - Enter ingredients in the "Generate a recipe" section
   - Select your preferences (dietary, meal type, cuisine, mood)
   - Click "Generate recipe" to get custom recipe suggestions
   - Upload a pantry photo to detect ingredients (placeholder functionality)
   - Save your favorite recipes to your local library

## Usage Guide

### Generating Recipes

1. Enter your available ingredients in the textarea (comma-separated)
2. Select your dietary preference, meal type, cuisine focus, and mood
3. Click "Generate recipe"
4. Browse the generated recipe suggestions
5. Click "Save to library" on any recipe you like

### Scanning Your Pantry

1. Click the drop zone or drag & drop an image of your pantry
2. Review the image preview
3. Click "Scan pantry"
4. View the detected ingredients (placeholder list)
5. Click "Use these ingredients" to populate the recipe form

### Managing Saved Recipes

1. All saved recipes appear in the "Your saved recipes" column
2. Click any recipe to expand and view full details
3. Click "Remove" to delete a recipe from your library
4. Signed-in users: Recipes sync to Firestore (accessible from any device)
5. Not signed in: Recipes save to localStorage (device-only)

### Authentication

1. Click "Sign In" in the header
2. Choose to sign in, sign up, or use Google
3. After authentication, your recipes automatically sync to the cloud
4. Sign out anytime from the header

## Firebase Setup

**Important**: To use authentication and cloud sync, you must enable these services in Firebase Console.

See **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** for detailed instructions on:
- Enabling Email/Password authentication
- Enabling Google sign-in
- Creating Firestore database
- Setting up security rules

## Browser Compatibility

PantryPal AI works in all modern browsers:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

Requires JavaScript enabled. Cloud features require Firebase authentication.

## Data Storage

**Version 2.0** uses a hybrid storage approach:

**When Signed In**:
- Recipes stored in Firestore (Firebase cloud database)
- Synced across all devices where you sign in
- Persistent and secure with user-specific access rules

**When Not Signed In**:
- Recipes stored in browser localStorage
- Device-only (not synced)
- Persists until browser data is cleared

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus ingredients field
- `Escape` - Blur active input field

## Current Limitations

This is version 2.0 with the following limitations:

- ❌ No real AI/ML - uses mock recipe generation (planned for v3.0)
- ❌ No real image recognition - returns placeholder ingredients (planned for v3.0)
- ❌ No recipe sharing between users (planned for v2.1)
- ❌ Limited recipe templates (will expand over time)

## Version History

### Version 2.0 - Cloud Integration ✅ **CURRENT**
- ✅ Firebase Authentication for user accounts
- ✅ Firestore database for cloud recipe storage
- ✅ Real-time sync across devices
- ✅ Email/Password and Google sign-in
- ✅ User-specific recipe collections
- ✅ Graceful localStorage fallback

### Version 1.0 - Local Prototype
- ✅ Mock recipe generation
- ✅ Pantry vision placeholder
- ✅ localStorage-based recipe library
- ✅ Pastel UI design

## Planned Features (Future Versions)

### Version 2.1 - Social Features
- 👥 Recipe sharing with friends and family
- 💬 Comments and ratings on recipes
- 📤 Export recipes as PDF
- 🔖 Public recipe collections

### Version 3.0 - AI-Powered
- 🤖 Integration with OpenAI/Anthropic for real recipe generation
- 🖼️ Real computer vision for pantry scanning (MobileNet/TensorFlow.js)
- 🎯 Personalized recipe recommendations
- 📊 Nutritional information and meal planning

### Version 4.0 - Enhanced Features
- 🛒 Shopping list generation
- ⏲️ Cooking timers and step-by-step mode
- 📝 Recipe ratings and reviews
- 🔍 Advanced search and filtering
- 📤 Export recipes as PDF

## Development

### Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **Storage**: Firestore + localStorage (hybrid approach)
- **Deployment**: Vercel
- **Icons**: Inline SVG
- **Styling**: CSS Grid, Flexbox, Custom Properties

### Code Style
- ES6+ JavaScript features
- Modular architecture with separation of concerns
- Event delegation for dynamic content
- Async/await for asynchronous operations
- Comprehensive error handling
- Firebase compat SDK for simpler integration

### Contributing
This is currently a personal project. Future versions may include contribution guidelines.

## Troubleshooting

**Authentication not working?**
- Verify Email/Password auth is enabled in Firebase Console
- Check Google sign-in is configured (if using Google)
- See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for setup instructions
- Check browser console for Firebase errors

**Recipes not saving?**
- Make sure you're signed in (header shows your name)
- Verify Firestore database is created in Firebase Console
- Check Firestore security rules allow writes
- Check browser console for errors

**Recipes not syncing across devices?**
- Sign in with the same account on both devices
- Wait a few seconds for Firestore sync
- Check internet connection
- Verify Firestore rules are correctly configured

**Image upload not working?**
- Ensure you're uploading a valid image file (JPG, PNG, etc.)
- Check file size (max 10MB)
- Check browser console for errors

**UI looks broken?**
- Ensure JavaScript is enabled
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Use a modern browser

## License

© 2025 PantryPal AI - Version 2.0 with Cloud Sync

## Support

- **Issues**: https://github.com/pat7536/pantrypal-ai/issues
- **Live Demo**: https://pantrypal-ai-delta.vercel.app
- **Setup Guide**: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

---

**Built with Firebase** 🔥 | **Deployed on Vercel** ▲

Enjoy discovering dinner in seconds! 🍳
