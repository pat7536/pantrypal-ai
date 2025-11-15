/**
 * Serverless function for personalized recipe recommendations using OpenAI
 * Endpoint: /api/get-recommendations
 */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userRecipes, preferences } = req.body;

        // Validate input
        if (!userRecipes || !Array.isArray(userRecipes)) {
            return res.status(400).json({ error: 'User recipes array is required' });
        }

        // Analyze user's cooking patterns
        const userProfile = analyzeUserProfile(userRecipes, preferences);

        // Build recommendation prompt
        const prompt = buildRecommendationPrompt(userProfile);

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
                        content: 'You are a personalized cooking assistant that provides tailored recipe recommendations based on user preferences and cooking history. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API error:', error);
            return res.status(response.status).json({
                error: 'Failed to generate recommendations',
                details: error.error?.message
            });
        }

        const data = await response.json();
        const recommendationsContent = data.choices[0].message.content;

        // Parse the JSON response
        const recommendations = JSON.parse(recommendationsContent);

        return res.status(200).json({
            success: true,
            recommendations: recommendations.recommendations || [],
            insights: recommendations.insights || {},
            tokensUsed: data.usage.total_tokens
        });

    } catch (error) {
        console.error('Error generating recommendations:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

/**
 * Analyze user's cooking patterns and preferences
 */
function analyzeUserProfile(recipes, preferences = {}) {
    const profile = {
        totalRecipes: recipes.length,
        cuisinePreferences: {},
        dietaryRestrictions: {},
        mealTypeDistribution: {},
        commonIngredients: {},
        recentRecipes: recipes.slice(-5).map(r => r.title)
    };

    recipes.forEach(recipe => {
        // Count cuisines
        if (recipe.cuisineFocus) {
            profile.cuisinePreferences[recipe.cuisineFocus] =
                (profile.cuisinePreferences[recipe.cuisineFocus] || 0) + 1;
        }

        // Count dietary preferences
        if (recipe.dietaryPreference && recipe.dietaryPreference !== 'none') {
            profile.dietaryRestrictions[recipe.dietaryPreference] =
                (profile.dietaryRestrictions[recipe.dietaryPreference] || 0) + 1;
        }

        // Count meal types
        if (recipe.mealType) {
            profile.mealTypeDistribution[recipe.mealType] =
                (profile.mealTypeDistribution[recipe.mealType] || 0) + 1;
        }

        // Count common ingredients
        if (recipe.ingredients) {
            recipe.ingredients.forEach(ing => {
                const ingredient = ing.toLowerCase().split(/[0-9]/)[0].trim();
                profile.commonIngredients[ingredient] =
                    (profile.commonIngredients[ingredient] || 0) + 1;
            });
        }
    });

    return { ...profile, ...preferences };
}

/**
 * Build recommendation prompt based on user profile
 */
function buildRecommendationPrompt(userProfile) {
    const topCuisines = Object.entries(userProfile.cuisinePreferences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cuisine]) => cuisine);

    const topIngredients = Object.entries(userProfile.commonIngredients)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ingredient]) => ingredient);

    return `Based on this user's cooking profile, provide 3 personalized recipe recommendations:

User Profile:
- Total recipes saved: ${userProfile.totalRecipes}
- Favorite cuisines: ${topCuisines.join(', ') || 'varied'}
- Common ingredients: ${topIngredients.join(', ')}
- Recent recipes: ${userProfile.recentRecipes.join(', ')}
- Dietary restrictions: ${Object.keys(userProfile.dietaryRestrictions).join(', ') || 'none'}

Provide recommendations that:
1. Match their cuisine preferences but introduce variety
2. Use some familiar ingredients but explore new combinations
3. Range from comfort food to adventurous dishes
4. Consider their dietary restrictions if any

Respond ONLY with valid JSON in this format:
{
  "recommendations": [
    {
      "title": "Recipe Name",
      "why": "Why this matches their profile",
      "cuisineType": "cuisine",
      "difficulty": "easy/medium/hard",
      "keyIngredients": ["ingredient1", "ingredient2"],
      "estimatedTime": "30 minutes"
    }
  ],
  "insights": {
    "cookingStyle": "Description of their cooking style",
    "suggestions": "Tips for expanding their repertoire"
  }
}`;
}
