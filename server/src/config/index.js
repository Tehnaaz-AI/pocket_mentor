import dotenv from 'dotenv';
dotenv.config();

// Collect all possible keys from comma-separated lists or fallback env vars
const rawKeys = [
  ...(process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : []),
  process.env.GEMINI_API_KEY,
  process.env.AI_API_KEY,
  process.env.GEMINI_FALLBACK_KEY_1,
  process.env.GEMINI_FALLBACK_KEY_2,
  process.env.GEMINI_FALLBACK_KEY_3,
  process.env.GEMINI_FALLBACK_KEY_4,
]
  .map(k => k?.trim())
  .filter(Boolean);

// Deduplicate keys
const geminiApiKeys = Array.from(new Set(rawKeys));

// Groq keys — same comma-separated-or-single convention as Gemini above.
const groqRawKeys = [
  ...(process.env.GROQ_API_KEYS ? process.env.GROQ_API_KEYS.split(',') : []),
  process.env.GROQ_API_KEY,
]
  .map(k => k?.trim())
  .filter(Boolean);

const groqApiKeys = Array.from(new Set(groqRawKeys));

export const config = {
  port: process.env.PORT || 5001,

  /**
   * Which AI provider serves generation. 'groq' | 'gemini'.
   * Both implementations stay in aiService.js; this only selects which one
   * callAI() dispatches to, so switching providers is an env change.
   */
  aiProvider: (process.env.AI_PROVIDER || 'groq').trim().toLowerCase(),
  jwtSecret: process.env.JWT_SECRET || 'pocket-mentor-super-secret-key-2025',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  geminiApiKey: geminiApiKeys[0] || '',
  geminiApiKeys, // Array of fallback keys
  geminiModels: (process.env.GEMINI_MODELS || 'gemini-3.6-flash,gemini-flash-latest').split(',').map(m => m.trim()),
  // Groq (OpenAI-compatible chat completions)
  groqApiKey: groqApiKeys[0] || '',
  groqApiKeys,
  groqModels: (process.env.GROQ_MODELS || 'openai/gpt-oss-120b,openai/gpt-oss-20b')
    .split(',').map(m => m.trim()).filter(Boolean),
  groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',

  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pocketmentor'
};
