import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, paginate } from '../utils/paginate.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly } = req.validatedQuery;
  const pagination = parsePagination(req.validatedQuery);

  const filter = { recipientId: req.user._id };
  if (unreadOnly) filter.isRead = false;

  const result = await paginate(Notification, filter, pagination, { sort: { createdAt: -1 } });
  const unreadCount = await Notification.countDocuments({ recipientId: req.user._id, isRead: false });

  sendSuccess(res, {
    message: 'Notifications retrieved successfully',
    data: { notifications: result.data, unreadCount },
    pagination: result.pagination,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Notification not found');
  }

  const notification = await Notification.findOne({ _id: req.params.id, recipientId: req.user._id });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.isRead = true;
  await notification.save();

  sendSuccess(res, { message: 'Notification marked as read', data: { notification } });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipientId: req.user._id, isRead: false }, { isRead: true });
  sendSuccess(res, { message: 'All notifications marked as read' });
});
