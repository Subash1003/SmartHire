import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/apiResponse.js';
import { isProduction } from '../config/env.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError || isProduction ? err.message : err.message || 'Internal server error';

  if (!isApiError) {
    console.error(err);
  }

  return sendError(res, {
    statusCode,
    message: isApiError ? message : 'Something went wrong. Please try again.',
    error: isProduction ? null : { message: err.message, stack: err.stack, details: err.details },
  });
}
