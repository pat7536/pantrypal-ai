/**
 * app.js
 * Main controller for PantryPal AI
 * Version 3.1 - Added Recipe Collections support
 * Orchestrates all app functionality and event handling
 */

// State management
const AppState = {
    currentGeneratedRecipes: [],
    currentUploadedImage: null,
    currentDetectedIngredients: [],
    currentUser: null,
    // Collections state
    collections: [],
    currentCollectionId: 'all',
    currentRecipeIdForAssignment: null
};

/**
 * Initialize the application
 */
function initApp() {
    console.log('PantryPal AI v3.1 - Initializing with Firebase and Collections...');

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

    // Setup collection event listeners
    setupCollectionEventListeners();

    console.log('PantryPal AI ready!');
}

/**
 * Setup authentication state listener
 */
function setupAuthStateListener() {
    onAuthStateChanged(async (user) => {
        AppState.currentUser = user;

        // Update UI based on auth state
        UI.renderAuthStatus(user);

        if (user) {
            console.log('User signed in:', user.email);

            // Initialize default collection if needed
            await initializeDefaultCollection();

            // Load user's collections and recipes
            await refreshCollectionsAndRecipes();
        } else {
            console.log('User signed out');

            // Reset collections state
            AppState.collections = [];
            AppState.currentCollectionId = 'all';

            // Clear saved recipes display (will show empty state)
            await refreshCollectionsAndRecipes();
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

    const prompt = document.getElementById('recipe-prompt').value.trim();
    const ingredients = document.getElementById('ingredients').value.trim();

    // Validate that either prompt or ingredients is provided
    if (!prompt && !ingredients) {
        UI.showNotification('Please enter a recipe prompt or ingredients', 'error');
        return;
    }

    const params = {
        prompt: prompt,
        ingredients: ingredients,
        dietaryPreference: document.getElementById('dietary-preference').value,
        mealType: document.getElementById('meal-type').value,
        cuisineFocus: document.getElementById('cuisine-focus').value,
        moodVibe: document.getElementById('mood-vibe').value
    };

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    UI.showButtonLoading(submitBtn, 'Generating...');

    try {
        // Generate recipes (this is now async)
        const recipes = await generateRecipes(params);

        if (!recipes || recipes.length === 0) {
            UI.showNotification('Could not generate recipes. Please try again.', 'error');
            return;
        }

        // Store in app state
        AppState.currentGeneratedRecipes = recipes;

        // Display generated recipes
        UI.displayGeneratedRecipes(recipes);

        UI.showNotification(`Generated ${recipes.length} recipe${recipes.length > 1 ? 's' : ''}!`, 'success');
    } catch (error) {
        console.error('Error generating recipes:', error);
        UI.showNotification('Error generating recipes. Please try again.', 'error');
    } finally {
        UI.hideButtonLoading(submitBtn);
    }
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

    // Add to collection button
    if (target.classList.contains('add-to-collection-btn')) {
        e.stopPropagation(); // Prevent recipe expansion
        const recipeId = target.dataset.recipeId;
        handleOpenAssignCollections(recipeId);
    }

    // Collection item click (switch collection)
    if (target.closest('.collection-item')) {
        const collectionItem = target.closest('.collection-item');
        const collectionId = collectionItem.dataset.collectionId;
        handleSwitchCollection(collectionId);
    }

    // Modal close buttons
    if (target.classList.contains('modal-close') || target.dataset.modal) {
        const modalId = target.dataset.modal;
        if (modalId) {
            UI.hideModal(modalId);
        }
    }

    // Click outside collection menu to close it
    if (!target.closest('.collection-actions') && !target.closest('#collection-menu')) {
        UI.hideCollectionMenu();
    }

    // Saved recipe card (for expansion) - exclude buttons
    if (target.closest('.saved-recipe') &&
        !target.classList.contains('delete-recipe-btn') &&
        !target.classList.contains('add-to-collection-btn') &&
        !target.closest('.saved-recipe-actions')) {
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

// ==================== COLLECTIONS HANDLERS ====================

/**
 * Setup collection-specific event listeners
 */
function setupCollectionEventListeners() {
    // New collection button
    document.getElementById('new-collection-btn').addEventListener('click', () => {
        UI.showCreateCollectionModal();
    });

    // Create collection form
    document.getElementById('create-collection-form').addEventListener('submit', handleCreateCollection);

    // Rename collection form
    document.getElementById('rename-collection-form').addEventListener('submit', handleRenameCollection);

    // Assign collections form
    document.getElementById('assign-collections-form').addEventListener('submit', handleAssignCollections);

    // Collection menu button
    document.getElementById('collection-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        UI.toggleCollectionMenu();
    });

    // Rename collection menu item
    document.getElementById('rename-collection-btn').addEventListener('click', () => {
        UI.hideCollectionMenu();
        const collection = AppState.collections.find(c => c.id === AppState.currentCollectionId);
        if (collection) {
            UI.showRenameCollectionModal(collection.name);
        }
    });

    // Delete collection menu item
    document.getElementById('delete-collection-btn').addEventListener('click', handleDeleteCollection);
}

/**
 * Refresh collections list and recipes display
 */
async function refreshCollectionsAndRecipes() {
    // Load collections
    AppState.collections = await getCollections();

    // Calculate recipe counts for each collection
    const allRecipes = await loadRecipes();
    const recipeCounts = { all: allRecipes.length };

    AppState.collections.forEach(collection => {
        recipeCounts[collection.id] = allRecipes.filter(
            recipe => recipe.collectionIds && recipe.collectionIds.includes(collection.id)
        ).length;
    });

    // Render collections list
    UI.renderCollectionsList(AppState.collections, AppState.currentCollectionId, recipeCounts);

    // Update collection header
    if (AppState.currentCollectionId === 'all') {
        UI.updateCollectionHeader('All Recipes', false);
    } else {
        const currentCollection = AppState.collections.find(c => c.id === AppState.currentCollectionId);
        if (currentCollection) {
            UI.updateCollectionHeader(currentCollection.name, true);
        } else {
            // Collection was deleted, switch to all
            AppState.currentCollectionId = 'all';
            UI.updateCollectionHeader('All Recipes', false);
        }
    }

    // Display recipes for current collection
    await UI.displaySavedRecipes(AppState.currentCollectionId, AppState.collections);
}

/**
 * Handle switching to a different collection
 * @param {string} collectionId - Collection ID to switch to
 */
async function handleSwitchCollection(collectionId) {
    AppState.currentCollectionId = collectionId;
    await refreshCollectionsAndRecipes();
    UI.showNotification(`Viewing ${collectionId === 'all' ? 'All Recipes' : AppState.collections.find(c => c.id === collectionId)?.name || 'collection'}`, 'info');
}

/**
 * Handle creating a new collection
 * @param {Event} e - Form submit event
 */
async function handleCreateCollection(e) {
    e.preventDefault();

    const nameInput = document.getElementById('collection-name-input');
    const name = nameInput.value.trim();

    if (!name) {
        UI.showNotification('Please enter a collection name', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    UI.showButtonLoading(submitBtn, 'Creating...');

    try {
        const collection = await createCollection(name);

        if (collection) {
            UI.showNotification(`Collection "${name}" created!`, 'success');
            UI.hideCreateCollectionModal();
            await refreshCollectionsAndRecipes();
        } else {
            throw new Error('Failed to create collection');
        }
    } catch (error) {
        console.error('Error creating collection:', error);
        UI.showNotification('Error creating collection', 'error');
    } finally {
        UI.hideButtonLoading(submitBtn);
    }
}

/**
 * Handle renaming a collection
 * @param {Event} e - Form submit event
 */
async function handleRenameCollection(e) {
    e.preventDefault();

    const newName = document.getElementById('rename-collection-input').value.trim();

    if (!newName) {
        UI.showNotification('Please enter a new name', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    UI.showButtonLoading(submitBtn, 'Renaming...');

    try {
        const success = await renameCollection(AppState.currentCollectionId, newName);

        if (success) {
            UI.showNotification(`Collection renamed to "${newName}"`, 'success');
            UI.hideRenameCollectionModal();
            await refreshCollectionsAndRecipes();
        } else {
            throw new Error('Failed to rename collection');
        }
    } catch (error) {
        console.error('Error renaming collection:', error);
        UI.showNotification('Error renaming collection', 'error');
    } finally {
        UI.hideButtonLoading(submitBtn);
    }
}

/**
 * Handle deleting the current collection
 */
async function handleDeleteCollection() {
    UI.hideCollectionMenu();

    const collection = AppState.collections.find(c => c.id === AppState.currentCollectionId);

    if (!collection) {
        UI.showNotification('Collection not found', 'error');
        return;
    }

    const confirmed = confirm(`Are you sure you want to delete "${collection.name}"?\n\nThis will NOT delete the recipes, only the collection.`);

    if (!confirmed) {
        return;
    }

    try {
        const success = await deleteCollection(AppState.currentCollectionId);

        if (success) {
            UI.showNotification(`Collection "${collection.name}" deleted`, 'success');
            AppState.currentCollectionId = 'all'; // Switch back to all recipes
            await refreshCollectionsAndRecipes();
        } else {
            throw new Error('Failed to delete collection');
        }
    } catch (error) {
        console.error('Error deleting collection:', error);
        UI.showNotification('Error deleting collection', 'error');
    }
}

/**
 * Handle opening the assign to collections modal
 * @param {string} recipeId - Recipe ID
 */
async function handleOpenAssignCollections(recipeId) {
    AppState.currentRecipeIdForAssignment = recipeId;

    const recipe = await getRecipeById(recipeId);

    if (!recipe) {
        UI.showNotification('Recipe not found', 'error');
        return;
    }

    const currentCollectionIds = recipe.collectionIds || [];
    UI.showAssignCollectionsModal(AppState.collections, currentCollectionIds);
}

/**
 * Handle assigning recipe to collections
 * @param {Event} e - Form submit event
 */
async function handleAssignCollections(e) {
    e.preventDefault();

    if (!AppState.currentRecipeIdForAssignment) {
        UI.showNotification('No recipe selected', 'error');
        return;
    }

    const selectedCollectionIds = UI.getSelectedCollectionIds();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    UI.showButtonLoading(submitBtn, 'Saving...');

    try {
        const success = await assignRecipeToCollections(AppState.currentRecipeIdForAssignment, selectedCollectionIds);

        if (success) {
            const count = selectedCollectionIds.length;
            UI.showNotification(
                count === 0
                    ? 'Recipe removed from all collections'
                    : `Recipe added to ${count} collection${count > 1 ? 's' : ''}`,
                'success'
            );
            UI.hideAssignCollectionsModal();
            await refreshCollectionsAndRecipes();
        } else {
            throw new Error('Failed to assign recipe to collections');
        }
    } catch (error) {
        console.error('Error assigning recipe to collections:', error);
        UI.showNotification('Error updating collections', 'error');
    } finally {
        UI.hideButtonLoading(submitBtn);
        AppState.currentRecipeIdForAssignment = null;
    }
}

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
        deleteRecipe: deleteRecipe,
        // Collections exports
        createCollection: createCollection,
        getCollections: getCollections,
        renameCollection: renameCollection,
        deleteCollection: deleteCollection,
        assignRecipeToCollections: assignRecipeToCollections
    };
}
