import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { MessageService } from './message.service.js';

const getConversation = catchAsync(async (req, res) => {
  const result = await MessageService.getConversation(
    req.user!.id,
    req.params.userId as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Conversation retrieved successfully',
    data: result,
  });
});

const getConversationList = catchAsync(async (req, res) => {
  const result = await MessageService.getConversationList(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Conversations retrieved successfully',
    data: result,
  });
});

const getUnreadCount = catchAsync(async (req, res) => {
  const result = await MessageService.getUnreadCount(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Unread count retrieved successfully',
    data: result,
  });
});

export const MessageController = {
  getConversation,
  getConversationList,
  getUnreadCount,
};
