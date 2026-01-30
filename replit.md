# BlueCarbon Ledger

## Overview

BlueCarbon Ledger is a blockchain-based blue carbon credit registry and marketplace that enables transparent tracking, verification, and trading of CO₂ absorption projects. The platform connects contributors (farmers/landowners) who submit blue carbon projects with buyers (companies/NGOs) who purchase carbon credits, all verified through a blockchain-backed system with cryptographic proof of transactions.

The application implements a multi-role system with four user types: Admin, Verifier, Contributor, and Buyer. Contributors submit projects with GIS-based land mapping, verifiers approve or reject submissions, and approved projects generate blockchain transactions that are grouped into immutable blocks with Merkle roots for tamper-proof verification.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with hot module replacement configured for Replit's proxy environment
- **Styling**: Tailwind CSS with custom ocean-themed design system (HSL color variables)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **State Management**: TanStack React Query for server state, React Context for auth/theme
- **Routing**: Wouter (lightweight React router)
- **Forms**: React Hook Form with Zod validation
- **Maps**: Leaflet with React-Leaflet and Leaflet-Draw for GIS polygon mapping

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: JWT-based with bcrypt password hashing
- **File Uploads**: Multer for memory storage, optional Google Cloud Storage integration
- **API Pattern**: RESTful endpoints with role-based access control middleware

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (Neon serverless driver with WebSocket support)
- **Schema**: Shared TypeScript schema definitions in `/shared/schema.ts`
- **Validation**: Zod schemas generated from Drizzle table definitions

### Blockchain Implementation
- **Hashing**: SHA-256 for transaction IDs, block hashes, and proof hashes
- **Block Structure**: Index, timestamp, transactions array, Merkle root, previous hash, validator signature, block hash
- **Merkle Tree**: Binary tree of transaction hashes for integrity verification
- **Proof-of-Authority**: Verifier signature validation

### Role-Based Access Control
- **Admin**: Full system access, user management, blockchain monitoring
- **Verifier**: Review and approve/reject project submissions
- **Contributor**: Submit blue carbon projects with GIS land mapping
- **Buyer**: Browse marketplace and purchase carbon credits

### GIS Integration
- Interactive polygon drawing for land boundary mapping
- Automatic area calculation from drawn polygons (spherical geometry)
- Read-only boundary visualization for verifiers
- Coordinates stored as JSON string in project records

## External Dependencies

### Database
- **PostgreSQL**: Primary data storage via Neon serverless driver
- **Drizzle Kit**: Schema migrations with `npm run db:push`

### Cloud Storage (Optional)
- **Google Cloud Storage**: Document uploads via Replit's object storage integration
- **Supabase Storage**: Alternative for proof document storage with signed URLs

### Third-Party Services
- **Supabase**: Optional external PostgreSQL hosting alternative
- **Google Fonts**: Inter, Space Grotesk, JetBrains Mono typefaces

### Key NPM Packages
- `@neondatabase/serverless`: PostgreSQL connection with WebSocket support
- `drizzle-orm`: Type-safe database queries
- `jsonwebtoken`: JWT token generation and verification
- `bcryptjs`: Password hashing
- `js-sha256`: Cryptographic hashing for blockchain
- `leaflet` / `react-leaflet`: Interactive mapping
- `@tanstack/react-query`: Server state management
- `zod`: Runtime type validation

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `USE_DATABASE`: Set to "true" to enable PostgreSQL storage
- `JWT_SECRET`: Secret key for JWT signing (defaults to dev secret)
- `PRIVATE_OBJECT_DIR`: Optional path for object storage bucket