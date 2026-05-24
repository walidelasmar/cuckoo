'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import type { User, Organization, Session, UserRole, UserStatus, InviteToken, AuditLogEntry } from '@/lib/types';

const USERS_KEY = 'auth_users';
const ORGS_KEY = 'auth_organizations';
const SESSION_KEY = 'auth_session';
const INVITES_KEY = 'auth_invites';
const AUDIT_KEY = 'auth_audit_log';

const hashPassword = (password: string): string => {
  return 'hashed__' + btoa(unescape(encodeURIComponent(password)));
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hash === 'hashed__' + btoa(unescape(encodeURIComponent(password)));
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|]/.test(password))
    return 'Password must contain at least one special character.';
  return null;
};

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const REMEMBER_ME_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
export const SUPER_ADMIN_EMAIL = 'walid@bernoullifinance.com';
const SUPER_ADMIN_ID = 'usr-superadmin';

const loadUsers = (): User[] => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
};
const saveUsers = (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const loadOrgs = (): Organization[] => {
  try { return JSON.parse(localStorage.getItem(ORGS_KEY) || '[]'); } catch { return []; }
};
const saveOrgs = (orgs: Organization[]) => localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));

const loadSession = (): Session | null => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};
const saveSession = (session: Session | null) => {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
};

const loadInvites = (): InviteToken[] => {
  try { return JSON.parse(localStorage.getItem(INVITES_KEY) || '[]'); } catch { return []; }
};
const saveInvites = (invites: InviteToken[]) => localStorage.setItem(INVITES_KEY, JSON.stringify(invites));

const appendAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  try {
    const logs: AuditLogEntry[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    logs.push({ ...entry, id: `log-${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString() });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
  } catch { /* silent */ }
};

// Email notification helpers ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ opens mailto: since no email backend exists in v1
export const sendAdminNotificationEmail = (subject: string, body: string): void => {
  try {
    const mailtoLink = `mailto:${SUPER_ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  } catch { /* silent */ }
};

export const sendUserActivationEmail = (userEmail: string, userName: string, appUrl: string): void => {
  try {
    const subject = 'Your Cuckoo account has been activated';
    const body = `Hi ${userName},\n\nYour Cuckoo account has been reviewed and activated. You can now log in at:\n${appUrl}\n\nWelcome aboard!\n\nThe Cuckoo Team`;
    const mailtoLink = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  } catch { /* silent */ }
};

const SUPER_ADMIN_PWD = '4rYObYKJho3!lb';

const ensureSuperAdmin = (): void => {
  try {
    const users = loadUsers();
    const existing = users.find(u => u.id === SUPER_ADMIN_ID);
    const correctHash = hashPassword(SUPER_ADMIN_PWD);
    if (!existing) {
      const superAdmin: User = {
        id: SUPER_ADMIN_ID,
        email: SUPER_ADMIN_EMAIL,
        fullName: 'Super Admin',
        role: 'super_admin',
        orgId: null as unknown as string,
        passwordHash: correctHash,
        isActive: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        failedLoginAttempts: 0,
      };
      saveUsers([...users, superAdmin]);
    } else {
      // Always force-sync password, status, and isActive Ã¢ÂÂ clears any stale hash
      saveUsers(users.map(u => u.id === SUPER_ADMIN_ID
        ? { ...u, passwordHash: correctHash, status: 'active' as UserStatus, isActive: true, failedLoginAttempts: 0, lockedUntil: undefined }
        : u));
    }
  } catch { /* silent */ }
};




const deleteAccountByEmail = (email: string): void => {
  try {
    const flagKey = 'auth_delete_' + btoa(email);
    if (localStorage.getItem(flagKey)) return; // already ran
    const users = loadUsers();
    const target = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (target) {
      // Remove user
      saveUsers(users.filter(u => u.id !== target.id));
      // Remove their org if they have one
      if (target.orgId) {
        const orgs = loadOrgs();
        saveOrgs(orgs.filter(o => o.id !== target.orgId));
        // Clear org-namespaced data
        ['rawMaterials_', 'recipes_', 'materialCategories_', 'materialProviders_', 'recipeCategories_'].forEach(prefix => {
          localStorage.removeItem(prefix + target.orgId);
        });
      }
      // Clear session if it belongs to this user
      const session = loadSession();
      if (session && session.userId === target.id) saveSession(null);
    }
    localStorage.setItem(flagKey, '1');
  } catch { /* silent */ }
};

export type AuthContextType = {
  currentUser: User | null;
  currentOrg: Organization | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ error?: string }>;
  logout: () => void;
  registerOrg: (orgName: string, country: string, countryCode: string, orgAddress: string, email: string, fullName: string, password: string) => Promise<{ error?: string }>;
  acceptInvite: (token: string, fullName: string, password: string) => Promise<{ error?: string }>;
  getInvite: (token: string) => InviteToken | null;
  createInvite: (email: string, role: UserRole, orgId: string) => Promise<{ token?: string; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'fullName'>>) => Promise<{ error?: string }>;
  updateOrgSettings: (updates: Partial<Omit<Organization, 'id' | 'createdAt'>>) => Promise<{ error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  setUserStatus: (userId: string, status: UserStatus) => Promise<{ error?: string }>;
  getAuditLog: () => AuditLogEntry[];
  getAllOrgs: () => Organization[];
  getAllUsers: () => User[];
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ensureSuperAdmin();
    deleteAccountByEmail('partners@laescala.eu');
    const session = loadSession();
    if (!session) { setIsLoading(false); return; }
    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    if (now > expiresAt) { saveSession(null); setIsLoading(false); return; }
    const users = loadUsers();
    const orgs = loadOrgs();
    const user = users.find(u => u.id === session.userId);
    if (!user || !user.isActive) { saveSession(null); setIsLoading(false); return; }
    const org = orgs.find(o => o.id === session.orgId) || null;
    setCurrentUser(user);
    setCurrentOrg(org);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let idleTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { logout(); }, IDLE_TIMEOUT_MS);
    };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(idleTimer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const login = useCallback(async (email: string, password: string, rememberMe = false): Promise<{ error?: string }> => {
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      appendAuditLog({ event: 'failed_login_attempt', details: { email } });
      return { error: 'Invalid email or password.' };
    }
    // Status-based access control
    const userStatus = user.status || (user.isActive ? 'active' : 'deactivated');
    if (userStatus === 'pending_approval') {
      return { error: 'Your account is pending approval. You will receive an email once it is activated.' };
    }
    if (userStatus === 'deactivated' || !user.isActive) {
      return { error: 'Your account has been deactivated. Please contact support.' };
    }
    if (user.lockedUntil) {
      const lockedUntil = new Date(user.lockedUntil).getTime();
      if (Date.now() < lockedUntil) {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 60000);
        return { error: `Account locked. Try again in ${remaining} minute(s) or reset your password.` };
      }
    }
    if (!verifyPassword(password, user.passwordHash)) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const updates: Partial<User> = { failedLoginAttempts: newAttempts };
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
        appendAuditLog({ event: 'account_lockout_triggered', userId: user.id, orgId: user.orgId, details: { email } });
      } else {
        appendAuditLog({ event: 'failed_login_attempt', userId: user.id, orgId: user.orgId, details: { email, attempts: newAttempts } });
      }
      saveUsers(users.map(u => u.id === user.id ? { ...u, ...updates } : u));
      return { error: 'Invalid email or password.' };
    }
    // If approved, transition to active on first login (1.c)
    const newStatus: UserStatus = userStatus === 'approved' ? 'active' : (userStatus as UserStatus);
    const updatedUsers = users.map(u => u.id === user.id
      ? { ...u, failedLoginAttempts: 0, lockedUntil: undefined, status: newStatus }
      : u
    );
    saveUsers(updatedUsers);
    const lifetime = rememberMe ? REMEMBER_ME_LIFETIME_MS : SESSION_LIFETIME_MS;
    const session: Session = {
      userId: user.id, orgId: user.orgId, role: user.role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + lifetime).toISOString(),
      rememberMe,
    };
    saveSession(session);
    const orgs = loadOrgs();
    const org = orgs.find(o => o.id === user.orgId) || null;
    setCurrentUser({ ...user, failedLoginAttempts: 0, lockedUntil: undefined, status: newStatus });
    setCurrentOrg(org);
    appendAuditLog({ event: 'successful_login', userId: user.id, orgId: user.orgId, details: {} });
    return {};
  }, []);

  const logout = useCallback(() => {
    if (currentUser) appendAuditLog({ event: 'logout', userId: currentUser.id, orgId: currentUser.orgId, details: {} });
    saveSession(null);
    setCurrentUser(null);
    setCurrentOrg(null);
  }, [currentUser]);

  const registerOrg = useCallback(async (orgName: string, country: string, countryCode: string, orgAddress: string, email: string, fullName: string, password: string): Promise<{ error?: string }> => {
    const pwError = validatePassword(password);
    if (pwError) return { error: pwError };
    if (!orgName.trim()) return { error: 'Organization name is required.' };
    if (!country.trim()) return { error: 'Country is required.' };
    const users = loadUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return { error: 'An account with this email already exists.' };
    const orgs = loadOrgs();
    const orgId = `org-${Date.now()}`;
    const userId = `usr-${Date.now()}`;
    const newOrg: Organization = { id: orgId, name: orgName, country, countryCode, address: orgAddress, preferredLanguage: 'en', currency: 'USD', createdAt: new Date().toISOString() };
    // New registrations start as pending_approval ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ NOT logged in (2.a)
    const newUser: User = {
      id: userId, email, fullName, role: 'org_admin', orgId,
      passwordHash: hashPassword(password),
      isActive: false,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      failedLoginAttempts: 0,
    };
    saveOrgs([...orgs, newOrg]);
    saveUsers([...users, newUser]);
    appendAuditLog({ event: 'user_account_created', userId, orgId, details: { email, orgName, status: 'pending_approval' } });
    return {};
  }, []);

  const acceptInvite = useCallback(async (token: string, fullName: string, password: string): Promise<{ error?: string }> => {
    const pwError = validatePassword(password);
    if (pwError) return { error: pwError };
    const invites = loadInvites();
    const invite = invites.find(i => i.token === token);
    if (!invite) return { error: 'Invite link is invalid or has expired.' };
    if (invite.accepted) return { error: 'This invite has already been used.' };
    if (new Date(invite.expiresAt).getTime() < Date.now()) return { error: 'This invite link has expired. Please request a new one.' };
    const users = loadUsers();
    const existing = users.find(u => u.email.toLowerCase() === invite.email.toLowerCase());
    if (existing) return { error: 'An account with this email already exists.' };
    const userId = `usr-${Date.now()}`;
    const newUser: User = {
      id: userId, email: invite.email, fullName, role: invite.role, orgId: invite.orgId,
      passwordHash: hashPassword(password),
      isActive: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      failedLoginAttempts: 0,
    };
    saveUsers([...users, newUser]);
    const updatedInvites = invites.map(i => i.token === token ? { ...i, accepted: true } : i);
    saveInvites(updatedInvites);
    const orgs = loadOrgs();
    const org = orgs.find(o => o.id === invite.orgId) || null;
    const session: Session = { userId, orgId: invite.orgId, role: invite.role, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS).toISOString(), rememberMe: false };
    saveSession(session);
    setCurrentUser(newUser);
    setCurrentOrg(org);
    appendAuditLog({ event: 'user_account_created', userId, orgId: invite.orgId, details: { email: invite.email, role: invite.role } });
    return {};
  }, []);

  const getInvite = useCallback((token: string): InviteToken | null => {
    return loadInvites().find(i => i.token === token) || null;
  }, []);

  const createInvite = useCallback(async (email: string, role: UserRole, orgId: string): Promise<{ token?: string; error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated.' };
    if (currentUser.role !== 'org_admin' && currentUser.role !== 'super_admin') return { error: 'Insufficient permissions.' };
    const users = loadUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return { error: 'A user with this email already exists.' };
    const token = `inv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const invite: InviteToken = { token, email, role, orgId, invitedBy: currentUser.id, expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(), accepted: false };
    saveInvites([...loadInvites(), invite]);
    appendAuditLog({ event: 'user_invited', userId: currentUser.id, orgId, details: { email, role } });
    return { token };
  }, [currentUser]);

  const setUserStatus = useCallback(async (userId: string, status: UserStatus): Promise<{ error?: string }> => {
    if (!currentUser || currentUser.role !== 'super_admin') return { error: 'Insufficient permissions.' };
    const users = loadUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { error: 'User not found.' };
    const isActive = status === 'active' || status === 'approved';
    const updatedUsers = users.map(u => u.id === userId ? { ...u, status, isActive } : u);
    saveUsers(updatedUsers);
    appendAuditLog({ event: status === 'active' ? 'user_activated' : 'user_deactivated', userId: currentUser.id, orgId: currentUser.orgId, details: { targetUserId: userId, newStatus: status } });
    return {};
  }, [currentUser]);

  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'fullName'>>): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated.' };
    const users = loadUsers();
    saveUsers(users.map(u => u.id === currentUser.id ? { ...u, ...updates } : u));
    setCurrentUser(prev => prev ? { ...prev, ...updates } : prev);
    return {};
  }, [currentUser]);

  const updateOrgSettings = useCallback(async (updates: Partial<Omit<Organization, 'id' | 'createdAt'>>): Promise<{ error?: string }> => {
    if (!currentUser || !currentOrg) return { error: 'Not authenticated.' };
    if (currentUser.role !== 'org_admin' && currentUser.role !== 'super_admin') return { error: 'Insufficient permissions.' };
    const orgs = loadOrgs();
    saveOrgs(orgs.map(o => o.id === currentOrg.id ? { ...o, ...updates } : o));
    setCurrentOrg(prev => prev ? { ...prev, ...updates } : prev);
    appendAuditLog({ event: 'organization_settings_changed', userId: currentUser.id, orgId: currentOrg.id, details: { changes: Object.keys(updates) } });
    return {};
  }, [currentUser, currentOrg]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated.' };
    if (!verifyPassword(currentPassword, currentUser.passwordHash)) return { error: 'Current password is incorrect.' };
    const pwError = validatePassword(newPassword);
    if (pwError) return { error: pwError };
    const users = loadUsers();
    saveUsers(users.map(u => u.id === currentUser.id ? { ...u, passwordHash: hashPassword(newPassword) } : u));
    saveSession(null);
    setCurrentUser(null);
    setCurrentOrg(null);
    appendAuditLog({ event: 'password_changed', userId: currentUser.id, orgId: currentUser.orgId, details: {} });
    return {};
  }, [currentUser]);

  const getAuditLog = useCallback((): AuditLogEntry[] => {
    try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); } catch { return []; }
  }, []);

  const getAllOrgs = useCallback((): Organization[] => loadOrgs(), []);
  const getAllUsers = useCallback((): User[] => loadUsers(), []);

  return (
    <AuthContext.Provider value={{ currentUser, currentOrg, isLoading, login, logout, registerOrg, acceptInvite, getInvite, createInvite, updateProfile, updateOrgSettings, changePassword, setUserStatus, getAuditLog, getAllOrgs, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}
