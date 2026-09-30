import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Groq's API is OpenAI-compatible, so no SDK dependency is needed — the
// service calls it directly with fetch.
export const isAiConfigured = Boolean(process.env.GROQ_API_KEY);
export const aiApiKey = process.env.GROQ_API_KEY;
export const AI_MODEL = 'openai/gpt-oss-120b';
