import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import { globalErrorHandler } from './app/middleware/globalErrorHandler.js';
import { notFound } from './app/middleware/notFound.js';
import { routes } from './app/routes/index.js';
import { config } from './app/config/index.js';

const app: Application = express();

app.use(
  cors({
    origin: [config.clientUrl],
    credentials: true,
  }),
);
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

app.use('/api/v1', routes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
