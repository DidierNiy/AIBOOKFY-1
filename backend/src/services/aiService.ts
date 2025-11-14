import { GoogleGenerativeAI } from '@google/generative-ai';

// This function connects to Gemini and returns a ready-to-use model
export function getGeminiModel() {
  // Use your Gemini API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use gemini-pro which is the stable, universally available model
  const envModel = process.env.GEMINI_MODEL_NAME?.trim();
  let modelName = envModel || 'gemini-pro';

  console.log(`[AI] Using Gemini model: ${modelName}`);

  return genAI.getGenerativeModel({ model: modelName });
}
