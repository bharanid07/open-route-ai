// Client Authentication Service connecting to backend /api/auth
import { UserProfile } from '../types';

const TOKEN_KEY = 'tn_smartpath_token';
const USER_KEY = 'tn_smartpath_user';

export class AuthService {
  /**
   * Get cached local token
   */
  public static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get cached local user
   */
  public static getCachedUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Sign In with backend credentials
   */
  public static async login(credentials: { email: string; password: string }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Authentication failed');
    }

    localStorage.setItem(TOKEN_KEY, json.token);
    localStorage.setItem(USER_KEY, JSON.stringify(json.user));

    return { user: json.user, token: json.token };
  }

  /**
   * Register a new user in backend storage
   */
  public static async register(data: {
    name: string;
    email: string;
    password: string;
    role: 'commander' | 'navigator' | 'planner';
    district: string;
    designation?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Registration failed');
    }

    localStorage.setItem(TOKEN_KEY, json.token);
    localStorage.setItem(USER_KEY, JSON.stringify(json.user));

    return { user: json.user, token: json.token };
  }

  /**
   * Verify token and fetch current user profile from backend
   */
  public static async getCurrentUser(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        this.logout();
        return null;
      }

      const json = await res.json();
      localStorage.setItem(USER_KEY, JSON.stringify(json.user));
      return json.user;
    } catch {
      return this.getCachedUser();
    }
  }

  /**
   * Terminate session
   */
  public static async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * List all registered accounts in backend
   */
  public static async getRegisteredUsers(): Promise<UserProfile[]> {
    try {
      const res = await fetch('/api/auth/users');
      if (!res.ok) return [];
      const json = await res.json();
      return json.users || [];
    } catch {
      return [];
    }
  }
}
