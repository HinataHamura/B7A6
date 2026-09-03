import type { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma.js';

interface ISendMessagePayload {
  receiverId: string;
  content: string;
}

const MAX_MESSAGE_LENGTH = 2000;

const isValidSendMessagePayload = (payload: unknown): payload is ISendMessagePayload => {
  if (!payload || typeof payload !== 'object') return false;
  const { receiverId, content } = payload as Record<string, unknown>;
  return (
    typeof receiverId === 'string' &&
    receiverId.length > 0 &&
    typeof content === 'string' &&
    content.trim().length > 0 &&
    content.length <= MAX_MESSAGE_LENGTH
  );
};

export const registerChatHandlers = (io: Server, socket: Socket) => {
  socket.on('sendMessage', async (payload: unknown) => {
    try {
      const senderId = socket.data.userId as string;

      if (!isValidSendMessagePayload(payload)) {
        socket.emit('errorMessage', { message: 'Invalid message payload' });
        return;
      }

      if (payload.receiverId === senderId) {
        socket.emit('errorMessage', { message: 'Cannot send a message to yourself' });
        return;
      }

      const receiverExists = await prisma.user.findUnique({
        where: { id: payload.receiverId },
        select: { id: true },
      });

      if (!receiverExists) {
        socket.emit('errorMessage', { message: 'Receiver does not exist' });
        return;
      }

      const message = await prisma.message.create({
        data: {
          senderId,
          receiverId: payload.receiverId,
          content: payload.content.trim(),
        },
      });

      io.to(payload.receiverId).emit('newMessage', message);
      io.to(senderId).emit('newMessage', message);
    } catch (error) {
      console.error('sendMessage handler error:', error);
      socket.emit('errorMessage', { message: 'Failed to send message' });
    }
  });

  socket.on('markAsRead', async (payload: unknown) => {
    try {
      const receiverId = socket.data.userId as string;
      const senderId =
        payload && typeof payload === 'object' ? (payload as { senderId?: unknown }).senderId : undefined;

      if (typeof senderId !== 'string' || senderId.length === 0) {
        socket.emit('errorMessage', { message: 'Invalid payload' });
        return;
      }

      await prisma.message.updateMany({
        where: { senderId, receiverId, isRead: false },
        data: { isRead: true },
      });

      io.to(senderId).emit('messagesRead', { readBy: receiverId });
    } catch (error) {
      console.error('markAsRead handler error:', error);
      socket.emit('errorMessage', { message: 'Failed to mark messages as read' });
    }
  });
};
