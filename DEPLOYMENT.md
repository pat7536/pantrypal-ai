# PantryPal AI Version 3.0 - Deployment Guide

## 🚀 Deploy to Vercel with OpenAI Integration

Version 3.0 adds OpenAI-powered features that require adding your API key to Vercel's environment variables.

---

## Step 1: Add OpenAI API Key to Vercel

### Via Vercel Dashboard (Recommended)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your **pantrypal-ai** project
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. Add a new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `your-openai-api-key-here` (paste your actual OpenAI API key)
   - **Environments**: Select **Production**, **Preview**, and **Development**
6. Click **Save**

**Note**: Your OpenAI API key should start with `sk-proj-` or `sk-`. Get it from https://platform.openai.com/api-keys

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add OPENAI_API_KEY
# When prompted, paste your API key
# Select: Production, Preview, Development (all three)
```

---

## Step 2: Redeploy Your App

After adding the environment variable, you need to trigger a new deployment:

### Option A: Auto-Deploy (Recommended)
- Since you just pushed to GitHub, Vercel will automatically deploy
- Wait 1-2 minutes for the deployment to complete
- Check https://pantrypal-ai-delta.vercel.app

### Option B: Manual Deploy via Dashboard
1. Go to Vercel dashboard → your project
2. Click **Deployments** tab
3. Find the latest deployment (should say "Building" or "Ready")
4. If needed, click the **...** menu → **Redeploy**

### Option C: Manual Deploy via CLI
```bash
cd pantrypal-ai
vercel --prod
```

---

## Step 3: Verify AI Features Work

Once deployed, test the AI features:

### 1. Test AI Recipe Generation
1. Go to https://pantrypal-ai-delta.vercel.app
2. Sign in with your Google account
3. Enter ingredients: `chicken, garlic, tomatoes, olive oil`
4. Click **Generate recipe**
5. You should see **real AI-generated recipes** with detailed instructions
6. Check browser console - should see: `"Generating recipes with OpenAI..."`
7. Should also see token count: `"AI generated X recipes (XXX tokens)"`

### 2. Test AI Vision (Pantry Scanning)
1. Click on the **Scan your pantry** section
2. Upload a photo of food items or your pantry
3. Click **Scan pantry**
4. You should see **real ingredients detected** by OpenAI Vision
5. Check browser console - should see: `"Scanning pantry with OpenAI Vision..."`
6. Should see: `"AI detected X ingredients (XXX tokens)"`

### 3. Check for Errors
Open browser console (F12) and look for:
- ✅ `"Firebase initialized successfully"`
- ✅ `"User signed in: your-email"`
- ✅ `"Generating recipes with OpenAI..."`
- ✅ `"AI generated X recipes (XXX tokens)"`
- ❌ If you see errors about "Failed to generate recipe", check environment variables

---

## Troubleshooting

### Error: "Failed to generate recipe"

**Check Environment Variables:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `OPENAI_API_KEY` exists and is set for all environments
3. Make sure there are no extra spaces or quotes in the value
4. Redeploy after making changes

**Check API Key:**
1. Go to https://platform.openai.com/api-keys
2. Verify your API key is active and not expired
3. Check you have available credits
4. You can create a new key if needed

**Check Console Logs:**
1. Open browser console (F12)
2. Look for specific error messages
3. Common issues:
   - "401 Unauthorized" = Invalid API key
   - "429 Too Many Requests" = Rate limit exceeded
   - "500 Internal Server Error" = Server-side issue

### Error: "Failed to scan pantry"

Same troubleshooting as above, plus:
- Ensure image is under 10MB
- Use JPG or PNG format
- Check that the image has actual food/ingredients visible

### Fallback to Mock Mode

If AI fails, the app automatically falls back to mock data:
- Console will show: `"Falling back to mock recipes..."`
- You'll still see recipes, but they won't be AI-generated
- This ensures the app never breaks completely

---

## API Usage & Costs

### Expected Token Usage

**Recipe Generation (GPT-4o):**
- ~500-1500 tokens per request
- Generates 2-3 recipes
- Cost: ~$0.015-$0.045 per request

**Pantry Scanning (GPT-4o with Vision):**
- ~200-800 tokens per image
- Detects ingredients from photos
- Cost: ~$0.006-$0.024 per image

**Estimated Monthly Costs:**
- 100 recipe generations: ~$1.50-$4.50
- 50 pantry scans: ~$0.30-$1.20
- Total: ~$2-$6/month for moderate use

### Monitor Usage

1. Go to https://platform.openai.com/usage
2. View your token consumption
3. Set up billing alerts if needed

---

## Security Best Practices

✅ **Good:**
- API key stored in Vercel environment variables
- Never committed to GitHub (.gitignore)
- Used only in serverless functions (not exposed to client)
- Proper error handling with fallbacks

❌ **Never Do:**
- Don't put API key in frontend JavaScript
- Don't commit .env.local to git
- Don't share your API key publicly
- Don't hardcode the key anywhere

---

## Advanced Configuration

### Change AI Model

Edit `/api/generate-recipe.js` and `/api/scan-pantry.js`:

```javascript
// Change this line:
model: 'gpt-4o',

// Options:
model: 'gpt-4o',           // Recommended (fast, good quality)
model: 'gpt-4',            // Slower, slightly better quality
model: 'gpt-3.5-turbo',    // Cheaper, lower quality
```

### Adjust Temperature (Creativity)

In `/api/generate-recipe.js`:

```javascript
temperature: 0.8,  // Current (creative)

// Options:
temperature: 0.5,  // More consistent
temperature: 1.0,  // Very creative
temperature: 0.3,  // Very predictable
```

### Toggle AI On/Off

In `recipes.js` and `pantry-vision.js`:

```javascript
// Turn off AI (use mock data)
const USE_AI_RECIPES = false;
const USE_AI_VISION = false;

// Turn on AI (use OpenAI)
const USE_AI_RECIPES = true;
const USE_AI_VISION = true;
```

---

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Monitor API usage and costs
3. ✅ Collect user feedback
4. 🔮 Implement personalized recommendations (already coded in `/api/get-recommendations.js`)
5. 🔮 Add recipe sharing features
6. 🔮 Implement meal planning
7. 🔮 Add nutritional information

---

## Support

- **GitHub Issues**: https://github.com/pat7536/pantrypal-ai/issues
- **Live App**: https://pantrypal-ai-delta.vercel.app
- **OpenAI Docs**: https://platform.openai.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

**🎉 Congratulations! You now have a fully AI-powered cooking app!** 🤖🍳

Your PantryPal AI v3.0 uses cutting-edge AI technology to generate personalized recipes and detect ingredients from photos. Enjoy the magic! ✨
