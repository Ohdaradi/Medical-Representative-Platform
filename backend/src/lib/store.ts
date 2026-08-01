import { prisma } from './prisma.js';

type Role = 'rep' | 'manager' | 'admin';

export interface DoctorRecord {
  id: number;
  name: string;
  specialty?: string | null;
  hospital?: string | null;
  phone?: string | null;
  email?: string | null;
  territory?: string | null;
  createdAt: Date;
}

export interface VisitRecord {
  id: number;
  doctorId: number;
  repId: number;
  notes?: string | null;
  outcome?: string | null;
  status: string;
  visitDate: Date;
  createdAt: Date;
}

export interface ProductRecord {
  id: number;
  name: string;
  category?: string | null;
  unitPrice?: number | null;
  stock: number;
  createdAt: Date;
}

export interface OrderRecord {
  id: number;
  doctorId: number;
  repId: number;
  productId: number;
  quantity: number;
  status: string;
  createdAt: Date;
}

export interface SampleRecord {
  id: number;
  productId: number;
  quantity: number;
  issuedTo: string;
  issuedAt: Date;
  status: string;
}

export interface TerritoryRecord {
  id: number;
  name: string;
  region: string;
  repCount: number;
  createdAt: Date;
}

export interface AuditLogRecord {
  id: number;
  action: string;
  entity: string;
  details: string;
  userEmail: string;
  createdAt: Date;
}

export const getDoctors = async () => prisma.doctor.findMany({ orderBy: { name: 'asc' } });

export const createDoctor = async (input: Partial<DoctorRecord>) => prisma.doctor.create({
  data: {
    name: input.name || 'Unnamed Doctor',
    specialty: input.specialty || null,
    hospital: input.hospital || null,
    phone: input.phone || null,
    email: input.email || null,
    territory: input.territory || null
  }
});

export const getVisits = async () => prisma.visit.findMany({
  include: { doctor: true, rep: true },
  orderBy: { visitDate: 'desc' }
});

export const createVisit = async (input: Partial<VisitRecord>) => prisma.visit.create({
  data: {
    doctorId: Number(input.doctorId || 0),
    repId: Number(input.repId || 0),
    notes: input.notes || null,
    outcome: input.outcome || null,
    status: input.status || 'completed',
    visitDate: input.visitDate || new Date()
  }
});

export const getProducts = async () => prisma.product.findMany({ orderBy: { name: 'asc' } });

export const createProduct = async (input: Partial<ProductRecord>) => prisma.product.create({
  data: {
    name: input.name || 'Unnamed Product',
    category: input.category || null,
    unitPrice: input.unitPrice ?? 0,
    stock: Number(input.stock || 0)
  }
});

export const getOrders = async () => prisma.order.findMany({
  include: { doctor: true, product: true },
  orderBy: { createdAt: 'desc' }
});

export const createOrder = async (input: Partial<OrderRecord>) => prisma.order.create({
  data: {
    doctorId: Number(input.doctorId || 0),
    repId: Number(input.repId || 0),
    productId: Number(input.productId || 0),
    quantity: Number(input.quantity || 0),
    status: input.status || 'pending'
  }
});

export const getSamples = async () => prisma.sample.findMany({
  include: { product: true },
  orderBy: { issuedAt: 'desc' }
});

export const createSample = async (input: Partial<SampleRecord>) => prisma.sample.create({
  data: {
    productId: Number(input.productId || 0),
    quantity: Number(input.quantity || 0),
    issuedTo: input.issuedTo || 'Unknown',
    status: input.status || 'issued'
  }
});

export const getTerritories = async () => prisma.territory.findMany({ orderBy: { name: 'asc' } });

export const createTerritory = async (input: Partial<TerritoryRecord>) => prisma.territory.create({
  data: {
    name: input.name || 'Unnamed Territory',
    region: input.region || 'Unknown'
  }
});

export const getAuditLogs = async () => prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });

export const createAuditLog = async (action: string, entity: string, details: string, userEmail: string, _role: Role = 'rep') => prisma.auditLog.create({
  data: {
    action,
    entity,
    details,
    userEmail
  }
});

export const getDashboardMetrics = async () => {
  const [totalDoctors, totalVisits, totalOrders, totalSamples, pendingOrders, lowStockProducts, totalTerritories, recentVisits, recentOrders] = await Promise.all([
    prisma.doctor.count(),
    prisma.visit.count(),
    prisma.order.count(),
    prisma.sample.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { stock: { lt: 10 } } }),
    prisma.territory.count(),
    prisma.visit.findMany({ include: { doctor: true, rep: true }, orderBy: { visitDate: 'desc' }, take: 3 }),
    prisma.order.findMany({ include: { doctor: true, product: true }, orderBy: { createdAt: 'desc' }, take: 3 })
  ]);

  return {
    totalDoctors,
    totalVisits,
    totalOrders,
    totalSamples,
    pendingOrders,
    lowStockProducts,
    totalTerritories,
    recentVisits,
    recentOrders
  };
};