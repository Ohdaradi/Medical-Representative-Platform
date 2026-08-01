import type { NextFunction, Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);
  if (error instanceof PrismaClientKnownRequestError) {
    const e = error as PrismaClientKnownRequestError;
    if (e.code === 'P2002') return res.status(409).json({ message: 'A record with this value already exists' });
    if (e.code === 'P2003') return res.status(409).json({ message: 'This record is still referenced by other data' });
    if (e.code === 'P2025') return res.status(404).json({ message: 'Record not found' });
  }
  return res.status(500).json({ message: 'An unexpected server error occurred' });
}
