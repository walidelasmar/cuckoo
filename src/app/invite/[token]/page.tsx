'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { useAuth } from '@/hooks/use-auth';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const { getInvite, acceptInvite } = useAuth();
  const router = useRouter();
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : '';

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    const invite = getInvite(token);
    if (!invite || invite.accepted || new Date(invite.expiresAt).getTime() < Date.now()) {
      setInviteValid(false);
    } else {
      setInviteValid(true);
      setInviteEmail(invite.email);
    }
  }, [token, getInvite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await acceptInvite(token, fullName, password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
    }
  };

  if (inviteValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inviteValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto grid w-[350px] gap-6 text-center">
          <div className="flex justify-center"><Logo /></div>
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-bold font-headline">Invite Invalid</h1>
            <p className="text-muted-foreground text-sm">
              This invite link is invalid, has expired, or has already been used.
            </p>
          </div>
          <Link href="/" className="text-sm underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="mx-auto grid w-[380px] gap-6">
        <div className="grid gap-2 text-center">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="text-3xl font-bold font-headline">Accept Invite</h1>
          <p className="text-balance text-muted-foreground">
            You have been invited to join. Set your name and password to get started.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="inviteEmail">Email</Label>
            <Input id="inviteEmail" type="email" value={inviteEmail} readOnly className="bg-muted" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="Jane Smith" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Min. 8 chars, uppercase, number, special char" />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Joining...</> : 'Join Organization'}
          </Button>
        </form>
      </div>
    </div>
  );
}
