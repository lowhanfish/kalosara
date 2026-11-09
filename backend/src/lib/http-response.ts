import type { Request, Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  req: Request,
  data: T,
  status = 200,
): void {
  res.status(status).json({
    success: true,
    data,
    requestId: req.id,
  });
}
