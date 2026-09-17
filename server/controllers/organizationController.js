import Organization from '../models/Organization.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getMyOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.user.organizationId);
  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  sendSuccess(res, { message: 'Organization retrieved successfully', data: { organization } });
});

export const updateMyOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findByIdAndUpdate(req.user.organizationId, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  sendSuccess(res, { message: 'Organization updated successfully', data: { organization } });
});
