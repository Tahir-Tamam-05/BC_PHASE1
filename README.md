# NEVARA
Natural Earth Verification and Registry Authority

# BlueCarbon Ledger

A blockchain-based platform for tracking, verifying, and trading Blue Carbon Credits from ocean and coastal ecosystems.

## Live Platform

The NEVARA Blue Carbon Ledger is deployed on AWS EC2 for testing and demonstration.

🌐 **Live Demo**  
http://98.84.126.47:5000


## Demo Video

Watch the working demo of the NEVARA platform below.

🎥 **Project Demo Video**  
https://drive.google.com/file/d/1mCxiEBpeIh1VpflkyZDN8FDfo9IQbUlu/view

## Overview

BlueCarbon Ledger enables:

- **Tracking** blue carbon projects (mangroves, seagrass, salt marshes)
- **Calculating** carbon sequestration using scientific methodologies
- **Verifying** projects through expert reviewers
- **Recording** approved projects on an immutable blockchain
- **Enabling** transparent carbon credit trading

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, TanStack Query, shadcn/ui, Tailwind CSS, Leaflet |
| Backend | Node.js, Express.js, TypeScript, Drizzle ORM |
| Database | PostgreSQL (AWS RDS) |
| Storage | Google Cloud Storage |
| Authentication | JWT, bcrypt |

## Project Structure

```
BLUECARBONPROJECT-main/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components (shadcn/ui + custom)
│   │   ├── pages/             # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities, contexts
│   │   └── types/            # TypeScript definitions
│   └── index.html
├── server/                    # Express.js backend
│   ├── auth.ts              # JWT authentication
│   ├── blockchain.ts        # SHA-256 blockchain engine
│   ├── carbonCalculation.ts # Carbon calculator
│   ├── db.ts                # PostgreSQL connection
│   ├── routes.ts            # API endpoints
│   ├── storage.ts           # Storage abstraction
│   └── index.ts             # Server entry
├── shared/
│   └── schema.ts            # Drizzle ORM schemas
├── migrations/              # Database migrations
├── docs/                    # Documentation
└── .env                     # Environment config
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use AWS RDS)
- Google Cloud Storage bucket (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, JWT_SECRET

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| USE_DATABASE | Set to 'true' for PostgreSQL | Yes |
| JWT_SECRET | Secret key for JWT tokens | Yes |
| NODE_ENV | development/production | No |
| PORT | Server port (default: 5000) | No |

## User Roles

| Role | Dashboard | Permissions |
|------|-----------|--------------|
| admin | /admin | Full system control, user management, backup |
| verifier | /verifier | Project review, approval/rejection |
| contributor | /dashboard | Submit projects, view own projects |
| buyer | /marketplace | Purchase credits, view purchases |

## Key Features

### Blockchain Explorer
- View all blocks and transactions
- Verify hash integrity
- Public transparency

### Marketplace
- Browse verified projects
- Purchase carbon credits
- Filter by ecosystem type

### GIS Mapping
- Interactive land boundary mapping
- Polygon drawing tool
- Location visualization

### Certificate Generation
- PDF carbon offset certificates
- QR code verification
- Blockchain transaction linking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/profile` - Get current user

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/review` - Review project

### Blockchain
- `GET /api/blocks` - List blocks
- `GET /api/transactions` - List transactions
- `GET /api/export` - Export blockchain

### Marketplace
- `GET /api/marketplace` - List marketplace projects
- `POST /api/credits/purchase` - Purchase credits

## Database Schema

### Core Tables
- `users` - User accounts with roles
- `projects` - Blue carbon projects
- `transactions` - Blockchain transactions
- `blocks` - Blockchain blocks
- `creditTransactions` - Credit purchases
- `rewardTransactions` - Blue Points rewards
- `warnings` - Admin warnings
- `systemSettings` - System configuration

## Security

- JWT authentication
- bcrypt password hashing (12 rounds)
- Role-based access control
- Rate limiting (20 req/15min auth, 200 req/min API)
- Helmet security headers
- Audit logging

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# TypeScript check
npm run check
```

## License

MIT
