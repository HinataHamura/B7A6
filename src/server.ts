import type { Server } from 'node:http';
import { createServer } from 'node:http';
import app from './app.js';
import { config } from './app/config/index.js';
import { prisma } from './app/lib/prisma.js';
import { initSocket } from './app/socket/index.js';

let server: Server;

async function main() {
  await prisma.$connect();
  console.log('Database connected successfully');

  const httpServer = createServer(app);
  initSocket(httpServer);

  server = httpServer.listen(config.port, () => {
    console.log(`Roomly server is listening on port ${config.port}`);
  });
}

main();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection detected, shutting down...', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception detected, shutting down...', err);
  process.exit(1);
});
