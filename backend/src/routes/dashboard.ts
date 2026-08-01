import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, requireRole(['manager', 'admin']));

router.get('/metrics', async (_req, res) => {
  const [totalDoctors, totalVisits, totalOrders, totalSamples, pendingOrders, lowStockProducts, totalTerritories, recentVisits, recentOrders, todaysVisits, todaysOrders] = await Promise.all([
    prisma.doctor.count(),
    prisma.visit.count(),
    prisma.order.count(),
    prisma.sample.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { stock: { lt: 10 } } }),
    prisma.territory.count(),
    prisma.visit.findMany({ include: { doctor: true, rep: true }, orderBy: { visitDate: 'desc' }, take: 3 }),
    prisma.order.findMany({ include: { doctor: true, product: true }, orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.visit.count({ where: { visitDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } })
  ]);

  res.json({ totalDoctors, totalVisits, totalOrders, totalSamples, pendingOrders, lowStockProducts, totalTerritories, recentVisits, recentOrders, todaysVisits, todaysOrders });

});

router.get('/audit-logs', async (_req, res) => {
  res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.get('/mr-performance', async (_req, res) => {
  const grouped = await prisma.visit.groupBy({
    by: ['repId'],
    _count: { repId: true },
    orderBy: { _count: { repId: 'desc' } }
  });
  const reps = await prisma.user.findMany({ select: { id: true, fullName: true, email: true, role: true } });
  
  const mapped = grouped.map((item) => ({ rep: reps.find((user) => user.id === item.repId), visits: item._count.repId }));
  const result = mapped.map((item, index) => {
    let label: string | null = null;
    if (index === 0) label = 'Top Performer';
    else if (index === mapped.length - 1 && mapped.length > 1) label = 'Lowest Performer';
    return { ...item, label };
  });
  res.json(result);
});

router.get('/territory-analytics', async (_req, res) => {
  const territories = await prisma.territory.findMany();
  const doctors = await prisma.doctor.findMany({ select: { territory: true } });
  const data = territories.map((territory) => {
    const covered = doctors.filter((doctor) => doctor.territory === territory.name).length;
    return {
      territory: territory.name,
      doctorsCovered: covered,
      coverage: Math.round((covered / Math.max(territory.coverageTarget, 1)) * 100)
    };
  });
  res.json(data);
});

router.get('/sales-analytics', async (_req, res) => {
  const topMedicines = await prisma.order.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5
  });
  const products = await prisma.product.findMany({ select: { id: true, name: true, unitPrice: true } });
  
  let totalRevenue = 0;
  const data = topMedicines.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const quantity = item._sum.quantity || 0;
    const revenue = quantity * (product?.unitPrice || 0);
    totalRevenue += revenue;
    return { product, quantity, revenue };
  });
  
  res.json({ totalRevenue, data });
});

router.get('/system-stats', async (_req, res) => {
  const [totalUsers, activeReps, activeManagers, activeAdmins, totalDoctors, totalProducts, totalTerritories, totalAuditLogs, totalNotifications] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'rep' } }),
    prisma.user.count({ where: { role: 'manager' } }),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.doctor.count(),
    prisma.product.count(),
    prisma.territory.count(),
    prisma.auditLog.count(),
    prisma.notification.count()
  ]);
  res.json({ totalUsers, activeReps, activeManagers, activeAdmins, totalDoctors, totalProducts, totalTerritories, totalAuditLogs, totalNotifications });
});

router.get('/team-summary', async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalReps,
    allVisitsToday,
    completedVisitsToday,
    pendingVisitsToday,
    ordersToday,
    samplesToday,
    activeTerritories,
    mrPerformanceRaw,
    reps
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'rep' } }),
    prisma.visit.findMany({ where: { visitDate: { gte: todayStart } }, select: { repId: true, status: true } }),
    prisma.visit.count({ where: { visitDate: { gte: todayStart }, status: { in: ['completed', 'approved'] } } }),
    prisma.visit.count({ where: { visitDate: { gte: todayStart }, status: { in: ['draft', 'in_progress'] } } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.sample.count({ where: { issuedAt: { gte: todayStart } } }),
    prisma.territory.count(),
    prisma.visit.groupBy({ by: ['repId'], _count: { repId: true }, orderBy: { _count: { repId: 'desc' } } }),
    prisma.user.findMany({ where: { role: 'rep' }, select: { id: true, fullName: true, email: true } })
  ]);

  // Active MRs today = unique repIds who logged at least 1 visit today
  const activeTodayRepIds = new Set(allVisitsToday.map((v) => v.repId));
  const activeTodayCount = activeTodayRepIds.size;

  const totalVisitsToday = completedVisitsToday + pendingVisitsToday;
  const visitCompletionPct = totalVisitsToday > 0 ? Math.round((completedVisitsToday / totalVisitsToday) * 100) : 0;

  // Build per-rep performance with today's stats
  const maxVisits = mrPerformanceRaw.length > 0 ? mrPerformanceRaw[0]._count.repId : 1;
  const mrPerformance = mrPerformanceRaw.map((item, index) => {
    const rep = reps.find((r) => r.id === item.repId);
    const visits = item._count.repId;
    const performancePct = Math.round((visits / maxVisits) * 100);
    const todayVisitCount = allVisitsToday.filter((v) => v.repId === item.repId).length;
    const todayCompleted = allVisitsToday.filter((v) => v.repId === item.repId && ['completed', 'approved'].includes(v.status || '')).length;
    return { rep, visits, performancePct, todayVisitCount, todayCompleted, rank: index + 1 };
  });

  res.json({
    totalReps,
    activeTodayCount,
    completedVisitsToday,
    pendingVisitsToday,
    ordersToday,
    samplesToday,
    visitCompletionPct,
    activeTerritories,
    mrPerformance
  });
});

export default router;
