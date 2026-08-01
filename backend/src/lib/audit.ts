import { prisma } from './prisma.js';

export async function audit(action: string, entity: string, details: string, userEmail: string, ipAddress?: string, userAgent?: string) {
  try {
    let finalDetails = details;
    if (ipAddress || userAgent) {
      finalDetails += ` (IP: ${ipAddress || 'unknown'}, UA: ${userAgent || 'unknown'})`;
    }
    return await prisma.auditLog.create({ data: { action, entity, details: finalDetails, userEmail } });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}
