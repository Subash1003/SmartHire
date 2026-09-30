import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Same "never crash the whole API for a missing third-party credential"
// pattern as config/cloudinary.js and config/ai.js. Without SMTP settings
// the app still boots — emailService just logs instead of sending.
export const isEmailConfigured = Boolean(
  process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
);

export const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
};
