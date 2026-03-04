import { pgTable, text, varchar, integer, timestamp, real, index, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ENUM types for PostgreSQL
export const userRoleEnum = pgEnum("user_role", ["admin", "verifier", "contributor", "buyer"]);
export const projectStatusEnum = pgEnum("project_status", ["pending", "verified", "rejected", "needs_clarification"]);
export const certificateStatusEnum = pgEnum("certificate_status", ["valid", "revoked"]);

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(), // 'admin' | 'verifier' | 'contributor' | 'buyer'
  username: text("username"), // Optional legacy field
  location: text("location"), // Location for buyers and contributors
  creditsPurchased: real("credits_purchased").default(0), // For buyers - total credits purchased
  rewardPoints: real("reward_points").default(0), // For both - Blue Points reward
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, role: true, username: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects table
// Task 4.1: Added indexes on userId, status, verifierId for query performance
export const projects = pgTable(
  "projects",
  {
    id: varchar("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    area: real("area").notNull(), // in hectares
    ecosystemType: text("ecosystem_type").notNull(), // 'Mangrove' | 'Seagrass' | 'Salt Marsh' | 'Coastal' | 'Other'
    plantationType: text("plantation_type"), // Type of plantation for contributors
    annualCO2: real("annual_co2").notNull(), // calculated annual sequestration in tons
    lifetimeCO2: real("lifetime_co2").notNull(), // calculated 20-year total in tons
    co2Captured: real("co2_captured").notNull(), // legacy field, now same as lifetimeCO2
    creditsEarned: real("credits_earned").notNull().default(0), // Credits available for sale (initially = lifetimeCO2)
    // Task 2.1: Added 'needs_clarification' status
    status: projectStatusEnum("status").notNull(), // 'pending' | 'verified' | 'rejected' | 'needs_clarification'
    userId: varchar("user_id").notNull().references(() => users.id),
    proofFileUrl: text("proof_file_url"),
    verifierId: varchar("verifier_id").references(() => users.id),
    rejectionReason: text("rejection_reason"),
    clarificationNote: text("clarification_note"), // Task 2.1: Separate field for clarification messages
    submittedAt: timestamp("submitted_at").notNull(),
    landBoundary: text("land_boundary"), // GIS polygon coordinates as JSON string [[lat,lng], ...]
    isListed: boolean("is_listed").default(true), // Admin can soft delete/hide from marketplace
    deletedAt: timestamp("deleted_at"), // Soft delete timestamp
  },
  (table) => ({
    // Task 4.1: Performance indexes
    userIdIdx: index("projects_user_id_idx").on(table.userId),
    statusIdx: index("projects_status_idx").on(table.status),
    verifierIdIdx: index("projects_verifier_id_idx").on(table.verifierId),
  })
);

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  status: true,
  verifierId: true,
  rejectionReason: true,
  submittedAt: true,
  annualCO2: true,
  lifetimeCO2: true,
  co2Captured: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Transactions table (blockchain transactions)
// Task 4.1: Added indexes on projectId and blockId
export const transactions = pgTable(
  "transactions",
  {
    id: varchar("id").primaryKey(),
    txId: text("tx_id").notNull().unique(),
    from: text("from").notNull(),
    to: text("to").notNull(),
    credits: real("credits").notNull(),
    projectId: varchar("project_id").notNull().references(() => projects.id),
    timestamp: timestamp("timestamp").notNull(),
    proofHash: text("proof_hash").notNull(),
    blockId: varchar("block_id").references(() => blocks.id),
    // New fields for the unified ledger (Task: Admin Ledger)
    type: text("type"), // 'Mint' | 'Buy' | 'Sell' | 'Verify' | 'Rollback'
    buyerId: varchar("buyer_id").references(() => users.id),
    contributorId: varchar("contributor_id").references(() => users.id),
    status: text("status").default("Completed"),
  },
  (table) => ({
    projectIdIdx: index("transactions_project_id_idx").on(table.projectId),
    blockIdIdx: index("transactions_block_id_idx").on(table.blockId),
    toIdx: index("transactions_to_idx").on(table.to),
  })
);

export type Transaction = typeof transactions.$inferSelect;

// Blocks table (blockchain blocks)
export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey(),
  index: integer("index").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  merkleRoot: text("merkle_root").notNull(),
  previousHash: text("previous_hash").notNull(),
  blockHash: text("block_hash").notNull().unique(),
  blockHashInput: text("block_hash_input").notNull(),
  validatorSignature: text("validator_signature"),
  transactionCount: integer("transaction_count").notNull(),
});

export type Block = typeof blocks.$inferSelect;

// Credit Transactions table (tracks credit purchases between buyers and contributors)
// Task 4.1: Added indexes on buyerId, contributorId, projectId
// Task 3.1: Added certificateStatus field for revocation tracking
// Task 5.1: Added idempotencyKey for duplicate request protection
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: varchar("id").primaryKey(),
    idempotencyKey: varchar("idempotency_key"), // Optional unique key to prevent duplicate purchases
    buyerId: varchar("buyer_id").notNull().references(() => users.id),
    contributorId: varchar("contributor_id").notNull().references(() => users.id),
    projectId: varchar("project_id").notNull().references(() => projects.id),
    credits: real("credits").notNull(),
    amount: real("amount").default(0), // Total amount spent in USD
    timestamp: timestamp("timestamp").notNull(),
    certificateStatus: certificateStatusEnum("certificate_status").notNull().default("valid"), // "valid" | "revoked"
  },
  (table) => ({
    buyerIdIdx: index("credit_tx_buyer_id_idx").on(table.buyerId),
    contributorIdIdx: index("credit_tx_contributor_id_idx").on(table.contributorId),
    projectIdIdx: index("credit_tx_project_id_idx").on(table.projectId),
    idempotencyKeyUnique: uniqueIndex("credit_tx_idempotency_key_idx").on(table.idempotencyKey),
  })
);

export type CreditTransaction = typeof creditTransactions.$inferSelect;

// Reward Transactions table (immutable ledger for Blue Points)
// Task 6.1: Added for production-grade reward audit trail
export const rewardTransactions = pgTable(
  "reward_transactions",
  {
    id: varchar("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id),
    points: real("points").notNull(),
    type: text("type").notNull(), // "EARNED" | "REVERSAL"
    role: text("role").notNull(), // "BUYER" | "CONTRIBUTOR"
    sourceTransactionId: varchar("source_transaction_id").references(() => creditTransactions.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("reward_tx_user_id_idx").on(table.userId),
    sourceTxIdx: index("reward_tx_source_tx_idx").on(table.sourceTransactionId),
  })
);

export type RewardTransaction = typeof rewardTransactions.$inferSelect;

// Credit purchase schema
export const creditPurchaseSchema = z.object({
  contributorId: z.string().min(1, "Contributor ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
  credits: z.number().positive("Credits must be positive"),
  amount: z.number().nonnegative("Amount must be non-negative").optional(), // Added for Admin Ledger
  idempotencyKey: z.string().optional(), // Optional client-provided key for idempotency
});
export type CreditPurchase = z.infer<typeof creditPurchaseSchema>;

// Login schema - now uses email instead of username
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Task 1.4: Password complexity requirements
// Enforces: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
const passwordComplexitySchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character (e.g. !@#$%)"
  );

// Signup schema - requires name, Gmail address, password, and role selection
export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string()
    .email("Invalid email address")
    .refine((email) => email.endsWith("@gmail.com"), {
      message: "Please use a Gmail address (@gmail.com)",
    }),
  password: passwordComplexitySchema,
  role: z.enum(["contributor", "buyer"], {
    errorMap: () => ({ message: "Please select your account type" }),
  }),
});
export type SignupInput = z.infer<typeof signupSchema>;

// Project submission schema with validation
export const projectSubmissionSchema = insertProjectSchema.extend({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  area: z.number().positive("Area must be positive"),
  ecosystemType: z.enum(['Mangrove', 'Seagrass', 'Salt Marsh', 'Coastal', 'Other']),
});

// Task 2.1: Standardized rejection reason codes
export const REJECTION_REASON_CODES = [
  "INSUFFICIENT_DOCUMENTATION",
  "INVALID_GIS_BOUNDARY",
  "MRV_INCOMPLETE",
  "OWNERSHIP_UNCLEAR",
  "OTHER",
] as const;

export type RejectionReasonCode = (typeof REJECTION_REASON_CODES)[number];

// Approval/Rejection/Clarification schema
// Task 2.1: 'clarify' action now uses a dedicated clarificationNote field
export const projectReviewSchema = z.object({
  projectId: z.string(),
  action: z.enum(["approve", "reject", "clarify"]),
  rejectionReason: z.enum(REJECTION_REASON_CODES).optional(),
  comment: z.string().optional(),
  clarificationNote: z
    .string()
    .min(10, "Clarification note must be at least 10 characters")
    .optional(),
});
export type ProjectReview = z.infer<typeof projectReviewSchema>;

// Hash verification schema
export const hashVerificationSchema = z.object({
  data: z.string(),
  expectedHash: z.string(),
});
export type HashVerification = z.infer<typeof hashVerificationSchema>;

// ─── Audit Logs Table (Task 1.3) ──────────────────────────────────────────────
// Append-only tamper-resistant log of all sensitive actions.
// IMPORTANT: This table must NEVER have UPDATE or DELETE operations applied to it.
// Indexes on userId and actionType for admin queries; timestamp for chronological ordering.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id").primaryKey(),
    // The user who performed the action (null for system-initiated events)
    userId: varchar("user_id"),
    // Standardized action type — see AuditActionType below
    actionType: text("action_type").notNull(),
    // The type of entity this action was performed on
    entityType: text("entity_type").notNull(),
    // The ID of the entity (project ID, user ID, transaction ID, etc.)
    entityId: varchar("entity_id"),
    // Arbitrary JSON metadata (e.g. IP address, old/new values, reason codes)
    metadata: text("metadata"), // stored as JSON string
    // Immutable creation timestamp — set once, never updated
    timestamp: timestamp("timestamp").notNull(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    actionTypeIdx: index("audit_logs_action_type_idx").on(table.actionType),
    timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;

// Standardized action type constants — exhaustive list of all auditable events
export const AUDIT_ACTION_TYPES = {
  // Authentication
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  SIGNUP: "SIGNUP",

  // Project lifecycle
  PROJECT_SUBMITTED: "PROJECT_SUBMITTED",
  PROJECT_APPROVED: "PROJECT_APPROVED",
  PROJECT_REJECTED: "PROJECT_REJECTED",
  PROJECT_CLARIFICATION_REQUESTED: "PROJECT_CLARIFICATION_REQUESTED",

  // Credits & marketplace
  CREDITS_PURCHASED: "CREDITS_PURCHASED",
  REWARDS_ISSUED: "REWARDS_ISSUED",
  CERTIFICATE_ISSUED: "CERTIFICATE_ISSUED",
  CERTIFICATE_REVOKED: "CERTIFICATE_REVOKED",

  // Administration
  VERIFIER_ASSIGNED: "VERIFIER_ASSIGNED",
  ROLE_CHANGED: "ROLE_CHANGED",
} as const;

export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[keyof typeof AUDIT_ACTION_TYPES];

// ─── System Settings Table ──────────────────────────────────────────────────
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey(),
  mintingEnabled: boolean("minting_enabled").default(true),
});

export type SystemSettings = typeof systemSettings.$inferSelect;

// ─── Warnings Table ──────────────────────────────────────────────────────────
export const warnings = pgTable("warnings", {
  id: varchar("id").primaryKey(),
  contributorId: varchar("contributor_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  severity: text("severity").notNull(), // 'Low', 'Medium', 'Critical'
  date: timestamp("date").notNull().defaultNow(),
});

export type Warning = typeof warnings.$inferSelect;

// ─── Rollbacks Table ─────────────────────────────────────────────────────────
export const rollbacks = pgTable("rollbacks", {
  id: varchar("id").primaryKey(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  targetId: varchar("target_id").notNull(),
  type: text("type").notNull(), // 'Credit mint', 'Transaction', 'Marketplace listing'
  reason: text("reason").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type Rollback = typeof rollbacks.$inferSelect;
