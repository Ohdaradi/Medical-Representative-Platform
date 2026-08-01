import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const password = await bcrypt.hash('password123', 10);

  await prisma.auditLog.deleteMany();
  await prisma.sample.deleteMany();
  await prisma.order.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.territory.deleteMany();
  await prisma.user.deleteMany();

  const userRep = await prisma.user.create({ data: { email: 'rep@iter.com', fullName: 'Field Representative', password, role: 'rep' } });
  const userManager = await prisma.user.create({ data: { email: 'manager@iter.com', fullName: 'Regional Manager', password, role: 'manager' } });
  const userAdmin = await prisma.user.create({ data: { email: 'admin@iter.com', fullName: 'System Admin', password, role: 'admin' } });

  await prisma.territory.createMany({
    data: [
      { name: 'North Zone', region: 'North', repCount: 3 },
      { name: 'Central Zone', region: 'Central', repCount: 2 },
      { name: 'South Zone', region: 'South', repCount: 2 }
    ]
  });

  const product1 = await prisma.product.create({ data: { name: 'CardioCare', category: 'Cardiology', unitPrice: 120, stock: 50 } });
  const product2 = await prisma.product.create({ data: { name: 'OncoShield', category: 'Oncology', unitPrice: 200, stock: 8 } });
  const product3 = await prisma.product.create({ data: { name: 'DermaEase', category: 'Dermatology', unitPrice: 75, stock: 30 } });

  const doctor1 = await prisma.doctor.create({ data: { name: 'Dr. Anita Rao', specialty: 'Cardiology', territory: 'North Zone', city: 'Mumbai', latitude: 19.0760, longitude: 72.8777 } });
  const doctor2 = await prisma.doctor.create({ data: { name: 'Dr. Suresh Kumar', specialty: 'Oncology', territory: 'Central Zone', city: 'Delhi', latitude: 28.7041, longitude: 77.1025 } });
  const doctor3 = await prisma.doctor.create({ data: { name: 'Dr. Meera Iyer', specialty: 'Dermatology', territory: 'South Zone', city: 'Bangalore', latitude: 12.9716, longitude: 77.5946 } });

  await prisma.visit.createMany({
    data: [
      { doctorId: doctor1.id, repId: userRep.id, visitDate: new Date(), notes: 'Initial meeting', status: 'completed' },
      { doctorId: doctor2.id, repId: userRep.id, visitDate: new Date(), notes: 'Follow up', status: 'planned' }
    ]
  });

  await prisma.order.createMany({
    data: [
      { doctorId: doctor1.id, repId: userRep.id, productId: product1.id, quantity: 5, status: 'pending' },
      { doctorId: doctor3.id, repId: userRep.id, productId: product3.id, quantity: 10, status: 'approved' }
    ]
  });

  await prisma.sample.createMany({
    data: [
      { doctorId: doctor2.id, repId: userRep.id, productId: product2.id, quantity: 2, status: 'given' }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });