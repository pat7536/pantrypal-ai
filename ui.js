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
     */
    async displaySavedRecipes() {
        const container = document.getElementById('saved-recipes');
        const recipes = await loadRecipes();

        if (recipes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>No saved recipes yet</p>
                    <p class="empty-state-subtext">Generate and save recipes to see them here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="saved-recipe" data-recipe-id="${recipe.id}">
                <div class="saved-recipe-header">
                    <div>
                        <h3>${recipe.title}</h3>
                        <p class="saved-recipe-meta">
                            ${recipe.cuisineFocus ? recipe.cuisineFocus + ' • ' : ''}
                            ${recipe.mealType}
                            ${recipe.dietaryPreference && recipe.dietaryPreference !== 'none' ? ' • ' + recipe.dietaryPreference : ''}
                        </p>
                    </div>
                    <button class="btn btn-small btn-danger delete-recipe-btn" data-recipe-id="${recipe.id}">
                        Remove
                    </button>
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
        `).join('');
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
