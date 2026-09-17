import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, paginate } from '../utils/paginate.js';
import { assertSameOrganization } from '../middleware/tenantMiddleware.js';

const SALT_ROUNDS = 12;

async function findOrgScopedUser(req, id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'User not found');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  assertSameOrganization(req, user.organizationId);
  return user;
}

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.validatedQuery;
  const pagination = parsePagination(req.validatedQuery);

  const filter = { organizationId: req.user.organizationId };
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const result = await paginate(User, filter, pagination);

  sendSuccess(res, {
    message: 'Users retrieved successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const created = await User.create({
    organizationId: req.user.organizationId,
    name,
    email,
    passwordHash,
    role,
    isEmailVerified: true,
  });

  const user = await User.findById(created._id);

  sendSuccess(res, {
    statusCode: 201,
    message: 'User created successfully',
    data: { user },
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await findOrgScopedUser(req, req.params.id);
  sendSuccess(res, { message: 'User retrieved successfully', data: { user } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await findOrgScopedUser(req, req.params.id);

  if (req.body.email && req.body.email !== user.email) {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }
  }

  Object.assign(user, req.body);
  await user.save();

  sendSuccess(res, { message: 'User updated successfully', data: { user } });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await findOrgScopedUser(req, req.params.id);

  if (user._id.equals(req.user._id) && req.body.isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  user.isActive = req.body.isActive;
  await user.save();

  sendSuccess(res, { message: 'User status updated successfully', data: { user } });
});
