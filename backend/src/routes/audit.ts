import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/', async (req, res) => {
  const { search, limit } = req.query;
  const take = limit ? Number(limit) : 100;

  const filters: any[] = [];
  if (search) {
    filters.push({
      OR: [
        { action: { contains: String(search), mode: 'insensitive' } },
        { entity: { contains: String(search), mode: 'insensitive' } },
        { details: { contains: String(search), mode: 'insensitive' } },
        { userEmail: { contains: String(search), mode: 'insensitive' } }
      ]
    });
  }

  const logs = await prisma.auditLog.findMany({
    where: filters.length > 0 ? { AND: filters } : {},
    orderBy: { createdAt: 'desc' },
    take
  });

  res.json(logs);
});

export default router;
