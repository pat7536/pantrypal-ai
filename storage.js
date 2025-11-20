/**
 * storage.js
 * Handles localStorage operations and Firestore sync for PantryPal AI
 * Version 3.3 - Offline-first architecture
 */

const STORAGE_KEY = 'pantry-recipes';
const COLLECTIONS_KEY = 'pantry-collections';
// USE_FIRESTORE is now implicitly true if user is authenticated, but we default to local first

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

        // Always save to localStorage first (offline cache)
        const recipes = await loadRecipesFromLocal();
        const existingIndex = recipes.findIndex(r => r.id === recipe.id);

        if (existingIndex !== -1) {
            recipes[existingIndex] = enrichedRecipe;
        } else {
            recipes.push(enrichedRecipe);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));

        // If authenticated, sync to Firestore
        if (user) {
            saveRecipeToFirestore(enrichedRecipe).catch(err =>
                console.warn('Background sync to Firestore failed:', err)
            );
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
    if (!user) return;

    const recipeRef = db.collection('users').doc(user.uid).collection('recipes').doc(recipe.id);
    await recipeRef.set(recipe, { merge: true });
    console.log('Recipe synced to Firestore:', recipe.id);
}

/**
 * Load all recipes from localStorage or Firestore
 * @returns {Promise<Array>} - Array of recipe objects
 */
async function loadRecipes() {
    try {
        // 1. Load from local storage immediately for speed
        let recipes = await loadRecipesFromLocal();

        // 2. If authenticated, try to fetch fresh data from Firestore
        const user = getCurrentUser();
        if (user) {
            try {
                const firestoreRecipes = await loadRecipesFromFirestore();
                if (firestoreRecipes && firestoreRecipes.length > 0) {
                    // Update local cache
                    recipes = firestoreRecipes;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
                }
            } catch (err) {
                console.warn('Failed to load from Firestore, using local cache:', err);
            }
        }

        return recipes;
    } catch (error) {
        console.error('Error loading recipes:', error);
        return [];
    }
}

/**
 * Helper to load recipes from local storage
 */
async function loadRecipesFromLocal() {
    const recipesJson = localStorage.getItem(STORAGE_KEY);
    return recipesJson ? JSON.parse(recipesJson) : [];
}

/**
 * Load recipes from Firestore
 * @returns {Promise<Array>} - Array of recipe objects
 */
async function loadRecipesFromFirestore() {
    const user = getCurrentUser();
    if (!user) return [];

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
        // Delete from local storage
        const recipes = await loadRecipesFromLocal();
        const filteredRecipes = recipes.filter(recipe => recipe.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecipes));

        // If authenticated, delete from Firestore
        const user = getCurrentUser();
        if (user) {
            deleteRecipeFromFirestore(id).catch(err =>
                console.warn('Background delete from Firestore failed:', err)
            );
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
    if (!user) return;

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
    const recipes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
        const collectionId = 'collection-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const collection = {
            id: collectionId,
            name: name.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to local
        const collections = await getCollectionsFromLocal();
        collections.push(collection);
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));

        // Sync to Firestore if authenticated
        const user = getCurrentUser();
        if (user) {
            const collectionRef = db.collection('users').doc(user.uid).collection('collections').doc(collectionId);
            collectionRef.set(collection).catch(err => console.warn('Firestore sync failed:', err));
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
        // 1. Load local
        let collections = await getCollectionsFromLocal();

        // 2. Sync from Firestore if authenticated
        const user = getCurrentUser();
        if (user) {
            try {
                const collectionsRef = db.collection('users').doc(user.uid).collection('collections');
                const snapshot = await collectionsRef.orderBy('createdAt', 'asc').get();

                const firestoreCollections = [];
                snapshot.forEach((doc) => {
                    firestoreCollections.push(doc.data());
                });

                if (firestoreCollections.length > 0) {
                    collections = firestoreCollections;
                    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
                }
            } catch (err) {
                console.warn('Failed to load collections from Firestore:', err);
            }
        }

        return collections;
    } catch (error) {
        console.error('Error loading collections:', error);
        return [];
    }
}

async function getCollectionsFromLocal() {
    const collectionsJson = localStorage.getItem(COLLECTIONS_KEY);
    return collectionsJson ? JSON.parse(collectionsJson) : [];
}

/**
 * Rename a collection
 * @param {string} collectionId - Collection ID
 * @param {string} newName - New collection name
 * @returns {Promise<boolean>} - Success status
 */
async function renameCollection(collectionId, newName) {
    try {
        // Update local
        const collections = await getCollectionsFromLocal();
        const index = collections.findIndex(c => c.id === collectionId);
        if (index !== -1) {
            collections[index].name = newName.trim();
            collections[index].updatedAt = new Date().toISOString();
            localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
        }

        // Sync to Firestore
        const user = getCurrentUser();
        if (user) {
            const collectionRef = db.collection('users').doc(user.uid).collection('collections').doc(collectionId);
            collectionRef.update({
                name: newName.trim(),
                updatedAt: new Date().toISOString()
            }).catch(err => console.warn('Firestore update failed:', err));
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
        // Update recipes locally first
        const recipes = await loadRecipesFromLocal();
        let recipesChanged = false;
        for (const recipe of recipes) {
            if (recipe.collectionIds && recipe.collectionIds.includes(collectionId)) {
                recipe.collectionIds = recipe.collectionIds.filter(id => id !== collectionId);
                recipesChanged = true;
            }
        }
        if (recipesChanged) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        }

        // Delete collection locally
        const collections = await getCollectionsFromLocal();
        const filteredCollections = collections.filter(c => c.id !== collectionId);
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filteredCollections));

        // Sync to Firestore
        const user = getCurrentUser();
        if (user) {
            // We should ideally update all recipes in Firestore too, but for now we'll just delete the collection doc
            // and let the client-side logic handle the missing collection ID on recipes
            const collectionRef = db.collection('users').doc(user.uid).collection('collections').doc(collectionId);
            collectionRef.delete().catch(err => console.warn('Firestore delete failed:', err));
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
        // 1. Try local storage first
        const localKey = `planner_${weekId}`;
        const localData = localStorage.getItem(localKey);
        let plannerData = localData ? JSON.parse(localData) : null;

        // 2. If authenticated, try to sync from Firestore
        const user = getCurrentUser();
        if (user) {
            try {
                const plannerRef = db.collection('users').doc(user.uid).collection('planner').doc(weekId);
                const doc = await plannerRef.get();

                if (doc.exists) {
                    const firestoreData = doc.data();
                    // Use Firestore data if it's newer or if we don't have local data
                    // Simple strategy: Firestore wins if it exists
                    plannerData = firestoreData;
                    localStorage.setItem(localKey, JSON.stringify(plannerData));
                    console.log('Synced planner from Firestore:', weekId);
                }
            } catch (err) {
                console.warn('Failed to load planner from Firestore, using local:', err);
            }
        }

        return plannerData;
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
        // 1. Save to local storage
        const localKey = `planner_${weekId}`;
        localStorage.setItem(localKey, JSON.stringify(plannerData));

        // 2. If authenticated, sync to Firestore
        const user = getCurrentUser();
        if (user) {
            const plannerRef = db.collection('users').doc(user.uid).collection('planner').doc(weekId);
            // Fire and forget sync
            plannerRef.set(plannerData, { merge: true })
                .then(() => console.log('Planner synced to Firestore:', weekId))
                .catch(err => console.warn('Planner sync failed:', err));
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
        // 1. Try local storage first
        const localKey = `grocery_${weekId}`;
        const localData = localStorage.getItem(localKey);
        let groceryData = localData ? JSON.parse(localData) : null;

        // 2. If authenticated, try to sync from Firestore
        const user = getCurrentUser();
        if (user) {
            try {
                const groceryRef = db.collection('users').doc(user.uid).collection('groceryLists').doc(weekId);
                const doc = await groceryRef.get();

                if (doc.exists) {
                    groceryData = doc.data();
                    localStorage.setItem(localKey, JSON.stringify(groceryData));
                    console.log('Synced grocery list from Firestore:', weekId);
                }
            } catch (err) {
                console.warn('Failed to load grocery list from Firestore, using local:', err);
            }
        }

        return groceryData;
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
        // 1. Save to local storage
        const localKey = `grocery_${weekId}`;
        localStorage.setItem(localKey, JSON.stringify(groceryData));

        // 2. If authenticated, sync to Firestore
        const user = getCurrentUser();
        if (user) {
            const groceryRef = db.collection('users').doc(user.uid).collection('groceryLists').doc(weekId);
            groceryRef.set(groceryData, { merge: true })
                .then(() => console.log('Grocery list synced to Firestore:', weekId))
                .catch(err => console.warn('Grocery list sync failed:', err));
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
        // We need to load, update, and save to ensure consistency
        // Ideally we'd optimize this to not reload everything, but for now this is safe
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
        // 1. Clear local
        const localKey = `grocery_${weekId}`;
        localStorage.removeItem(localKey);

        // 2. Clear Firestore if authenticated
        const user = getCurrentUser();
        if (user) {
            const groceryRef = db.collection('users').doc(user.uid).collection('groceryLists').doc(weekId);
            groceryRef.delete().catch(err => console.warn('Firestore delete failed:', err));
        }

        return true;
    } catch (error) {
        console.error('Error clearing grocery list:', error);
        return false;
    }
}
