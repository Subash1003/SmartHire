import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

function limitHandler(req, res) {
  sendError(res, { statusCode: 429, message: 'Too many requests. Please try again later.' });
}

const isTestEnv = process.env.NODE_ENV === 'test';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
  skip: () => isTestEnv,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
  skip: () => isTestEnv,
});
