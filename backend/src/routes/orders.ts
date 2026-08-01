import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { audit } from '../lib/audit.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  const { search, status } = req.query;
  const filters: any[] = [];
  
  if (status) {
    filters.push({ status: String(status) });
  }

  if (req.user!.role === 'rep') {
    filters.push({ repId: req.user!.id });
  }

  if (search) {
    filters.push({
      OR: [
        { product: { name: { contains: String(search), mode: 'insensitive' } } },
        { doctor: { name: { contains: String(search), mode: 'insensitive' } } }
      ]
    });
  }

  const orders = await prisma.order.findMany({
    where: filters.length > 0 ? { AND: filters } : {},
    include: { doctor: true, product: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { doctor: true, product: true, rep: true }
  });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

router.post('/', requireRole(['rep', 'manager', 'admin']), async (req: AuthRequest, res) => {
  const { doctorId, productId, quantity, status } = req.body;

  if (!doctorId || !productId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
    return res.status(400).json({ message: 'doctorId, productId and a positive integer quantity are required' });
  }

  const order = await prisma.order.create({
    data: {
      doctorId: Number(doctorId),
      repId: req.user!.id,
      productId: Number(productId),
      quantity: Number(quantity),
      status: status || 'pending'
    }
  });
  await audit('order_created', 'order', `Order ${order.id} created`, req.user!.email);
  return res.json(order);
});

router.put('/:id', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { quantity, status } = req.body;
  if (quantity !== undefined && (!Number.isInteger(Number(quantity)) || Number(quantity) < 1)) return res.status(400).json({ message: 'Quantity must be a positive integer' });
  const order = await prisma.order.update({
    where: { id },
    data: { quantity: quantity ? Number(quantity) : undefined, status }
  });
  await audit('order_updated', 'order', `Order ${id} updated`, req.user!.email);
  res.json(order);
});

router.post('/:id/cancel', requireRole(['rep', 'manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;
  const order = await prisma.order.update({
    where: { id },
    data: { status: 'cancelled', cancelReason: reason || 'Cancelled', cancelledAt: new Date() }
  });
  await audit('order_cancelled', 'order', `Order ${id} cancelled: ${reason || 'Cancelled'}`, req.user!.email);
  res.json(order);
});

router.post('/:id/sign', requireRole(['rep', 'manager', 'admin']), async (req: AuthRequest, res) => {
  const signatureName = String(req.body.signatureName || '').trim();
  if (!signatureName) return res.status(400).json({ message: 'The signer name is required' });
  const order = await prisma.order.update({ where: { id: Number(req.params.id) }, data: { signatureName, signedAt: new Date() } });
  await audit('order_signed', 'order', `Order ${order.id} signed by ${signatureName}`, req.user!.email);
  res.json(order);
});

router.post('/:id/approve', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const order = await prisma.order.update({
    where: { id },
    data: { status: 'approved' }
  });
  await audit('order_approved', 'order', `Order ${id} approved`, req.user!.email);
  res.json(order);
});

router.post('/:id/reject', requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const order = await prisma.order.update({
    where: { id },
    data: { status: 'rejected' }
  });
  await audit('order_rejected', 'order', `Order ${id} rejected`, req.user!.email);
  res.json(order);
});

router.delete('/:id', requireRole(['admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await prisma.order.delete({ where: { id } });
  await audit('order_deleted', 'order', `Order ${id} deleted`, req.user!.email);
  res.json({ message: 'Order deleted' });
});

export default router;
