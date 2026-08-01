import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'A record with this value already exists' });
    if (error.code === 'P2003') return res.status(409).json({ message: 'This record is still referenced by other data' });
    if (error.code === 'P2025') return res.status(404).json({ message: 'Record not found' });
  }
  return res.status(500).json({ message: 'An unexpected server error occurred' });
}
