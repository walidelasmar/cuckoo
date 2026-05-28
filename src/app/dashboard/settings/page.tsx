'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { validatePassword, sendUserActivationEmail } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, UserCircle, Building2, Lock, UserPlus, ShieldCheck, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { UserRole, UserStatus, User, Organization } from '@/lib/types';

const COUNTRIES = [
  { name: 'United States', code: 'us' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'Canada', code: 'ca' },
  { name: 'Australia', code: 'au' },
  { name: 'France', code: 'fr' },
  { name: 'Germany', code: 'de' },
  { name: 'Spain', code: 'es' },
  { name: 'Italy', code: 'it' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'Belgium', code: 'be' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Austria', code: 'at' },
  { name: 'Sweden', code: 'se' },
  { name: 'Norway', code: 'no' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Finland', code: 'fi' },
  { name: 'Poland', code: 'pl' },
  { name: 'Brazil', code: 'br' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Argentina', code: 'ar' },
  { name: 'Chile', code: 'cl' },
  { name: 'Colombia', code: 'co' },
  { name: 'Japan', code: 'jp' },
  { name: 'South Korea', code: 'kr' },
  { name: 'China', code: 'cn' },
  { name: 'India', code: 'in' },
  { name: 'Singapore', code: 'sg' },
  { name: 'United Arab Emirates', code: 'ae' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'South Africa', code: 'za' },
  { name: 'Morocco', code: 'ma' },
  { name: 'Egypt', code: 'eg' },
  { name: 'New Zealand', code: 'nz' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Greece', code: 'gr' },
  { name: 'Turkey', code: 'tr' },
  { name: 'Israel', code: 'il' },
  { name: 'Lebanon', code: 'lb' },
  { name: 'Tunisia', code: 'tn' },
];

const STATUS_BADGE: Record<UserStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active:           { label: 'Active',           variant: 'default' },
  approved:         { label: 'Approved',         variant: 'secondary' },
  pending_approval: { label: 'Pending Approval', variant: 'outline' },
  deactivated:      { label: 'Deactivated',      variant: 'destructive' },
};

function UserStatusBadge({ status }: { status: UserStatus | undefined }) {
  const s = status || 'active';
  const cfg = STATUS_BADGE[s] || STATUS_BADGE.active;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function SettingsPage() {
  const { currentUser, currentOrg, updateProfile, updateOrgSettings, changePassword, createInvite, setUserStatus, getAllOrgs, getAllUsers } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isOrgAdmin = currentUser?.role === 'org_admin';
  const isAdmin = isOrgAdmin || isSuperAdmin;

  // Profile state
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Org state
  const [orgName, setOrgName] = useState(currentOrg?.name || '');
  const [orgCountry, setOrgCountry] = useState(currentOrg?.country || '');
  const [orgCountryCode, setOrgCountryCode] = useState(currentOrg?.countryCode || '');
  const [orgAddress, setOrgAddress] = useState(currentOrg?.address || '');
  const [orgCurrency, setOrgCurrency] = useState<'USD' | 'EUR'>((currentOrg?.currency as 'USD' | 'EUR') || 'USD');
  const [orgLang, setOrgLang] = useState<'en' | 'es'>((currentOrg?.preferredLanguage as 'en' | 'es') || 'en');
  const [orgLoading, setOrgLoading] = useState(false);

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('org_editor');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // Users list state (super admin only) Ã¢ÂÂ local copy to reflect toggle changes immediately
  const [usersSnapshot, setUsersSnapshot] = useState<User[]>([]);

  // Always read fresh user list from Supabase when page mounts or super admin status is known
  useEffect(() => {
    if (isSuperAdmin) {
      getAllUsers().then(users => setUsersSnapshot(users));
    }
  }, [isSuperAdmin, getAllUsers]);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  useEffect(() => {
    if (isSuperAdmin) {
      getAllOrgs().then(orgs => setAllOrgs(orgs));
    }
  }, [isSuperAdmin, getAllOrgs]);
  const orgById = (id: string) => allOrgs.find(o => o.id === id);

  // Exclude the super admin account itself from the users table
  const managedUsers = usersSnapshot.filter(u => u.role !== 'super_admin');

  const handleCountryChange = (code: string) => {
    const found = COUNTRIES.find(c => c.code === code);
    if (found) {
      setOrgCountryCode(found.code);
      setOrgCountry(found.name);
      setOrgAddress('');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    const result = await updateProfile({ fullName });
    setProfileLoading(false);
    if (result.error) toast({ variant: 'destructive', title: 'Error', description: result.error });
    else toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
  };

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgLoading(true);
    const result = await updateOrgSettings({ name: orgName, country: orgCountry, countryCode: orgCountryCode, address: orgAddress, currency: orgCurrency, preferredLanguage: orgLang });
    setOrgLoading(false);
    if (result.error) toast({ variant: 'destructive', title: 'Error', description: result.error });
    else toast({ title: 'Organization updated', description: 'Organization settings saved.' });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    const validationError = validatePassword(newPw);
    if (validationError) { setPwError(validationError); return; }
    setPwLoading(true);
    const result = await changePassword(currentPw, newPw);
    setPwLoading(false);
    if (result.error) setPwError(result.error);
    else toast({ title: 'Password changed', description: 'You have been signed out. Please log in again.' });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLink('');
    setInviteLoading(true);
    const targetOrgId = isSuperAdmin ? inviteOrgId : (currentUser?.orgId || '');
    const result = await createInvite(inviteEmail, inviteRole, targetOrgId);
    setInviteLoading(false);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else if (result.token) {
      const link = `${window.location.origin}/invite/${result.token}`;
      setInviteLink(link);
      setInviteEmail('');
      toast({ title: 'Invite created', description: 'Share the link below with the invitee.' });
    }
  };

  const handleUserToggle = useCallback(async (user: User, checked: boolean) => {
    // Determine the new status based on current status and switch direction (1.b)
    const currentStatus: UserStatus = user.status || (user.isActive ? 'active' : 'deactivated');
    let newStatus: UserStatus;
    if (checked) {
      // Switch turned ON -> activate
      newStatus = 'active';
    } else {
      // Switch turned OFF -> deactivate
      newStatus = 'deactivated';
    }
    setTogglingUserId(user.id);
    const result = await setUserStatus(user.id, newStatus);
    setTogglingUserId(null);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      // Update local snapshot
      setUsersSnapshot(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus, isActive: newStatus === 'active' } : u));
      if (newStatus === 'active' && currentStatus === 'pending_approval') {
        // Send activation email to user (2.c)
        sendUserActivationEmail(user.email, user.fullName, window.location.origin);
        toast({ title: 'Account activated', description: `${user.fullName} can now log in. An activation email will be sent.` });
      } else if (newStatus === 'active') {
        toast({ title: 'Account activated', description: `${user.fullName}'s account has been activated.` });
      } else {
        toast({ title: 'Account deactivated', description: `${user.fullName}'s account has been deactivated.` });
      }
    }
  }, [setUserStatus, toast]);

  const isSwitchOn = (status: UserStatus | undefined): boolean => {
    const s = status || 'active';
    return s === 'active' || s === 'approved';
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 max-w-4xl">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and organization settings.</p>
      </div>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Platform Overview</CardTitle>
            <CardDescription>Super Admin platform-level summary.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-muted p-4 text-center">
              <p className="text-2xl font-bold">{allOrgs.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Organizations</p>
            </div>
            <div className="rounded-md bg-muted p-4 text-center">
              <p className="text-2xl font-bold">{managedUsers.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Users</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />User Management</CardTitle>
            <CardDescription>Review and manage all user accounts. Toggle the switch to activate or deactivate a user.</CardDescription>
          </CardHeader>
          <CardContent>
            {managedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No users yet. Users will appear here after they submit account requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Full Name</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Organization</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Role</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managedUsers.map(user => {
                      const org = orgById(user.orgId);
                      const status: UserStatus = user.status || (user.isActive ? 'active' : 'deactivated');
                      const switchOn = isSwitchOn(user.status);
                      const isToggling = togglingUserId === user.id;
                      return (
                        <tr key={user.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="py-3 pr-4">
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {org?.name || <span className="italic text-xs">No org</span>}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="capitalize text-muted-foreground">{user.role.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <UserStatusBadge status={status} />
                          </td>
                          <td className="py-3">
                            {isToggling ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Switch
                                checked={switchOn}
                                onCheckedChange={(checked) => handleUserToggle(user, checked)}
                                aria-label={`Toggle ${user.fullName}`}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" />Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="settingsFullName">Full Name</Label>
              <Input id="settingsFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={currentUser?.email || ''} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Input value={currentUser?.role?.replace(/_/g, ' ') || ''} readOnly className="bg-muted capitalize" />
            </div>
            <Button type="submit" size="sm" disabled={profileLoading} className="w-fit">
              {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {isOrgAdmin && currentOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Organization</CardTitle>
            <CardDescription>Manage your organization settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOrgSave} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="settingsOrgName">Organization Name</Label>
                <Input id="settingsOrgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>Country</Label>
                <Select value={orgCountryCode} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="settingsOrgAddress">Address</Label>
                <AddressAutocomplete
                  id="settingsOrgAddress"
                  value={orgAddress}
                  onChange={setOrgAddress}
                  countryCode={orgCountryCode}
                  placeholder={orgCountryCode ? 'Start typing an address...' : 'Select a country first'}
                  disabled={!orgCountryCode}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={orgCurrency} onValueChange={(v) => setOrgCurrency(v as 'USD' | 'EUR')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (Ã¢ÂÂ¬)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Language</Label>
                  <Select value={orgLang} onValueChange={(v) => setOrgLang(v as 'en' | 'es')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={orgLoading} className="w-fit">
                {orgLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Organization
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Invite User</CardTitle>
            <CardDescription>
              {isSuperAdmin ? 'Invite a new Org Admin to an existing organization.' : 'Invite a new team member to your organization.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="grid gap-4">
              {isSuperAdmin && (
                <div className="grid gap-2">
                  <Label>Organization</Label>
                  <Select value={inviteOrgId} onValueChange={setInviteOrgId}>
                    <SelectTrigger><SelectValue placeholder="Select an organization..." /></SelectTrigger>
                    <SelectContent>
                      {allOrgs.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input id="inviteEmail" type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org_admin">Org Admin</SelectItem>
                    <SelectItem value="org_editor">Org Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" disabled={inviteLoading || (isSuperAdmin && !inviteOrgId)} className="w-fit">
                {inviteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Send Invite
              </Button>
              {inviteLink && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium mb-1">Share this invite link:</p>
                  <p className="break-all text-muted-foreground font-mono text-xs">{inviteLink}</p>
                  <p className="text-xs text-muted-foreground mt-1">Expires in 72 hours.</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle>
          <CardDescription>You will be signed out after changing your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="grid gap-4">
            {pwError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{pwError}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="currentPw">Current Password</Label>
              <Input id="currentPw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required autoComplete="current-password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPw">New Password</Label>
              <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required autoComplete="new-password" placeholder="Min. 8 chars, uppercase, number, special char" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPw">Confirm New Password</Label>
              <Input id="confirmPw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required autoComplete="new-password" />
            </div>
            <Button type="submit" size="sm" variant="destructive" disabled={pwLoading} className="w-fit">
              {pwLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
