import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import type { User, InsertUser, Project, InsertProject, Transaction, Block, CreditTransaction, RewardTransaction } from "@shared/schema";
import { users, projects, transactions, blocks, creditTransactions, rewardTransactions } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

// Type for project creation with calculated carbon values
export type InsertProjectWithCarbon = InsertProject & {
  annualCO2: number;
  lifetimeCO2: number;
  co2Captured: number
};

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  getProjectsByVerifierId(verifierId: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProjectWithCarbon): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByTxId(txId: string): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  getTransactionsByBlockId(blockId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Blocks
  getBlock(id: string): Promise<Block | undefined>;
  getBlockByHash(blockHash: string): Promise<Block | undefined>;
  getBlockByIndex(index: number): Promise<Block | undefined>;
  getAllBlocks(): Promise<Block[]>;
  getLastBlock(): Promise<Block | undefined>;
  createBlock(block: Omit<Block, 'id'>): Promise<Block>;

  // Credit Transactions
  getCreditTransaction(id: string): Promise<CreditTransaction | undefined>;
  getAllCreditTransactions(): Promise<CreditTransaction[]>;
  getCreditTransactionsByBuyerId(buyerId: string): Promise<CreditTransaction[]>;
  getCreditTransactionsByContributorId(contributorId: string): Promise<CreditTransaction[]>;
  createCreditTransaction(transaction: Omit<CreditTransaction, 'id'>): Promise<CreditTransaction>;
  updateCreditTransaction(id: string, updates: Partial<CreditTransaction>): Promise<CreditTransaction | undefined>;
  purchaseCredits(buyerId: string, contributorId: string, projectId: string, credits: number, idempotencyKey?: string): Promise<{ buyer: User; contributor: User; project: Project; transaction: CreditTransaction }>;
  reverseRewardsForTransaction(transactionId: string): Promise<{ reversed: boolean; buyerId: string; contributorId: string }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private transactions: Map<string, Transaction>;
  private blocks: Map<string, Block>;
  private creditTransactions: Map<string, CreditTransaction>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.transactions = new Map();
    this.blocks = new Map();
    this.creditTransactions = new Map();
    this.initializeData();
  }

  private initializeData() {
    const adminId = randomUUID();
    const verifier1Id = randomUUID();
    const aliceId = randomUUID();
    const bobId = randomUUID();

    // Hash passwords synchronously during initialization
    this.users.set(adminId, {
      id: adminId,
      name: 'Admin User',
      email: 'admin@bluecarbon.com',
      password: bcrypt.hashSync('admin123', 12),
      role: 'admin',
      username: 'admin',
      location: null,
      creditsPurchased: null,
      rewardPoints: 0,
      deletedAt: null,
    });

    this.users.set(verifier1Id, {
      id: verifier1Id,
      name: 'Verifier One',
      email: 'verifier1@bluecarbon.com',
      password: bcrypt.hashSync('verifier123', 12),
      role: 'verifier',
      username: 'verifier1',
      location: null,
      creditsPurchased: null,
      rewardPoints: 0,
      deletedAt: null,
    });

    this.users.set(aliceId, {
      id: aliceId,
      name: 'Alice Johnson',
      email: 'alice@bluecarbon.com',
      password: bcrypt.hashSync('password123', 12),
      role: 'contributor',
      username: 'alice',
      location: 'California, USA',
      creditsPurchased: null,
      rewardPoints: 0,
      deletedAt: null,
    });

    this.users.set(bobId, {
      id: bobId,
      name: 'Bob Smith',
      email: 'bob@bluecarbon.com',
      password: bcrypt.hashSync('password123', 12),
      role: 'buyer',
      username: 'bob',
      location: 'New York, USA',
      creditsPurchased: 0,
      rewardPoints: 0,
      deletedAt: null,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser & { role?: string }): Promise<User> {
    const id = randomUUID();
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      role: insertUser.role || 'contributor',
      username: null,
      location: insertUser.location || null,
      creditsPurchased: insertUser.role === 'buyer' ? 0 : null,
      rewardPoints: 0,
      deletedAt: null,
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter((user) => user.role === role);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter((p) => p.userId === userId);
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter((p) => p.status === status);
  }

  async getProjectsByVerifierId(verifierId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter((p) => p.verifierId === verifierId);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProjectWithCarbon): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      status: "pending",
      verifierId: null,
      rejectionReason: null,
      clarificationNote: null, // Task 2.1: Initialize clarification note
      proofFileUrl: insertProject.proofFileUrl || null,
      plantationType: insertProject.plantationType || null,
      landBoundary: insertProject.landBoundary || null,
      creditsEarned: 0, // Credits start at 0, will be set to lifetimeCO2 when verified
      submittedAt: new Date(),
      deletedAt: null,
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updated = { ...project, ...updates };
    this.projects.set(id, updated);
    return updated;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByTxId(txId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find((tx) => tx.txId === txId);
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter((tx) => tx.to === userId);
  }

  async getTransactionsByBlockId(blockId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter((tx) => tx.blockId === blockId);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const id = randomUUID();
    const tx: Transaction = { ...transaction, id };
    this.transactions.set(id, tx);
    return tx;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const tx = this.transactions.get(id);
    if (!tx) return undefined;
    const updated = { ...tx, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  async getBlock(id: string): Promise<Block | undefined> {
    return this.blocks.get(id);
  }

  async getBlockByHash(blockHash: string): Promise<Block | undefined> {
    return Array.from(this.blocks.values()).find((block) => block.blockHash === blockHash);
  }

  async getBlockByIndex(index: number): Promise<Block | undefined> {
    return Array.from(this.blocks.values()).find((block) => block.index === index);
  }

  async getAllBlocks(): Promise<Block[]> {
    return Array.from(this.blocks.values()).sort((a, b) => a.index - b.index);
  }

  async getLastBlock(): Promise<Block | undefined> {
    const blocks = await this.getAllBlocks();
    return blocks[blocks.length - 1];
  }

  async createBlock(block: Omit<Block, 'id'>): Promise<Block> {
    const id = randomUUID();
    const newBlock: Block = { ...block, id };
    this.blocks.set(id, newBlock);
    return newBlock;
  }

  async getCreditTransaction(id: string): Promise<CreditTransaction | undefined> {
    return this.creditTransactions.get(id);
  }

  async getAllCreditTransactions(): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values());
  }

  async getCreditTransactionsByBuyerId(buyerId: string): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter((tx) => tx.buyerId === buyerId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getCreditTransactionsByContributorId(contributorId: string): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter((tx) => tx.contributorId === contributorId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createCreditTransaction(transaction: Omit<CreditTransaction, 'id'>): Promise<CreditTransaction> {
    const id = randomUUID();
    // Ensure certificateStatus is set (Task 3.1)
    const tx: CreditTransaction = {
      ...transaction,
      id,
      certificateStatus: transaction.certificateStatus || 'valid'
    };
    this.creditTransactions.set(id, tx);
    return tx;
  }

  async updateCreditTransaction(id: string, updates: Partial<CreditTransaction>): Promise<CreditTransaction | undefined> {
    const existing = this.creditTransactions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.creditTransactions.set(id, updated);
    return updated;
  }

  async purchaseCredits(
    buyerId: string,
    contributorId: string,
    projectId: string,
    credits: number,
    idempotencyKey?: string
  ): Promise<{ buyer: User; contributor: User; project: Project; transaction: CreditTransaction }> {
    // Check for duplicate request using idempotency key
    if (idempotencyKey) {
      for (const tx of this.creditTransactions.values()) {
        if (tx.idempotencyKey === idempotencyKey) {
          // Return existing transaction without re-issuing rewards
          const existingBuyer = this.users.get(buyerId);
          const existingContributor = this.users.get(contributorId);
          const existingProject = this.projects.get(projectId);
          if (!existingBuyer || !existingContributor || !existingProject) {
            throw new Error('Transaction data not found');
          }
          console.log(`[MEM_STORAGE_DEBUG] Duplicate request detected for idempotencyKey: ${idempotencyKey}. Returning existing transaction.`);
          return {
            buyer: existingBuyer,
            contributor: existingContributor,
            project: existingProject,
            transaction: tx,
          };
        }
      }
    }

    // Get buyer, contributor, and project
    const buyer = this.users.get(buyerId);
    const contributor = this.users.get(contributorId);
    const project = this.projects.get(projectId);

    if (!buyer || buyer.role !== 'buyer') {
      throw new Error('Invalid buyer');
    }
    if (!contributor || contributor.role !== 'contributor') {
      throw new Error('Invalid contributor');
    }
    if (!project) {
      throw new Error('Project not found');
    }
    if (project.userId !== contributorId) {
      throw new Error('Project does not belong to this contributor');
    }
    if (project.status !== 'verified') {
      throw new Error('Project must be verified to purchase credits');
    }
    if (credits <= 0) {
      throw new Error('Credits must be positive');
    }
    if ((project.creditsEarned || 0) < credits) {
      throw new Error('Insufficient credits available');
    }

    // Atomically update balances
    const updatedProject = {
      ...project,
      creditsEarned: (project.creditsEarned || 0) - credits,
    };
    const updatedBuyer = {
      ...buyer,
      creditsPurchased: (buyer.creditsPurchased || 0) + credits,
    };

    // Create transaction record
    const transaction: CreditTransaction = {
      id: randomUUID(),
      idempotencyKey: idempotencyKey || null,
      buyerId,
      contributorId,
      projectId,
      credits,
      timestamp: new Date(),
      certificateStatus: 'valid', // Task 3.1: Default status
    };

    // Calculate Blue Points: 20 BP for contributor, 5 BP for buyer
    const contributorPointsEarned = (Number(credits) || 0) * 20;
    const buyerPointsEarned = (Number(credits) || 0) * 5;

    const updatedBuyerWithPoints = {
      ...updatedBuyer,
      rewardPoints: Number(buyer.rewardPoints || 0) + buyerPointsEarned,
    };
    const updatedContributorWithPoints = {
      ...contributor,
      rewardPoints: Number(contributor.rewardPoints || 0) + contributorPointsEarned,
    };

    // Persist changes
    this.projects.set(projectId, updatedProject);
    this.users.set(buyerId, updatedBuyerWithPoints);
    this.users.set(contributorId, updatedContributorWithPoints);
    this.creditTransactions.set(transaction.id, transaction);

    console.log(`[MEM_STORAGE_DEBUG] Updated rewardPoints: Buyer=${updatedBuyerWithPoints.rewardPoints}, Contributor=${updatedContributorWithPoints.rewardPoints}`);

    return {
      buyer: updatedBuyerWithPoints,
      contributor: updatedContributorWithPoints,
      project: updatedProject,
      transaction,
    };
  }

  // Reverse rewards for a credit transaction (internal method)
  async reverseRewardsForTransaction(transactionId: string): Promise<{ reversed: boolean; buyerId: string; contributorId: string }> {
    // Find the credit transaction
    const creditTx = this.creditTransactions.get(transactionId);
    if (!creditTx) {
      return { reversed: false, buyerId: '', contributorId: '' };
    }

    const buyerId = creditTx.buyerId;
    const contributorId = creditTx.contributorId;

    // Calculate points to reverse (same as original purchase)
    const buyerPointsToReverse = (creditTx.credits || 0) * 5;
    const contributorPointsToReverse = (creditTx.credits || 0) * 20;

    // Reverse buyer's reward points
    const buyer = this.users.get(buyerId);
    if (buyer) {
      this.users.set(buyerId, {
        ...buyer,
        rewardPoints: Math.max(0, (buyer.rewardPoints || 0) - buyerPointsToReverse),
      });
    }

    // Reverse contributor's reward points
    const contributor = this.users.get(contributorId);
    if (contributor) {
      this.users.set(contributorId, {
        ...contributor,
        rewardPoints: Math.max(0, (contributor.rewardPoints || 0) - contributorPointsToReverse),
      });
    }

    console.log(`[MEM_STORAGE_DEBUG] Reversed rewards for transaction: ${transactionId}`);
    return { reversed: true, buyerId, contributorId };
  }
}

// Database Storage implementation using Drizzle ORM
export class DbStorage implements IStorage {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username) return undefined;
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { role?: string }): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);
    const [user] = await this.db
      .insert(users)
      .values({
        ...insertUser,
        id,
        password: hashedPassword,
        role: insertUser.role || 'contributor',
        username: null,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, role));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await this.db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return await this.db.select().from(projects).where(eq(projects.userId, userId));
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return await this.db.select().from(projects).where(eq(projects.status, status));
  }

  async getProjectsByVerifierId(verifierId: string): Promise<Project[]> {
    return await this.db.select().from(projects).where(eq(projects.verifierId, verifierId));
  }

  async getAllProjects(): Promise<Project[]> {
    return await this.db.select().from(projects);
  }

  async createProject(insertProject: InsertProjectWithCarbon): Promise<Project> {
    const id = randomUUID();
    const [project] = await this.db
      .insert(projects)
      .values({
        ...insertProject,
        id,
        status: 'pending',
        verifierId: null,
        rejectionReason: null,
        proofFileUrl: insertProject.proofFileUrl || null,
        submittedAt: new Date(),
      })
      .returning();
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const [updated] = await this.db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updated || undefined;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionByTxId(txId: string): Promise<Transaction | undefined> {
    const [transaction] = await this.db.select().from(transactions).where(eq(transactions.txId, txId));
    return transaction || undefined;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return await this.db.select().from(transactions).where(eq(transactions.to, userId));
  }

  async getTransactionsByBlockId(blockId: string): Promise<Transaction[]> {
    return await this.db.select().from(transactions).where(eq(transactions.blockId, blockId));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await this.db.select().from(transactions);
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const id = randomUUID();
    const [tx] = await this.db
      .insert(transactions)
      .values({ ...transaction, id })
      .returning();
    return tx;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updated] = await this.db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return updated || undefined;
  }

  async getBlock(id: string): Promise<Block | undefined> {
    const [block] = await this.db.select().from(blocks).where(eq(blocks.id, id));
    return block || undefined;
  }

  async getBlockByHash(blockHash: string): Promise<Block | undefined> {
    const [block] = await this.db.select().from(blocks).where(eq(blocks.blockHash, blockHash));
    return block || undefined;
  }

  async getBlockByIndex(index: number): Promise<Block | undefined> {
    const [block] = await this.db.select().from(blocks).where(eq(blocks.index, index));
    return block || undefined;
  }

  async getAllBlocks(): Promise<Block[]> {
    return await this.db.select().from(blocks).orderBy(blocks.index);
  }

  async getLastBlock(): Promise<Block | undefined> {
    const [block] = await this.db.select().from(blocks).orderBy(desc(blocks.index)).limit(1);
    return block || undefined;
  }

  async createBlock(block: Omit<Block, 'id'>): Promise<Block> {
    const id = randomUUID();
    const [newBlock] = await this.db
      .insert(blocks)
      .values({ ...block, id })
      .returning();
    return newBlock;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async getCreditTransaction(id: string): Promise<CreditTransaction | undefined> {
    const [tx] = await this.db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.id, id));
    return tx || undefined;
  }

  async getAllCreditTransactions(): Promise<CreditTransaction[]> {
    return await this.db
      .select()
      .from(creditTransactions)
      .orderBy(desc(creditTransactions.timestamp));
  }

  async getCreditTransactionsByBuyerId(buyerId: string): Promise<CreditTransaction[]> {
    return await this.db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.buyerId, buyerId))
      .orderBy(desc(creditTransactions.timestamp));
  }

  async getCreditTransactionsByContributorId(contributorId: string): Promise<CreditTransaction[]> {
    return await this.db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.contributorId, contributorId))
      .orderBy(desc(creditTransactions.timestamp));
  }

  async createCreditTransaction(transaction: Omit<CreditTransaction, 'id'>): Promise<CreditTransaction> {
    const id = randomUUID();
    const [tx] = await this.db
      .insert(creditTransactions)
      .values({ ...transaction, id, certificateStatus: transaction.certificateStatus || 'valid' })
      .returning();
    return tx;
  }

  async updateCreditTransaction(id: string, updates: Partial<CreditTransaction>): Promise<CreditTransaction | undefined> {
    const [tx] = await this.db
      .update(creditTransactions)
      .set(updates)
      .where(eq(creditTransactions.id, id))
      .returning();
    return tx;
  }

  async purchaseCredits(
    buyerId: string,
    contributorId: string,
    projectId: string,
    credits: number,
    idempotencyKey?: string
  ): Promise<{ buyer: User; contributor: User; project: Project; transaction: CreditTransaction }> {
    // Get buyer, contributor, and project (validation only - not in transaction)
    const [buyer] = await this.db.select().from(users).where(eq(users.id, buyerId));
    const [contributor] = await this.db.select().from(users).where(eq(users.id, contributorId));
    const [project] = await this.db.select().from(projects).where(eq(projects.id, projectId));

    if (!buyer || buyer.role !== 'buyer') {
      throw new Error('Invalid buyer');
    }
    if (!contributor || contributor.role !== 'contributor') {
      throw new Error('Invalid contributor');
    }
    if (!project) {
      throw new Error('Project not found');
    }
    if (project.userId !== contributorId) {
      throw new Error('Project does not belong to this contributor');
    }
    if (project.status !== 'verified') {
      throw new Error('Project must be verified to purchase credits');
    }
    if (credits <= 0) {
      throw new Error('Credits must be positive');
    }

    // PART 3 & 4: Wrap ALL database mutations in a transaction for atomicity
    // Credit validation and deduction happen INSIDE the transaction with row-level locking
    const result = await this.db.transaction(async (tx: any) => {
      // Fetch project with FOR UPDATE to lock the row (prevents race conditions)
      const [lockedProject] = await tx
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .forUpdate();

      // PART 4: Validate credit availability INSIDE transaction
      if (!lockedProject || (lockedProject.creditsEarned || 0) < credits) {
        throw new Error('Insufficient credits available');
      }

      // Attempt to insert transaction record first (for atomic idempotency)
      const transactionId = randomUUID();
      
      try {
        const [createdTransaction] = await tx
          .insert(creditTransactions)
          .values({
            id: transactionId,
            idempotencyKey: idempotencyKey || null,
            buyerId,
            contributorId,
            projectId,
            credits,
            timestamp: new Date(),
          })
          .returning();

        // PART 4: Safe credit deduction inside transaction (uses locked row value)
        const [updatedProject] = await tx
          .update(projects)
          .set({ creditsEarned: (lockedProject.creditsEarned || 0) - credits })
          .where(eq(projects.id, projectId))
          .returning();

        // Update buyer credits and reward points (5 BP/credit)
        const [updatedBuyer] = await tx
          .update(users)
          .set({
            creditsPurchased: sql`COALESCE(${users.creditsPurchased}, 0) + ${credits}`,
            rewardPoints: sql`COALESCE(${users.rewardPoints}, 0) + ${credits * 5}`
          })
          .where(eq(users.id, buyerId))
          .returning();

        // Update contributor reward points (20 BP/credit)
        const [updatedContributor] = await tx
          .update(users)
          .set({
            rewardPoints: sql`COALESCE(${users.rewardPoints}, 0) + ${credits * 20}`
          })
          .where(eq(users.id, contributorId))
          .returning();

        // Insert reward transaction record for buyer (5 BP)
        const buyerPoints = credits * 5;
        await tx
          .insert(rewardTransactions)
          .values({
            id: randomUUID(),
            userId: buyerId,
            points: buyerPoints,
            type: "EARNED",
            role: "BUYER",
            sourceTransactionId: createdTransaction.id,
            createdAt: new Date(),
          });

        // Insert reward transaction record for contributor (20 BP)
        const contributorPoints = credits * 20;
        await tx
          .insert(rewardTransactions)
          .values({
            id: randomUUID(),
            userId: contributorId,
            points: contributorPoints,
            type: "EARNED",
            role: "CONTRIBUTOR",
            sourceTransactionId: createdTransaction.id,
            createdAt: new Date(),
          });

        return {
          buyer: updatedBuyer,
          contributor: updatedContributor,
          project: updatedProject,
          transaction: createdTransaction,
        };
      } catch (error: any) {
        // Check if error is due to unique constraint violation on idempotencyKey
        if (idempotencyKey && error?.code === '23505') {
          // Unique constraint violation - fetch existing transaction
          const [existingTx] = await tx
            .select()
            .from(creditTransactions)
            .where(eq(creditTransactions.idempotencyKey, idempotencyKey));

          if (existingTx) {
            console.log(`[DB_STORAGE_DEBUG] Duplicate request detected for idempotencyKey: ${idempotencyKey}. Returning existing transaction.`);
            return {
              buyer,
              contributor,
              project,
              transaction: existingTx,
            };
          }
        }
        // Re-throw if not an idempotency-related error
        throw error;
      }
    });

    console.log(`[DB_STORAGE_DEBUG] Updated rewardPoints: Buyer=${result.buyer.rewardPoints}, Contributor=${result.contributor.rewardPoints}`);

    return result;
  }

  // Reverse rewards for a credit transaction (internal method)
  async reverseRewardsForTransaction(transactionId: string): Promise<{ reversed: boolean; buyerId: string; contributorId: string }> {
    // Find reward transactions linked to this credit transaction
    const rewardTxns = await this.db
      .select()
      .from(rewardTransactions)
      .where(eq(rewardTransactions.sourceTransactionId, transactionId));

    if (rewardTxns.length === 0) {
      return { reversed: false, buyerId: '', contributorId: '' };
    }

    // PART 2: Check if already reversed (double reversal prevention)
    const alreadyReversed = rewardTxns.some(r => r.type === 'REVERSAL');
    if (alreadyReversed) {
      console.log(`[DB_STORAGE_DEBUG] Transaction ${transactionId} already reversed. Skipping.`);
      return { reversed: false, buyerId: '', contributorId: '' };
    }

    // Get buyer and contributor IDs
    const buyerReward = rewardTxns.find(r => r.role === 'BUYER');
    const contributorReward = rewardTxns.find(r => r.role === 'CONTRIBUTOR');

    if (!buyerReward || !contributorReward) {
      return { reversed: false, buyerId: '', contributorId: '' };
    }

    const buyerId = buyerReward.userId;
    const contributorId = contributorReward.userId;

    // Reverse all rewards in a transaction
    await this.db.transaction(async (tx: any) => {
      // Reverse buyer's reward points
      await tx
        .insert(rewardTransactions)
        .values({
          id: randomUUID(),
          userId: buyerId,
          points: -buyerReward.points,
          type: "REVERSAL",
          role: "BUYER",
          sourceTransactionId: transactionId,
          createdAt: new Date(),
        });

      await tx
        .update(users)
        .set({
          rewardPoints: sql`COALESCE(${users.rewardPoints}, 0) - ${buyerReward.points}`
        })
        .where(eq(users.id, buyerId));

      // Reverse contributor's reward points
      await tx
        .insert(rewardTransactions)
        .values({
          id: randomUUID(),
          userId: contributorId,
          points: -contributorReward.points,
          type: "REVERSAL",
          role: "CONTRIBUTOR",
          sourceTransactionId: transactionId,
          createdAt: new Date(),
        });

      await tx
        .update(users)
        .set({
          rewardPoints: sql`COALESCE(${users.rewardPoints}, 0) - ${contributorReward.points}`
        })
        .where(eq(users.id, contributorId));
    });

    console.log(`[DB_STORAGE_DEBUG] Reversed rewards for transaction: ${transactionId}`);
    return { reversed: true, buyerId, contributorId };
  }
}

// Storage switcher - use environment variable to choose storage type
async function createStorage(): Promise<IStorage> {
  const useDatabase = process.env.USE_DATABASE === 'true';

  if (useDatabase) {
    try {
      // Dynamically import db to avoid errors when DATABASE_URL is not set
      const { db } = await import('./db');
      console.log('✅ Using PostgreSQL database storage');
      return new DbStorage(db);
    } catch (error) {
      console.error('❌ Database connection failed, falling back to in-memory storage');
      console.error(error);
      return new MemStorage();
    }
  }

  console.log('✅ Using in-memory storage');
  return new MemStorage();
}

export const storage = await createStorage();
