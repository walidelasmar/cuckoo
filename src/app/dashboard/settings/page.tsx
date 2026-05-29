'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { validatePassword, sendUserActivationEmail } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, UserCircle, Building2, Lock, UserPlus, ShieldCheck, Users, Globe, Edit2, X, Check } from 'lucide-react';
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

const STATUS_CONFIG: Record<UserStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active:           { label: 'Active',           variant: 'default' },
  approved:         { label: 'Approved',         variant: 'secondary' },
  pending_approval: { label: 'Pending Approval', variant: 'outline' },
  deactivated:      { label: 'Deactivated',      variant: 'destructive' },
};

function UserStatusBadge({ status }: { status: UserStatus | undefined }) {
  if (!status) return null;
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function getRoleLabel(role: UserRole, t: any): string {
  switch (role) {
    case 'super_admin': return t.settings.superAdmin;
    case 'org_admin': return t.settings.accountAdmin;
    case 'org_editor': return t.settings.accountEditor;
    case 'org_viewer': return t.settings.accountViewer;
    default: return role.replace(/_/g, ' ');
  }
}

export default function SettingsPage() {
  const { currentUser, currentOrg, isLoading, isSuperAdmin, isOrgAdmin, isAdmin, isViewer,
          updateProfile, updateOrgSettings, changePassword, createInvite, setUserStatus,
          getAllUsers, getAllOrgs, updateUserByAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();

  // Profile state
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Org state
  const [orgName, setOrgName] = useState(currentOrg?.name || '');
  const [orgCountry, setOrgCountry] = useState(currentOrg?.country || '');
  const [orgCountryCode, setOrgCountryCode] = useState(currentOrg?.countryCode || '');
  const [orgAddress, setOrgAddress] = useState(currentOrg?.address || '');
  const [orgCurrency, setOrgCurrency] = useState<string>(currentOrg?.currency || 'USD');
  const [orgLang, setOrgLang] = useState<'en' | 'es'>(currentOrg?.preferredLanguage || 'en');
  const [orgLoading, setOrgLoading] = useState(false);

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('org_editor');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // Users list state (super admin only) — local copy to reflect toggle changes immediately
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Org members state (org admin only)
  const [orgMembers, setOrgMembers] = useState<User[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberRole, setEditMemberRole] = useState<UserRole>('org_editor');
  const [editMemberStatus, setEditMemberStatus] = useState<UserStatus>('active');
  const [memberSaving, setMemberSaving] = useState(false);

  // All orgs (super admin only)
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);

  // Always read fresh user list from Supabase when page mounts or super admin status is known
  useEffect(() => {
    if (isSuperAdmin) {
      getAllUsers().then(users => setManagedUsers(users.filter(u => u.id !== 'usr-superadmin')));
    }
  }, [isSuperAdmin, getAllUsers]);

  useEffect(() => {
    if (isSuperAdmin) {
      getAllOrgs().then(setAllOrgs);
    }
  }, [isSuperAdmin, getAllOrgs]);

  // Load org members for org admin
  useEffect(() => {
    if (isOrgAdmin && currentUser?.orgId) {
      getAllUsers().then(users => {
        setOrgMembers(users.filter(u => u.orgId === currentUser.orgId && u.id !== currentUser.id));
      });
    }
  }, [isOrgAdmin, currentUser, getAllUsers]);

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
    if (result.error) toast({ variant: 'destructive', title: t.common.error, description: result.error });
    else toast({ title: t.settings.profile, description: t.settings.saveProfile });
  };

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgLoading(true);
    const result = await updateOrgSettings({ name: orgName, country: orgCountry, countryCode: orgCountryCode, address: orgAddress, currency: orgCurrency, preferredLanguage: orgLang });
    setOrgLoading(false);
    if (result.error) toast({ variant: 'destructive', title: t.common.error, description: result.error });
    else toast({ title: t.settings.orgSettings, description: t.settings.saveOrg });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    const validationError = validatePassword(newPw);
    if (validationError) { setPwError(validationError); return; }
    setPwLoading(true);
    const result = await changePassword(currentPw, newPw);
    setPwLoading(false);
    if (result.error) setPwError(result.error);
    else toast({ title: t.settings.changePassword, description: t.settings.changePasswordDesc });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLink('');
    setInviteLoading(true);
    const orgId = isSuperAdmin ? inviteOrgId : (currentUser?.orgId || '');
    const result = await createInvite(inviteEmail, inviteRole, orgId);
    setInviteLoading(false);
    if (result.error) {
      toast({ variant: 'destructive', title: t.common.error, description: result.error });
    } else if (result.token) {
      const link = `${window.location.origin}/invite/${result.token}`;
      setInviteLink(link);
      setInviteEmail('');
      toast({ title: t.settings.inviteUser, description: t.settings.sendInvite });
    }
  };

  const handleUserToggle = useCallback(async (user: User, checked: boolean) => {
    const currentStatus = user.status;
    let newStatus: UserStatus;
    if (checked) {
      newStatus = currentStatus === 'pending_approval' ? 'approved' : 'active';
    } else {
      newStatus = 'deactivated';
    }
    setTogglingUserId(user.id);
    const result = await setUserStatus(user.id, newStatus);
    setTogglingUserId(null);
    if (result.error) {
      toast({ variant: 'destructive', title: t.common.error, description: result.error });
    } else {
      setManagedUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus, isActive: checked } : u));
      if (newStatus === 'approved') {
        sendUserActivationEmail(user.email, user.fullName, window.location.origin);
        toast({ title: t.settings.active, description: `${user.fullName} can now log in.` });
      } else if (newStatus === 'active') {
        toast({ title: t.settings.active, description: `${user.fullName}'s account has been activated.` });
      } else {
        toast({ title: t.settings.deactivated, description: `${user.fullName}'s account has been deactivated.` });
      }
    }
  }, [setUserStatus, toast, t]);

  const isSwitchOn = (status: UserStatus | undefined): boolean => {
    return status === 'active' || status === 'approved';
  };

  // Org member editing handlers
  const startEditMember = (member: User) => {
    setEditingMemberId(member.id);
    setEditMemberName(member.fullName);
    setEditMemberEmail(member.email);
    setEditMemberRole(member.role);
    setEditMemberStatus(member.status);
  };

  const cancelEditMember = () => {
    setEditingMemberId(null);
  };

  const saveMember = async (memberId: string) => {
    setMemberSaving(true);
    const result = await updateUserByAdmin(memberId, {
      fullName: editMemberName,
      email: editMemberEmail,
      role: editMemberRole,
      status: editMemberStatus,
    });
    setMemberSaving(false);
    if (result.error) {
      toast({ variant: 'destructive', title: t.common.error, description: result.error });
    } else {
      setOrgMembers(prev => prev.map(m => m.id === memberId ? {
        ...m,
        fullName: editMemberName,
        email: editMemberEmail,
        role: editMemberRole,
        status: editMemberStatus,
        isActive: editMemberStatus === 'active' || editMemberStatus === 'approved',
      } : m));
      setEditingMemberId(null);
      toast({ title: t.settings.saveUser, description: 'User updated successfully.' });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 max-w-4xl">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-1">{t.settings.subtitle}</p>
      </div>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />{t.settings.platformOverview}</CardTitle>
            <CardDescription>{t.settings.platformOverviewDesc}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-muted p-4 text-center">
              <p className="text-2xl font-bold">{allOrgs.length}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.settings.organizations}</p>
            </div>
            <div className="rounded-md bg-muted p-4 text-center">
              <p className="text-2xl font-bold">{managedUsers.length}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.settings.totalUsers}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{t.settings.allUsers}</CardTitle>
            <CardDescription>{t.settings.allUsersDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {managedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t.settings.user}</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t.settings.organization}</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t.settings.role}</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t.settings.status}</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">{t.settings.active}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managedUsers.map((user) => {
                      const org = allOrgs.find(o => o.id === user.orgId);
                      const status = user.status;
                      const switchOn = isSwitchOn(status);
                      const isToggling = togglingUserId === user.id;
                      return (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="py-3 pr-4">
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {org?.name || <span className="italic text-xs">{t.common.noOrg}</span>}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-muted-foreground">{getRoleLabel(user.role, t)}</span>
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
          <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" />{t.settings.profile}</CardTitle>
          <CardDescription>{t.settings.profileDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="settingsFullName">{t.settings.fullName}</Label>
              <Input id="settingsFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isViewer} />
            </div>
            <div className="grid gap-2">
              <Label>{t.settings.email}</Label>
              <Input value={currentUser?.email || ''} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>{t.settings.role}</Label>
              <Input value={currentUser ? getRoleLabel(currentUser.role, t) : ''} readOnly className="bg-muted capitalize" />
            </div>
            {!isViewer && (
              <Button type="submit" size="sm" disabled={profileLoading} className="w-fit">
                {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t.settings.saveProfile}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {isOrgAdmin && currentOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />{t.settings.orgSettings}</CardTitle>
            <CardDescription>{t.settings.orgSettingsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOrgSave} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="settingsOrgName">{t.settings.orgName}</Label>
                <Input id="settingsOrgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>{t.settings.country}</Label>
                <Select value={orgCountryCode} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.common.selectCountry} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="settingsOrgAddress">{t.settings.address}</Label>
                <AddressAutocomplete
                  id="settingsOrgAddress"
                  value={orgAddress}
                  onChange={setOrgAddress}
                  countryCode={orgCountryCode}
                  placeholder={orgCountryCode ? t.common.startTypingAddress : t.common.selectCountryFirst}
                  disabled={!orgCountryCode}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t.settings.currency}</Label>
                <Select value={orgCurrency} onValueChange={(v) => setOrgCurrency(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CAD">CAD (CA$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                    <SelectItem value="CHF">CHF (CHF)</SelectItem>
                    <SelectItem value="MXN">MXN (MX$)</SelectItem>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                    <SelectItem value="AED">AED (AED)</SelectItem>
                    <SelectItem value="SAR">SAR (SAR)</SelectItem>
                    <SelectItem value="MAD">MAD (MAD)</SelectItem>
                    <SelectItem value="EGP">EGP (EGP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" disabled={orgLoading} className="w-fit">
                {orgLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t.settings.saveOrg}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Language Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{t.settings.language}</CardTitle>
          <CardDescription>{t.settings.language_switch_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t.settings.english}</span>
            <Switch
              checked={language === 'es'}
              onCheckedChange={(checked) => setLanguage(checked ? 'es' : 'en')}
            />
            <span className="text-sm font-medium">{t.settings.spanish}</span>
          </div>
        </CardContent>
      </Card>

      {/* Org Members Section (Account Admin only) */}
      {isOrgAdmin && !isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{t.settings.orgMembers}</CardTitle>
            <CardDescription>{t.settings.orgMembersDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {orgMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other members in your organization.</p>
            ) : (
              <div className="space-y-3">
                {orgMembers.map((member) => {
                  const isEditing = editingMemberId === member.id;
                  return (
                    <div key={member.id} className="rounded-md border p-3">
                      {isEditing ? (
                        <div className="grid gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1">
                              <Label className="text-xs">{t.settings.fullName}</Label>
                              <Input value={editMemberName} onChange={e => setEditMemberName(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-xs">{t.settings.email}</Label>
                              <Input type="email" value={editMemberEmail} onChange={e => setEditMemberEmail(e.target.value)} className="h-8 text-sm" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1">
                              <Label className="text-xs">{t.settings.role}</Label>
                              <Select value={editMemberRole} onValueChange={(v) => setEditMemberRole(v as UserRole)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="org_admin">{t.settings.accountAdmin}</SelectItem>
                                  <SelectItem value="org_editor">{t.settings.accountEditor}</SelectItem>
                                  <SelectItem value="org_viewer">{t.settings.accountViewer}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-xs">{t.settings.status}</Label>
                              <Select value={editMemberStatus} onValueChange={(v) => setEditMemberStatus(v as UserStatus)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">{t.settings.active}</SelectItem>
                                  <SelectItem value="approved">{t.settings.approved}</SelectItem>
                                  <SelectItem value="pending_approval">{t.settings.pendingApproval}</SelectItem>
                                  <SelectItem value="deactivated">{t.settings.deactivated}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveMember(member.id)} disabled={memberSaving} className="h-7 text-xs">
                              {memberSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                              {t.settings.saveUser}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditMember} className="h-7 text-xs">
                              <X className="h-3 w-3 mr-1" />{t.settings.cancel}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{member.fullName}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{getRoleLabel(member.role, t)}</span>
                              <UserStatusBadge status={member.status} />
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => startEditMember(member)} className="h-7 text-xs">
                            <Edit2 className="h-3 w-3 mr-1" />{t.settings.editUser}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />{t.settings.inviteUser}</CardTitle>
            <CardDescription>
              {isSuperAdmin ? t.settings.inviteUserDescSuperAdmin : t.settings.inviteUserDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="grid gap-4">
              {isSuperAdmin && (
                <div className="grid gap-2">
                  <Label>{t.settings.organization}</Label>
                  <Select value={inviteOrgId} onValueChange={setInviteOrgId}>
                    <SelectTrigger><SelectValue placeholder={t.common.selectOrg} /></SelectTrigger>
                    <SelectContent>
                      {allOrgs.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="inviteEmail">{t.settings.inviteEmail}</Label>
                <Input id="inviteEmail" type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>{t.settings.role}</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org_admin">{t.settings.accountAdmin}</SelectItem>
                    <SelectItem value="org_editor">{t.settings.accountEditor}</SelectItem>
                    <SelectItem value="org_viewer">{t.settings.accountViewer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" disabled={inviteLoading} className="w-fit">
                {inviteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t.settings.sendInvite}
              </Button>
              {inviteLink && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium mb-1">{t.settings.inviteLink}</p>
                  <p className="break-all text-muted-foreground font-mono text-xs">{inviteLink}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.settings.inviteExpires}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />{t.settings.changePassword}</CardTitle>
          <CardDescription>{t.settings.changePasswordDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="grid gap-4">
            {pwError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{pwError}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="currentPw">{t.settings.currentPassword}</Label>
              <Input id="currentPw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required autoComplete="current-password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPw">{t.settings.newPassword}</Label>
              <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required autoComplete="new-password" placeholder="Min. 8 chars, uppercase, number, special char" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPw">{t.settings.confirmPassword}</Label>
              <Input id="confirmPw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required autoComplete="new-password" />
            </div>
            <Button type="submit" size="sm" variant="destructive" disabled={pwLoading} className="w-fit">
              {pwLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t.settings.changePasswordBtn}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
