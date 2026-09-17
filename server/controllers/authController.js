import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import RefreshToken from '../models/RefreshToken.js';
import PasswordReset from '../models/PasswordReset.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { signAccessToken } from '../utils/jwt.js';
import { generateRawToken, hashToken } from '../utils/tokens.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import { jwtConfig } from '../config/jwt.js';
import { isProduction } from '../config/env.js';

const SALT_ROUNDS = 12;

function toPublicUser(user) {
  return {
    id: user._id,
    organizationId: user.organizationId,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
  };
}

async function issueSession(res, user, req) {
  const accessToken = signAccessToken(user);
  const rawRefreshToken = generateRawToken();
  const csrfToken = crypto.randomBytes(24).toString('hex');

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt: new Date(Date.now() + jwtConfig.refreshExpiresInDays * 24 * 60 * 60 * 1000),
    createdByIp: req.ip,
  });

  setAuthCookies(res, { accessToken, refreshToken: rawRefreshToken, csrfToken });
}

export const register = asyncHandler(async (req, res) => {
  const { organizationId, name, email, password } = req.body;

  if (!mongoose.isValidObjectId(organizationId)) {
    throw new ApiError(400, 'Invalid organization');
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new ApiError(400, 'Invalid organization');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    organizationId,
    name,
    email,
    passwordHash,
    role: 'candidate',
  });

  const rawToken = generateRawToken();
  await EmailVerificationToken.create({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  if (!isProduction) {
    console.log(`[dev] Email verification link for ${user.email}: /verify-email?token=${rawToken}`);
  }

  await issueSession(res, user, req);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: { user: toPublicUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  await issueSession(res, user, req);

  sendSuccess(res, {
    message: 'Login successful',
    data: { user: toPublicUser(user) },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    clearAuthCookies(res);
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const user = await User.findById(stored.userId);
  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const newRawToken = generateRawToken();
  stored.revokedAt = new Date();
  stored.replacedByTokenHash = hashToken(newRawToken);
  await stored.save();

  const accessToken = signAccessToken(user);
  const csrfToken = crypto.randomBytes(24).toString('hex');

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(newRawToken),
    expiresAt: new Date(Date.now() + jwtConfig.refreshExpiresInDays * 24 * 60 * 60 * 1000),
    createdByIp: req.ip,
  });

  setAuthCookies(res, { accessToken, refreshToken: newRawToken, csrfToken });

  sendSuccess(res, { message: 'Session refreshed', data: { user: toPublicUser(user) } });
});

export const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (rawToken) {
    await RefreshToken.updateOne(
      { tokenHash: hashToken(rawToken), revokedAt: null },
      { revokedAt: new Date() }
    );
  }

  clearAuthCookies(res);
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Current user retrieved', data: { user: toPublicUser(req.user) } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const rawToken = generateRawToken();
    await PasswordReset.create({
      userId: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    if (!isProduction) {
      console.log(`[dev] Password reset link for ${user.email}: /reset-password?token=${rawToken}`);
    }
  }

  // Always respond the same way, whether or not the email exists, to avoid
  // leaking which addresses are registered.
  sendSuccess(res, {
    message: 'If an account with that email exists, a password reset link has been sent',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = hashToken(token);

  const resetRecord = await PasswordReset.findOne({ tokenHash });
  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const user = await User.findById(resetRecord.userId);
  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await user.save();

  resetRecord.used = true;
  await resetRecord.save();

  await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });

  sendSuccess(res, { message: 'Password reset successful. Please log in with your new password.' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const tokenHash = hashToken(token);

  const record = await EmailVerificationToken.findOne({ tokenHash });
  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  await User.updateOne({ _id: record.userId }, { isEmailVerified: true });
  await EmailVerificationToken.deleteOne({ _id: record._id });

  sendSuccess(res, { message: 'Email verified successfully' });
});
