/**
 * recipes.js
 * Recipe generator for PantryPal AI
 * Version 3.0: Now with OpenAI-powered recipe generation!
 */

// Toggle between AI and mock mode
const USE_AI_RECIPES = false;

/**
 * Generate unique recipe ID
 * @returns {string} - Unique ID
 */
function generateRecipeId() {
    return 'recipe-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate recipes using OpenAI API (Version 3.0)
 * @param {Object} params - Recipe generation parameters
 * @returns {Promise<Array>} - Array of AI-generated recipe objects
 */
async function generateRecipesWithAI(params) {
    try {
        console.log('Generating recipes with OpenAI...');

        const response = await fetch('/api/generate-recipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate recipes');
        }

        const data = await response.json();
        console.log(`AI generated ${data.recipes.length} recipes (${data.tokensUsed} tokens)`);

        return data.recipes;
    } catch (error) {
        console.error('Error with AI recipe generation:', error);
        console.log('Falling back to mock recipes...');
        // Fallback to mock recipes if AI fails
        return generateMockRecipes(params);
    }
}

/**
 * Recipe templates organized by cuisine and meal type
 */
const recipeTemplates = {
    italian: {
        dinner: [
            {
                title: "Creamy Garlic Pasta",
                baseIngredients: ["pasta", "garlic", "cream", "parmesan"],
                steps: [
                    "Boil pasta according to package directions",
                    "Sauté minced garlic in olive oil until fragrant",
                    "Add cream and simmer for 3 minutes",
                    "Toss cooked pasta with sauce and parmesan",
                    "Season with salt, pepper, and fresh herbs"
                ]
            },
            {
                title: "Tomato Basil Risotto",
                baseIngredients: ["rice", "tomatoes", "basil", "onion"],
                steps: [
                    "Sauté diced onion in butter until translucent",
                    "Add arborio rice and toast for 2 minutes",
                    "Gradually add warm broth, stirring constantly",
                    "Fold in diced tomatoes and fresh basil",
                    "Finish with butter and parmesan cheese"
                ]
            }
        ],
        breakfast: [
            {
                title: "Italian Frittata",
                baseIngredients: ["eggs", "cheese", "tomatoes", "basil"],
                steps: [
                    "Whisk eggs with salt and pepper",
                    "Heat olive oil in an oven-safe skillet",
                    "Add eggs, tomatoes, and cheese",
                    "Cook on stovetop for 5 minutes",
                    "Finish under broiler until golden"
                ]
            }
        ]
    },
    mexican: {
        dinner: [
            {
                title: "Quick Chicken Tacos",
                baseIngredients: ["chicken", "tortillas", "lime", "cilantro"],
                steps: [
                    "Season and cook chicken until done",
                    "Shred or dice the cooked chicken",
                    "Warm tortillas in a dry skillet",
                    "Fill tortillas with chicken and toppings",
                    "Garnish with lime and fresh cilantro"
                ]
            },
            {
                title: "Bean and Cheese Quesadillas",
                baseIngredients: ["tortillas", "beans", "cheese", "peppers"],
                steps: [
                    "Mash beans with spices",
                    "Spread beans on half of each tortilla",
                    "Top with cheese and peppers",
                    "Fold tortillas and cook until golden",
                    "Cut into wedges and serve with salsa"
                ]
            }
        ]
    },
    asian: {
        dinner: [
            {
                title: "Stir-Fried Vegetables",
                baseIngredients: ["vegetables", "soy sauce", "ginger", "garlic"],
                steps: [
                    "Cut all vegetables into uniform pieces",
                    "Heat oil in a wok or large skillet",
                    "Stir-fry garlic and ginger until fragrant",
                    "Add vegetables and cook until crisp-tender",
                    "Season with soy sauce and sesame oil"
                ]
            },
            {
                title: "Fried Rice",
                baseIngredients: ["rice", "eggs", "vegetables", "soy sauce"],
                steps: [
                    "Use day-old cooked rice for best results",
                    "Scramble eggs and set aside",
                    "Stir-fry vegetables in hot oil",
                    "Add rice and break up any clumps",
                    "Mix in eggs and season with soy sauce"
                ]
            }
        ],
        lunch: [
            {
                title: "Quick Noodle Bowl",
                baseIngredients: ["noodles", "vegetables", "broth", "soy sauce"],
                steps: [
                    "Cook noodles according to package directions",
                    "Heat broth with soy sauce and spices",
                    "Add sliced vegetables to broth",
                    "Drain noodles and add to bowls",
                    "Pour hot broth and vegetables over noodles"
                ]
            }
        ]
    },
    mediterranean: {
        dinner: [
            {
                title: "Mediterranean Bowl",
                baseIngredients: ["chickpeas", "cucumber", "tomatoes", "feta"],
                steps: [
                    "Rinse and drain chickpeas",
                    "Dice cucumber and tomatoes",
                    "Combine vegetables in a bowl",
                    "Top with crumbled feta cheese",
                    "Dress with olive oil and lemon juice"
                ]
            },
            {
                title: "Greek-Style Chicken",
                baseIngredients: ["chicken", "lemon", "oregano", "garlic"],
                steps: [
                    "Marinate chicken with lemon, garlic, and oregano",
                    "Let sit for at least 15 minutes",
                    "Heat oil in a skillet over medium-high heat",
                    "Cook chicken until golden and cooked through",
                    "Serve with lemon wedges"
                ]
            }
        ]
    },
    american: {
        dinner: [
            {
                title: "Classic Burger Bowl",
                baseIngredients: ["ground beef", "lettuce", "tomatoes", "cheese"],
                steps: [
                    "Season and cook ground beef until browned",
                    "Chop lettuce and dice tomatoes",
                    "Arrange lettuce in bowls as base",
                    "Top with cooked beef and cheese",
                    "Add your favorite burger toppings"
                ]
            }
        ],
        breakfast: [
            {
                title: "Breakfast Scramble",
                baseIngredients: ["eggs", "cheese", "potatoes", "peppers"],
                steps: [
                    "Dice potatoes and cook until crispy",
                    "Sauté peppers until softened",
                    "Scramble eggs in the same pan",
                    "Mix in cheese until melted",
                    "Season with salt and pepper"
                ]
            }
        ]
    },
    indian: {
        dinner: [
            {
                title: "Simple Curry",
                baseIngredients: ["vegetables", "curry powder", "coconut milk", "onion"],
                steps: [
                    "Sauté diced onion until golden",
                    "Add curry powder and cook until fragrant",
                    "Add chopped vegetables and stir well",
                    "Pour in coconut milk and simmer until vegetables are tender",
                    "Serve over rice with fresh cilantro"
                ]
            }
        ]
    }
};

/**
 * Generic fallback recipes for when no specific match is found
 */
const genericRecipes = [
    {
        title: "Simple Sauté",
        steps: [
            "Heat oil in a large pan over medium-high heat",
            "Add your ingredients, starting with aromatics",
            "Cook until everything is tender and well-combined",
            "Season to taste with salt, pepper, and herbs",
            "Serve hot and enjoy"
        ]
    },
    {
        title: "Quick One-Pan Meal",
        steps: [
            "Preheat your pan with a bit of oil",
            "Add ingredients in order of cooking time (longest first)",
            "Stir occasionally to prevent sticking",
            "Cook until everything is done to your liking",
            "Season and serve immediately"
        ]
    },
    {
        title: "Easy Mixed Dish",
        steps: [
            "Prepare all ingredients by washing and chopping",
            "Combine ingredients in a bowl or pan",
            "Mix well and season with your preferred spices",
            "Cook or serve as appropriate for ingredients",
            "Adjust seasoning to taste before serving"
        ]
    }
];

/**
 * Main recipe generation function - routes to AI or mock based on USE_AI_RECIPES
 * @param {Object} params - Recipe generation parameters
 * @returns {Promise<Array>} - Array of generated recipe objects
 */
async function generateRecipes(params) {
    if (USE_AI_RECIPES) {
        return await generateRecipesWithAI(params);
    } else {
        return generateMockRecipes(params);
    }
}

/**
 * Generate mock recipes based on user input (fallback/offline mode)
 * @param {Object} params - Recipe generation parameters
 * @returns {Array} - Array of generated recipe objects
 */
function generateMockRecipes(params) {
    const {
        prompt = '',
        ingredients = '',
        dietaryPreference = 'none',
        mealType = 'any',
        cuisineFocus = 'any',
        moodVibe = 'any'
    } = params;

    const ingredientList = ingredients
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i.length > 0);

    // If neither prompt nor ingredients provided, return empty array
    if (!prompt && ingredientList.length === 0) {
        return [];
    }

    // If only prompt is provided (no ingredients), generate generic recipes
    if (prompt && ingredientList.length === 0) {
        // Use generic ingredients for prompt-only requests
        const genericIngredients = ['chicken', 'olive oil', 'garlic', 'salt', 'pepper'];
        ingredientList.push(...genericIngredients);
    }

    const recipes = [];
    const numRecipes = Math.min(3, Math.max(2, Math.floor(ingredientList.length / 3)));

    // Try to get recipes from templates based on cuisine and meal type
    let templates = [];

    if (cuisineFocus !== 'any' && recipeTemplates[cuisineFocus]) {
        const cuisineTemplates = recipeTemplates[cuisineFocus];

        if (mealType !== 'any' && cuisineTemplates[mealType]) {
            templates = [...cuisineTemplates[mealType]];
        } else {
            // Get all templates from this cuisine
            templates = Object.values(cuisineTemplates).flat();
        }
    }

    // If no templates found, use all templates
    if (templates.length === 0) {
        Object.values(recipeTemplates).forEach(cuisine => {
            Object.values(cuisine).forEach(mealTemplates => {
                templates.push(...mealTemplates);
            });
        });
    }

    // Generate recipes
    for (let i = 0; i < numRecipes; i++) {
        let recipe;

        if (templates.length > 0 && i < templates.length) {
            const template = templates[i];
            recipe = {
                id: generateRecipeId(),
                title: template.title,
                ingredients: [...new Set([...ingredientList, ...template.baseIngredients])],
                steps: template.steps,
                dietaryPreference,
                mealType: mealType === 'any' ? 'dinner' : mealType,
                cuisineFocus: cuisineFocus === 'any' ? 'fusion' : cuisineFocus,
                moodVibe,
                createdAt: new Date().toISOString()
            };
        } else {
            // Fallback to generic recipes
            const genericTemplate = genericRecipes[i % genericRecipes.length];
            recipe = {
                id: generateRecipeId(),
                title: genericTemplate.title,
                ingredients: ingredientList,
                steps: genericTemplate.steps,
                dietaryPreference,
                mealType: mealType === 'any' ? 'dinner' : mealType,
                cuisineFocus: cuisineFocus === 'any' ? 'fusion' : cuisineFocus,
                moodVibe,
                createdAt: new Date().toISOString()
            };
        }

        // Apply dietary modifications to title if applicable
        if (dietaryPreference !== 'none') {
            recipe.title = `${capitalizeFirst(dietaryPreference)} ${recipe.title}`;
        }

        recipes.push(recipe);
    }

    return recipes;
}

/**
 * Capitalize first letter of a string
 * @param {string} str - Input string
 * @returns {string} - Capitalized string
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get a random recipe suggestion
 * @returns {Object} - Random recipe object
 */
function getRandomRecipe() {
    const allTemplates = [];

    Object.values(recipeTemplates).forEach(cuisine => {
        Object.values(cuisine).forEach(mealTemplates => {
            allTemplates.push(...mealTemplates);
        });
    });

    const template = allTemplates[Math.floor(Math.random() * allTemplates.length)];

    return {
        id: generateRecipeId(),
        title: template.title,
        ingredients: template.baseIngredients,
        steps: template.steps,
        dietaryPreference: 'none',
        mealType: 'dinner',
        cuisineFocus: 'fusion',
        moodVibe: 'any',
        createdAt: new Date().toISOString()
    };
}
