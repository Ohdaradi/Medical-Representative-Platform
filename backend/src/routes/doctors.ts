import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { audit } from '../lib/audit.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  const { search, city, specialty, showAll } = req.query;
  let repTerritoryCondition: any = undefined;

  // showAll=true bypasses territory filtering (used by visit/order/sample forms)
  if (req.user!.role === 'rep' && showAll !== 'true') {
    // Check legacy assignedToEmail field first
    let territory = await prisma.territory.findFirst({
      where: { assignedToEmail: req.user!.email }
    });

    // Also check the newer TerritoryAssignment join table
    if (!territory) {
      const assignment = await prisma.territoryAssignment.findFirst({
        where: { userId: req.user!.id },
        include: { territory: true }
      });
      if (assignment) territory = assignment.territory;
    }

    // If the rep has a territory, filter doctors by it; otherwise show all doctors
    if (territory) {
      repTerritoryCondition = { territory: territory.name };
    }
  }

  const filters: any[] = [];
  if (search) {
    filters.push({
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { hospital: { contains: String(search), mode: 'insensitive' } }
      ]
    });
  }
  if (city) {
    filters.push({ city: { contains: String(city), mode: 'insensitive' } });
  }
  if (specialty) {
    filters.push({ specialty: { contains: String(specialty), mode: 'insensitive' } });
  }
  if (repTerritoryCondition) {
    filters.push(repTerritoryCondition);
  }

  const doctors = await prisma.doctor.findMany({
    where: filters.length > 0 ? { AND: filters } : {},
    orderBy: { name: 'asc' }
  });
  res.json(doctors);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [doctor, visits, orders, samples] = await Promise.all([
    prisma.doctor.findUnique({ where: { id } }),
    prisma.visit.findMany({ where: { doctorId: id }, orderBy: { visitDate: 'desc' } }),
    prisma.order.findMany({ where: { doctorId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.sample.findMany({ where: { doctorId: id }, orderBy: { issuedAt: 'desc' } })
  ]);

  res.json({ doctor, visits, orders, samples });
});

router.post('/', requireRole(['admin']), async (req: AuthRequest, res) => {
  const { name, city, specialty, hospital, phone, email, territory, latitude, longitude, geoRadiusMeters } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Doctor name is required' });
  }

  const doctor = await prisma.doctor.create({
    data: { name, city: city || null, specialty: specialty || null, hospital: hospital || null, phone: phone || null, email: email || null, territory: territory || null, latitude: latitude === undefined || latitude === '' ? null : Number(latitude), longitude: longitude === undefined || longitude === '' ? null : Number(longitude), geoRadiusMeters: Number(geoRadiusMeters || 250) }
  });
  await audit('doctor_created', 'doctor', `Doctor ${doctor.id} created`, req.user!.email);
  return res.json(doctor);
});

router.put('/:id', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { name, city, specialty, hospital, phone, email, territory, latitude, longitude, geoRadiusMeters } = req.body;
  const doctor = await prisma.doctor.update({
    where: { id },
    data: { name, city, specialty, hospital, phone, email, territory, latitude: latitude === undefined ? undefined : Number(latitude), longitude: longitude === undefined ? undefined : Number(longitude), geoRadiusMeters: geoRadiusMeters === undefined ? undefined : Number(geoRadiusMeters) }
  });
  await audit('doctor_updated', 'doctor', `Doctor ${id} updated`, req.user!.email);
  res.json(doctor);
});

router.delete('/:id', requireRole(['admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await prisma.doctor.delete({ where: { id } });
  await audit('doctor_deleted', 'doctor', `Doctor ${id} deleted`, req.user!.email);
  res.json({ message: 'Doctor deleted' });
});

export default router;
