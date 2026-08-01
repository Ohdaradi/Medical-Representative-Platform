import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { audit } from '../lib/audit.js';
import { sendMail } from '../lib/mailer.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (_req, res) => {
  res.json(
    await prisma.sample.findMany({
      include: { product: true, doctor: true },
      orderBy: { issuedAt: 'desc' }
    })
  );
});

router.get('/inventory', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
  const lowStock = products.filter((p) => p.stock < 10);
  res.json({ products, lowStock });
});

router.post('/', requireRole(['admin', 'rep', 'manager']), async (req: AuthRequest, res) => {
  const { productId, doctorId, quantity, remarks, batchNumber, expiryDate } = req.body;

  if (!productId || !doctorId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
    return res.status(400).json({ message: 'productId, doctorId and a positive integer quantity are required' });
  }

  const sample = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: Number(productId) } });
    if (!product || product.stock < Number(quantity)) {
      throw new Error('Insufficient stock for this sample issuance');
    }

    const doctor = await tx.doctor.findUnique({ where: { id: Number(doctorId) } });

    const created = await tx.sample.create({
      data: {
        productId: Number(productId),
        doctorId: Number(doctorId),
        issuedByRepId: req.user!.id,
        quantity: Number(quantity),
        // issuedTo auto-derived from doctor name
        issuedTo: doctor?.name ?? null,
        remarks: remarks || null,
        status: 'issued',
        batchNumber: batchNumber || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: { product: true, doctor: true }
    });

    await tx.product.update({
      where: { id: Number(productId) },
      data: { stock: { decrement: Number(quantity) } }
    });

    return created;
  });

  await audit('sample_issued', 'sample', `Sample ${sample.id} of ${sample.product?.name} issued to Dr. ${sample.doctor?.name}`, req.user!.email);

  // Auto-notify admin if stock is now low after issuance
  const updatedProduct = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (updatedProduct && updatedProduct.stock < 10) {
    const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { email: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          channel: 'email',
          recipient: admin.email,
          subject: `Low Stock Alert: ${updatedProduct.name}`,
          body: `Stock for ${updatedProduct.name} has dropped to ${updatedProduct.stock} units after sample issuance. Please restock.`,
          status: 'queued'
        }
      });
      await sendMail({
        to: admin.email,
        subject: `[ITER Platform] Low Stock Alert: ${updatedProduct.name}`,
        text: `Stock for ${updatedProduct.name} has dropped to ${updatedProduct.stock} units. Please restock soon.`
      }).catch(() => undefined);
    }
  }

  return res.json(sample);
});

router.post('/:id/distribute', requireRole(['rep', 'admin', 'manager']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ message: 'doctorId is required for distribution' });

  const doctor = await prisma.doctor.findUnique({ where: { id: Number(doctorId) } });
  const sample = await prisma.sample.update({
    where: { id },
    data: {
      doctorId: Number(doctorId),
      issuedTo: doctor?.name ?? null,
      status: 'distributed'
    }
  });
  await audit('sample_distributed', 'sample', `Sample ${id} distributed to doctor ${doctorId}`, req.user!.email);
  return res.json(sample);
});

export default router;
