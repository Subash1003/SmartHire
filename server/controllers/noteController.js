import Note from '../models/Note.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { findOrgScopedApplication } from './applicationController.js';

export const listNotes = asyncHandler(async (req, res) => {
  const application = await findOrgScopedApplication(req);

  const notes = await Note.find({ applicationId: application._id })
    .sort({ createdAt: -1 })
    .populate('authorId', 'name');

  sendSuccess(res, { message: 'Notes retrieved successfully', data: { notes } });
});

export const createNote = asyncHandler(async (req, res) => {
  const application = await findOrgScopedApplication(req);

  const note = await Note.create({
    organizationId: application.organizationId,
    applicationId: application._id,
    authorId: req.user._id,
    content: req.body.content,
  });

  const populated = await note.populate('authorId', 'name');

  sendSuccess(res, { statusCode: 201, message: 'Note added successfully', data: { note: populated } });
});
