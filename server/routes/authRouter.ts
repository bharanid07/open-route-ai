import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'commander' | 'navigator' | 'planner';
  district: string;
  designation: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  role: 'commander' | 'navigator' | 'planner';
  district: string;
  designation: string;
  createdAt: string;
  lastLoginAt?: string;
}

const DATA_DIR = path.resolve('./server/data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// In-memory token session store (token -> userId)
const activeTokens = new Map<string, string>();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`tn_salt_${password}`).digest('hex');
}

function sanitizeUser(user: StoredUser): SanitizedUser {
  const { passwordHash, ...rest } = user;
  return rest;
}

function ensureDataFile(): StoredUser[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    // Seed initial official accounts for demonstration
    const defaultUsers: StoredUser[] = [
      {
        id: 'user_admin_01',
        name: 'Thiru. Bharanidharan',
        email: 'admin@smartpath.tn.gov.in',
        passwordHash: hashPassword('admin123'),
        role: 'commander',
        district: 'Chennai',
        designation: 'State Logistics Chief Director',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      },
      {
        id: 'user_cbe_02',
        name: 'Coimbatore Dispatch Officer',
        email: 'officer@coimbatore.tn.gov.in',
        passwordHash: hashPassword('coimbatore123'),
        role: 'commander',
        district: 'Coimbatore',
        designation: 'Senior Freight Dispatcher (NH 544)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_transit_03',
        name: 'Accessible Transit Coordinator',
        email: 'transit@chennai.tn.gov.in',
        passwordHash: hashPassword('transit123'),
        role: 'navigator',
        district: 'Chennai',
        designation: 'Universal Accessibility Lead Officer',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_planner_04',
        name: 'State Infrastructure Planner',
        email: 'planner@tndc.gov.in',
        passwordHash: hashPassword('planner123'),
        role: 'planner',
        district: 'Salem',
        designation: '38-District Highway Corridor Analyst',
        createdAt: new Date().toISOString()
      }
    ];

    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
    return defaultUsers;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as StoredUser[];
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export const authRouter = Router();

// Ensure storage initialized on boot
ensureDataFile();

/**
 * POST /api/auth/register
 * Creates a new user and persists in backend users.json
 */
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'commander', district = 'Chennai', designation } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    if (cleanPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const users = ensureDataFile();

    const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash: hashPassword(cleanPassword),
      role: role as 'commander' | 'navigator' | 'planner',
      district: String(district).trim(),
      designation: designation ? String(designation).trim() : 'Operations Member',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Create session token
    const token = `tn_token_${crypto.randomBytes(24).toString('hex')}`;
    activeTokens.set(token, newUser.id);

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully in backend.',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials against backend users.json
 */
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const users = ensureDataFile();
    const targetHash = hashPassword(cleanPassword);

    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user || user.passwordHash !== targetHash) {
      return res.status(401).json({ error: 'Invalid email address or password. Please verify credentials.' });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date().toISOString();
    saveUsers(users);

    // Create session token
    const token = `tn_token_${crypto.randomBytes(24).toString('hex')}`;
    activeTokens.set(token, user.id);

    return res.json({
      status: 'success',
      message: 'Authentication successful.',
      token,
      user: sanitizeUser(user)
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
authRouter.get('/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      token = String(req.query.token);
    }

    if (!token || !activeTokens.has(token)) {
      return res.status(401).json({ error: 'Not authenticated or session expired.' });
    }

    const userId = activeTokens.get(token);
    const users = ensureDataFile();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.json({
      status: 'success',
      user: sanitizeUser(user)
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Session verification failed';
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/auth/logout
 * Terminates user session
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
  }
  return res.json({ status: 'success', message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/users
 * Returns list of registered accounts in backend (sanitized, for administration & inspection)
 */
authRouter.get('/users', (_req: Request, res: Response) => {
  const users = ensureDataFile();
  return res.json({
    status: 'success',
    totalUsers: users.length,
    users: users.map(sanitizeUser)
  });
});
