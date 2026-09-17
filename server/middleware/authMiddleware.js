import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired session');
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid or expired session');
  }

  req.user = user;
  next();
});

// Populates req.user when a valid session cookie is present, but never
// blocks the request otherwise. Used by public-but-personalized routes
// (e.g. job listing, where staff see more than anonymous visitors).
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Ignore invalid/expired tokens on optional-auth routes.
  }

  next();
});
