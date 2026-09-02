import { prisma } from '../../lib/prisma.js';

const getConversation = async (userId: string, otherUserId: string) => {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });
};

const getConversationList = async (userId: string) => {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, email: true } },
      receiver: { select: { id: true, email: true } },
    },
  });

  const conversationMap = new Map<string, (typeof messages)[number]>();

  for (const message of messages) {
    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
    if (!conversationMap.has(otherUserId)) {
      conversationMap.set(otherUserId, message);
    }
  }

  return Array.from(conversationMap.values());
};

const getUnreadCount = async (userId: string) => {
  const count = await prisma.message.count({
    where: { receiverId: userId, isRead: false },
  });

  return { unreadCount: count };
};

export const MessageService = {
  getConversation,
  getConversationList,
  getUnreadCount,
};
