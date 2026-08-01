import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { audit } from '../lib/audit.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  const { search, category } = req.query;
  const products = await prisma.product.findMany({
    where: {
      AND: [
        search ? { name: { contains: String(search), mode: 'insensitive' } } : {},
        category ? { category: { contains: String(category), mode: 'insensitive' } } : {}
      ]
    },
    orderBy: { name: 'asc' }
  });
  res.json(products);
});

router.post('/', requireRole(['admin']), async (req: AuthRequest, res) => {
  const { name, category, unitPrice, stock, imageUrl } = req.body;

  if (!name || Number(stock || 0) < 0 || Number(unitPrice || 0) < 0) {
    return res.status(400).json({ message: 'Product name is required' });
  }

  const product = await prisma.product.create({
    data: {
      name,
      category,
      unitPrice: Number(unitPrice || 0),
      stock: Number(stock || 0),
      imageUrl: imageUrl || null
    }
  });
  await audit('product_created', 'product', `Product ${product.id} created`, req.user!.email);

  return res.json(product);
});

router.put('/:id', requireRole(['admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { name, category, unitPrice, stock, imageUrl } = req.body;
  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      category,
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
      stock: stock !== undefined ? Number(stock) : undefined,
      imageUrl
    }
  });
  await audit('product_updated', 'product', `Product ${id} updated`, req.user!.email);
  res.json(product);
});

router.delete('/:id', requireRole(['admin']), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await prisma.product.delete({ where: { id } });
  await audit('product_deleted', 'product', `Product ${id} deleted`, req.user!.email);
  res.json({ message: 'Product deleted' });
});

export default router;
