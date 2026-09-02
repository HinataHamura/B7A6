import type { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma.js';

interface ISendMessagePayload {
  receiverId: string;
  content: string;
}

export const registerChatHandlers = (io: Server, socket: Socket) => {
  socket.on('sendMessage', async (payload: ISendMessagePayload) => {
    const senderId = socket.data.userId as string;

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: payload.receiverId,
        content: payload.content,
      },
    });

    io.to(payload.receiverId).emit('newMessage', message);
    io.to(senderId).emit('newMessage', message);
  });

  socket.on('markAsRead', async ({ senderId }: { senderId: string }) => {
    const receiverId = socket.data.userId as string;
    await prisma.message.updateMany({
      where: { senderId, receiverId, isRead: false },
      data: { isRead: true },
    });
    io.to(senderId).emit('messagesRead', { readBy: receiverId });
  });
};
