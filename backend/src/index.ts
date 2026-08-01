import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { register, collectDefaultMetrics } from 'prom-client';
import authRoutes from './routes/auth.js';
import doctorsRoutes from './routes/doctors.js';
import visitsRoutes from './routes/visits.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import samplesRoutes from './routes/samples.js';
import dashboardRoutes from './routes/dashboard.js';
import territoriesRoutes from './routes/territories.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import reportsRoutes from './routes/reports.js';
import auditRoutes from './routes/audit.js';
import { errorHandler, notFound } from './middleware/errors.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(helmet());
app.use(express.json());

collectDefaultMetrics();
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ITER Pharma API is running' });
});

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many requests, please try again later' } }), authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/samples', samplesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/territories', territoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

process.on('SIGTERM', () => { server.close(); });
process.on('SIGINT', () => { server.close(); });
