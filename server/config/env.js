import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const REQUIRED_VARS = ['MONGO_URI', 'CLIENT_URL'];

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL,
};

export const isProduction = env.nodeEnv === 'production';
