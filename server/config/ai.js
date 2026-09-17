import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const isAiConfigured = Boolean(process.env.AI_API_KEY);
export const aiApiKey = process.env.AI_API_KEY;
export const AI_MODEL = 'claude-opus-5';
