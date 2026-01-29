import { pgTable, text, varchar, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'admin' | 'verifier' | 'contributor' | 'buyer'
  username: text("username"), // Optional legacy field
  location: text("location"), // Location for buyers and contributors
  creditsPurchased: real("credits_purchased").default(0), // For buyers - total credits purchased
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, role: true, username: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects table
export const projects = pgTable("projects", {
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
  status: text("status").notNull(), // 'pending' | 'verified' | 'rejected'
  userId: varchar("user_id").notNull(),
  proofFileUrl: text("proof_file_url"),
  verifierId: varchar("verifier_id"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").notNull(),
});

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
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey(),
  txId: text("tx_id").notNull().unique(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  credits: real("credits").notNull(),
  projectId: varchar("project_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  proofHash: text("proof_hash").notNull(),
  blockId: varchar("block_id"),
});

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
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey(),
  buyerId: varchar("buyer_id").notNull(),
  contributorId: varchar("contributor_id").notNull(),
  projectId: varchar("project_id").notNull(),
  credits: real("credits").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;

// Credit purchase schema
export const creditPurchaseSchema = z.object({
  contributorId: z.string().min(1, "Contributor ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
  credits: z.number().positive("Credits must be positive"),
});
export type CreditPurchase = z.infer<typeof creditPurchaseSchema>;

// Login schema - now uses email instead of username
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Signup schema - requires name, Gmail address, password, and role selection
export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string()
    .email("Invalid email address")
    .refine((email) => email.endsWith('@gmail.com'), {
      message: "Please use a Gmail address (@gmail.com)",
    }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(['contributor', 'buyer'], {
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

// Approval/Rejection schema
export const projectReviewSchema = z.object({
  projectId: z.string(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});
export type ProjectReview = z.infer<typeof projectReviewSchema>;

// Hash verification schema
export const hashVerificationSchema = z.object({
  data: z.string(),
  expectedHash: z.string(),
});
export type HashVerification = z.infer<typeof hashVerificationSchema>;
