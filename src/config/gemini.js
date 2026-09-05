/**
 * Gemini AI client setup.
 * Wraps @google/generative-ai and exposes a simple generateResponse() function.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./env');

let genAI = null;
let model = null;

/**
 * Initialize the Gemini client (called at startup).
 * Separated from module-level so we can handle missing API key gracefully.
 */
function initialize() {
  if (!config.gemini.apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not set — AI search will return fallback responses');
    return;
  }
  genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
  console.log('✅  Gemini AI client initialized');
}

/**
 * Generate an AI response for a search query.
 * @param {string} query - The user's search query.
 * @returns {Promise<string>} The AI-generated response text.
 */
async function generateResponse(query) {
  if (!model) {
    return `[AI unavailable] No Gemini API key configured. Query: "${query}"`;
  }

  const prompt = `You are a smart search assistant. Answer the following query concisely and informatively. 
Provide a clear, well-structured response.

Query: ${query}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (err) {
    console.error('⚠️  Gemini API error:', err.message);
    // If the API key is invalid, disable the model so future calls use fallback
    if (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid')) {
      console.warn('⚠️  Disabling Gemini due to invalid API key — using fallback mode');
      model = null;
    }
    return `[AI unavailable] Gemini API error. Query: "${query}"`;
  }
}

module.exports = { initialize, generateResponse };
