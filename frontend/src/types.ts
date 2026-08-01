export interface Doctor {
  id: number;
  name: string;
  city?: string;
  specialty?: string;
  hospital?: string;
  phone?: string;
  email?: string;
  territory?: string;
  latitude?: number;
  longitude?: number;
  geoRadiusMeters?: number;
  createdAt?: string;
}

export interface Visit {
  id: number;
  doctorId: number;
  repId: number;
  scheduledById?: number;
  isManagerScheduled?: boolean;
  scheduledTime?: string;
  checkInAt?: string;
  checkOutAt?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  visitDate?: string;
  productsDiscussed?: string;
  doctorFeedback?: string;
  consentVersion?: string;
  consentCapturedAt?: string;
  geoVerified?: boolean;
  notes?: string;
  outcome?: string;
  status?: string;
  durationMinutes?: number;
  doctor?: Doctor;
  rep?: User;
  createdAt?: string;
}

export interface Product {
  id: number;
  name: string;
  category?: string;
  imageUrl?: string;
  unitPrice?: number;
  stock: number;
  createdAt?: string;
}

export interface Order {
  id: number;
  doctorId: number;
  repId: number;
  productId: number;
  quantity: number;
  status: string;
  cancelReason?: string;
  cancelledAt?: string;
  signatureName?: string;
  signedAt?: string;
  createdAt?: string;
  doctor?: Doctor;
  product?: Product;
  rep?: User;
}

export interface Sample {
  id: number;
  productId: number;
  doctorId?: number;
  issuedByRepId?: number;
  quantity: number;
  issuedTo?: string;
  remarks?: string;
  batchNumber?: string;
  expiryDate?: string;
  issuedAt?: string;
  status: string;
  product?: Product;
  doctor?: Doctor;
}

export interface TerritoryAssignment {
  id: number;
  territoryId: number;
  userId: number;
  assignedAt: string;
  user?: User;
}

export interface Territory {
  id: number;
  name: string;
  region: string;
  description?: string;
  assignedToEmail?: string;
  coverageTarget?: number;
  repCount?: number;
  assignedReps?: User[];
  assignments?: TerritoryAssignment[];
  createdAt?: string;
}

export interface User {
  id: number;
  fullName?: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface Notification {
  id: number;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  createdAt?: string;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity: string;
  details: string;
  userEmail: string;
  createdAt?: string;
}
