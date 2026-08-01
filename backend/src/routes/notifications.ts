import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { sendMail } from '../lib/mailer.js';

const router = express.Router();
router.use(authenticateToken);

// ─── Notification History ─────────────────────────────────────────────────────

router.get('/', async (req: AuthRequest, res) => {
  const { channel, status, search } = req.query;
  const user = req.user!;

  const notifications = await prisma.notification.findMany({
    where: {
      AND: [
        user.role === 'rep' ? { recipient: user.email } : {},
        channel ? { channel: String(channel) } : {},
        status ? { status: String(status) } : {},
        search
          ? {
              OR: [
                { subject: { contains: String(search), mode: 'insensitive' } },
                { recipient: { contains: String(search), mode: 'insensitive' } }
              ]
            }
          : {}
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(notifications);
});

router.patch('/:id/status', requireRole(['admin', 'manager']), async (req, res) => {
  const notification = await prisma.notification.update({
    where: { id: Number(req.params.id) },
    data: { status: req.body.status || 'queued' }
  });
  res.json(notification);
});

router.delete('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  await prisma.notification.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'Notification removed' });
});

// ─── Notification Templates ───────────────────────────────────────────────────

router.get('/templates', async (_req, res) => {
  res.json(await prisma.notificationTemplate.findMany({ orderBy: { name: 'asc' } }));
});

router.post('/templates', requireRole(['admin']), async (req, res) => {
  const { name, subject, body, variables } = req.body;
  if (!name || !subject || !body) {
    return res.status(400).json({ message: 'name, subject and body are required' });
  }
  const template = await prisma.notificationTemplate.create({
    data: { name, subject, body, variables: variables || null }
  });
  res.json(template);
});

router.put('/templates/:id', requireRole(['admin']), async (req, res) => {
  const { name, subject, body, variables } = req.body;
  const template = await prisma.notificationTemplate.update({
    where: { id: Number(req.params.id) },
    data: { name, subject, body, variables: variables || null }
  });
  res.json(template);
});

router.delete('/templates/:id', requireRole(['admin']), async (req, res) => {
  await prisma.notificationTemplate.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'Template deleted' });
});

// ─── Manual Announcements ─────────────────────────────────────────────────────

router.post('/announce', requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  const { title, message, recipientType, territoryId, specificUserIds } = req.body as {
    title: string;
    message: string;
    recipientType: 'all_reps' | 'all_managers' | 'territory' | 'specific';
    territoryId?: number;
    specificUserIds?: number[];
  };

  if (!title || !message || !recipientType) {
    return res.status(400).json({ message: 'title, message, and recipientType are required' });
  }

  let users: { email: string; id: number }[] = [];

  if (recipientType === 'all_reps') {
    users = await prisma.user.findMany({ where: { role: 'rep' }, select: { id: true, email: true } });
  } else if (recipientType === 'all_managers') {
    users = await prisma.user.findMany({ where: { role: 'manager' }, select: { id: true, email: true } });
  } else if (recipientType === 'territory' && territoryId) {
    const assignments = await prisma.territoryAssignment.findMany({
      where: { territoryId: Number(territoryId) },
      include: { user: { select: { id: true, email: true } } }
    });
    users = assignments.map((a) => a.user);
  } else if (recipientType === 'specific' && specificUserIds?.length) {
    users = await prisma.user.findMany({
      where: { id: { in: specificUserIds } },
      select: { id: true, email: true }
    });
  }

  if (users.length === 0) {
    return res.status(400).json({ message: 'No recipients found for the selected criteria' });
  }

  const notifications = await Promise.all(
    users.map((u) =>
      prisma.notification.create({
        data: {
          channel: 'email',
          recipient: u.email,
          subject: title,
          body: message,
          status: 'queued'
        }
      })
    )
  );

  // Attempt actual email delivery
  let sentCount = 0;
  for (const u of users) {
    const delivered = await sendMail({ to: u.email, subject: `[ITER Platform] ${title}`, text: message }).catch(() => false);
    if (delivered) {
      sentCount++;
      await prisma.notification.updateMany({
        where: { recipient: u.email, subject: title, status: 'queued' },
        data: { status: 'sent' }
      });
    }
  }

  res.json({
    message: `Announcement sent to ${users.length} recipient(s). ${sentCount} email(s) delivered.`,
    total: users.length,
    delivered: sentCount,
    notifications
  });
});

export default router;
