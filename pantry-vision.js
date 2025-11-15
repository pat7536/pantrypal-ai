/**
 * pantry-vision.js
 * Placeholder module for pantry image scanning
 * Returns mock detected ingredients (no real ML yet)
 */

/**
 * List of common pantry ingredients for mock detection
 */
const commonIngredients = [
    // Vegetables
    'tomatoes', 'onions', 'garlic', 'carrots', 'potatoes', 'bell peppers',
    'broccoli', 'spinach', 'lettuce', 'cucumbers', 'celery', 'mushrooms',

    // Proteins
    'chicken', 'beef', 'eggs', 'tofu', 'salmon', 'shrimp',

    // Dairy
    'milk', 'cheese', 'butter', 'yogurt', 'cream',

    // Pantry staples
    'rice', 'pasta', 'flour', 'sugar', 'salt', 'pepper',
    'olive oil', 'soy sauce', 'vinegar', 'bread',

    // Herbs & Spices
    'basil', 'oregano', 'thyme', 'cilantro', 'parsley',
    'cumin', 'paprika', 'curry powder',

    // Canned goods
    'beans', 'chickpeas', 'tomato sauce', 'coconut milk',

    // Others
    'lemon', 'lime', 'ginger', 'honey', 'nuts', 'oats'
];

/**
 * Process uploaded image and return mock detected ingredients
 * @param {File} imageFile - Uploaded image file
 * @returns {Promise<Object>} - Promise resolving to detection results
 */
function scanPantryImage(imageFile) {
    return new Promise((resolve, reject) => {
        if (!imageFile) {
            reject(new Error('No image file provided'));
            return;
        }

        // Validate file type
        if (!imageFile.type.startsWith('image/')) {
            reject(new Error('File must be an image'));
            return;
        }

        // Simulate processing delay (as if real ML inference is happening)
        setTimeout(() => {
            // Generate mock detected ingredients
            const detectedIngredients = generateMockIngredients();

            resolve({
                success: true,
                ingredients: detectedIngredients,
                confidence: 0.85, // Mock confidence score
                imageSize: imageFile.size,
                processedAt: new Date().toISOString()
            });
        }, 1500); // 1.5 second simulated processing time
    });
}

/**
 * Generate a random set of mock detected ingredients
 * @returns {Array<Object>} - Array of ingredient objects with confidence scores
 */
function generateMockIngredients() {
    // Randomly select 5-10 ingredients
    const numIngredients = Math.floor(Math.random() * 6) + 5; // 5-10 ingredients
    const shuffled = [...commonIngredients].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numIngredients);

    return selected.map(ingredient => ({
        name: ingredient,
        confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) // 0.70-1.00
    })).sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending
}

/**
 * Create image preview from file
 * @param {File} imageFile - Image file to preview
 * @returns {Promise<string>} - Promise resolving to data URL
 */
function createImagePreview(imageFile) {
    return new Promise((resolve, reject) => {
        if (!imageFile || !imageFile.type.startsWith('image/')) {
            reject(new Error('Invalid image file'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            resolve(e.target.result);
        };

        reader.onerror = () => {
            reject(new Error('Error reading image file'));
        };

        reader.readAsDataURL(imageFile);
    });
}

/**
 * Validate image file size and dimensions
 * @param {File} imageFile - Image file to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Promise resolving to validation result
 */
function validateImage(imageFile, options = {}) {
    const {
        maxSizeMB = 10,
        maxWidth = 4096,
        maxHeight = 4096
    } = options;

    return new Promise((resolve, reject) => {
        // Check file size
        const sizeMB = imageFile.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            reject(new Error(`Image size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`));
            return;
        }

        // Check image dimensions
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            if (img.width > maxWidth || img.height > maxHeight) {
                reject(new Error(`Image dimensions (${img.width}x${img.height}) exceed maximum allowed dimensions (${maxWidth}x${maxHeight})`));
                return;
            }

            resolve({
                valid: true,
                width: img.width,
                height: img.height,
                sizeMB: sizeMB.toFixed(2)
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Invalid image file'));
        };

        img.src = objectUrl;
    });
}

/**
 * Format detected ingredients for display
 * @param {Array<Object>} ingredients - Array of ingredient objects
 * @returns {string} - Formatted comma-separated string
 */
function formatIngredientsString(ingredients) {
    return ingredients.map(ing => ing.name).join(', ');
}

/**
 * Get ingredient suggestions based on detected items
 * @param {Array<Object>} detectedIngredients - Detected ingredients with confidence
 * @returns {Array<string>} - Suggested additional ingredients
 */
function getSuggestedIngredients(detectedIngredients) {
    // Mock suggestion logic - suggest complementary ingredients
    const suggestions = {
        'tomatoes': ['basil', 'garlic', 'olive oil'],
        'chicken': ['garlic', 'lemon', 'herbs'],
        'pasta': ['tomato sauce', 'parmesan', 'garlic'],
        'rice': ['soy sauce', 'vegetables', 'eggs'],
        'beans': ['cumin', 'onions', 'peppers']
    };

    const suggested = new Set();

    detectedIngredients.forEach(({ name }) => {
        if (suggestions[name]) {
            suggestions[name].forEach(s => suggested.add(s));
        }
    });

    return Array.from(suggested).slice(0, 5);
}
