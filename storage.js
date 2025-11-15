/**
 * storage.js
 * Handles localStorage operations and Firestore sync for PantryPal AI
 * Version 2.0 - Cloud-enabled with Firebase Firestore
 */

const STORAGE_KEY = 'pantry-recipes';
const USE_FIRESTORE = true; // Toggle between localStorage and Firestore

/**
 * Save a recipe to localStorage or Firestore
 * @param {Object} recipe - Recipe object containing id, title, ingredients, steps, etc.
 * @returns {Promise<boolean>} - Success status
 */
async function saveRecipe(recipe) {
    try {
        // Add userId and timestamp
        const user = getCurrentUser();
        const enrichedRecipe = {
            ...recipe,
            userId: user ? user.uid : 'local',
            updatedAt: new Date().toISOString()
        };

        if (USE_FIRESTORE && user) {
            // Save to Firestore
            await saveRecipeToFirestore(enrichedRecipe);
        } else {
            // Fallback to localStorage
            const recipes = await loadRecipes();

            // Check if recipe with this ID already exists
            const existingIndex = recipes.findIndex(r => r.id === recipe.id);

            if (existingIndex !== -1) {
                // Update existing recipe
                recipes[existingIndex] = enrichedRecipe;
            } else {
                // Add new recipe
                recipes.push(enrichedRecipe);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        }

        return true;
    } catch (error) {
        console.error('Error saving recipe:', error);
        return false;
    }
}

/**
 * Save recipe to Firestore
 * @param {Object} recipe - Recipe object
 * @returns {Promise<void>}
 */
async function saveRecipeToFirestore(recipe) {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('User must be authenticated to save to Firestore');
    }

    const recipeRef = db.collection('users').doc(user.uid).collection('recipes').doc(recipe.id);
    await recipeRef.set(recipe, { merge: true });
    console.log('Recipe saved to Firestore:', recipe.id);
}

/**
 * Load all recipes from localStorage or Firestore
 * @returns {Promise<Array>} - Array of recipe objects
 */
async function loadRecipes() {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            // Load from Firestore
            return await loadRecipesFromFirestore();
        } else {
            // Fallback to localStorage
            const recipesJson = localStorage.getItem(STORAGE_KEY);

            if (!recipesJson) {
                return [];
            }

            return JSON.parse(recipesJson);
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
        return [];
    }
}

/**
 * Load recipes from Firestore
 * @returns {Promise<Array>} - Array of recipe objects
 */
async function loadRecipesFromFirestore() {
    const user = getCurrentUser();
    if (!user) {
        return [];
    }

    const recipesRef = db.collection('users').doc(user.uid).collection('recipes');
    const snapshot = await recipesRef.orderBy('updatedAt', 'desc').get();

    const recipes = [];
    snapshot.forEach((doc) => {
        recipes.push(doc.data());
    });

    console.log(`Loaded ${recipes.length} recipes from Firestore`);
    return recipes;
}

/**
 * Delete a recipe from localStorage or Firestore by ID
 * @param {string} id - Recipe ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteRecipe(id) {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            // Delete from Firestore
            await deleteRecipeFromFirestore(id);
        } else {
            // Fallback to localStorage
            const recipes = await loadRecipes();
            const filteredRecipes = recipes.filter(recipe => recipe.id !== id);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecipes));
        }

        return true;
    } catch (error) {
        console.error('Error deleting recipe:', error);
        return false;
    }
}

/**
 * Delete recipe from Firestore
 * @param {string} id - Recipe ID
 * @returns {Promise<void>}
 */
async function deleteRecipeFromFirestore(id) {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('User must be authenticated to delete from Firestore');
    }

    const recipeRef = db.collection('users').doc(user.uid).collection('recipes').doc(id);
    await recipeRef.delete();
    console.log('Recipe deleted from Firestore:', id);
}

/**
 * Get a single recipe by ID
 * @param {string} id - Recipe ID
 * @returns {Promise<Object|null>} - Recipe object or null if not found
 */
async function getRecipeById(id) {
    const recipes = await loadRecipes();
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
