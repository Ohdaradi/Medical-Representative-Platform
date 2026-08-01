import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { audit } from '../lib/audit.js';

const router = express.Router();
router.use(authenticateToken);

function distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get('/', async (req: AuthRequest, res) => {
  const { search, doctorId, repId, period, status } = req.query;
  const now = new Date();
  let dateFilter: any = undefined;
  if (period === 'daily') {
    dateFilter = { gte: new Date(now.setHours(0, 0, 0, 0)) };
  } else if (period === 'weekly') {
    dateFilter = { gte: new Date(now.setDate(now.getDate() - 7)) };
  }

  const filters: any[] = [];
  if (status) filters.push({ status: String(status) });
  if (doctorId) filters.push({ doctorId: Number(doctorId) });
  
  if (req.user!.role === 'rep') {
    filters.push({ repId: req.user!.id });
  } else if (repId) {
    filters.push({ repId: Number(repId) });
  }

  if (period && dateFilter) filters.push({ visitDate: dateFilter });
  if (search) {
    filters.push({
      OR: [
        { notes: { contains: String(search), mode: 'insensitive' } },
        { outcome: { contains: String(search), mode: 'insensitive' } },
        { doctor: { name: { contains: String(search), mode: 'insensitive' } } }
      ]
    });
  }

  const visits = await prisma.visit.findMany({
    where: filters.length > 0 ? { AND: filters } : {},
    include: { doctor: true, rep: true },
    orderBy: { visitDate: 'desc' }
  });
  
  const mapped = visits.map((visit) => {
    let durationMinutes = null;
    if (visit.checkInAt && visit.checkOutAt) {
      durationMinutes = Math.round((visit.checkOutAt.getTime() - visit.checkInAt.getTime()) / 60000);
    }
    return { ...visit, durationMinutes };
  });
  
  res.json(mapped);
});

router.get('/history', async (req, res) => {
  const { doctorId } = req.query;
  const visits = await prisma.visit.findMany({
    where: doctorId ? { doctorId: Number(doctorId) } : {},
    include: { doctor: true, rep: true },
    orderBy: { visitDate: 'desc' }
  });
  res.json(visits);
});

router.post('/', requireRole(['rep', 'manager', 'admin']), async (req: AuthRequest, res) => {
  const { doctorId, repId, scheduledTime, notes, productsDiscussed, doctorFeedback, consentVersion } = req.body;

  if (!doctorId) {
    return res.status(400).json({ message: 'doctorId is required' });
  }

  const isManager = ['manager', 'admin'].includes(req.user!.role);
  
  let targetRepId = req.user!.id;
  let isManagerScheduled = false;
  let scheduledById = null;
  let status = 'pending_approval';

  if (isManager) {
    if (!repId) return res.status(400).json({ message: 'repId is required when scheduling for a rep' });
    targetRepId = Number(repId);
    isManagerScheduled = true;
    scheduledById = req.user!.id;
    status = 'planned';
  }

  const visit = await prisma.visit.create({
    data: {
      doctorId: Number(doctorId),
      repId: targetRepId,
      isManagerScheduled,
      scheduledById,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      notes: notes || null,
      status,
      productsDiscussed: productsDiscussed || null,
      doctorFeedback: doctorFeedback || null,
      consentVersion: consentVersion || null,
      consentCapturedAt: consentVersion ? new Date() : null
    }
  });
  
  if (isManager) {
    await audit('visit_scheduled', 'visit', `Manager scheduled visit ${visit.id} for rep ${targetRepId}`, req.user!.email);
  } else {
    await audit('visit_requested', 'visit', `Rep requested visit ${visit.id} for doctor ${doctorId}`, req.user!.email);
  }
  return res.json(visit);
});

router.delete('/:id', requireRole(['rep', 'manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const visit = await prisma.visit.findUnique({ where: { id } });
  
  if (!visit) return res.status(404).json({ message: 'Visit not found' });
  
  if (req.user!.role === 'rep') {
    if (visit.repId !== req.user!.id) return res.status(403).json({ message: 'Cannot delete other rep visits' });
    if (visit.isManagerScheduled) return res.status(403).json({ message: 'Cannot delete a manager-scheduled visit' });
    if (visit.status !== 'pending_approval') return res.status(403).json({ message: 'Can only delete pending requests' });
  }
  
  await prisma.visit.delete({ where: { id } });
  await audit('visit_deleted', 'visit', `Visit ${id} deleted`, req.user!.email);
  res.json({ success: true });
});

router.post('/:id/consent', requireRole(['rep', 'manager', 'admin']), async (req: AuthRequest, res) => {
  const consentVersion = String(req.body.consentVersion || '').trim();
  if (!consentVersion) return res.status(400).json({ message: 'A consent version is required' });
  const visit = await prisma.visit.update({ where: { id: Number(req.params.id) }, data: { consentVersion, consentCapturedAt: new Date() } });
  await audit('consent_captured', 'visit', `Consent ${consentVersion} captured for visit ${visit.id}`, req.user!.email);
  res.json(visit);
});

router.post('/:id/check-in', requireRole(['rep', 'manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { latitude, longitude } = req.body;
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return res.status(400).json({ message: 'Valid latitude and longitude are required' });
  const existing = await prisma.visit.findUnique({ where: { id }, include: { doctor: true } });
  if (!existing) return res.status(404).json({ message: 'Visit not found' });
  const geoVerified = existing.doctor.latitude !== null && existing.doctor.longitude !== null
    ? distanceInMeters(Number(latitude), Number(longitude), existing.doctor.latitude, existing.doctor.longitude) <= existing.doctor.geoRadiusMeters
    : false;
  const visit = await prisma.visit.update({
    where: { id },
    data: {
      checkInAt: new Date(),
      checkInLat: latitude !== undefined ? Number(latitude) : null,
      checkInLng: longitude !== undefined ? Number(longitude) : null,
      status: 'in_progress', geoVerified
    }
  });
  await audit('visit_check_in', 'visit', `Visit ${id} checked in`, req.user!.email);
  res.json(visit);
});

router.post('/:id/check-out', requireRole(['rep', 'manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { latitude, longitude } = req.body;
  const visit = await prisma.visit.update({
    where: { id },
    data: {
      checkOutAt: new Date(),
      checkOutLat: latitude !== undefined ? Number(latitude) : null,
      checkOutLng: longitude !== undefined ? Number(longitude) : null,
      status: 'completed'
    }
  });
  await audit('visit_check_out', 'visit', `Visit ${id} checked out`, req.user!.email);
  res.json(visit);
});

router.put('/:id', requireRole(['rep', 'manager', 'admin']), async (req, res) => {
  const id = Number(req.params.id);
  const { notes, outcome, status, productsDiscussed, doctorFeedback } = req.body;
  const visit = await prisma.visit.update({
    where: { id },
    data: { notes, outcome, status, productsDiscussed, doctorFeedback }
  });
  res.json(visit);
});

router.post('/:id/approve', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const visit = await prisma.visit.update({
    where: { id },
    data: { status: 'planned' }
  });
  await audit('visit_approved', 'visit', `Visit ${id} approved`, req.user!.email);
  res.json(visit);
});

router.post('/:id/reject', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const visit = await prisma.visit.update({
    where: { id },
    data: { status: 'rejected' }
  });
  await audit('visit_rejected', 'visit', `Visit ${id} rejected`, req.user!.email);
  res.json(visit);
});

router.post('/:id/reschedule', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { scheduledTime } = req.body;
  if (!scheduledTime) return res.status(400).json({ message: 'scheduledTime is required' });

  const visit = await prisma.visit.update({
    where: { id },
    data: { scheduledTime: new Date(scheduledTime), status: 'planned' }
  });
  await audit('visit_rescheduled', 'visit', `Visit ${id} rescheduled to ${scheduledTime}`, req.user!.email);
  res.json(visit);
});

export default router;
