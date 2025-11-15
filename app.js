/**
 * app.js
 * Main controller for PantryPal AI
 * Version 2.0 - Cloud-enabled with Firebase
 * Orchestrates all app functionality and event handling
 */

// State management
const AppState = {
    currentGeneratedRecipes: [],
    currentUploadedImage: null,
    currentDetectedIngredients: [],
    currentUser: null
};

/**
 * Initialize the application
 */
function initApp() {
    console.log('PantryPal AI v2.0 - Initializing with Firebase...');

    // Initialize Firebase
    const firebaseInitialized = initializeFirebase();

    if (!firebaseInitialized) {
        console.error('Firebase initialization failed');
        return;
    }

    // Setup authentication state listener
    setupAuthStateListener();

    // Setup event listeners
    setupEventListeners();

    console.log('PantryPal AI ready!');
}

/**
 * Setup authentication state listener
 */
function setupAuthStateListener() {
    onAuthStateChanged((user) => {
        AppState.currentUser = user;

        // Update UI based on auth state
        UI.renderAuthStatus(user);

        if (user) {
            console.log('User signed in:', user.email);

            // Load user's recipes from Firestore
            UI.displaySavedRecipes();
        } else {
            console.log('User signed out');

            // Clear saved recipes display (will show empty state)
            UI.displaySavedRecipes();
        }
    });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Recipe generation form
    const recipeForm = document.getElementById('recipe-form');
    recipeForm.addEventListener('submit', handleRecipeGeneration);

    // Pantry image upload - drop zone
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('pantry-image-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    fileInput.addEventListener('change', handleFileSelect);

    // Scan pantry button
    const scanButton = document.getElementById('scan-pantry-btn');
    scanButton.addEventListener('click', handlePantryScan);

    // Auth modal events
    const modalClose = document.querySelector('.modal-close');
    modalClose.addEventListener('click', () => UI.hideAuthModal());

    // Auth form submissions
    document.getElementById('signin-form').addEventListener('submit', handleSignIn);
    document.getElementById('signup-form').addEventListener('submit', handleSignUp);
    document.getElementById('reset-form').addEventListener('submit', handlePasswordReset);

    // Auth form switchers
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        UI.switchAuthForm('signup');
    });

    document.getElementById('show-signin').addEventListener('click', (e) => {
        e.preventDefault();
        UI.switchAuthForm('signin');
    });

    document.getElementById('show-reset').addEventListener('click', (e) => {
        e.preventDefault();
        UI.switchAuthForm('reset');
    });

    document.getElementById('back-to-signin').addEventListener('click', (e) => {
        e.preventDefault();
        UI.switchAuthForm('signin');
    });

    // Google sign-in button
    document.getElementById('google-signin-btn').addEventListener('click', handleGoogleSignIn);

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('auth-modal');
        if (e.target === modal) {
            UI.hideAuthModal();
        }
    });

    // Event delegation for dynamically created elements
    document.addEventListener('click', handleDocumentClick);
}

/**
 * Handle recipe generation form submission
 * @param {Event} e - Form submit event
 */
async function handleRecipeGeneration(e) {
    e.preventDefault();

    const ingredients = document.getElementById('ingredients').value.trim();

    if (!ingredients) {
        UI.showNotification('Please enter some ingredients', 'error');
        return;
    }

    const params = {
        ingredients: ingredients,
        dietaryPreference: document.getElementById('dietary-preference').value,
        mealType: document.getElementById('meal-type').value,
        cuisineFocus: document.getElementById('cuisine-focus').value,
        moodVibe: document.getElementById('mood-vibe').value
    };

    // Generate recipes
    const recipes = generateRecipes(params);

    if (recipes.length === 0) {
        UI.showNotification('Could not generate recipes. Please try again.', 'error');
        return;
    }

    // Store in app state
    AppState.currentGeneratedRecipes = recipes;

    // Display generated recipes
    UI.displayGeneratedRecipes(recipes);

    UI.showNotification(`Generated ${recipes.length} recipe${recipes.length > 1 ? 's' : ''}!`, 'success');
}

/**
 * Handle drag over event
 * @param {Event} e - Drag event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

/**
 * Handle drag leave event
 * @param {Event} e - Drag event
 */
function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

/**
 * Handle file drop event
 * @param {Event} e - Drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;

    if (files.length > 0) {
        processImageFile(files[0]);
    }
}

/**
 * Handle file select from input
 * @param {Event} e - Change event
 */
function handleFileSelect(e) {
    const files = e.target.files;

    if (files.length > 0) {
        processImageFile(files[0]);
    }
}

/**
 * Process uploaded image file
 * @param {File} file - Image file
 */
async function processImageFile(file) {
    try {
        // Validate image
        await validateImage(file);

        // Store in app state
        AppState.currentUploadedImage = file;

        // Create and show preview
        const previewUrl = await createImagePreview(file);
        UI.showImagePreview(previewUrl);

        // Enable scan button
        UI.enableScanButton();

        UI.showNotification('Image uploaded successfully', 'success');
    } catch (error) {
        console.error('Error processing image:', error);
        UI.showNotification(error.message, 'error');
    }
}

/**
 * Handle pantry scan button click
 */
async function handlePantryScan() {
    if (!AppState.currentUploadedImage) {
        UI.showNotification('Please upload an image first', 'error');
        return;
    }

    const scanButton = document.getElementById('scan-pantry-btn');
    UI.showButtonLoading(scanButton, 'Scanning...');

    try {
        // Scan image (mock ML processing)
        const result = await scanPantryImage(AppState.currentUploadedImage);

        if (result.success) {
            // Store detected ingredients
            AppState.currentDetectedIngredients = result.ingredients;

            // Display detected ingredients
            UI.displayDetectedIngredients(result.ingredients);

            UI.showNotification(`Detected ${result.ingredients.length} ingredients!`, 'success');
        } else {
            throw new Error('Scan failed');
        }
    } catch (error) {
        console.error('Error scanning pantry:', error);
        UI.showNotification('Error scanning image. Please try again.', 'error');
    } finally {
        UI.hideButtonLoading(scanButton);
    }
}

/**
 * Handle document-wide click events (event delegation)
 * @param {Event} e - Click event
 */
function handleDocumentClick(e) {
    const target = e.target;

    // Sign in button
    if (target.id === 'signin-btn') {
        UI.showAuthModal();
        UI.switchAuthForm('signin');
    }

    // Sign out button
    if (target.id === 'signout-btn') {
        handleSignOut();
    }

    // Save recipe button
    if (target.classList.contains('save-recipe-btn')) {
        const recipeId = target.dataset.recipeId;
        handleSaveRecipe(recipeId);
    }

    // Delete recipe button
    if (target.classList.contains('delete-recipe-btn')) {
        e.stopPropagation(); // Prevent recipe expansion
        const recipeId = target.dataset.recipeId;
        handleDeleteRecipe(recipeId);
    }

    // Use detected ingredients button
    if (target.classList.contains('use-ingredients-btn')) {
        const ingredients = target.dataset.ingredients;
        handleUseIngredients(ingredients);
    }

    // Saved recipe card (for expansion)
    if (target.closest('.saved-recipe') && !target.classList.contains('delete-recipe-btn')) {
        const recipeCard = target.closest('.saved-recipe');
        UI.toggleRecipeExpansion(recipeCard);
    }
}

/**
 * Handle saving a recipe
 * @param {string} recipeId - Recipe ID
 */
async function handleSaveRecipe(recipeId) {
    // Find recipe in current generated recipes
    const recipe = AppState.currentGeneratedRecipes.find(r => r.id === recipeId);

    if (!recipe) {
        UI.showNotification('Recipe not found', 'error');
        return;
    }

    // Save to Firestore or localStorage
    const success = await saveRecipe(recipe);

    if (success) {
        UI.showNotification(`"${recipe.title}" saved to library!`, 'success');

        // Refresh saved recipes display
        await UI.displaySavedRecipes();
    } else {
        UI.showNotification('Error saving recipe', 'error');
    }
}

/**
 * Handle deleting a recipe
 * @param {string} recipeId - Recipe ID
 */
async function handleDeleteRecipe(recipeId) {
    // Get recipe details for notification
    const recipe = await getRecipeById(recipeId);

    if (!recipe) {
        UI.showNotification('Recipe not found', 'error');
        return;
    }

    // Confirm deletion
    const confirmed = confirm(`Are you sure you want to delete "${recipe.title}"?`);

    if (!confirmed) {
        return;
    }

    // Delete from Firestore or localStorage
    const success = await deleteRecipe(recipeId);

    if (success) {
        UI.showNotification(`"${recipe.title}" removed from library`, 'success');

        // Refresh saved recipes display
        await UI.displaySavedRecipes();
    } else {
        UI.showNotification('Error deleting recipe', 'error');
    }
}

/**
 * Handle using detected ingredients
 * @param {string} ingredientsString - Comma-separated ingredients
 */
function handleUseIngredients(ingredientsString) {
    // Populate ingredients field
    UI.populateIngredientsField(ingredientsString);

    UI.showNotification('Ingredients added to form', 'success');
}

/**
 * Handle sign in form submission
 * @param {Event} e - Form submit event
 */
async function handleSignIn(e) {
    e.preventDefault();

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    UI.showButtonLoading(submitBtn, 'Signing in...');

    try {
        await signInUser(email, password);
        UI.hideAuthModal();
        UI.showNotification('Signed in successfully!', 'success');
    } catch (error) {
        console.error('Sign in error:', error);
        UI.showNotification(getAuthErrorMessage(error.code), 'error');
    } finally {
        UI.hideButtonLoading(submitBtn);
    }
}

/**
 * Handle sign up form submission
 * @param {Event} e - Form submit event
 */
async function handleSignUp(e) {
    e.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    UI.showButtonLoading(submitBtn, 'Creating account...');

    try {
        await signUpUser(email, password, name);
        UI.hideAuthModal();
        UI.showNotification('Account created successfully!', 'success');
    } catch (error) {
        console.error('Sign up error:', error);
        UI.showNotification(getAuthErrorMessage(error.code), 'error');
    } finally {
        UI.hideButtonLoading(submitBtn);
    }
}

/**
 * Handle password reset form submission
 * @param {Event} e - Form submit event
 */
async function handlePasswordReset(e) {
    e.preventDefault();

    const email = document.getElementById('reset-email').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    UI.showButtonLoading(submitBtn, 'Sending...');

    try {
        await resetPassword(email);
        UI.showNotification('Password reset email sent! Check your inbox.', 'success');
        UI.switchAuthForm('signin');
    } catch (error) {
        console.error('Password reset error:', error);
        UI.showNotification(getAuthErrorMessage(error.code), 'error');
    } finally {
        UI.hideButtonLoading(submitBtn);
    }
}

/**
 * Handle Google sign in
 */
async function handleGoogleSignIn() {
    try {
        await signInWithGoogle();
        UI.hideAuthModal();
        UI.showNotification('Signed in with Google!', 'success');
    } catch (error) {
        console.error('Google sign in error:', error);
        UI.showNotification(getAuthErrorMessage(error.code), 'error');
    }
}

/**
 * Handle sign out
 */
async function handleSignOut() {
    try {
        await signOutUser();
        UI.showNotification('Signed out successfully', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        UI.showNotification('Error signing out', 'error');
    }
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K: Focus ingredients field
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('ingredients').focus();
    }

    // Escape: Clear current form/reset
    if (e.key === 'Escape') {
        // Check if any modal or overlay is open, otherwise clear form
        const ingredientsField = document.getElementById('ingredients');
        if (document.activeElement === ingredientsField) {
            ingredientsField.blur();
        }
    }
}

// Setup keyboard shortcuts
document.addEventListener('keydown', handleKeyboardShortcuts);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for potential external use
if (typeof window !== 'undefined') {
    window.PantryPalApp = {
        state: AppState,
        UI: UI,
        generateRecipes: generateRecipes,
        scanPantryImage: scanPantryImage,
        saveRecipe: saveRecipe,
        loadRecipes: loadRecipes,
        deleteRecipe: deleteRecipe
    };
}
