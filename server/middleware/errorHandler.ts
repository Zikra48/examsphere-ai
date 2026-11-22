import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundApiHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

export function centralErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_ERROR';
  const message =
    isAppError
      ? err.message
      : env.isProduction
        ? 'An unexpected server error occurred.'
        : err instanceof Error
          ? err.message
          : 'An unexpected server error occurred.';

  if (statusCode >= 500) {
    console.error('[ExamSphere API Error]', err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
