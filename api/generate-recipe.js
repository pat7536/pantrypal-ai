/**
 * Serverless function for AI-powered recipe generation using OpenAI GPT-4
 * Endpoint: /api/generate-recipe
 */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { ingredients, dietaryPreference, mealType, cuisineFocus, moodVibe } = req.body;

        // Validate input
        if (!ingredients || ingredients.trim().length === 0) {
            return res.status(400).json({ error: 'Ingredients are required' });
        }

        // Construct the prompt for OpenAI
        const prompt = buildRecipePrompt({
            ingredients,
            dietaryPreference,
            mealType,
            cuisineFocus,
            moodVibe
        });

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert chef and recipe creator. Generate creative, delicious, and practical recipes based on the user\'s ingredients and preferences. Always respond with valid JSON only, no additional text.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API error:', error);
            return res.status(response.status).json({
                error: 'Failed to generate recipe',
                details: error.error?.message
            });
        }

        const data = await response.json();
        const recipeContent = data.choices[0].message.content;

        // Parse the JSON response
        const recipes = JSON.parse(recipeContent);

        // Add metadata
        const enrichedRecipes = recipes.recipes.map(recipe => ({
            ...recipe,
            id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            dietaryPreference,
            mealType,
            cuisineFocus,
            moodVibe,
            aiGenerated: true
        }));

        return res.status(200).json({
            success: true,
            recipes: enrichedRecipes,
            tokensUsed: data.usage.total_tokens
        });

    } catch (error) {
        console.error('Error generating recipe:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

/**
 * Build a detailed prompt for recipe generation
 */
function buildRecipePrompt({ ingredients, dietaryPreference, mealType, cuisineFocus, moodVibe }) {
    let prompt = `Generate 2-3 creative and delicious recipes using these ingredients: ${ingredients}.

Requirements:
- Meal type: ${mealType || 'any'}
- Cuisine style: ${cuisineFocus || 'any'}
- Dietary preference: ${dietaryPreference || 'none'}
- Mood/vibe: ${moodVibe || 'any'}

For each recipe, provide:
1. A creative and appetizing title
2. Complete list of ingredients with measurements
3. Step-by-step cooking instructions
4. Estimated cooking time
5. Serving size
6. Difficulty level (easy, medium, hard)

Respond ONLY with valid JSON in this exact format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "cookingTime": "30 minutes",
      "servings": "4 servings",
      "difficulty": "easy",
      "ingredients": ["2 cups chicken, diced", "1 tbsp olive oil", ...],
      "steps": ["Step 1 description", "Step 2 description", ...],
      "tips": "Optional cooking tip"
    }
  ]
}`;

    return prompt;
}
