import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import status from 'http-status';
import { config } from '../config/index.js';
import { verifyToken } from '../utils/jwt.js';
import { registerChatHandlers } from './chat.socket.js';

export let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = verifyToken(token, config.jwt.accessSecret);
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.data.userId);
    registerChatHandlers(io, socket);

    socket.on('disconnect', () => {
      socket.leave(socket.data.userId);
    });
  });

  return io;
};
