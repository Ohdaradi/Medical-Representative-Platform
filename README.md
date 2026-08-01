# ITER Pharmaceuticals Medical Representative Platform

A full-stack field operations platform for pharmaceutical medical representatives, managers, and administrators. It combines role-based workflows for doctors, visits, orders, samples, reporting, notifications, and audit tracking in one system.

## Overview

This project provides a modern digital workflow for pharmaceutical sales operations, including:

- secure authentication and role-based access control
- doctor and territory management
- visit tracking with GPS-based check-in/check-out workflows
- order and sample handling
- manager analytics and operational reporting
- monitoring, containerization, and infrastructure automation

## Key capabilities

- Authentication and user management with JWT-based sessions
- Doctor management with search, filters, and relationship context
- Territory management with coverage and assignment workflows
- Visit management for eDCR-style execution and tracking
- Order and sample workflows with stock and status handling
- Dashboard analytics for operations and performance visibility
- Notifications, reports, and audit logging

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Security | JWT, bcrypt, Helmet, rate limiting |
| Reporting | PDF generation and CSV export support |
| Monitoring | Prometheus, Grafana |
| DevOps | Docker Compose, Kubernetes manifests, Terraform |

## Repository structure

```text
backend/       # Express + Prisma API
frontend/      # React + Vite UI
k8s/           # Kubernetes deployment manifests
monitoring/    # Prometheus and Grafana configuration
terraform/     # Infrastructure-as-code templates
```

## Quick start

### Prerequisites

- Node.js 20+
- Docker Desktop (recommended for the full stack)
- PostgreSQL 16+ if you plan to run services locally without Docker

### Option 1: Docker Compose (recommended)

1. Clone the repository
2. Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

3. Start the full stack:

```bash
docker compose up --build
```

This starts:

- frontend: http://localhost:3000
- backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

### Option 2: Local development

1. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure environment variables in backend/.env.

3. Apply database migrations and seed initial data:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

4. Start the services in separate terminals:

```bash
# Terminal 1
cd backend && npm run dev
```

```bash
# Terminal 2
cd frontend && npm run dev
```

5. Open http://localhost:3000 in your browser.

## Environment variables

The backend expects a file named backend/.env with values such as:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iter_pharma
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

The sample file is already available at backend/.env.example.

## Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Representative | rep@iter.com | password123 |
| Manager | manager@iter.com | password123 |
| Admin | admin@iter.com | password123 |

## Deployment options

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

## Monitoring and health checks

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Health endpoint: GET /health
- Metrics endpoint: GET /metrics

## Security notes

For production deployments, use:

- strong secrets and rotation policies
- HTTPS and a WAF in front of the application
- managed identity or SSO where possible
- encrypted storage for sensitive operational data
- regular dependency and vulnerability review

## License

This project is intended as a demonstration and platform prototype. Adapt and extend it for your own environment and compliance needs.
