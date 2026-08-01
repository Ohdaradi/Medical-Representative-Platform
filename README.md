# ITER Pharmaceuticals Medical Representative Platform

A comprehensive field-operations platform for pharmaceutical medical representatives, managers, and administrators. Built with React, Express.js, PostgreSQL/Prisma, and Docker.

## Features (All 13 Epics Implemented)

### Epic 1: Authentication & User Management
- JWT-based login/registration with password strength validation
- OTP-based forgot/reset password flow
- Role-based access control (Admin, Manager, Medical Representative)
- Session management with secure token handling
- Audit logging for all auth events

### Epic 2: Doctor Management
- Full CRUD operations with edit/delete confirmation dialogs
- Search by name, filter by city and specialty
- Doctor detail view with visit history, orders, and samples
- GPS coordinates and geofence radius configuration

### Epic 3: Territory Management
- Territory CRUD with region and coverage target management
- MR assignment and removal
- Territory dashboard with coverage %, doctors covered, pending visits
- Territory analytics in manager dashboard

### Epic 4: Visit Management (eDCR)
- Visit creation with doctor dropdown selector
- GPS check-in/check-out with geofence verification
- Visit notes, products discussed, doctor feedback, consent capture
- Daily/weekly filtering and visit duration tracking
- Edit visit capability

### Epic 5: Order Management
- Order creation with doctor and product dropdown selectors
- Order editing (quantity/status) and cancellation with reason
- Electronic signature capture
- Order detail view with full information
- Status filtering (pending, confirmed, cancelled)

### Epic 6: Sample Management
- Transactional sample issuance with stock validation
- Batch number and expiry date tracking
- Doctor and product dropdown selectors
- Low stock alerts and inventory snapshot
- Reissue capability

### Epic 7: Medicine Management
- Full CRUD with search and category filter
- Image URL support with preview
- Stock and pricing management
- Role-based create/edit/delete permissions

### Epic 8: Manager Dashboard & Analytics
- Real-time operational metrics (visits, orders, samples, stock)
- MR performance ranking with top/lowest performer labels
- Territory analytics with coverage calculation
- Sales analytics with revenue calculation
- System statistics panel
- Audit trail viewer

### Epic 9: Notifications
- Multi-channel notification queue (email, SMS, push)
- Notification creation, status management, and deletion
- Email delivery integration seam (Nodemailer)
- Test notification delivery endpoint
- Rep-scoped notification viewing

### Epic 10: Reports
- Period-filtered reports (daily/weekly/monthly with actual date ranges)
- CSV export per period
- PDF report generation via PDFKit
- Operational trend visualization

### Epic 11: Admin Panel
- User CRUD with role management
- Edit and delete with confirmation dialogs
- User search and filtering
- System statistics overview

### Epic 12: Cloud & DevOps
- Docker Compose with PostgreSQL, backend, frontend, Prometheus, Grafana
- Kubernetes deployment manifests with HPA
- Terraform infrastructure-as-code (KMS, S3, CloudWatch)
- GitHub Actions CI/CD with CodeQL security scanning
- Prometheus metrics endpoint and Grafana dashboard

### Epic 13: Security & Compliance
- Password hashing with bcrypt
- JWT validation with role-based middleware
- Helmet security headers
- Rate limiting on authentication endpoints
- Comprehensive audit logging with IP tracking
- Input validation across all endpoints
- Centralized error handling

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, React Router |
| Backend | Express.js, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT, bcrypt |
| Reports | PDFKit (PDF), CSV export |
| Monitoring | Prometheus, Grafana |
| DevOps | Docker, Kubernetes, Terraform, GitHub Actions |

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### Quick Start

1. Clone the repository and install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure environment:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL and JWT_SECRET
```

3. Initialize database:
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

4. Start development servers:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

5. Open http://localhost:3000

### Docker Compose

```bash
docker compose up --build
```

This starts PostgreSQL, backend, frontend, Prometheus (port 9090), and Grafana (port 3001).

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Representative | rep@iter.com | password123 |
| Manager | manager@iter.com | password123 |
| Admin | admin@iter.com | password123 |

## Deployment

### Kubernetes
```bash
kubectl apply -f k8s/platform.yaml
```

### Terraform
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Monitoring

- **Prometheus**: http://localhost:9090 — Scrapes `/metrics` endpoint
- **Grafana**: http://localhost:3001 — Pre-configured dashboard (admin/admin)
- **Health Check**: GET `/health` returns API status

## Security Notes

Production deployments should use:
- Managed identity provider (Cognito/SSO)
- AWS Secrets Manager for credentials
- KMS envelope encryption for consent documents
- HTTPS with WAF
- Secret rotation policies
- Independent compliance validation package
