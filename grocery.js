/**
 * grocery.js
 * Grocery List Generator for PantryPal AI
 * Handles ingredient extraction, normalization, and categorization
 */

/**
 * Category definitions with common keywords
 */
const INGREDIENT_CATEGORIES = {
    'Produce': [
        'tomato', 'onion', 'garlic', 'carrot', 'potato', 'pepper', 'lettuce', 'spinach',
        'broccoli', 'cucumber', 'celery', 'mushroom', 'zucchini', 'squash', 'eggplant',
        'cabbage', 'kale', 'avocado', 'lemon', 'lime', 'orange', 'apple', 'banana',
        'berry', 'grape', 'melon', 'pineapple', 'mango', 'ginger', 'cilantro', 'parsley',
        'basil', 'mint', 'dill', 'chive', 'scallion', 'leek', 'shallot', 'radish',
        'beet', 'turnip', 'asparagus', 'artichoke', 'corn', 'pea', 'bean', 'sprout'
    ],
    'Meat & Seafood': [
        'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'bacon', 'sausage',
        'ham', 'steak', 'ground', 'salmon', 'tuna', 'shrimp', 'fish', 'cod', 'tilapia',
        'crab', 'lobster', 'scallop', 'mussel', 'clam', 'anchovy', 'sardine'
    ],
    'Dairy & Eggs': [
        'milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'sour cream', 'cottage',
        'ricotta', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'goat cheese',
        'cream cheese', 'half and half', 'whipping cream', 'buttermilk'
    ],
    'Grains & Pasta': [
        'rice', 'pasta', 'noodle', 'bread', 'flour', 'oat', 'quinoa', 'barley',
        'couscous', 'bulgur', 'tortilla', 'pita', 'bagel', 'roll', 'cracker',
        'cereal', 'granola', 'panko', 'breadcrumb', 'spaghetti', 'penne', 'fettuccine'
    ],
    'Canned & Jarred': [
        'canned', 'tomato sauce', 'tomato paste', 'diced tomato', 'crushed tomato',
        'coconut milk', 'chickpea', 'black bean', 'kidney bean', 'lentil',
        'broth', 'stock', 'salsa', 'pickle', 'olive', 'artichoke heart', 'roasted pepper'
    ],
    'Spices & Seasonings': [
        'salt', 'pepper', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary',
        'cinnamon', 'nutmeg', 'clove', 'cardamom', 'turmeric', 'curry', 'chili',
        'cayenne', 'garlic powder', 'onion powder', 'bay leaf', 'saffron', 'sumac',
        'coriander', 'fennel seed', 'mustard seed', 'vanilla', 'extract'
    ],
    'Oils & Vinegars': [
        'olive oil', 'vegetable oil', 'canola oil', 'sesame oil', 'coconut oil',
        'vinegar', 'balsamic', 'red wine vinegar', 'apple cider vinegar', 'rice vinegar'
    ],
    'Condiments & Sauces': [
        'soy sauce', 'fish sauce', 'worcestershire', 'hot sauce', 'ketchup', 'mustard',
        'mayonnaise', 'honey', 'maple syrup', 'tahini', 'peanut butter', 'jam',
        'hoisin', 'oyster sauce', 'teriyaki', 'bbq sauce', 'sriracha'
    ],
    'Baking': [
        'sugar', 'brown sugar', 'powdered sugar', 'baking soda', 'baking powder',
        'yeast', 'cocoa', 'chocolate', 'vanilla extract', 'almond extract'
    ],
    'Other': []
};

/**
 * Extract ingredients from an array of recipes
 * @param {Array} recipes - Array of recipe objects
 * @returns {Array} - Flat array of ingredient strings
 */
function extractIngredientsFromRecipes(recipes) {
    const allIngredients = [];

    recipes.forEach(recipe => {
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            recipe.ingredients.forEach(ing => {
                allIngredients.push(ing);
            });
        }
    });

    return allIngredients;
}

/**
 * Normalize an ingredient name (extract the main ingredient)
 * @param {string} ingredientString - Full ingredient string (e.g., "2 cups diced tomatoes")
 * @returns {Object} - { name: string, quantity: string }
 */
function normalizeIngredientName(ingredientString) {
    // Remove common measurements and quantities
    let cleaned = ingredientString.toLowerCase().trim();

    // Extract quantity (numbers and fractions at the beginning)
    const quantityMatch = cleaned.match(/^[\d\s\/\-\.]+\s*(cup|cups|tbsp|tsp|oz|ounce|lb|pound|g|gram|kg|ml|liter|can|clove|piece|slice|bunch|head|stalk|sprig|pinch|dash|to taste)?s?\b/i);
    let quantity = '';
    if (quantityMatch) {
        quantity = quantityMatch[0].trim();
        cleaned = cleaned.substring(quantityMatch[0].length).trim();
    }

    // Remove preparation words
    const prepWords = [
        'diced', 'chopped', 'minced', 'sliced', 'crushed', 'grated', 'shredded',
        'melted', 'softened', 'room temperature', 'cold', 'warm', 'hot', 'fresh',
        'dried', 'frozen', 'canned', 'cooked', 'raw', 'peeled', 'seeded', 'trimmed',
        'boneless', 'skinless', 'large', 'medium', 'small', 'optional', 'finely',
        'roughly', 'thinly', 'thickly', 'to taste', 'for garnish', 'divided'
    ];

    prepWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });

    // Clean up extra spaces and punctuation
    cleaned = cleaned.replace(/[,\(\)]/g, '').replace(/\s+/g, ' ').trim();

    // Capitalize first letter
    const name = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

    return {
        name: name || ingredientString,
        quantity: quantity || ''
    };
}

/**
 * Merge duplicate ingredients
 * @param {Array} ingredients - Array of normalized ingredient objects
 * @returns {Array} - Merged array with combined quantities
 */
function mergeIngredients(ingredients) {
    const merged = {};

    ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();

        if (merged[key]) {
            // Combine quantities
            if (ing.quantity && merged[key].quantity) {
                merged[key].quantity += ', ' + ing.quantity;
            } else if (ing.quantity) {
                merged[key].quantity = ing.quantity;
            }
        } else {
            merged[key] = {
                name: ing.name,
                quantity: ing.quantity,
                checked: false
            };
        }
    });

    return Object.values(merged);
}

/**
 * Categorize an ingredient
 * @param {string} ingredientName - Name of the ingredient
 * @returns {string} - Category name
 */
function categorizeIngredient(ingredientName) {
    const lowerName = ingredientName.toLowerCase();

    for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
        if (category === 'Other') continue;

        for (const keyword of keywords) {
            if (lowerName.includes(keyword)) {
                return category;
            }
        }
    }

    return 'Other';
}

/**
 * Categorize all ingredients
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {Array} - Array with category added to each ingredient
 */
function categorizeIngredients(ingredients) {
    return ingredients.map(ing => ({
        ...ing,
        category: categorizeIngredient(ing.name)
    }));
}

/**
 * Build complete grocery list from planner data
 * @param {Object} plannerData - Weekly planner data
 * @param {Array} allRecipes - All user's saved recipes
 * @returns {Object} - Grocery list data structure
 */
function buildGroceryList(plannerData, allRecipes) {
    // Get recipe IDs from planner
    const plannedRecipeIds = getPlannedRecipeIds(plannerData);

    // Get full recipe objects
    const plannedRecipes = plannedRecipeIds
        .map(id => allRecipes.find(r => r.id === id))
        .filter(r => r);

    // Extract all ingredients
    const rawIngredients = extractIngredientsFromRecipes(plannedRecipes);

    // Normalize each ingredient
    const normalizedIngredients = rawIngredients.map(ing => normalizeIngredientName(ing));

    // Merge duplicates
    const mergedIngredients = mergeIngredients(normalizedIngredients);

    // Categorize
    const categorizedIngredients = categorizeIngredients(mergedIngredients);

    // Sort by category then by name
    categorizedIngredients.sort((a, b) => {
        if (a.category === b.category) {
            return a.name.localeCompare(b.name);
        }
        return a.category.localeCompare(b.category);
    });

    return {
        weekId: plannerData.weekStart,
        items: categorizedIngredients,
        plannedRecipeIds: plannedRecipeIds,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Group grocery items by category
 * @param {Array} items - Array of grocery items
 * @returns {Object} - Items grouped by category
 */
function groupItemsByCategory(items) {
    const grouped = {};

    items.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });

    return grouped;
}

/**
 * Calculate grocery list progress
 * @param {Array} items - Array of grocery items
 * @returns {Object} - { checked: number, total: number, percentage: number }
 */
function calculateProgress(items) {
    const total = items.length;
    const checked = items.filter(item => item.checked).length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { checked, total, percentage };
}
