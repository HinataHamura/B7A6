import type { Response } from 'express';

interface IMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

interface ISuccessResponse<T> {
  statusCode: number;
  success?: boolean;
  message: string;
  meta?: IMeta;
  data: T;
}

export const sendResponse = <T>(res: Response, payload: ISuccessResponse<T>) => {
  res.status(payload.statusCode).json({
    success: payload.success ?? true,
    message: payload.message,
    meta: payload.meta,
    data: payload.data,
  });
};
