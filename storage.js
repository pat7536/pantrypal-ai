/**
 * storage.js
 * Handles localStorage operations for PantryPal AI
 */

const STORAGE_KEY = 'pantry-recipes';

/**
 * Save a recipe to localStorage
 * @param {Object} recipe - Recipe object containing id, title, ingredients, steps, etc.
 * @returns {boolean} - Success status
 */
function saveRecipe(recipe) {
    try {
        const recipes = loadRecipes();

        // Check if recipe with this ID already exists
        const existingIndex = recipes.findIndex(r => r.id === recipe.id);

        if (existingIndex !== -1) {
            // Update existing recipe
            recipes[existingIndex] = recipe;
        } else {
            // Add new recipe
            recipes.push(recipe);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        return true;
    } catch (error) {
        console.error('Error saving recipe:', error);
        return false;
    }
}

/**
 * Load all recipes from localStorage
 * @returns {Array} - Array of recipe objects
 */
function loadRecipes() {
    try {
        const recipesJson = localStorage.getItem(STORAGE_KEY);

        if (!recipesJson) {
            return [];
        }

        return JSON.parse(recipesJson);
    } catch (error) {
        console.error('Error loading recipes:', error);
        return [];
    }
}

/**
 * Delete a recipe from localStorage by ID
 * @param {string} id - Recipe ID
 * @returns {boolean} - Success status
 */
function deleteRecipe(id) {
    try {
        const recipes = loadRecipes();
        const filteredRecipes = recipes.filter(recipe => recipe.id !== id);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecipes));
        return true;
    } catch (error) {
        console.error('Error deleting recipe:', error);
        return false;
    }
}

/**
 * Get a single recipe by ID
 * @param {string} id - Recipe ID
 * @returns {Object|null} - Recipe object or null if not found
 */
function getRecipeById(id) {
    const recipes = loadRecipes();
    return recipes.find(recipe => recipe.id === id) || null;
}

/**
 * Clear all recipes from localStorage
 * @returns {boolean} - Success status
 */
function clearAllRecipes() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing recipes:', error);
        return false;
    }
}

/**
 * Export recipes as JSON file
 * @returns {string} - JSON string of all recipes
 */
function exportRecipes() {
    const recipes = loadRecipes();
    return JSON.stringify(recipes, null, 2);
}

/**
 * Import recipes from JSON string
 * @param {string} jsonString - JSON string containing recipes array
 * @returns {boolean} - Success status
 */
function importRecipes(jsonString) {
    try {
        const recipes = JSON.parse(jsonString);

        if (!Array.isArray(recipes)) {
            throw new Error('Invalid format: expected array of recipes');
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        return true;
    } catch (error) {
        console.error('Error importing recipes:', error);
        return false;
    }
}
