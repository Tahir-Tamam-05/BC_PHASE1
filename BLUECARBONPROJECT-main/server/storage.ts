import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import type { User, InsertUser, Project, InsertProject, Transaction, Block, CreditTransaction } from "@shared/schema";
import { users, projects, transactions, blocks, creditTransactions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
  getCreditTransactionsByBuyerId(buyerId: string): Promise<CreditTransaction[]>;
  getCreditTransactionsByContributorId(contributorId: string): Promise<CreditTransaction[]>;
  createCreditTransaction(transaction: Omit<CreditTransaction, 'id'>): Promise<CreditTransaction>;
  purchaseCredits(buyerId: string, contributorId: string, projectId: string, credits: number): Promise<{ buyer: User; contributor: User; project: Project; transaction: CreditTransaction }>;
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
      status: 'pending',
      verifierId: null,
      rejectionReason: null,
      proofFileUrl: insertProject.proofFileUrl || null,
      plantationType: insertProject.plantationType || null,
      creditsEarned: 0, // Credits start at 0, will be set to lifetimeCO2 when verified
      submittedAt: new Date(),
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
    const tx: CreditTransaction = { ...transaction, id };
    this.creditTransactions.set(id, tx);
    return tx;
  }

  async purchaseCredits(
    buyerId: string,
    contributorId: string,
    projectId: string,
    credits: number
  ): Promise<{ buyer: User; contributor: User; project: Project; transaction: CreditTransaction }> {
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
      buyerId,
      contributorId,
      projectId,
      credits,
      timestamp: new Date(),
    };

    // Persist changes
    this.projects.set(projectId, updatedProject);
    this.users.set(buyerId, updatedBuyer);
    this.creditTransactions.set(transaction.id, transaction);

    return {
      buyer: updatedBuyer,
      contributor,
      project: updatedProject,
      transaction,
    };
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
      .values({ ...transaction, id })
      .returning();
    return tx;
  }

  async purchaseCredits(
    buyerId: string,
    contributorId: string,
    projectId: string,
    credits: number
  ): Promise<{ buyer: User; contributor: User; project: Project; transaction: CreditTransaction }> {
    // Get buyer, contributor, and project
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
    if ((project.creditsEarned || 0) < credits) {
      throw new Error('Insufficient credits available');
    }

    // Create transaction record
    const transactionId = randomUUID();
    const [createdTransaction] = await this.db
      .insert(creditTransactions)
      .values({
        id: transactionId,
        buyerId,
        contributorId,
        projectId,
        credits,
        timestamp: new Date(),
      })
      .returning();

    // Update project credits
    const [updatedProject] = await this.db
      .update(projects)
      .set({ creditsEarned: (project.creditsEarned || 0) - credits })
      .where(eq(projects.id, projectId))
      .returning();

    // Update buyer credits
    const [updatedBuyer] = await this.db
      .update(users)
      .set({ creditsPurchased: (buyer.creditsPurchased || 0) + credits })
      .where(eq(users.id, buyerId))
      .returning();

    return {
      buyer: updatedBuyer,
      contributor,
      project: updatedProject,
      transaction: createdTransaction,
    };
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
