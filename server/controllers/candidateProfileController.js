import CandidateProfile from '../models/CandidateProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { uploadResume } from '../services/resumeService.js';

async function getOrCreateProfile(userId) {
  let profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    profile = await CandidateProfile.create({ userId });
  }
  return profile;
}

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  sendSuccess(res, { message: 'Profile retrieved successfully', data: { profile } });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await CandidateProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: req.body },
    { returnDocument: 'after', upsert: true, runValidators: true }
  );

  sendSuccess(res, { message: 'Profile updated successfully', data: { profile } });
});

export const uploadMyResume = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);

  const resume = await uploadResume(req.file, {
    userId: req.user._id,
    previousPublicId: profile.resume?.publicId,
  });

  profile.resume = resume;
  await profile.save();

  sendSuccess(res, { message: 'Resume uploaded successfully', data: { profile } });
});
