import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { audit } from '../lib/audit.js';

const router = express.Router();
router.use(authenticateToken);

// GET all territories with assignment counts
router.get('/', async (_req, res) => {
  const territories = await prisma.territory.findMany({
    orderBy: { name: 'asc' },
    include: {
      assignments: {
        include: { user: { select: { id: true, fullName: true, email: true, role: true } } }
      }
    }
  });
  const mapped = territories.map((t) => ({
    ...t,
    repCount: t.assignments.length,
    assignedReps: t.assignments.map((a) => a.user)
  }));
  res.json(mapped);
});

// GET territory dashboard
router.get('/dashboard', async (_req, res) => {
  const [territories, doctors, plannedVisits] = await Promise.all([
    prisma.territory.findMany({ include: { assignments: true } }),
    prisma.doctor.findMany({ select: { territory: true } }),
    prisma.visit.findMany({ where: { status: 'planned' }, select: { doctor: { select: { territory: true } } } })
  ]);

  const coveredDoctors = doctors.filter((d) => Boolean(d.territory)).length;
  const coveragePercent = doctors.length ? Math.round((coveredDoctors / doctors.length) * 100) : 0;
  const pendingVisits = plannedVisits.filter((v) => Boolean(v.doctor?.territory)).length;

  res.json({ coveragePercent, doctorsCovered: coveredDoctors, pendingVisits, territories });
});

// GET single territory with full details
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const territory = await prisma.territory.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { user: { select: { id: true, fullName: true, email: true, role: true } } }
      }
    }
  });
  if (!territory) return res.status(404).json({ message: 'Territory not found' });
  res.json({ ...territory, repCount: territory.assignments.length, assignedReps: territory.assignments.map((a) => a.user) });
});

// POST create territory (no repCount — computed from assignments)
router.post('/', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const { name, region, description, coverageTarget } = req.body;
  if (!name || !region) return res.status(400).json({ message: 'Territory name and region are required' });
  const territory = await prisma.territory.create({
    data: {
      name,
      region,
      description: description || null,
      coverageTarget: Number(coverageTarget || 0)
    }
  });
  if (req.user) await audit('create', 'territory', `Created territory ${name}`, req.user.email);
  res.json(territory);
});

// PUT update territory
router.put('/:id', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { name, region, description, coverageTarget } = req.body;
  const territory = await prisma.territory.update({
    where: { id },
    data: {
      name,
      region,
      description: description || null,
      coverageTarget: Number(coverageTarget || 0)
    }
  });
  if (req.user) await audit('update', 'territory', `Updated territory ${name}`, req.user.email);
  res.json(territory);
});

// DELETE territory
router.delete('/:id', requireRole(['admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const territory = await prisma.territory.findUnique({ where: { id } });
  await prisma.territory.delete({ where: { id } });
  if (req.user && territory) await audit('delete', 'territory', `Deleted territory ${territory.name}`, req.user.email);
  res.json({ message: 'Territory deleted' });
});

// GET assignments for a territory
router.get('/:id/assignments', async (req, res) => {
  const id = Number(req.params.id);
  const assignments = await prisma.territoryAssignment.findMany({
    where: { territoryId: id },
    include: { user: { select: { id: true, fullName: true, email: true, role: true } } }
  });
  res.json(assignments);
});

// POST assign one or more MRs to a territory
router.post('/:id/assignments', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const territoryId = Number(req.params.id);
  const { userIds } = req.body as { userIds: number[] };

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'userIds array is required' });
  }

  // Upsert each assignment (ignore duplicates gracefully)
  const created: number[] = [];
  for (const userId of userIds) {
    try {
      await prisma.territoryAssignment.create({ data: { territoryId, userId } });
      created.push(userId);
    } catch {
      // Already assigned — skip
    }
  }

  const territory = await prisma.territory.findUnique({
    where: { id: territoryId },
    include: { assignments: { include: { user: { select: { id: true, fullName: true, email: true } } } } }
  });

  if (req.user) {
    await audit('assign', 'territory', `Assigned ${created.length} MR(s) to territory ${territory?.name}`, req.user.email);
  }
  res.json({ assigned: created.length, assignments: territory?.assignments ?? [] });
});

// DELETE remove a specific MR from a territory
router.delete('/:id/assignments/:userId', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const territoryId = Number(req.params.id);
  const userId = Number(req.params.userId);

  await prisma.territoryAssignment.deleteMany({ where: { territoryId, userId } });

  const territory = await prisma.territory.findUnique({ where: { id: territoryId } });
  if (req.user) {
    await audit('remove_assignment', 'territory', `Removed MR ${userId} from territory ${territory?.name}`, req.user.email);
  }
  res.json({ message: 'Assignment removed' });
});

export default router;
