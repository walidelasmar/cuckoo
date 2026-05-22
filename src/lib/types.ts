export type Unit =
  | 'g'
  | 'kg'
  | 'oz'
  | 'lb'
  | 'ml'
  | 'l'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'pc'
  | 'portion';

export type RawMaterial = {
  id: string;
  category: string;
  name: string;
  shortName: string;
  provider: string;
  sku: string;
  quantity: number;
  unit: Unit;
  cost: number;
  allergens?: string[];
};

export type Ingredient = {
  id: string;
  rawMaterial: RawMaterial;
  quantity: number;
  unit: Unit;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  description: string;
  portions: number;
  ingredients: Ingredient[];
  pricePerServing?: number;
};

// ─── Auth & Multi-tenant types ───────────────────────────────────────────────

export type UserRole = 'super_admin' | 'org_admin' | 'org_editor';

export type Organization = {
  id: string;
  name: string;
  address: string;
  preferredLanguage: 'en' | 'es';
  currency: 'USD' | 'EUR';
  logoUrl?: string;
  createdAt: string;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  orgId: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
};

export type Session = {
  userId: string;
  orgId: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  rememberMe: boolean;
};

export type InviteToken = {
  token: string;
  email: string;
  role: UserRole;
  orgId: string;
  invitedBy: string;
  expiresAt: string;
  accepted: boolean;
};

export type AuditLogEntry = {
  id: string;
  event: string;
  userId?: string;
  orgId?: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
};
