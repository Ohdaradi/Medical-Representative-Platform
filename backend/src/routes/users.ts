import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { audit } from '../lib/audit.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;
    const filters: any[] = [];

    if (req.user!.role === 'manager') {
      filters.push({ role: 'rep' });
    }

    if (search) {
      filters.push({
        OR: [
          { email: { contains: String(search), mode: 'insensitive' } },
          { fullName: { contains: String(search), mode: 'insensitive' } }
        ]
      });
    }

    const users = await prisma.user.findMany({
      where: filters.length > 0 ? { AND: filters } : {},
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, updatedAt: true }
    });
    res.json(users);
  } catch (err: any) {
    console.error('[GET /api/users]', err);
    res.status(500).json({ message: err.message || 'Failed to load users' });
  }
});

router.post('/', requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullName: fullName || null, email, password: hashedPassword, role: role || 'rep' },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, updatedAt: true }
    });
    await audit('user_created', 'user', `Created user ${email}`, req.user!.email);
    res.json(user);
  } catch (err: any) {
    console.error('[POST /api/users]', err);
    res.status(500).json({ message: err.message || 'Failed to create user' });
  }
});

router.put('/:id', requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.id);
    const { fullName, email, password, role } = req.body;
    const data: Record<string, unknown> = { fullName, email, role };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, updatedAt: true }
    });
    await audit('user_updated', 'user', `Updated user ${email || userId}`, req.user!.email);
    res.json(user);
  } catch (err: any) {
    console.error('[PUT /api/users/:id]', err);
    res.status(500).json({ message: err.message || 'Failed to update user' });
  }
});

router.delete('/:id', requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.user.delete({ where: { id: userId } });
    if (user) await audit('user_deleted', 'user', `Deleted user ${user.email}`, req.user!.email);
    res.json({ message: 'User deleted' });
  } catch (err: any) {
    console.error('[DELETE /api/users/:id]', err);
    res.status(500).json({ message: err.message || 'Failed to delete user' });
  }
});

export default router;
