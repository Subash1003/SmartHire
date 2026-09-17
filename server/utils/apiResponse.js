export function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, pagination } = {}) {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

export function sendError(res, { statusCode = 500, message = 'Something went wrong', error = null } = {}) {
  return res.status(statusCode).json({ success: false, message, error });
}
