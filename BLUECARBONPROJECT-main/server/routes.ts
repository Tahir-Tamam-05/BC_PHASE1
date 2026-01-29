import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { loginSchema, signupSchema, projectReviewSchema, projectSubmissionSchema, creditPurchaseSchema } from "@shared/schema";
import { generateToken, requireAuth, requireRole, type AuthRequest } from "./auth";
import {
  computeTransactionId,
  computeProofHash,
  computeMerkleRoot,
  computeBlockHash,
  generateValidatorSignature,
} from "./blockchain";
import { calculateCarbonSequestration } from "./carbonCalculation";

// Configure multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // AUTH ROUTES - Public
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Compare hashed passwords
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate JWT token
      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({ 
        message: "Login successful",
        token,
        user: userWithoutPassword 
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

      // Create user with hashed password (role defaults to 'user')
      const user = await storage.createUser(data);
      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({ 
        message: "Account created successfully",
        token,
        user: userWithoutPassword 
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      const totalProjects = projects.length;
      const verifiedProjects = projects.filter(p => p.status === 'verified').length;
      const totalCO2Captured = projects
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + p.co2Captured, 0);

      return res.json({
        totalProjects,
        verifiedProjects,
        totalCO2Captured,
      });
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

      // Parse form data
      const projectData = {
        name: req.body.name,
        description: req.body.description,
        location: req.body.location,
        area: parseFloat(req.body.area),
        ecosystemType: req.body.ecosystemType,
        userId: req.user.id, // Use authenticated user's ID
        proofFileUrl: null as string | null,
      };

      // Validate project data
      const validated = projectSubmissionSchema.parse(projectData);

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
      };
      
      const project = await storage.createProject(projectWithCarbon);
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
      const projects = await storage.getAllProjects();
      return res.json(projects);
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

  // Get verifier's assigned reviews - Protected (verifier only)
  app.get("/api/projects/my-reviews", requireAuth, requireRole('verifier'), async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const projects = await storage.getProjectsByVerifierId(req.user.id);
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
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/review", async (req, res) => {
    try {
      const { id } = req.params;
      const { action, rejectionReason } = projectReviewSchema.parse({
        projectId: id,
        ...req.body,
      });

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (action === 'reject') {
        await storage.updateProject(id, {
          status: 'rejected',
          rejectionReason,
        });
        return res.json({ success: true });
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
        status: 'verified',
        creditsEarned: project.lifetimeCO2 // Set credits available for purchase
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
        transactionId: tx?.txId || 'N/A',
        blockHash: block?.blockHash || 'N/A',
        blockIndex: block?.index,
        issuedAt: new Date().toISOString(),
        certificateId: `BC-${project.id}`,
      };

      return res.json(certificate);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      return res.json(transactions);
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
      const blocks = await storage.getAllBlocks();
      return res.json(blocks);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blockchain/export", async (req, res) => {
    try {
      const blocks = await storage.getAllBlocks();
      const transactions = await storage.getAllTransactions();
      const projects = await storage.getAllProjects();

      const exportData = {
        exportedAt: new Date().toISOString(),
        totalBlocks: blocks.length,
        totalTransactions: transactions.length,
        totalProjects: projects.length,
        blocks: blocks.map(block => ({
          ...block,
          transactions: transactions.filter(tx => tx.blockId === block.id),
        })),
        integrity: 'verified',
      };

      return res.json(exportData);
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
  app.get("/api/projects/marketplace", requireAuth, requireRole('buyer'), async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getProjectsByStatus('verified');
      return res.json(projects);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // BUYER FILTER ROUTE - Filter contributors by credits and plantation type
  app.get("/api/buyer/filter", requireAuth, requireRole('buyer'), async (req: AuthRequest, res) => {
    try {
      const { credits_min, credits_max, plantation_type } = req.query;
      
      // Get all verified projects
      let projects = await storage.getProjectsByStatus('verified');
      
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
      const { contributorId, projectId, credits } = validated;

      // Atomically purchase credits - this updates buyer, contributor, and project balances
      const result = await storage.purchaseCredits(
        req.user.id,
        contributorId,
        projectId,
        credits
      );

      return res.json({ 
        message: 'Purchase successful',
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
      
      // Enrich transactions with contributor and project details
      const enriched = await Promise.all(
        transactions.map(async (tx) => {
          const contributor = await storage.getUser(tx.contributorId);
          const project = await storage.getProject(tx.projectId);
          return {
            ...tx,
            contributorName: contributor?.name || 'Unknown',
            projectName: project?.name || 'Unknown',
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

  const httpServer = createServer(app);
  return httpServer;
}
