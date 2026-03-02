import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { loginSchema, signupSchema, projectReviewSchema, projectSubmissionSchema, creditPurchaseSchema, AUDIT_ACTION_TYPES, type Project, type Transaction } from "@shared/schema";
import { generateToken, requireAuth, requireRole, type AuthRequest } from "./auth";
import {
  computeTransactionId,
  computeProofHash,
  computeMerkleRoot,
  computeBlockHash,
  generateValidatorSignature,
} from "./blockchain";
import { sha256 } from "js-sha256";
import { calculateCarbonSequestration } from "./carbonCalculation";
import { audit } from "./auditLog";

// UUID validation regex - matches standard UUID format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

// ─── Fallback for turf ────────────────────────────────────────────────────────
let turf: any = null;
try {
  turf = require("@turf/turf");
} catch (e) {
  try {
    turf = require("turf");
  } catch (e2) {
    import("@turf/turf").then(m => {
      turf = m;
      console.log("✅ GIS: turf loaded via dynamic import");
    }).catch(() => {
      console.warn("⚠️ GIS libraries not found. Overlap detection will be disabled.");
    });
  }
}

setTimeout(() => {
  if (turf) {
    console.log("✅ GIS: turf library is active");
  } else {
    console.warn("❌ GIS: turf library failed to initialize");
  }
}, 1000);

// ─── Configure multer ─────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// ─── Account Lockout Store (Task 1.1) ─────────────────────────────────────────
// In-memory store: email → { count, lockedUntil }
// This is intentionally in-memory so it resets on server restart (acceptable for
// a single-instance deployment; replace with Redis for multi-instance).
interface LockoutEntry {
  count: number;
  lockedUntil: number | null; // Unix timestamp ms, null = not locked
}

const loginAttempts = new Map<string, LockoutEntry>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getLoginAttempts(email: string): LockoutEntry {
  return loginAttempts.get(email) ?? { count: 0, lockedUntil: null };
}

function recordFailedAttempt(email: string): LockoutEntry {
  const entry = getLoginAttempts(email);
  const newCount = entry.count + 1;
  const lockedUntil =
    newCount >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null;
  const updated: LockoutEntry = { count: newCount, lockedUntil };
  loginAttempts.set(email, updated);
  return updated;
}

function resetLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

function isAccountLocked(email: string): { locked: boolean; remainingMs: number } {
  const entry = getLoginAttempts(email);
  if (!entry.lockedUntil) return { locked: false, remainingMs: 0 };
  const remaining = entry.lockedUntil - Date.now();
  if (remaining <= 0) {
    // Lock has expired — reset
    loginAttempts.delete(email);
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs: remaining };
}

// ─── In-Memory Cache (Task 7.3) ───────────────────────────────────────────────
// Simple TTL cache for high-traffic read endpoints.
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

const cache = new SimpleCache();
const CACHE_TTL_MARKETPLACE = 60 * 1000;  // 60 seconds
const CACHE_TTL_STATS = 5 * 60 * 1000;    // 5 minutes

// GIS Utility functions
function isOverlapping(newCoords: number[][], existingProjects: any[]): string | null {
  if (!turf) return null;
  try {
    if (!newCoords || newCoords.length < 3) return null;

    // Convert new coordinates to a Turf polygon
    // Leaflet uses [lat, lng], Turf uses [lng, lat]
    const newPolygon = turf.polygon([
      [...newCoords.map(c => [c[1], c[0]]), [newCoords[0][1], newCoords[0][0]]]
    ]);

    for (const project of existingProjects) {
      if (!project.landBoundary || project.status !== 'verified') continue;

      try {
        const existingCoords = JSON.parse(project.landBoundary);
        if (!existingCoords || existingCoords.length < 3) continue;

        const existingPolygon = turf.polygon([
          [...existingCoords.map((c: any) => [c[1], c[0]]), [existingCoords[0][1], existingCoords[0][0]]]
        ]);

        if (turf.booleanIntersects(newPolygon, existingPolygon)) {
          return project.name;
        }
      } catch (e) {
        console.error("Error parsing existing boundary:", e);
      }
    }
  } catch (e) {
    console.error("Error in overlap detection:", e);
  }
  return null;
}

function calculateGisArea(coords: number[][]): number {
  if (!turf) return 0;
  try {
    if (!coords || coords.length < 3) return 0;
    const polygon = turf.polygon([
      [...coords.map(c => [c[1], c[0]]), [coords[0][1], coords[0][0]]]
    ]);
    const areaSqMeters = turf.area(polygon);
    return areaSqMeters / 10000; // Convert to hectares
  } catch (e) {
    console.error("Error calculating GIS area:", e);
    return 0;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ─── HEALTH CHECK (Task 5.2) ────────────────────────────────────────────────
  app.get("/health", async (_req, res) => {
    try {
      // Verify DB connectivity by running a lightweight query
      await storage.getAllBlocks();
      return res.json({
        status: "ok",
        db: "connected",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (err: any) {
      return res.status(503).json({
        status: "degraded",
        db: "error",
        error: err.message,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ─── AUTH ROUTES - Public ───────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";

      // ── Account Lockout Check (Task 1.1) ──────────────────────────────────
      const lockStatus = isAccountLocked(email);
      if (lockStatus.locked) {
        const remainingMinutes = Math.ceil(lockStatus.remainingMs / 60000);
        // Audit: account was locked when login was attempted
        await audit({
          userId: null,
          actionType: AUDIT_ACTION_TYPES.ACCOUNT_LOCKED,
          entityType: "user",
          entityId: null,
          metadata: { email, ip, remainingMs: lockStatus.remainingMs },
        });
        return res.status(429).json({
          error: `Account temporarily locked due to too many failed login attempts. Try again in ${remainingMinutes} minute(s).`,
          lockedFor: lockStatus.remainingMs,
        });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        recordFailedAttempt(email);
        // Audit: login failure (unknown email)
        await audit({
          userId: null,
          actionType: AUDIT_ACTION_TYPES.LOGIN_FAILURE,
          entityType: "user",
          entityId: null,
          metadata: { email, ip, reason: "user_not_found" },
        });
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Compare hashed passwords
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        const attempt = recordFailedAttempt(email);
        const remaining = MAX_FAILED_ATTEMPTS - attempt.count;
        const isNowLocked = attempt.count >= MAX_FAILED_ATTEMPTS;
        // Audit: login failure (wrong password) — also log if account just got locked
        await audit({
          userId: user.id,
          actionType: isNowLocked
            ? AUDIT_ACTION_TYPES.ACCOUNT_LOCKED
            : AUDIT_ACTION_TYPES.LOGIN_FAILURE,
          entityType: "user",
          entityId: user.id,
          metadata: {
            ip,
            failedAttempts: attempt.count,
            reason: "invalid_password",
            accountLocked: isNowLocked,
          },
        });
        const message = isNowLocked
          ? "Account locked for 15 minutes due to too many failed attempts."
          : `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`;
        return res.status(401).json({ error: message });
      }

      // Successful login — reset lockout counter
      resetLoginAttempts(email);

      // Audit: successful login
      await audit({
        userId: user.id,
        actionType: AUDIT_ACTION_TYPES.LOGIN_SUCCESS,
        entityType: "user",
        entityId: user.id,
        metadata: { ip, role: user.role },
      });

      // Generate JWT token
      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        message: "Login successful",
        token,
        user: userWithoutPassword,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);

      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create user with hashed password
      const user = await storage.createUser(data);
      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      // Audit: new user signup
      await audit({
        userId: user.id,
        actionType: AUDIT_ACTION_TYPES.SIGNUP,
        entityType: "user",
        entityId: user.id,
        metadata: { role: user.role, ip: req.ip ?? "unknown" },
      });

      return res.json({
        message: "Account created successfully",
        token,
        user: userWithoutPassword,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/auth/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/debug/users", requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      return res.json(allUsers.map(u => {
        const { password: _, ...rest } = u;
        return rest;
      }));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ─── ROLE CHANGE ROUTE (ADMIN ONLY) ───────────────────────────────────────────
  app.patch("/api/users/:id/role", requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      const allowedRoles = ['admin', 'verifier', 'contributor', 'buyer'];
      if (!role || !allowedRoles.includes(role)) {
        return res.status(400).json({
          error: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
        });
      }

      // Get existing user
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const oldRole = existingUser.role;

      // Don't allow changing own role (prevent lockout)
      if (id === req.user.id) {
        return res.status(400).json({ error: "Cannot change your own role" });
      }

      // Update user role
      const updatedUser = await storage.updateUser(id, { role });
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user role" });
      }

      // Audit: role changed
      await audit({
        userId: req.user.id,
        actionType: AUDIT_ACTION_TYPES.ROLE_CHANGED,
        entityType: "user",
        entityId: id,
        metadata: {
          targetUserEmail: existingUser.email,
          oldRole,
          newRole: role,
        },
      });

      return res.json({
        message: "Role updated successfully",
        user: { ...updatedUser, password: undefined }
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      // ── Cached stats (Task 7.3) ──────────────────────────────────────────
      const CACHE_KEY = "stats:global";
      const cached = cache.get<object>(CACHE_KEY);
      if (cached) return res.json(cached);

      const projects = await storage.getAllProjects();
      const totalProjects = projects.length;
      const verifiedProjects = projects.filter(p => p.status === "verified").length;
      const totalCO2Captured = projects
        .filter(p => p.status === "verified")
        .reduce((sum, p) => sum + p.co2Captured, 0);

      const result = { totalProjects, verifiedProjects, totalCO2Captured };
      cache.set(CACHE_KEY, result, CACHE_TTL_STATS);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // PROJECT SUBMISSION - Protected route with optional file upload
  app.post("/api/projects", requireAuth, upload.single('proof'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Day 4: Project Freeze - Check for "Under Review" (pending) status
      // In this system, once submitted it's "pending". If we want to freeze edits, 
      // we check if a project with this ID (if it was an update) or similar logic applies.
      // Since this is a POST (new submission), we don't freeze the creation.
      // However, if we had a PUT /api/projects/:id, we would check status.

      // Parse form data
      const projectData = {
        name: req.body.name,
        description: req.body.description,
        location: req.body.location,
        area: parseFloat(req.body.area),
        ecosystemType: req.body.ecosystemType,
        userId: req.user.id, // Use authenticated user's ID
        proofFileUrl: null as string | null,
        landBoundary: req.body.landBoundary || null, // GIS polygon coordinates
      };

      // Validate project data
      const validated = projectSubmissionSchema.parse(projectData);

      // Day 5: GIS Overlap Detection
      if (projectData.landBoundary) {
        try {
          const newCoords = JSON.parse(projectData.landBoundary);
          const allProjects = await storage.getAllProjects();
          const overlappingProjectName = isOverlapping(newCoords, allProjects);

          if (overlappingProjectName) {
            return res.status(400).json({
              error: `GIS Overlap Detected: The selected area overlaps with an existing verified project ("${overlappingProjectName}"). Please adjust your boundaries.`
            });
          }

          // Day 6: GIS Area Cross-Validation
          const calculatedArea = calculateGisArea(newCoords);
          const declaredArea = validated.area;
          const variance = Math.abs(calculatedArea - declaredArea) / (declaredArea || 1);

          if (variance > 0.15) { // 15% threshold
            console.warn(`GIS Area Variance Alert: Declared ${declaredArea}ha vs Calculated ${calculatedArea.toFixed(2)}ha`);
            // Add a temporary flag to the project name or description to alert the verifier
            if (req.body.description) {
              projectData.description = `[GIS AREA VARIANCE: ${calculatedArea.toFixed(2)}ha] ${req.body.description}`;
            }
          }
        } catch (e) {
          console.error("GIS validation error:", e);
        }
      }

      // Calculate carbon sequestration based on area, ecosystem, and location
      const { annualCO2, lifetimeCO2 } = calculateCarbonSequestration(
        validated.area,
        validated.ecosystemType,
        validated.location
      );

      // Handle optional file upload
      if (req.file) {
        // Validate file type
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
          'application/msword', // DOC
        ];

        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            error: "Invalid file type. Only PDF, JPG, PNG, and DOCX files are allowed."
          });
        }

        // Check if object storage is configured
        const isObjectStorageConfigured = process.env.PRIVATE_OBJECT_DIR;

        if (isObjectStorageConfigured) {
          try {
            const objectStorage = new ObjectStorageService();
            const fileName = `proof-${Date.now()}-${req.file.originalname}`;
            const uploadedUrl = await objectStorage.uploadToPrivate(
              fileName,
              req.file.buffer,
              req.file.mimetype
            );
            validated.proofFileUrl = uploadedUrl;
          } catch (uploadError: any) {
            console.error("File upload error:", uploadError);
            return res.status(500).json({
              error: uploadError.message || "Failed to upload proof document"
            });
          }
        } else {
          // Object storage not configured - log warning and skip file upload
          console.warn("⚠️  Object storage not configured. Proof document will not be saved. To enable file uploads, set up object storage and configure PRIVATE_OBJECT_DIR environment variable.");
          // Leave proofFileUrl as null (already set in projectData initialization)
        }
      }

      // Create project with calculated carbon values
      const projectWithCarbon = {
        ...validated,
        annualCO2,
        lifetimeCO2,
        co2Captured: lifetimeCO2, // Legacy field, same as lifetime
        landBoundary: projectData.landBoundary, // GIS polygon data
      };

      const project = await storage.createProject(projectWithCarbon);

      // Audit: project submitted
      await audit({
        userId: req.user.id,
        actionType: AUDIT_ACTION_TYPES.PROJECT_SUBMITTED,
        entityType: "project",
        entityId: project.id,
        metadata: {
          projectName: project.name,
          ecosystemType: project.ecosystemType,
          area: project.area,
          lifetimeCO2: project.lifetimeCO2,
        },
      });

      return res.json({
        message: "Project submitted successfully",
        project,
        carbonCalculation: {
          annualCO2,
          lifetimeCO2,
        }
      });
    } catch (error: any) {
      console.error("Project submission error:", error);
      return res.status(400).json({ error: error.message || "Failed to submit project" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const { limit, offset } = parsePaginationParams(req);
      const allProjects = await storage.getAllProjects();
      const total = allProjects.length;
      
      // Sort by submittedAt descending (newest first)
      const sorted = [...allProjects].sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      const paginatedProjects = sorted.slice(offset, offset + limit);
      
      return res.json({
        data: paginatedProjects,
        pagination: getPaginationMeta(total, limit, offset),
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Get current user's projects - Protected
  app.get("/api/projects/my", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const projects = await storage.getProjectsByUserId(req.user.id);
      return res.json(projects);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Get pending projects - Protected (verifier only)
  app.get("/api/projects/pending", requireAuth, requireRole('verifier', 'admin'), async (req, res) => {
    try {
      const projects = await storage.getProjectsByStatus('pending');
      return res.json(projects);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Get verifier's assigned reviews - Protected (verifier/admin only)
  app.get("/api/projects/my-reviews", requireAuth, requireRole('verifier', 'admin'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      console.log("Fetching history for verifier:", req.user.id);
      const projects = await storage.getVerifiedProjectsByVerifierId(req.user.id);
      console.log("Projects found:", projects.length);
      return res.json(projects);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/projects/:id/assign", async (req, res) => {
    try {
      const { id } = req.params;
      const { verifierId } = req.body;

      const updated = await storage.updateProject(id, { verifierId });

      // Audit: verifier assigned to project
      await audit({
        userId: null, // Admin action — no auth middleware on this route currently
        actionType: AUDIT_ACTION_TYPES.VERIFIER_ASSIGNED,
        entityType: "project",
        entityId: id,
        metadata: { verifierId },
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/review", requireAuth, requireRole("verifier", "admin"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { action, rejectionReason, comment, clarificationNote } = projectReviewSchema.parse({
        projectId: id,
        ...req.body,
      });

      // Day 4: Check if minting is enabled before approving
      if (action === "approve") {
        const mintingEnabled = await storage.getMintingStatus();
        if (!mintingEnabled) {
          return res.status(403).json({
            error: "Minting temporarily disabled by admin. Approval not allowed at this time.",
            mintingEnabled: false
          });
        }
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // ── Verifier Conflict of Interest Check ──────────────────────────────
      if (req.user?.id === project.userId && req.user?.role !== "admin") {
        console.warn(
          `COI attempt: User ${req.user.id} tried to verify their own project ${id}`
        );
        return res.status(403).json({
          error: "Conflict of Interest: Verifiers cannot verify their own projects.",
        });
      }

      // ── Task 2.3: Project Freeze — block reviews on already-verified projects ──
      if (project.status === "verified") {
        return res.status(400).json({
          error: "Cannot review a project that is already verified. Revoke verification first.",
        });
      }

      // ── Reject action ─────────────────────────────────────────────────────
      if (action === "reject") {
        if (!rejectionReason) {
          return res.status(400).json({
            error: "A rejection reason code is required when rejecting a project.",
          });
        }
        await storage.updateProject(id, {
          status: "rejected",
          rejectionReason: rejectionReason + (comment ? `: ${comment}` : ""),
          clarificationNote: null,
          verifierId: req.user?.id,
        });
        // Audit: project rejected
        await audit({
          userId: req.user?.id,
          actionType: AUDIT_ACTION_TYPES.PROJECT_REJECTED,
          entityType: "project",
          entityId: id,
          metadata: {
            projectName: project.name,
            contributorId: project.userId,
            rejectionReason,
            comment: comment ?? null,
          },
        });
        return res.json({ success: true, message: "Project rejected" });
      }

      // ── Task 2.1: Clarify action — uses dedicated needs_clarification status ──
      if (action === "clarify") {
        if (!clarificationNote) {
          return res.status(400).json({
            error: "A clarification note is required when requesting clarification.",
          });
        }
        await storage.updateProject(id, {
          status: "needs_clarification",
          clarificationNote,
          rejectionReason: null,
          verifierId: req.user?.id,
        });
        // Audit: clarification requested
        await audit({
          userId: req.user?.id,
          actionType: AUDIT_ACTION_TYPES.PROJECT_CLARIFICATION_REQUESTED,
          entityType: "project",
          entityId: id,
          metadata: {
            projectName: project.name,
            contributorId: project.userId,
            clarificationNote,
          },
        });
        return res.json({
          success: true,
          message: "Clarification requested. The contributor has been notified.",
        });
      }

      // ── Task 2.3: Only allow approval if project is in a reviewable state ──
      if (project.status !== "pending" && project.status !== "needs_clarification") {
        return res.status(400).json({
          error: `Cannot approve a project with status '${project.status}'.`,
        });
      }

      const timestamp = new Date();
      const txId = computeTransactionId({
        projectId: project.id,
        userId: project.userId,
        credits: project.co2Captured,
        timestamp,
      });

      const proofHash = computeProofHash(project.proofFileUrl || '');

      const transaction = await storage.createTransaction({
        txId,
        from: 'system',
        to: project.userId,
        credits: project.co2Captured,
        projectId: project.id,
        timestamp,
        proofHash,
        blockId: null,
        status: 'Completed',
        type: 'Mint',
        buyerId: null,
        contributorId: project.userId,
      });

      const pendingTransactions = await storage.getAllTransactions();
      const unblocked = pendingTransactions.filter(tx => !tx.blockId);

      if (unblocked.length >= 1) {
        const lastBlock = await storage.getLastBlock();
        const blockIndex = lastBlock ? lastBlock.index + 1 : 0;
        const previousHash = lastBlock ? lastBlock.blockHash : '0000000000000000';

        const txIds = unblocked.map(tx => tx.txId);
        const merkleRoot = computeMerkleRoot(txIds);

        const blockTimestamp = new Date();
        const { hash: blockHash, input: blockHashInput } = computeBlockHash({
          index: blockIndex,
          timestamp: blockTimestamp,
          merkleRoot,
          previousHash,
          transactionCount: unblocked.length,
        });

        const validatorSignature = generateValidatorSignature(blockHash, project.verifierId || 'system');

        const block = await storage.createBlock({
          index: blockIndex,
          timestamp: blockTimestamp,
          merkleRoot,
          previousHash,
          blockHash,
          blockHashInput,
          validatorSignature,
          transactionCount: unblocked.length,
        });

        for (const tx of unblocked) {
          await storage.updateTransaction(tx.id, { blockId: block.id });
        }
      }

      await storage.updateProject(id, {
        status: "verified",
        creditsEarned: project.lifetimeCO2,
        verifierId: req.user?.id,
      });

      // Invalidate marketplace cache so buyers see the newly verified project
      cache.invalidate("marketplace:verified-projects");
      cache.invalidate("stats:global");

      // Audit: project approved
      await audit({
        userId: req.user?.id,
        actionType: AUDIT_ACTION_TYPES.PROJECT_APPROVED,
        entityType: "project",
        entityId: id,
        metadata: {
          projectName: project.name,
          contributorId: project.userId,
          creditsIssued: project.lifetimeCO2,
          transactionId: transaction.txId,
        },
      });

      return res.json({ success: true, transaction });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id/certificate", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);

      if (!project || project.status !== 'verified') {
        return res.status(404).json({ error: "Verified project not found" });
      }

      const transactions = await storage.getAllTransactions();
      const tx = transactions.find(t => t.projectId === id);

      const blocks = await storage.getAllBlocks();
      const block = tx && tx.blockId ? blocks.find(b => b.id === tx.blockId) : undefined;

      const certificate = {
        projectName: project.name,
        projectDescription: project.description,
        co2Captured: project.co2Captured,
        status: project.status,
        submittedAt: project.submittedAt,
        transactionId: tx?.txId || "N/A",
        blockHash: block?.blockHash || "N/A",
        blockIndex: block?.index,
        issuedAt: new Date().toISOString(),
        certificateId: `BC-${project.id}`,
      };

      // Audit: certificate issued (accessed)
      // Note: this endpoint is public — userId may be null for unauthenticated access
      await audit({
        userId: null,
        actionType: AUDIT_ACTION_TYPES.CERTIFICATE_ISSUED,
        entityType: "project",
        entityId: id,
        metadata: {
          certificateId: certificate.certificateId,
          projectName: project.name,
          co2Captured: project.co2Captured,
          transactionId: certificate.transactionId,
        },
      });

      return res.json(certificate);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ─── PUBLIC CERTIFICATE VERIFICATION ENDPOINT (Task 1.5) ───────────────────────
  app.get("/verify/:certificateId", async (req, res) => {
    try {
      const { certificateId } = req.params;

      // Parse certificate ID (format: BCL-YYYY-XXXXXX)
      const certIdMatch = certificateId.match(/^BCL-(\d{4})-(\d+)$/);
      if (!certIdMatch) {
        return res.status(400).json({
          error: "Invalid certificate ID format",
          status: "Invalid"
        });
      }

      const year = parseInt(certIdMatch[1], 10);
      const sequence = parseInt(certIdMatch[2], 10);

      // Find credit transaction by reconstructing the ID from sequence
      // The certificate ID format is BCL-{year}-{sequence} where sequence is derived from purchase.id
      // We need to find the purchase by matching the sequence
      const allTransactions = await storage.getAllCreditTransactions();

      let matchingTx: any = null;
      for (const tx of allTransactions) {
        const txSeq = String(tx.id).slice(-6).padStart(6, '0');
        if (txSeq === certIdMatch[2]) {
          matchingTx = tx;
          break;
        }
      }

      if (!matchingTx) {
        return res.status(404).json({
          error: "Certificate not found",
          status: "Not Found"
        });
      }

      // Get related data
      const buyer = await storage.getUser(matchingTx.buyerId);
      const contributor = await storage.getUser(matchingTx.contributorId);
      const project = await storage.getProject(matchingTx.projectId);

      if (!buyer || !project) {
        return res.status(404).json({
          error: "Certificate data not found",
          status: "Not Found"
        });
      }

      // Determine status based on certificateStatus field
      const status = matchingTx.certificateStatus === 'revoked' ? 'REVOKED' : 'Valid';

      return res.json({
        certificateId: `BCL-${year}-${certIdMatch[2]}`,
        status,
        projectName: project.name,
        buyerName: buyer.name,
        creditsPurchased: matchingTx.credits,
        issueDate: matchingTx.timestamp,
        projectLocation: project.location,
        ecosystemType: project.ecosystemType,
        transactionId: matchingTx.id,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ─── PAGINATION HELPERS ───────────────────────────────────────────────────────
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;

  function parsePaginationParams(req: any) {
    const limit = Math.min(
      parseInt(req.query.limit) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const offset = parseInt(req.query.offset) || 0;
    return { limit, offset };
  }

  function getPaginationMeta(total: number, limit: number, offset: number) {
    return {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  app.get("/api/transactions", async (req, res) => {
    try {
      const { limit, offset } = parsePaginationParams(req);
      const allTransactions = await storage.getAllTransactions();
      const total = allTransactions.length;
      
      // Sort by timestamp descending (newest first)
      const sorted = [...allTransactions].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const paginatedTransactions = sorted.slice(offset, offset + limit);
      
      return res.json({
        data: paginatedTransactions,
        pagination: getPaginationMeta(total, limit, offset),
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/my", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const transactions = await storage.getTransactionsByUserId(req.user.id);
      return res.json(transactions);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blocks", async (req, res) => {
    try {
      const { limit, offset } = parsePaginationParams(req);
      const allBlocks = await storage.getAllBlocks();
      const total = allBlocks.length;
      
      // Sort by index descending (newest first)
      const sorted = [...allBlocks].sort((a, b) => b.index - a.index);
      
      const paginatedBlocks = sorted.slice(offset, offset + limit);
      
      return res.json({
        data: paginatedBlocks,
        pagination: getPaginationMeta(total, limit, offset),
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blockchain/export", async (_req, res) => {
    try {
      const blocks = await storage.getAllBlocks();
      const transactions = await storage.getAllTransactions();
      const projects = await storage.getAllProjects();

      // ── Real Blockchain Integrity Validation (Task 5.1) ──────────────────
      // Validate the entire chain by recomputing each block's hash from its
      // stored blockHashInput and verifying the previousHash linkage.
      let integrityStatus: "verified" | "tampered" = "verified";
      const integrityErrors: string[] = [];

      const sortedBlocks = [...blocks].sort((a, b) => a.index - b.index);

      for (let i = 0; i < sortedBlocks.length; i++) {
        const block = sortedBlocks[i];

        // 1. Recompute hash from stored input and compare
        const recomputedHash = sha256(block.blockHashInput);
        if (recomputedHash !== block.blockHash) {
          integrityStatus = "tampered";
          integrityErrors.push(
            `Block #${block.index}: hash mismatch. Expected ${recomputedHash}, got ${block.blockHash}`
          );
        }

        // 2. Verify previousHash linkage (skip genesis block)
        if (i > 0) {
          const prevBlock = sortedBlocks[i - 1];
          if (block.previousHash !== prevBlock.blockHash) {
            integrityStatus = "tampered";
            integrityErrors.push(
              `Block #${block.index}: previousHash does not match Block #${prevBlock.index} hash`
            );
          }
        }
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        totalBlocks: blocks.length,
        totalTransactions: transactions.length,
        totalProjects: projects.length,
        blocks: sortedBlocks.map(block => ({
          ...block,
          transactions: transactions.filter(tx => tx.blockId === block.id),
        })),
        integrity: integrityStatus,
        integrityErrors: integrityErrors.length > 0 ? integrityErrors : undefined,
      };

      return res.json(exportData);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ── Blockchain Integrity Check Endpoint (Task 5.1) ──────────────────────────
  app.get("/api/blockchain/integrity", async (_req, res) => {
    try {
      const blocks = await storage.getAllBlocks();
      const sortedBlocks = [...blocks].sort((a, b) => a.index - b.index);

      let status: "verified" | "tampered" = "verified";
      const errors: string[] = [];

      for (let i = 0; i < sortedBlocks.length; i++) {
        const block = sortedBlocks[i];

        const recomputedHash = sha256(block.blockHashInput);
        if (recomputedHash !== block.blockHash) {
          status = "tampered";
          errors.push(`Block #${block.index}: hash mismatch`);
        }

        if (i > 0) {
          const prevBlock = sortedBlocks[i - 1];
          if (block.previousHash !== prevBlock.blockHash) {
            status = "tampered";
            errors.push(`Block #${block.index}: broken chain link`);
          }
        }
      }

      return res.json({
        status,
        totalBlocks: sortedBlocks.length,
        checkedAt: new Date().toISOString(),
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // VERIFIER DASHBOARD STATUS (Improved Performance & Stats)
  app.get("/api/verifier/status", requireAuth, requireRole('verifier', 'admin'), async (req: AuthRequest, res) => {
    try {
      const mintingEnabled = await storage.getMintingStatus();

      // Get verified and rejected projects by this verifier
      const myReviews = await storage.getVerifiedProjectsByVerifierId(req.user!.id);
      // Enhanced performance aggregation
      const verifiedProjects = myReviews.filter(p => p.status === 'verified');
      const rejectedProjects = myReviews.filter(p => p.status === 'rejected');

      const totalCO2 = verifiedProjects.reduce((sum, p) => sum + (p.co2Captured || 0), 0);

      // Average review time calculation - using submittedAt as a base
      let avgReviewDays = 0;
      if (myReviews.length > 0) {
        const totalMs = myReviews.reduce((sum, p) => {
          const start = new Date(p.submittedAt).getTime();
          const end = Date.now(); // Fallback estimate since project is finalized
          return sum + (end - start);
        }, 0);
        avgReviewDays = totalMs / myReviews.length / (1000 * 60 * 60 * 24);
      }

      // Trust Score: verified projects / (verified + rejected) or 100%
      const totalReviews = verifiedProjects.length + rejectedProjects.length;
      const trustScore = totalReviews > 0
        ? Math.round((verifiedProjects.length / totalReviews) * 100)
        : 100;

      const warnings = await storage.getWarningsByContributorId(req.user!.id);

      return res.json({
        mintingEnabled,
        trustScore,
        warningCount: warnings.length,
        performance: {
          verified: verifiedProjects.length,
          rejected: rejectedProjects.length,
          totalCO2: Math.round(totalCO2 * 100) / 100,
          avgReviewTime: Math.max(0.1, Math.round(avgReviewDays * 10) / 10) || 0,
          pendingReviews: (await storage.getProjectsByStatus('pending')).length
        },
        meta: {
          verifierId: req.user!.id,
          totalInteractions: myReviews.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/verifiers", async (req, res) => {
    try {
      const verifiers = await storage.getUsersByRole('verifier');
      return res.json(verifiers.map(v => ({ ...v, password: undefined })));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // MARKETPLACE ROUTES - Protected (Buyer role)
  app.get("/api/projects/marketplace", requireAuth, requireRole("buyer"), async (_req: AuthRequest, res) => {
    try {
      // ── Cached marketplace listing (Task 7.3) ─────────────────────────────
      const CACHE_KEY = "marketplace:verified-projects";
      const cached = cache.get<object[]>(CACHE_KEY);
      if (cached) return res.json(cached);

      let projects = await storage.getProjectsByStatus("verified");
      projects = projects.filter(p => (p as any).isListed !== false);
      cache.set(CACHE_KEY, projects, CACHE_TTL_MARKETPLACE);
      return res.json(projects);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // BUYER FILTER ROUTE - Filter contributors by credits and plantation type
  app.get("/api/buyer/filter", requireAuth, requireRole('buyer'), async (req: AuthRequest, res) => {
    try {
      const { credits_min, credits_max, plantation_type } = req.query;

      // Get all verified and listed projects
      let projects = (await storage.getProjectsByStatus('verified')).filter(p => (p as any).isListed !== false);

      // Apply filters
      if (credits_min) {
        const min = parseFloat(credits_min as string);
        projects = projects.filter(p => (p.creditsEarned || 0) >= min);
      }

      if (credits_max) {
        const max = parseFloat(credits_max as string);
        projects = projects.filter(p => (p.creditsEarned || 0) <= max);
      }

      if (plantation_type) {
        projects = projects.filter(p => p.plantationType === plantation_type);
      }

      // Sort by credits_earned DESC (highest first)
      projects.sort((a, b) => (b.creditsEarned || 0) - (a.creditsEarned || 0));

      // Return formatted response with requested fields
      const response = projects.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location,
        area_ha: p.area,
        plantation_type: p.plantationType,
        credits_earned: p.creditsEarned,
        carbon_avoided_tpy: p.annualCO2,
      }));

      return res.json(response);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // CREDIT PURCHASE ROUTES
  app.post("/api/credits/purchase", requireAuth, requireRole('buyer'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validated = creditPurchaseSchema.parse(req.body);
      const { contributorId, projectId, credits, idempotencyKey } = validated;

      // Atomically purchase credits - this updates buyer, contributor, and project balances
      const result = await storage.purchaseCredits(
        req.user.id,
        contributorId,
        projectId,
        credits,
        validated.amount || 0,
        idempotencyKey
      );

      console.log(`[REWARD_DEBUG] Purchase successful. Buyer points: ${result.buyer.rewardPoints}, Contributor points: ${result.contributor.rewardPoints}`);

      // Invalidate marketplace cache — project's available credits have changed
      cache.invalidate("marketplace:verified-projects");

      // Audit: credits purchased and retired
      await audit({
        userId: req.user.id,
        actionType: AUDIT_ACTION_TYPES.CREDITS_PURCHASED,
        entityType: "credit_transaction",
        entityId: result.transaction.id,
        metadata: {
          buyerId: req.user.id,
          contributorId,
          projectId,
          credits,
          projectName: result.project.name,
        },
      });

      return res.json({
        message: "Purchase successful",
        buyer: { ...result.buyer, password: undefined },
        project: result.project,
        transaction: result.transaction,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  // Get buyer's purchase history
  app.get("/api/credits/purchases", requireAuth, requireRole('buyer'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const transactions = await storage.getCreditTransactionsByBuyerId(req.user.id);

      // Enrich transactions with contributor and project details for certificate generation
      const enriched = await Promise.all(
        transactions.map(async (tx) => {
          const contributor = await storage.getUser(tx.contributorId);
          const project = await storage.getProject(tx.projectId);
          return {
            ...tx,
            contributorName: contributor?.name || 'Unknown',
            projectName: project?.name || 'Unknown',
            projectLocation: project?.location || 'Unknown Location',
            ecosystemType: project?.ecosystemType || 'Blue Carbon',
            projectArea: project?.area || 0,
            annualCO2: project?.annualCO2 || 0,
          };
        })
      );

      return res.json(enriched);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Get contributor's sales history
  app.get("/api/credits/sales", requireAuth, requireRole('contributor'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const transactions = await storage.getCreditTransactionsByContributorId(req.user.id);

      // Enrich transactions with buyer and project details
      const enriched = await Promise.all(
        transactions.map(async (tx) => {
          const buyer = await storage.getUser(tx.buyerId);
          const project = await storage.getProject(tx.projectId);
          return {
            ...tx,
            buyerName: buyer?.name || 'Unknown',
            projectName: project?.name || 'Unknown',
          };
        })
      );

      return res.json(enriched);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // OBJECT STORAGE ROUTES
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/proof-files", async (req, res) => {
    try {
      if (!req.body.proofFileURL) {
        return res.status(400).json({ error: "proofFileURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.proofFileURL,
        {
          owner: 'system',
          visibility: "public",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error: any) {
      console.error("Error setting proof file:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // ─── DATABASE BACKUP ENDPOINT (Task 4.3) ─────────────────────────────────────
  // Admin-only endpoint to trigger a manual backup export (JSON dump of all tables).
  // This provides a downloadable snapshot of the database state for disaster recovery.
  app.post("/api/admin/backup", requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Collect all data from storage
      const [
        allUsers,
        allProjects,
        allTransactions,
        allBlocks,
        allCreditTransactions,
      ] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllProjects(),
        storage.getAllTransactions(),
        storage.getAllBlocks(),
        storage.getAllCreditTransactions(),
      ]);

      // Remove sensitive data (passwords) from users
      const sanitizedUsers = allUsers.map((user) => {
        const { password: _password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      // Get audit logs from in-memory store
      const auditLogsData = await (async () => {
        try {
          const { memAuditLog } = await import("./auditLog");
          return memAuditLog.getAll();
        } catch {
          return [];
        }
      })();

      // Build backup object with metadata
      const backup = {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: req.user.id,
          version: "1.0",
          environment: process.env.NODE_ENV || "development",
        },
        counts: {
          users: sanitizedUsers.length,
          projects: allProjects.length,
          transactions: allTransactions.length,
          blocks: allBlocks.length,
          creditTransactions: allCreditTransactions.length,
          auditLogs: auditLogsData.length,
        },
        data: {
          users: sanitizedUsers,
          projects: allProjects,
          transactions: allTransactions,
          blocks: allBlocks,
          creditTransactions: allCreditTransactions,
          auditLogs: auditLogsData,
        },
      };

      // Set headers for file download
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `bluecarbon-backup-${timestamp}.json`;

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      // Audit: backup was triggered
      await audit({
        userId: req.user.id,
        actionType: "BACKUP_CREATED" as any,
        entityType: "system",
        entityId: null,
        metadata: {
          filename,
          recordCounts: backup.counts,
        },
      });

      return res.json(backup);
    } catch (error: any) {
      console.error("Backup failed:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // ─── CERTIFICATE REVOCATION ENDPOINT (Task 3.1) ─────────────────────────────────────
  // Admin-only endpoint to revoke a certificate. This marks the certificate as revoked
  // in the database without affecting blockchain records or purchase transactions.
  app.post("/api/admin/certificates/:id/revoke", requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const { reason } = req.body;

      // Find the credit transaction
      const transaction = await storage.getCreditTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      // Check if already revoked
      if (transaction.certificateStatus === 'revoked') {
        return res.status(400).json({ error: "Certificate is already revoked" });
      }

      // Update the certificate status
      await storage.updateCreditTransaction(id, { certificateStatus: 'revoked' });

      // Audit log the revocation
      await audit({
        userId: req.user.id,
        actionType: AUDIT_ACTION_TYPES.CERTIFICATE_REVOKED,
        entityType: 'creditTransaction',
        entityId: id,
        metadata: {
          reason: reason || 'No reason provided',
          previousStatus: transaction.certificateStatus,
          newStatus: 'revoked',
        },
      });

      return res.json({
        success: true,
        message: "Certificate revoked successfully",
        certificateId: id,
        status: "revoked",
      });
    } catch (error: any) {
      console.error("Certificate revocation failed:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // ─── ADMIN GOVERNANCE & LEDGER ROUTES (New Upgrade) ───────────────────────────

  app.get("/api/admin/top-buyers", requireAuth, requireRole('admin'), async (_req, res) => {
    try {
      const topBuyers = await storage.getTopBuyers();
      return res.json(topBuyers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/top-contributors", requireAuth, requireRole('admin'), async (_req, res) => {
    try {
      const topContributors = await storage.getTopContributors();
      return res.json(topContributors);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // GET /api/admin/ledger - Add audit logging for security tracking
  app.get("/api/admin/ledger", requireAuth, requireRole('admin'), async (req: AuthRequest, _res) => {
    try {
      // Log ledger access for security audit trail
      await audit({
        userId: req.user!.id,
        actionType: "VIEW_LEDGER" as any,
        entityType: "system",
        entityId: "ledger",
        metadata: { timestamp: new Date().toISOString() },
      });
      const ledger = await storage.getAdminLedger();
      return _res.json(ledger);
    } catch (error: any) {
      return _res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/minting-status", requireAuth, requireRole('admin'), async (_req, res) => {
    try {
      const enabled = await storage.getMintingStatus();
      return res.json({ enabled });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/minting-status", requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      await storage.setMintingStatus(enabled);

      await audit({
        userId: req.user!.id,
        actionType: "MINTING_STATUS_CHANGED" as any,
        entityType: "system",
        entityId: "global",
        metadata: { enabled },
      });

      return res.json({ success: true, enabled });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // POST /api/admin/projects/:id/remove - Add UUID validation
  app.post("/api/admin/projects/:id/remove", requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      // Validate UUID format for security
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: "Invalid Project ID format" });
      }

      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      await storage.updateProject(id, { isListed: false });

      await audit({
        userId: req.user!.id,
        actionType: "PROJECT_REMOVED_FROM_MARKETPLACE" as any,
        entityType: "project",
        entityId: id,
        metadata: { projectName: project.name },
      });

      return res.json({ success: true, message: "Project removed from marketplace" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // POST /api/admin/warnings - Add strict severity validation
  app.post("/api/admin/warnings", requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { contributorId, message, severity } = req.body;
      if (!contributorId || !message || !severity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Strict severity validation - only allow low, medium, critical
      const allowedSeverity = ["low", "medium", "critical"];
      if (!allowedSeverity.includes(severity.toLowerCase())) {
        return res.status(400).json({ error: "Invalid severity. Allowed values: low, medium, critical" });
      }

      const warning = await storage.issueWarning({ contributorId, message, severity: severity.toLowerCase() });

      await audit({
        userId: req.user!.id,
        actionType: "WARNING_ISSUED" as any,
        entityType: "user",
        entityId: contributorId,
        metadata: { message, severity },
      });

      return res.json(warning);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/warnings/:contributorId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { contributorId } = req.params;
      // Admin can see any, contributors can only see their own
      if (req.user!.role !== 'admin' && req.user!.id !== contributorId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const warnings = await storage.getWarningsByContributorId(contributorId);
      return res.json(warnings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // POST /api/admin/rollback - Add strict type validation
  app.post("/api/admin/rollback", requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { targetId, type, reason } = req.body;
      if (!targetId || !type || !reason) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Strict rollback type validation - only allow mint, buy, sell, verify, listing
      const allowedTypes = ["mint", "buy", "sell", "verify", "listing"];
      if (!allowedTypes.includes(type.toLowerCase())) {
        return res.status(400).json({ error: "Invalid rollback type. Allowed values: mint, buy, sell, verify, listing" });
      }

      await storage.rollbackAction({
        adminId: req.user!.id,
        targetId,
        type: type.toLowerCase(),
        reason
      });

      await audit({
        userId: req.user!.id,
        actionType: "ROLLBACK_PERFORMED" as any,
        entityType: type, // Transaction, Project, etc.
        entityId: targetId,
        metadata: { reason, type },
      });

      return res.json({ success: true, message: "Rollback recorded and action performed" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
