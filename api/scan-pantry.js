/**
 * Serverless function for AI-powered pantry scanning using OpenAI Vision (GPT-4V)
 * Endpoint: /api/scan-pantry
 */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageBase64 } = req.body;

        // Validate input
        if (!imageBase64) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        // Call OpenAI Vision API
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
                        content: 'You are an expert at identifying food items and ingredients from images. Analyze pantry photos and list all visible ingredients. Be specific and accurate. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this pantry/kitchen image and identify all visible food items and ingredients. For each item, provide the name and your confidence level (0.0 to 1.0). Respond ONLY with valid JSON in this format: {"ingredients": [{"name": "item name", "confidence": 0.95}]}'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageBase64.startsWith('data:')
                                        ? imageBase64
                                        : `data:image/jpeg;base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI Vision API error:', error);
            return res.status(response.status).json({
                error: 'Failed to analyze image',
                details: error.error?.message
            });
        }

        const data = await response.json();
        const analysisContent = data.choices[0].message.content;

        // Parse the JSON response
        const analysis = JSON.parse(analysisContent);

        return res.status(200).json({
            success: true,
            ingredients: analysis.ingredients || [],
            tokensUsed: data.usage.total_tokens,
            processedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error scanning pantry:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
