# BlueCarbon Ledger

## Overview

BlueCarbon Ledger is a blockchain-based blue carbon credit registry and marketplace that enables transparent tracking, verification, and trading of CO₂ absorption projects. The system implements a proof-of-authority blockchain with role-based access control, supporting four distinct user types: **Contributors** (organizations that create carbon capture projects), **Buyers** (entities that purchase carbon credits), **Verifiers** (review and approve projects), and **Administrators** (manage the system). All approved projects generate cryptographically signed transactions that are grouped into immutable blocks, creating a transparent and tamper-proof public ledger.

**User Registration:** New users sign up with Gmail addresses (@gmail.com) and choose their account type:
- **Contributor Account**: Submit and manage blue carbon projects
- **Buyer Account**: Browse verified projects and purchase carbon credits

Demo accounts remain available for testing all four user roles.

## Recent Changes (November 9, 2025)

### Replit Environment Setup Completed
- ✅ Extracted project from GitHub import ZIP file
- ✅ Installed Node.js 20 and all npm dependencies
- ✅ Configured Vite to work with Replit's proxy environment (host: 0.0.0.0, HMR on port 443)
- ✅ Connected to Replit's built-in PostgreSQL database
- ✅ Pushed database schema using Drizzle ORM
- ✅ Seeded database with demo users (admin, verifier, contributor, buyer)
- ✅ Set up workflow to run with `USE_DATABASE=true` environment variable
- ✅ Configured deployment settings (VM deployment for stateful blockchain application)
- ✅ Application running successfully on port 5000 with PostgreSQL storage

### Database Configuration
The application is now configured to use PostgreSQL database storage (Replit's built-in database):
- Environment variable: `USE_DATABASE=true` (set in workflow command)
- Database connection: Uses Neon serverless driver with WebSocket support
- Demo credentials available in database for testing all user roles

### File Upload Configuration
**Current Status:** File uploads are functional but object storage is not configured.

When users submit projects with proof documents:
- ✅ The application accepts submissions with or without files
- ⚠️  Files are validated for type (PDF, JPG, PNG, DOCX) but not permanently stored
- ⚠️  A warning is logged when object storage is not configured
- ✅ Projects can still be submitted and processed without file storage

**To Enable Full File Upload Support (Optional):**
1. Set up Replit's Object Storage integration
2. Configure the `PRIVATE_OBJECT_DIR` environment variable with your bucket path
3. Restart the application

For now, the application works fully for project submission, verification, and blockchain operations without file storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom ocean-themed design system

**Design Philosophy:**
The application follows a "futuristic minimalism with ocean immersion" design approach, inspired by Stripe's dashboard clarity, Linear's typography, and Coinbase's blockchain explorer patterns. Custom ocean-themed visual elements create an aquatic environment while maintaining clean data presentation.

**Component Architecture:**
- Reusable UI components built on Radix UI primitives (located in `client/src/components/ui/`)
- Custom application components for blockchain visualization (`BlockCard`, `HashDisplay`)
- Form handling with React Hook Form and Zod validation
- Theme provider for light/dark mode toggle
- Authentication context provider for user session management

**State Management:**
- TanStack Query handles all server state with automatic caching and background refetching
- React Context API for global auth and theme state
- Local component state for UI interactions
- Client-side session persistence via localStorage

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js framework
- TypeScript for type safety across the stack
- In-memory storage implementation (`MemStorage` class) for data persistence
- Vite integration for HMR during development

**API Design:**
RESTful API endpoints organized by domain:
- `/api/auth/*` - Authentication (login, signup with role selection)
- `/api/projects/*` - Project CRUD and review operations
- `/api/projects/marketplace` - Get all verified projects for buyers
- `/api/credits/purchase` - Purchase carbon credits from contributors (buyer role only)
- `/api/credits/purchases` - Get buyer's purchase history
- `/api/credits/sales` - Get contributor's sales history  
- `/api/transactions/*` - Transaction queries
- `/api/blocks/*` - Blockchain queries and export
- `/api/stats` - Dashboard statistics
- `/api/objects/*` - File upload handling

**Credit Purchase System:**
Atomic credit trading between buyers and contributors:
- Buyers purchase credits directly from verified projects owned by contributors
- Each purchase atomically updates buyer's `creditsPurchased`, decrements project's `creditsEarned`, and creates a `CreditTransaction` record
- Purchase history tracked separately from blockchain transactions for buyer-contributor relationship visibility
- Admin dashboard displays top buyers (by credits purchased) and top contributors (by credits earned)
- All purchases are buyer-role protected and validated for project ownership, verification status, and available credits

**Blockchain Implementation:**
Custom blockchain logic implementing:
- SHA-256 hashing for transaction IDs, Merkle roots, and block hashes
- Merkle tree construction for transaction verification
- Proof-of-Authority consensus with verifier signatures
- Block creation triggered by project approval
- Immutable block storage with chain validation
- **Hash Verification:** Each block stores `blockHashInput` - the exact pre-hash string used to create the block hash, enabling users to verify data integrity by copying the original data and confirming the hash matches

**Authentication & Authorization:**
- Role-based access control (admin, verifier, contributor, buyer)
- Hardcoded demo credentials for quick testing
- Session-based authentication with client-side token storage
- Route-level authorization checks

**Data Models:**
Defined in `shared/schema.ts` using Drizzle ORM schema:
- Users: username, password, email, role, name, location, creditsPurchased (buyers only)
- Projects: name, description, CO₂ captured, status, proof files, plantationType, creditsEarned (available for purchase)
- Transactions: txId, from/to addresses, credits, project reference, blockchain metadata
- CreditTransactions: buyer, contributor, project, credits, timestamp (tracks purchase relationships)
- Blocks: index, timestamp, transactions array, Merkle root, previous hash, block hash, blockHashInput (exact pre-hash string), validator signature

### Data Storage Solutions

**Current Implementation:**
In-memory storage using JavaScript Map objects for rapid prototyping:
- Separate maps for users, projects, transactions, and blocks
- Initialization with demo data (admin, verifier, sample users)
- Complete CRUD operations through `IStorage` interface

**Database Schema Preparation:**
Drizzle ORM schema defined for PostgreSQL migration:
- Schema located in `shared/schema.ts`
- Configuration in `drizzle.config.ts` for Neon Database serverless
- Migration scripts ready via `npm run db:push`
- Currently using `@neondatabase/serverless` driver

**Migration Path:**
The storage layer uses an interface pattern (`IStorage`) allowing seamless transition from in-memory to PostgreSQL by implementing the same interface with Drizzle queries.

### Authentication and Authorization

**Authentication Flow:**
1. **Signup (New Users):**
   - User provides full name, Gmail address, password (min 8 characters), and selects account type
   - Account types: **Contributor** (submit projects) or **Buyer** (purchase credits)
   - System validates Gmail requirement (must end with @gmail.com)
   - Password is hashed with bcrypt before storage
   - JWT token generated and returned
   - Contributors redirect to `/dashboard`, Buyers redirect to `/marketplace`
2. **Login (All Users):**
   - User submits email and password to `/api/auth/login`
   - Server validates credentials using bcrypt comparison
   - JWT token generated and user object returned (without password)
   - Client stores token and user in localStorage
   - Subsequent requests include authentication token
   - Auto-redirect based on role: Admin→`/admin`, Verifier→`/verifier`, Contributor→`/dashboard`, Buyer→`/marketplace`

**Authorization Model:**
Role-based access with four user types:
- **Contributor**: Submit blue carbon projects, view own projects and transactions, download certificates
- **Buyer**: Browse verified projects in marketplace, purchase carbon credits, view purchase history
- **Verifier**: Review pending projects, approve/reject with reasons, view assigned projects
- **Admin**: Assign verifiers to projects, view all system data, export blockchain

**Route Protection:**
Frontend `ProtectedRoute` component enforces role-based redirects, with fallback redirects based on user role to prevent unauthorized access.

## External Dependencies

### Third-Party UI Libraries
- **Radix UI**: Headless component primitives for accessibility (Dialog, Dropdown, Tooltip, etc.)
- **shadcn/ui**: Pre-built component library built on Radix
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography

### File Storage
- **Google Cloud Storage** (`@google-cloud/storage`): Object storage for project proof documents
- **Uppy** (`@uppy/core`, `@uppy/react`, `@uppy/aws-s3`): File upload UI and S3-compatible uploads
- Custom object storage service with ACL policy management (in `server/objectStorage.ts`)
- Replit Sidecar integration for credential management

### Form & Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for forms and API payloads
- **@hookform/resolvers**: Connects Zod schemas to React Hook Form

### Cryptography & Blockchain
- **js-sha256**: SHA-256 hashing for blockchain operations
- **crypto** (Node.js built-in): Random salt generation for transaction IDs
- Custom blockchain logic implementing Merkle trees and block validation

### Database & ORM
- **Drizzle ORM**: Type-safe SQL query builder
- **@neondatabase/serverless**: PostgreSQL driver for Neon Database
- **drizzle-kit**: Migration and schema push tooling
- Schema prepared but currently using in-memory storage

### Development Tools
- **Vite**: Build tool with HMR and optimized production builds
- **esbuild**: Fast JavaScript bundler for server code
- **tsx**: TypeScript execution for development server
- **@replit/vite-plugin-***: Development plugins for Replit environment

### Fonts
- **Inter**: Primary UI font
- **Space Grotesk**: Accent font for headings
- **JetBrains Mono**: Monospace font for technical data (hashes, transaction IDs)

### Session Management
- **connect-pg-simple**: PostgreSQL session store (configured but not actively used with current in-memory auth)