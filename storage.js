/**
 * storage.js
 * Handles localStorage operations and Firestore sync for PantryPal AI
 * Version 3.1 - Added Recipe Collections support
 */

const STORAGE_KEY = 'pantry-recipes';
const COLLECTIONS_KEY = 'pantry-collections';
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
            updatedAt: new Date().toISOString(),
            collectionIds: recipe.collectionIds || [] // Initialize empty collections array
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

// ==================== COLLECTIONS MANAGEMENT ====================

/**
 * Create a new collection
 * @param {string} name - Collection name
 * @returns {Promise<Object|null>} - Created collection object or null
 */
async function createCollection(name) {
    try {
        const user = getCurrentUser();
        const collectionId = 'collection-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        const collection = {
            id: collectionId,
            name: name.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (USE_FIRESTORE && user) {
            const collectionRef = db.collection('users').doc(user.uid).collection('collections').doc(collectionId);
            await collectionRef.set(collection);
            console.log('Collection created in Firestore:', collectionId);
        } else {
            const collections = await getCollections();
            collections.push(collection);
            localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
        }

        return collection;
    } catch (error) {
        console.error('Error creating collection:', error);
        return null;
    }
}

/**
 * Get all collections for current user
 * @returns {Promise<Array>} - Array of collection objects
 */
async function getCollections() {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            const collectionsRef = db.collection('users').doc(user.uid).collection('collections');
            const snapshot = await collectionsRef.orderBy('createdAt', 'asc').get();

            const collections = [];
            snapshot.forEach((doc) => {
                collections.push(doc.data());
            });

            console.log(`Loaded ${collections.length} collections from Firestore`);
            return collections;
        } else {
            const collectionsJson = localStorage.getItem(COLLECTIONS_KEY);
            return collectionsJson ? JSON.parse(collectionsJson) : [];
        }
    } catch (error) {
        console.error('Error loading collections:', error);
        return [];
    }
}

/**
 * Rename a collection
 * @param {string} collectionId - Collection ID
 * @param {string} newName - New collection name
 * @returns {Promise<boolean>} - Success status
 */
async function renameCollection(collectionId, newName) {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            const collectionRef = db.collection('users').doc(user.uid).collection('collections').doc(collectionId);
            await collectionRef.update({
                name: newName.trim(),
                updatedAt: new Date().toISOString()
            });
            console.log('Collection renamed in Firestore:', collectionId);
        } else {
            const collections = await getCollections();
            const index = collections.findIndex(c => c.id === collectionId);
            if (index !== -1) {
                collections[index].name = newName.trim();
                collections[index].updatedAt = new Date().toISOString();
                localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
            }
        }

        return true;
    } catch (error) {
        console.error('Error renaming collection:', error);
        return false;
    }
}

/**
 * Delete a collection (does NOT delete recipes, just removes collectionId from them)
 * @param {string} collectionId - Collection ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteCollection(collectionId) {
    try {
        const user = getCurrentUser();

        // First, remove this collectionId from all recipes
        const recipes = await loadRecipes();
        for (const recipe of recipes) {
            if (recipe.collectionIds && recipe.collectionIds.includes(collectionId)) {
                recipe.collectionIds = recipe.collectionIds.filter(id => id !== collectionId);
                await saveRecipe(recipe);
            }
        }

        // Then delete the collection itself
        if (USE_FIRESTORE && user) {
            const collectionRef = db.collection('users').doc(user.uid).collection('collections').doc(collectionId);
            await collectionRef.delete();
            console.log('Collection deleted from Firestore:', collectionId);
        } else {
            const collections = await getCollections();
            const filteredCollections = collections.filter(c => c.id !== collectionId);
            localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filteredCollections));
        }

        return true;
    } catch (error) {
        console.error('Error deleting collection:', error);
        return false;
    }
}

/**
 * Assign a recipe to one or more collections
 * @param {string} recipeId - Recipe ID
 * @param {Array<string>} collectionIds - Array of collection IDs
 * @returns {Promise<boolean>} - Success status
 */
async function assignRecipeToCollections(recipeId, collectionIds) {
    try {
        const recipe = await getRecipeById(recipeId);
        if (!recipe) {
            throw new Error('Recipe not found');
        }

        recipe.collectionIds = collectionIds;
        recipe.updatedAt = new Date().toISOString();

        await saveRecipe(recipe);
        console.log(`Recipe ${recipeId} assigned to collections:`, collectionIds);
        return true;
    } catch (error) {
        console.error('Error assigning recipe to collections:', error);
        return false;
    }
}

/**
 * Get recipes in a specific collection
 * @param {string} collectionId - Collection ID (use 'all' for all recipes)
 * @returns {Promise<Array>} - Array of recipe objects
 */
async function getRecipesInCollection(collectionId) {
    const recipes = await loadRecipes();

    if (collectionId === 'all') {
        return recipes;
    }

    return recipes.filter(recipe =>
        recipe.collectionIds && recipe.collectionIds.includes(collectionId)
    );
}

/**
 * Get a single collection by ID
 * @param {string} collectionId - Collection ID
 * @returns {Promise<Object|null>} - Collection object or null
 */
async function getCollectionById(collectionId) {
    const collections = await getCollections();
    return collections.find(c => c.id === collectionId) || null;
}

/**
 * Initialize default collection if none exist
 * @returns {Promise<void>}
 */
async function initializeDefaultCollection() {
    const collections = await getCollections();
    if (collections.length === 0) {
        await createCollection('Favorites');
        console.log('Created default "Favorites" collection');
    }
}

// ==================== MEAL PLANNER MANAGEMENT ====================

/**
 * Load planner data for a specific week
 * @param {string} weekId - Week ID (YYYY-MM-DD of Monday)
 * @returns {Promise<Object|null>} - Planner data or null
 */
async function loadPlanner(weekId) {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            const plannerRef = db.collection('users').doc(user.uid).collection('planner').doc(weekId);
            const doc = await plannerRef.get();

            if (doc.exists) {
                console.log('Loaded planner from Firestore:', weekId);
                return doc.data();
            }
        }

        return null;
    } catch (error) {
        console.error('Error loading planner:', error);
        return null;
    }
}

/**
 * Save planner data for a specific week
 * @param {string} weekId - Week ID (YYYY-MM-DD of Monday)
 * @param {Object} plannerData - Planner data object
 * @returns {Promise<boolean>} - Success status
 */
async function savePlanner(weekId, plannerData) {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            const plannerRef = db.collection('users').doc(user.uid).collection('planner').doc(weekId);
            await plannerRef.set(plannerData, { merge: true });
            console.log('Planner saved to Firestore:', weekId);
        }

        return true;
    } catch (error) {
        console.error('Error saving planner:', error);
        return false;
    }
}

// ==================== GROCERY LIST MANAGEMENT ====================

/**
 * Load grocery list for a specific week
 * @param {string} weekId - Week ID (YYYY-MM-DD of Monday)
 * @returns {Promise<Object|null>} - Grocery list data or null
 */
async function loadGroceryList(weekId) {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            const groceryRef = db.collection('users').doc(user.uid).collection('groceryLists').doc(weekId);
            const doc = await groceryRef.get();

            if (doc.exists) {
                console.log('Loaded grocery list from Firestore:', weekId);
                return doc.data();
            }
        }

        return null;
    } catch (error) {
        console.error('Error loading grocery list:', error);
        return null;
    }
}

/**
 * Save grocery list for a specific week
 * @param {string} weekId - Week ID (YYYY-MM-DD of Monday)
 * @param {Object} groceryData - Grocery list data object
 * @returns {Promise<boolean>} - Success status
 */
async function saveGroceryList(weekId, groceryData) {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            const groceryRef = db.collection('users').doc(user.uid).collection('groceryLists').doc(weekId);
            await groceryRef.set(groceryData, { merge: true });
            console.log('Grocery list saved to Firestore:', weekId);
        }

        return true;
    } catch (error) {
        console.error('Error saving grocery list:', error);
        return false;
    }
}

/**
 * Update a single grocery item's checked status
 * @param {string} weekId - Week ID
 * @param {number} itemIndex - Index of the item in the array
 * @param {boolean} checked - New checked status
 * @returns {Promise<boolean>} - Success status
 */
async function updateGroceryItemStatus(weekId, itemIndex, checked) {
    try {
        const groceryData = await loadGroceryList(weekId);
        if (!groceryData) return false;

        groceryData.items[itemIndex].checked = checked;
        return await saveGroceryList(weekId, groceryData);
    } catch (error) {
        console.error('Error updating grocery item:', error);
        return false;
    }
}

/**
 * Clear/delete grocery list for a specific week
 * @param {string} weekId - Week ID
 * @returns {Promise<boolean>} - Success status
 */
async function clearGroceryList(weekId) {
    try {
        const user = getCurrentUser();

        if (USE_FIRESTORE && user) {
            const groceryRef = db.collection('users').doc(user.uid).collection('groceryLists').doc(weekId);
            await groceryRef.delete();
            console.log('Grocery list cleared from Firestore:', weekId);
        }

        return true;
    } catch (error) {
        console.error('Error clearing grocery list:', error);
        return false;
    }
}
