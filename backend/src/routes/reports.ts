import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

const router = express.Router();
router.use(authenticateToken, requireRole(['manager', 'admin']));

function getDateRange(period: string) {
  const now = new Date();
  if (period === 'daily') {
    return { gte: new Date(now.setHours(0, 0, 0, 0)) };
  } else if (period === 'weekly') {
    return { gte: new Date(now.setDate(now.getDate() - 7)) };
  } else if (period === 'monthly') {
    return { gte: new Date(now.setDate(now.getDate() - 30)) };
  }
  return { gte: new Date(0) };
}

router.get('/daily', async (_req, res) => {
  const dateFilter = getDateRange('daily');
  const [visits, orders, samples] = await Promise.all([
    prisma.visit.count({ where: { visitDate: dateFilter } }),
    prisma.order.count({ where: { createdAt: dateFilter } }),
    prisma.sample.count({ where: { issuedAt: dateFilter } })
  ]);
  res.json({ period: 'daily', visits, orders, samples });
});

router.get('/weekly', async (_req, res) => {
  const dateFilter = getDateRange('weekly');
  const [visits, orders, samples] = await Promise.all([
    prisma.visit.count({ where: { visitDate: dateFilter } }),
    prisma.order.count({ where: { createdAt: dateFilter } }),
    prisma.sample.count({ where: { issuedAt: dateFilter } })
  ]);
  res.json({ period: 'weekly', visits, orders, samples, download: 'pdf-ready' });
});

router.get('/monthly', async (_req, res) => {
  const dateFilter = getDateRange('monthly');
  const [visits, orders, samples, territories] = await Promise.all([
    prisma.visit.count({ where: { visitDate: dateFilter } }),
    prisma.order.count({ where: { createdAt: dateFilter } }),
    prisma.sample.count({ where: { issuedAt: dateFilter } }),
    prisma.territory.count()
  ]);
  res.json({ period: 'monthly', visits, orders, samples, territories });
});

router.get('/:period/pdf', async (req, res) => {
  const period = String(req.params.period || 'daily');
  const dateFilter = getDateRange(period);
  const [visits, orders, samples, territories, doctors, pendingOrders] = await Promise.all([
    prisma.visit.count({ where: { visitDate: dateFilter } }),
    prisma.order.count({ where: { createdAt: dateFilter } }),
    prisma.sample.count({ where: { issuedAt: dateFilter } }),
    prisma.territory.count(),
    prisma.doctor.count(),
    prisma.order.count({ where: { status: 'pending', createdAt: dateFilter } })
  ]);

  const reportRows = [
    ['Period', period],
    ['Doctors', String(doctors)],
    ['Visits', String(visits)],
    ['Orders', String(orders)],
    ['Pending Orders', String(pendingOrders)],
    ['Samples', String(samples)],
    ['Territories', String(territories)]
  ];

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="iter-pharma-${period}-report.pdf"`);

  const document = new PDFDocument({ margin: 48 });
  document.pipe(res);
  document.fontSize(18).text('ITER Pharmaceuticals Report', { align: 'left' });
  document.moveDown(0.5);
  document.fontSize(11).fillColor('#555').text(`Generated for ${period} overview`);
  document.moveDown(1);

  reportRows.forEach(([label, value]) => {
    document.fillColor('#111').fontSize(12).text(`${label}: ${value}`);
    document.moveDown(0.3);
  });

  document.moveDown(1);
  document.fontSize(10).fillColor('#666').text('This report is generated from live operational data.', { align: 'left' });
  document.end();
});

router.get('/:period/csv', async (req, res) => {
  const period = String(req.params.period || 'daily');
  const dateFilter = getDateRange(period);
  const [visits, orders, samples, territories, doctors, pendingOrders] = await Promise.all([
    prisma.visit.count({ where: { visitDate: dateFilter } }),
    prisma.order.count({ where: { createdAt: dateFilter } }),
    prisma.sample.count({ where: { issuedAt: dateFilter } }),
    prisma.territory.count(),
    prisma.doctor.count(),
    prisma.order.count({ where: { status: 'pending', createdAt: dateFilter } })
  ]);

  const headers = ['Period', 'Doctors', 'Visits', 'Orders', 'Pending Orders', 'Samples', 'Territories'];
  const row = [period, doctors, visits, orders, pendingOrders, samples, territories];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="iter-pharma-${period}-report.csv"`);
  res.send(`${headers.join(',')}\n${row.join(',')}\n`);
});

export default router;
