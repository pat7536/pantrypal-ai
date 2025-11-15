# PantryPal AI

**Version 1.0 - Local-Only Prototype**

Discover dinner in seconds with AI-powered recipe suggestions based on your pantry ingredients.

![PantryPal AI](assets/placeholder-pantrypal.png)

## Overview

PantryPal AI is a modern cooking application that helps you transform your pantry ingredients into delicious meals. This is the **local-only version** that runs entirely in your browser with no backend required. All data is stored locally using localStorage.

### Key Features

- 🍳 **AI-assisted recipe ideas** - Generate custom recipes based on your ingredients and preferences
- 📸 **Pantry vision** - Upload photos of your pantry to detect ingredients (placeholder functionality)
- 💾 **Personal recipe library** - Save and manage your favorite recipes locally on your device
- 🎨 **Modern UI** - Beautiful pastel-themed interface with smooth animations
- 📱 **Responsive design** - Works seamlessly on mobile, tablet, and desktop devices

## Project Structure

```
pantrypal-ai/
├── index.html              # Main HTML structure with hero section and three-column layout
├── styles.css              # All styling with pastel aesthetic and responsive design
├── app.js                  # Main controller - orchestrates all functionality
├── ui.js                   # DOM manipulation and UI updates
├── recipes.js              # Mock recipe generation logic
├── storage.js              # localStorage management
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
4. All recipes are stored in your browser's localStorage

## Browser Compatibility

PantryPal AI works in all modern browsers:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

Requires JavaScript enabled and localStorage support.

## Data Storage

All data is stored locally in your browser using localStorage under the key `pantry-recipes`. Your data:
- Never leaves your device
- Persists between sessions
- Is tied to your browser and domain
- Can be cleared via browser settings

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus ingredients field
- `Escape` - Blur active input field

## Current Limitations

This is version 1.0 - a local-only prototype with the following limitations:

- ❌ No real AI/ML - uses mock recipe generation
- ❌ No real image recognition - returns placeholder ingredients
- ❌ No cloud sync - data is browser-local only
- ❌ No user authentication
- ❌ No recipe sharing
- ❌ Limited recipe templates

## Planned Features (Future Versions)

### Version 2.0 - Cloud Integration
- 🔐 Firebase Authentication for user accounts
- ☁️ Firestore database for cloud recipe storage
- 🔄 Real-time sync across devices
- 👥 Recipe sharing with friends and family

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
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: Browser localStorage
- **Icons**: Inline SVG
- **Styling**: CSS Grid, Flexbox, Custom Properties

### Code Style
- ES6+ JavaScript features
- Modular architecture with separation of concerns
- Event delegation for dynamic content
- Async/await for asynchronous operations
- Comprehensive error handling

### Contributing
This is currently a prototype project. Future versions will include contribution guidelines.

## Troubleshooting

**Recipes not saving?**
- Check that localStorage is enabled in your browser
- Check browser console for errors
- Try clearing localStorage and reloading

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

© 2025 PantryPal AI - Local-only version v1.0

## Support

For issues, feature requests, or questions about future versions, please check back for updates.

---

**Note**: This is a local-only prototype. Firebase integration, real AI-powered recipe generation, and actual machine learning for pantry vision will be added in future versions.

Enjoy discovering dinner in seconds! 🍳
