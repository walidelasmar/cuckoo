'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { validatePassword } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, UserCircle, Building2, Lock, UserPlus, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserRole } from '@/lib/types';

export default function SettingsPage() {
  const { currentUser, currentOrg, updateProfile, updateOrgSettings, changePassword, createInvite, getAllOrgs, getAllUsers } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isOrgAdmin = currentUser?.role === 'org_admin';
  const isAdmin = isOrgAdmin || isSuperAdmin;

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [orgName, setOrgName] = useState(currentOrg?.name || '');
  const [orgAddress, setOrgAddress] = useState(currentOrg?.address || '');
  const [orgCurrency, setOrgCurrency] = useState<'USD' | 'EUR'>((currentOrg?.currency as 'USD' | 'EUR') || 'USD');
  const [orgLang, setOrgLang] = useState<'en' | 'es'>((currentOrg?.preferredLanguage as 'en' | 'es') || 'en');
  const [orgLoading, setOrgLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('org_editor');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const allOrgs = isSuperAdmin ? getAllOrgs() : [];
  const allUsers = isSuperAdmin ? getAllUsers() : [];

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
    const result = await updateOrgSettings({ name: orgName, address: orgAddress, currency: orgCurrency, preferredLanguage: orgLang });
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

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 max-w-2xl">
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
              <p className="text-2xl font-bold">{allUsers.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Users</p>
            </div>
            {allOrgs.length > 0 && (
              <div className="col-span-2">
                <p className="text-sm font-medium mb-2">Organizations:</p>
                <ul className="space-y-1">
                  {allOrgs.map(org => (
                    <li key={org.id} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="font-medium text-foreground">{org.name}</span>
                      <span className="text-xs">— {org.address || 'No address'}</span>
                    </li>
                  ))}
                </ul>
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
                <Label htmlFor="settingsOrgAddress">Address</Label>
                <Input id="settingsOrgAddress" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={orgCurrency} onValueChange={(v) => setOrgCurrency(v as 'USD' | 'EUR')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
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
                  <Select value={inviteOrgId} onValueChange={setInviteOrgId} required>
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
