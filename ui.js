/**
 * ui.js
 * Handles all DOM manipulation and UI updates for PantryPal AI
 */

const UI = {
    /**
     * Display generated recipes in the UI
     * @param {Array<Object>} recipes - Array of recipe objects
     */
    displayGeneratedRecipes(recipes) {
        const container = document.getElementById('generated-recipes');

        if (!recipes || recipes.length === 0) {
            container.innerHTML = '<p class="empty-state-subtext">No recipes generated yet</p>';
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                <h3>${recipe.title}</h3>

                <h4>Ingredients:</h4>
                <ul>
                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>

                <h4>Steps:</h4>
                <ol>
                    ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>

                <div class="recipe-actions">
                    <button class="btn btn-small btn-success save-recipe-btn" data-recipe-id="${recipe.id}">
                        Save to library
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Display saved recipes from localStorage or Firestore
     * @param {string} collectionId - Collection ID to filter by (default: 'all')
     * @param {Array} collections - Array of collection objects for tag display
     */
    async displaySavedRecipes(collectionId = 'all', collections = []) {
        const container = document.getElementById('saved-recipes');
        const recipes = await getRecipesInCollection(collectionId);

        if (recipes.length === 0) {
            const emptyMessage = collectionId === 'all'
                ? 'No saved recipes yet'
                : 'No recipes in this collection';
            const emptySubtext = collectionId === 'all'
                ? 'Generate and save recipes to see them here'
                : 'Add recipes to this collection to see them here';

            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>${emptyMessage}</p>
                    <p class="empty-state-subtext">${emptySubtext}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recipes.map(recipe => {
            // Get collection names for this recipe
            const recipeCollections = (recipe.collectionIds || [])
                .map(cId => collections.find(c => c.id === cId))
                .filter(c => c)
                .map(c => c.name);

            return `
                <div class="saved-recipe" data-recipe-id="${recipe.id}">
                    <div class="saved-recipe-header">
                        <div>
                            <h3>${recipe.title}</h3>
                            <p class="saved-recipe-meta">
                                ${recipe.cuisineFocus ? recipe.cuisineFocus + ' • ' : ''}
                                ${recipe.mealType || 'dinner'}
                                ${recipe.dietaryPreference && recipe.dietaryPreference !== 'none' ? ' • ' + recipe.dietaryPreference : ''}
                            </p>
                            ${recipeCollections.length > 0 ? `
                                <div class="recipe-collections-tags">
                                    ${recipeCollections.map(name => `<span class="collection-tag">${name}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="saved-recipe-actions">
                            <button class="add-to-collection-btn" data-recipe-id="${recipe.id}" title="Add to collection">
                                + Collection
                            </button>
                            <button class="btn btn-small btn-danger delete-recipe-btn" data-recipe-id="${recipe.id}">
                                Remove
                            </button>
                        </div>
                    </div>

                    <div class="saved-recipe-details">
                        <h4>Ingredients:</h4>
                        <ul>
                            ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>

                        <h4>Steps:</h4>
                        <ol>
                            ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Display detected ingredients from pantry scan
     * @param {Array<Object>} ingredients - Array of ingredient objects with confidence
     */
    displayDetectedIngredients(ingredients) {
        const container = document.getElementById('detected-ingredients');

        if (!ingredients || ingredients.length === 0) {
            container.innerHTML = '';
            return;
        }

        const ingredientNames = ingredients.map(ing => ing.name);

        container.innerHTML = `
            <h3>Detected ingredients:</h3>
            <div class="ingredient-tags">
                ${ingredients.map(ing => `
                    <span class="ingredient-tag" title="Confidence: ${(ing.confidence * 100).toFixed(0)}%">
                        ${ing.name}
                    </span>
                `).join('')}
            </div>
            <button class="btn btn-primary use-ingredients-btn" data-ingredients="${ingredientNames.join(', ')}">
                Use these ingredients
            </button>
        `;
    },

    /**
     * Show image preview
     * @param {string} imageDataUrl - Data URL of the image
     */
    showImagePreview(imageDataUrl) {
        const previewContainer = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');

        previewImg.src = imageDataUrl;
        previewContainer.style.display = 'block';
    },

    /**
     * Hide image preview
     */
    hideImagePreview() {
        const previewContainer = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');

        previewImg.src = '';
        previewContainer.style.display = 'none';
    },

    /**
     * Show loading state on a button
     * @param {HTMLElement} button - Button element
     * @param {string} loadingText - Text to display while loading
     */
    showButtonLoading(button, loadingText = 'Loading...') {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
    },

    /**
     * Hide loading state on a button
     * @param {HTMLElement} button - Button element
     */
    hideButtonLoading(button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    },

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: ${type === 'success' ? '#86efac' : type === 'error' ? '#fca5a5' : '#a78bfa'};
            color: #2d3748;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    },

    /**
     * Clear generated recipes display
     */
    clearGeneratedRecipes() {
        const container = document.getElementById('generated-recipes');
        container.innerHTML = '';
    },

    /**
     * Clear detected ingredients display
     */
    clearDetectedIngredients() {
        const container = document.getElementById('detected-ingredients');
        container.innerHTML = '';
    },

    /**
     * Reset the recipe generation form
     */
    resetRecipeForm() {
        document.getElementById('recipe-form').reset();
        this.clearGeneratedRecipes();
    },

    /**
     * Reset the pantry scan section
     */
    resetPantryScan() {
        this.hideImagePreview();
        this.clearDetectedIngredients();
        document.getElementById('scan-pantry-btn').disabled = true;
        document.getElementById('pantry-image-input').value = '';
    },

    /**
     * Populate ingredients field with detected ingredients
     * @param {string} ingredientsString - Comma-separated ingredients
     */
    populateIngredientsField(ingredientsString) {
        const ingredientsField = document.getElementById('ingredients');
        ingredientsField.value = ingredientsString;
        ingredientsField.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add a subtle highlight effect
        ingredientsField.style.borderColor = 'var(--primary)';
        setTimeout(() => {
            ingredientsField.style.borderColor = '';
        }, 2000);
    },

    /**
     * Toggle saved recipe expansion
     * @param {HTMLElement} recipeElement - Recipe card element
     */
    toggleRecipeExpansion(recipeElement) {
        recipeElement.classList.toggle('expanded');
    },

    /**
     * Scroll to a specific section
     * @param {string} elementId - ID of element to scroll to
     */
    scrollToSection(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Enable scan button when image is uploaded
     */
    enableScanButton() {
        const scanButton = document.getElementById('scan-pantry-btn');
        scanButton.disabled = false;
    },

    /**
     * Disable scan button
     */
    disableScanButton() {
        const scanButton = document.getElementById('scan-pantry-btn');
        scanButton.disabled = true;
    },

    /**
     * Render authentication status in header
     * @param {firebase.User|null} user - Current user or null
     */
    renderAuthStatus(user) {
        const container = document.getElementById('auth-status');

        if (user) {
            // User is signed in
            const displayName = user.displayName || user.email.split('@')[0];
            container.innerHTML = `
                <div class="user-info">
                    <span class="user-name">👋 ${displayName}</span>
                    <button id="signout-btn" class="btn btn-small">Sign Out</button>
                </div>
            `;
        } else {
            // User is not signed in
            container.innerHTML = `
                <button id="signin-btn" class="btn btn-small btn-primary">Sign In</button>
            `;
        }
    },

    /**
     * Show authentication modal
     */
    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'flex';
    },

    /**
     * Hide authentication modal
     */
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'none';
        // Reset forms
        document.getElementById('signin-form').reset();
        document.getElementById('signup-form').reset();
        document.getElementById('reset-form').reset();
    },

    /**
     * Switch between auth forms (signin, signup, reset)
     * @param {string} formType - 'signin', 'signup', or 'reset'
     */
    switchAuthForm(formType) {
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        const resetForm = document.getElementById('reset-form');
        const title = document.getElementById('auth-modal-title');

        // Hide all forms
        signinForm.style.display = 'none';
        signupForm.style.display = 'none';
        resetForm.style.display = 'none';

        // Show selected form
        if (formType === 'signup') {
            signupForm.style.display = 'block';
            title.textContent = 'Sign Up';
        } else if (formType === 'reset') {
            resetForm.style.display = 'block';
            title.textContent = 'Reset Password';
        } else {
            signinForm.style.display = 'block';
            title.textContent = 'Sign In';
        }
    },

    // ==================== COLLECTIONS UI ====================

    /**
     * Render collections list in the sidebar
     * @param {Array} collections - Array of collection objects
     * @param {string} activeCollectionId - Currently active collection ID
     * @param {Object} recipeCounts - Object with collection IDs as keys and counts as values
     */
    renderCollectionsList(collections, activeCollectionId = 'all', recipeCounts = {}) {
        const container = document.getElementById('collections-list');

        let html = `
            <div class="collection-item ${activeCollectionId === 'all' ? 'active' : ''}" data-collection-id="all">
                <span class="collection-name">All Recipes</span>
                <span class="collection-count">${recipeCounts.all || 0}</span>
            </div>
        `;

        collections.forEach(collection => {
            html += `
                <div class="collection-item ${activeCollectionId === collection.id ? 'active' : ''}" data-collection-id="${collection.id}">
                    <span class="collection-name">${collection.name}</span>
                    <span class="collection-count">${recipeCounts[collection.id] || 0}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Update current collection header display
     * @param {string} collectionName - Name of the collection
     * @param {boolean} isCustomCollection - Whether this is a custom collection (show menu)
     */
    updateCollectionHeader(collectionName, isCustomCollection = false) {
        const header = document.getElementById('current-collection-header');
        const nameElement = document.getElementById('current-collection-name');

        if (isCustomCollection) {
            header.style.display = 'flex';
            nameElement.textContent = collectionName;
        } else {
            header.style.display = 'none';
        }
    },

    /**
     * Show collection menu dropdown
     */
    showCollectionMenu() {
        const menu = document.getElementById('collection-menu');
        menu.style.display = 'block';
    },

    /**
     * Hide collection menu dropdown
     */
    hideCollectionMenu() {
        const menu = document.getElementById('collection-menu');
        menu.style.display = 'none';
    },

    /**
     * Toggle collection menu visibility
     */
    toggleCollectionMenu() {
        const menu = document.getElementById('collection-menu');
        if (menu.style.display === 'none' || menu.style.display === '') {
            this.showCollectionMenu();
        } else {
            this.hideCollectionMenu();
        }
    },

    /**
     * Show create collection modal
     */
    showCreateCollectionModal() {
        const modal = document.getElementById('create-collection-modal');
        modal.style.display = 'flex';
        document.getElementById('collection-name-input').focus();
    },

    /**
     * Hide create collection modal
     */
    hideCreateCollectionModal() {
        const modal = document.getElementById('create-collection-modal');
        modal.style.display = 'none';
        document.getElementById('create-collection-form').reset();
    },

    /**
     * Show rename collection modal
     * @param {string} currentName - Current name of the collection
     */
    showRenameCollectionModal(currentName) {
        const modal = document.getElementById('rename-collection-modal');
        const input = document.getElementById('rename-collection-input');
        modal.style.display = 'flex';
        input.value = currentName;
        input.focus();
        input.select();
    },

    /**
     * Hide rename collection modal
     */
    hideRenameCollectionModal() {
        const modal = document.getElementById('rename-collection-modal');
        modal.style.display = 'none';
        document.getElementById('rename-collection-form').reset();
    },

    /**
     * Show assign to collections modal
     * @param {Array} collections - Array of collection objects
     * @param {Array} currentCollectionIds - Array of currently assigned collection IDs
     */
    showAssignCollectionsModal(collections, currentCollectionIds = []) {
        const modal = document.getElementById('assign-collections-modal');
        const checkboxList = document.getElementById('collections-checkbox-list');

        if (collections.length === 0) {
            checkboxList.innerHTML = `
                <p class="empty-state-subtext">No collections yet. Create a collection first!</p>
            `;
        } else {
            checkboxList.innerHTML = collections.map(collection => `
                <div class="collection-checkbox-item">
                    <input type="checkbox" id="collection-${collection.id}" value="${collection.id}"
                        ${currentCollectionIds.includes(collection.id) ? 'checked' : ''}>
                    <label for="collection-${collection.id}">${collection.name}</label>
                </div>
            `).join('');
        }

        modal.style.display = 'flex';
    },

    /**
     * Hide assign to collections modal
     */
    hideAssignCollectionsModal() {
        const modal = document.getElementById('assign-collections-modal');
        modal.style.display = 'none';
    },

    /**
     * Get selected collection IDs from assign modal
     * @returns {Array<string>} - Array of selected collection IDs
     */
    getSelectedCollectionIds() {
        const checkboxes = document.querySelectorAll('#collections-checkbox-list input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    },

    /**
     * Hide any modal by ID
     * @param {string} modalId - ID of the modal to hide
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
};

// Add CSS animations for toast notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
