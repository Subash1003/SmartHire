import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const REQUIRED_VARS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 7,
};
