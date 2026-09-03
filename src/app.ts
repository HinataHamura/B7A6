import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './app/config/index.js';
import { globalErrorHandler } from './app/middleware/globalErrorHandler.js';
import { notFound } from './app/middleware/notFound.js';
import { globalRateLimiter } from './app/middleware/rateLimiter.js';
import { routes } from './app/routes/index.js';
import { prisma } from './app/lib/prisma.js';

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: [config.clientUrl],
    credentials: true,
  }),
);
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(globalRateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Roomly API is running',
    data: null,
  });
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'Service healthy',
      data: { database: 'connected', uptime: process.uptime() },
    });
  } catch {
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      errors: [{ path: 'database', message: 'Database connection failed' }],
    });
  }
});

app.use('/api/v1', routes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
