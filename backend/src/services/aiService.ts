import { GoogleGenerativeAI } from '@google/generative-ai';

// This function connects to Gemini and returns a ready-to-use model
export async function getGeminiModel(): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // prefer env override but keep fallback empty for discovery
  const envModel = process.env.GEMINI_MODEL_NAME?.trim();
  const triedNames: string[] = [];

  // helper to try creating a model instance
  const tryGetModel = async (name?: string) => {
    if (!name) return null;
    triedNames.push(name);
    try {
      console.log(`[AI] Attempting Gemini model: ${name}`);
      return genAI.getGenerativeModel({ model: name });
    } catch (err) {
      console.warn(`[AI] Model "${name}" not usable:`, (err as Error).message || err);
      return null;
    }
  };

  // 1) try env model first (if set)
  if (envModel) {
    const model = await tryGetModel(envModel);
    if (model) return model;
  }

  // 2) attempt to discover a chat-capable model via listModels and try candidates
  try {
    // Try SDK method first; if it doesn't exist (older/newer sdk shapes), fallback to HTTP GET.
    let listRes: any;
    if (typeof (genAI as any).listModels === 'function') {
      listRes = await (genAI as any).listModels();
    } else {
      // fallback: call REST ListModels endpoint using API key
      try {
        const resp = await (globalThis as any).fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
        );
        if (!resp.ok) {
          throw new Error(`ListModels HTTP error ${resp.status}`);
        }
        listRes = await resp.json();
      } catch (httpErr) {
        console.warn('[AI] listModels HTTP fallback failed:', (httpErr as Error).message || httpErr);
        throw httpErr;
      }
    }
    // normalize possible shapes
    const modelsList = listRes?.models || listRes?.model || listRes || [];
    const candidates: string[] = [];

    for (const m of modelsList) {
      const n = (m?.name || m?.id || m?.model || m || '').toString();
      // prefer model names that hint chat capability, avoid embeddings/text-only labels
      if (/chat|bison|gemini/i.test(n) && !/embed|embedding|text-embedding/i.test(n)) {
        candidates.push(n);
      }
    }

    // try common known chat name patterns as additional fallbacks
    candidates.push('chat-bison@001', 'chat-bison', 'models/chat-bison-001', 'gemini-chat-1.0', 'gemini-1.5-chat');

    // try candidates in order (unique)
    for (const cand of Array.from(new Set(candidates)).filter(Boolean)) {
      const model = await tryGetModel(cand);
      if (model) return model;
    }
  } catch (err) {
    console.warn('[AI] listModels failed or returned unexpected shape:', (err as Error).message || err);
  }

  throw new Error(`Unable to initialize a Gemini model. Tried: ${triedNames.join(', ')}`);
}