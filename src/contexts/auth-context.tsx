'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Organization, UserRole, UserStatus, InviteToken, AuditLogEntry } from '@/lib/types';

export const SUPER_ADMIN_EMAIL = 'walid@bernoullifinance.com';
const SUPER_ADMIN_ID = 'usr-superadmin';
const SUPER_ADMIN_PWD = '4rYObYKJho3!lb';

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const REMEMBER_ME_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

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
  if (!/[!@#$%^&*()_+\-=\[\]{};:\'",./<>?\\|]/.test(password))
    return 'Password must contain at least one special character.';
  return null;
};

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

// Map DB row to User type
const rowToUser = (row: any): User => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role as UserRole,
  orgId: row.org_id,
  passwordHash: row.password_hash,
  isActive: row.is_active,
  status: row.status as UserStatus,
  failedLoginAttempts: row.failed_login_attempts || 0,
  lockedUntil: row.locked_until || undefined,
  createdAt: row.created_at,
});

// Map DB row to Organization type
const rowToOrg = (row: any): Organization => ({
  id: row.id,
  name: row.name,
  country: row.country || '',
  countryCode: row.country_code || '',
  address: row.address || '',
  preferredLanguage: row.preferred_language || 'en',
  currency: row.currency || 'USD',
  createdAt: row.created_at,
});

interface SessionData {
  userId: string;
  orgId: string | null;
  role: UserRole;
  expiresAt: string;
  rememberMe: boolean;
}

const SESSION_KEY = 'cuckoo_session';

const loadSession = (): SessionData | null => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};
const saveSession = (s: SessionData | null) => {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
};

export type AuthContextType = {
  currentUser: User | null;
  currentOrg: Organization | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ error?: string }>;
  logout: () => void;
  registerOrg: (orgName: string, country: string, countryCode: string, orgAddress: string, email: string, fullName: string, password: string) => Promise<{ error?: string }>;
  acceptInvite: (token: string, fullName: string, password: string) => Promise<{ error?: string }>;
  getInvite: (token: string) => Promise<InviteToken | null>;
  createInvite: (email: string, role: UserRole, orgId: string) => Promise<{ token?: string; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'fullName'>>) => Promise<{ error?: string }>;
  updateOrgSettings: (updates: Partial<Omit<Organization, 'id' | 'createdAt'>>) => Promise<{ error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  setUserStatus: (userId: string, status: UserStatus) => Promise<{ error?: string }>;
  getAuditLog: () => Promise<AuditLogEntry[]>;
  getAllOrgs: () => Promise<Organization[]>;
  getAllUsers: () => Promise<User[]>;
  updateUserByAdmin: (userId: string, updates: { fullName?: string; email?: string; role?: UserRole; status?: UserStatus }) => Promise<{ error?: string }>;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isAdmin: boolean;
  isViewer: boolean;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure super admin exists and password is always up to date
  const ensureSuperAdmin = useCallback(async () => {
    try {
      const correctHash = hashPassword(SUPER_ADMIN_PWD);
      const { data: existing } = await supabase.from('users').select('*').eq('id', SUPER_ADMIN_ID).maybeSingle();
      if (!existing) {
        await supabase.from('users').insert({
          id: SUPER_ADMIN_ID,
          email: SUPER_ADMIN_EMAIL,
          full_name: 'Super Admin',
          role: 'super_admin',
          org_id: null,
          password_hash: correctHash,
          is_active: true,
          status: 'active',
          failed_login_attempts: 0,
        });
      } else {
        await supabase.from('users').update({
          password_hash: correctHash,
          status: 'active',
          is_active: true,
          failed_login_attempts: 0,
          locked_until: null,
        }).eq('id', SUPER_ADMIN_ID);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      await ensureSuperAdmin();
      const session = loadSession();
      if (!session) { setIsLoading(false); return; }
      const now = Date.now();
      if (now > new Date(session.expiresAt).getTime()) {
        saveSession(null); setIsLoading(false); return;
      }
      const { data: userRow } = await supabase.from('users').select('*').eq('id', session.userId).maybeSingle();
      if (!userRow || !userRow.is_active) { saveSession(null); setIsLoading(false); return; }
      const user = rowToUser(userRow);
      setCurrentUser(user);
      if (session.orgId) {
        const { data: orgRow } = await supabase.from('organizations').select('*').eq('id', session.orgId).maybeSingle();
        if (orgRow) setCurrentOrg(rowToOrg(orgRow));
      }
      setIsLoading(false);
    };
    init();
  }, [ensureSuperAdmin]);

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
    const { data: userRow } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).maybeSingle();
    if (!userRow) return { error: 'Invalid email or password.' };
    const user = rowToUser(userRow);
    const userStatus = user.status || (user.isActive ? 'active' : 'deactivated');
    if (userStatus === 'pending_approval') return { error: 'Your account is pending approval. You will receive an email once it is activated.' };
    if (userStatus === 'deactivated' || !user.isActive) return { error: 'Your account has been deactivated. Please contact support.' };
    if (user.lockedUntil && Date.now() < new Date(user.lockedUntil).getTime()) {
      const remaining = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return { error: `Account locked. Try again in ${remaining} minute(s) or reset your password.` };
    }
    if (!verifyPassword(password, user.passwordHash)) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const updates: any = { failed_login_attempts: newAttempts };
      if (newAttempts >= MAX_FAILED_ATTEMPTS) updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
      await supabase.from('users').update(updates).eq('id', user.id);
      return { error: 'Invalid email or password.' };
    }
    const newStatus: UserStatus = userStatus === 'approved' ? 'active' : (userStatus as UserStatus);
    await supabase.from('users').update({ failed_login_attempts: 0, locked_until: null, status: newStatus }).eq('id', user.id);
    const lifetime = rememberMe ? REMEMBER_ME_LIFETIME_MS : SESSION_LIFETIME_MS;
    const session: SessionData = {
      userId: user.id, orgId: user.orgId || null, role: user.role,
      expiresAt: new Date(Date.now() + lifetime).toISOString(), rememberMe,
    };
    saveSession(session);
    const updatedUser = { ...user, failedLoginAttempts: 0, lockedUntil: undefined, status: newStatus };
    setCurrentUser(updatedUser);
    if (user.orgId) {
      const { data: orgRow } = await supabase.from('organizations').select('*').eq('id', user.orgId).maybeSingle();
      if (orgRow) setCurrentOrg(rowToOrg(orgRow));
    }
    return {};
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
    setCurrentUser(null);
    setCurrentOrg(null);
  }, []);

  const registerOrg = useCallback(async (orgName: string, country: string, countryCode: string, orgAddress: string, email: string, fullName: string, password: string): Promise<{ error?: string }> => {
    const pwError = validatePassword(password);
    if (pwError) return { error: pwError };
    if (!orgName.trim()) return { error: 'Organization name is required.' };
    if (!country.trim()) return { error: 'Country is required.' };
    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existing) return { error: 'An account with this email already exists.' };
    const orgId = `org-${Date.now()}`;
    const userId = `usr-${Date.now()}`;
    await supabase.from('organizations').insert({ id: orgId, name: orgName, country, country_code: countryCode, address: orgAddress });
    await supabase.from('users').insert({
      id: userId, email: email.toLowerCase(), full_name: fullName, role: 'org_admin', org_id: orgId,
      password_hash: hashPassword(password), is_active: false, status: 'pending_approval', failed_login_attempts: 0,
    });
    return {};
  }, []);

  const acceptInvite = useCallback(async (token: string, fullName: string, password: string): Promise<{ error?: string }> => {
    const pwError = validatePassword(password);
    if (pwError) return { error: pwError };
    const { data: invite } = await supabase.from('invites').select('*').eq('token', token).maybeSingle();
    if (!invite) return { error: 'Invite link is invalid or has expired.' };
    if (invite.accepted) return { error: 'This invite has already been used.' };
    if (new Date(invite.expires_at).getTime() < Date.now()) return { error: 'This invite link has expired. Please request a new one.' };
    const { data: existing } = await supabase.from('users').select('id').eq('email', invite.email.toLowerCase()).maybeSingle();
    if (existing) return { error: 'An account with this email already exists.' };
    const userId = `usr-${Date.now()}`;
    await supabase.from('users').insert({
      id: userId, email: invite.email.toLowerCase(), full_name: fullName, role: invite.role, org_id: invite.org_id,
      password_hash: hashPassword(password), is_active: true, status: 'active', failed_login_attempts: 0,
    });
    await supabase.from('invites').update({ accepted: true }).eq('token', token);
    const session: SessionData = {
      userId, orgId: invite.org_id, role: invite.role,
      expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS).toISOString(), rememberMe: false,
    };
    saveSession(session);
    const { data: userRow } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    const { data: orgRow } = await supabase.from('organizations').select('*').eq('id', invite.org_id).maybeSingle();
    if (userRow) setCurrentUser(rowToUser(userRow));
    if (orgRow) setCurrentOrg(rowToOrg(orgRow));
    return {};
  }, []);

  const getInvite = useCallback(async (token: string): Promise<InviteToken | null> => {
    const { data } = await supabase.from('invites').select('*').eq('token', token).maybeSingle();
    if (!data) return null;
    return { token: data.token, email: data.email, role: data.role, orgId: data.org_id, invitedBy: data.invited_by, expiresAt: data.expires_at, accepted: data.accepted };
  }, []);

  const createInvite = useCallback(async (email: string, role: UserRole, orgId: string): Promise<{ token?: string; error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated.' };
    if (currentUser.role !== 'org_admin' && currentUser.role !== 'super_admin') return { error: 'Insufficient permissions.' };
    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existing) return { error: 'A user with this email already exists.' };
    const token = `inv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await supabase.from('invites').insert({ token, email, role, org_id: orgId, invited_by: currentUser.id, expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(), accepted: false });
    return { token };
  }, [currentUser]);

  const setUserStatus = useCallback(async (userId: string, status: UserStatus): Promise<{ error?: string }> => {
    if (!currentUser || currentUser.role !== 'super_admin') return { error: 'Insufficient permissions.' };
    const isActive = status === 'active' || status === 'approved';
    await supabase.from('users').update({ status, is_active: isActive }).eq('id', userId);
    return {};
  }, [currentUser]);

  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'fullName'>>): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated.' };
    await supabase.from('users').update({ full_name: updates.fullName }).eq('id', currentUser.id);
    setCurrentUser(prev => prev ? { ...prev, ...updates } : prev);
    return {};
  }, [currentUser]);

  const updateOrgSettings = useCallback(async (updates: Partial<Omit<Organization, 'id' | 'createdAt'>>): Promise<{ error?: string }> => {
    if (!currentUser || !currentOrg) return { error: 'Not authenticated.' };
    if (currentUser.role !== 'org_admin' && currentUser.role !== 'super_admin') return { error: 'Insufficient permissions.' };
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.preferredLanguage !== undefined) dbUpdates.preferred_language = updates.preferredLanguage;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    await supabase.from('organizations').update(dbUpdates).eq('id', currentOrg.id);
    setCurrentOrg(prev => prev ? { ...prev, ...updates } : prev);
    return {};
  }, [currentUser, currentOrg]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated.' };
    if (!verifyPassword(currentPassword, currentUser.passwordHash)) return { error: 'Current password is incorrect.' };
    const pwError = validatePassword(newPassword);
    if (pwError) return { error: pwError };
    await supabase.from('users').update({ password_hash: hashPassword(newPassword) }).eq('id', currentUser.id);
    saveSession(null);
    setCurrentUser(null);
    setCurrentOrg(null);
    return {};
  }, [currentUser]);

  const getAuditLog = useCallback(async (): Promise<AuditLogEntry[]> => {
    const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false });
    return (data || []).map((r: any) => ({ id: r.id, event: r.event, userId: r.user_id, orgId: r.org_id, details: r.details, timestamp: r.created_at }));
  }, []);

  const getAllOrgs = useCallback(async (): Promise<Organization[]> => {
    const { data } = await supabase.from('organizations').select('*');
    return (data || []).map(rowToOrg);
  }, []);

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    const { data } = await supabase.from('users').select('*');
    return (data || []).map(rowToUser);
  }, []);

  const updateUserByAdmin = useCallback(async (userId: string, updates: { fullName?: string; email?: string; role?: UserRole; status?: UserStatus }): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated.' };
    const dbUpdates: Record<string, unknown> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.email !== undefined) dbUpdates.email = updates.email.toLowerCase();
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status;
      dbUpdates.is_active = updates.status === 'active' || updates.status === 'approved';
    }
    await supabase.from('users').update(dbUpdates).eq('id', userId);
    return {};
  }, [currentUser]);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isOrgAdmin = currentUser?.role === 'org_admin';
  const isAdmin = isSuperAdmin || isOrgAdmin;
  const isViewer = currentUser?.role === 'org_viewer';

  return (
    <AuthContext.Provider value={{ currentUser, currentOrg, isLoading, login, logout, registerOrg, acceptInvite, getInvite, createInvite, updateProfile, updateOrgSettings, changePassword, setUserStatus, getAuditLog, getAllOrgs, getAllUsers, updateUserByAdmin, isSuperAdmin, isOrgAdmin, isAdmin, isViewer }}>
      {children}
    </AuthContext.Provider>
  );
}
