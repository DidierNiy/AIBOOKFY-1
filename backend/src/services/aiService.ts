import { GoogleGenerativeAI } from '@google/generative-ai';

// This function connects to Gemini and returns a ready-to-use model
export async function getGeminiModel(opts?: { mode?: 'chat' | 'generate' }): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Prefer env override but fallback to sensible candidates
  const envModel = process.env.GEMINI_MODEL_NAME?.trim();
  const triedNames: string[] = [];
  const mode = opts?.mode || 'chat';
  // mode-specific candidate lists
  // Prefer the user's requested model if available; otherwise try sensible fallbacks.
  const preferredModel = 'gemini-2.5-flash';
  const candidateDefaults = (mode === 'generate'
    ? [
        envModel,
        // prefer the requested gemini model first for generate-capable mode
        preferredModel,
        // generate/content-capable candidates
        'models/text-bison-001',
        'text-bison@001',
        'models/text-bison-002'
      ]
    : [
        envModel,
        // prefer the requested gemini model first for chat-capable mode
        preferredModel,
        // chat-capable candidates
        'models/chat-bison-001',
        'chat-bison@001',
        'gemini-1.5-chat',
        'gemini-1.5-pro'
      ]).filter(Boolean);

  // helper to try creating a usable model wrapper
  const tryInit = async (name?: string) => {
    if (!name) return null;
    if (triedNames.includes(name)) return null;
    triedNames.push(name);

    try {
      console.log(`[AI] Attempting Gemini model: ${name}`);
      // Try to get SDK model instance (may or may not expose startChat/generateContent)
      const sdkModel = genAI.getGenerativeModel({ model: name });

      // Build a wrapper that ensures both generateContent and startChat exist.
      // Only accept model if it likely supports the requested mode.
      const hasGenerate = sdkModel && typeof (sdkModel as any).generateContent === 'function';
      const hasStartChat = sdkModel && typeof (sdkModel as any).startChat === 'function';
      if (mode === 'generate' && !hasGenerate) {
        // skip returning wrapper for models that don't expose generateContent via SDK
        return null;
      }
      if (mode === 'chat' && !hasStartChat) {
        // skip models that don't expose startChat via SDK (prefer true chat-capable models)
        return null;
      }

      const wrapper = {
        modelName: name,
        // unify generateContent: accept either string or request-like object
        generateContent: async (req: any) => {
          // If the sdkModel itself exposes generateContent, prefer it
          if (sdkModel && typeof (sdkModel as any).generateContent === 'function') {
            return (sdkModel as any).generateContent(req);
          }
          // Otherwise call the client's top-level generateContent with the model name
          if (typeof req === 'string') {
            return await (genAI as any).generateContent({
              model: name,
              // minimal shape: sdk may expect input/prompt shape; pass text under "prompt" if supported
              prompt: { text: req }
            });
          }
          // assume req is already a request object
          return await (genAI as any).generateContent({ model: name, ...req });
        },
        // unify startChat: prefer sdkModel.startChat, else emulate via generateContent
        startChat: (opts?: any) => {
          if (sdkModel && typeof (sdkModel as any).startChat === 'function') {
            return (sdkModel as any).startChat(opts);
          }
          // Emulated chat: provide sendMessage that maps to generateContent
          return {
            sendMessage: async (message: string) => {
              // use generateContent and return an object shaped like the SDK expected result
              const res = await (genAI as any).generateContent({
                model: name,
                prompt: { text: message }
              }).catch((e: any) => ({ error: e }));
              // Try to normalize response.text() usage from ChatService
              const textFromRes =
                // SDK may return output items
                (res?.output?.[0]?.content?.map((c: any) => c.text).join('') ||
                  // fallback to a "candidates" style
                  (res?.candidates && res.candidates[0]?.output?.[0]?.content?.map((c: any) => c.text).join('')) ||
                  // fallback to raw text field
                  res?.text ||
                  '');
              return {
                response: Promise.resolve({
                  text: () => (textFromRes || '').toString()
                })
              };
            }
          };
        }
      };

      return wrapper;
    } catch (err) {
      console.warn(`[AI] Model "${name}" not usable:`, (err as Error).message || err);
      return null;
    }
  };

  // try candidates in order
  for (const cand of Array.from(new Set(candidateDefaults)).filter(Boolean)) {
    const model = await tryInit(cand);
    if (model) return model;
  }

  // As a last attempt, try listing models (SDK or HTTP) and try a few from the list
  try {
    let listRes: any;
    if (typeof (genAI as any).listModels === 'function') {
      listRes = await (genAI as any).listModels();
    } else {
      const resp = await (globalThis as any).fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (resp.ok) listRes = await resp.json();
    }
    const modelsList = listRes?.models || listRes?.model || listRes || [];
    const discovered: string[] = [];
    for (const m of modelsList) {
      const n = (m?.name || m?.id || m?.model || m || '').toString();
      if (!n || triedNames.includes(n)) continue;
      if (mode === 'generate' && /text|bison|generate|gpt/i.test(n)) discovered.push(n);
      if (mode === 'chat' && /chat|bison|gemini/i.test(n)) discovered.push(n);
    }
    for (const cand of discovered) {
      const model = await tryInit(cand);
      if (model) return model;
    }
  } catch (err) {
    console.warn('[AI] listModels failed or returned unexpected shape:', (err as Error).message || err);
  }

  throw new Error(`Unable to initialize a Gemini model. Tried: ${triedNames.join(', ')}`);
}
