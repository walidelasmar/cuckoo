'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { PlaceHolderImages } from '@/lib/images/placeholder-images';
import { useAuth } from '@/hooks/use-auth';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { registerOrg } = useAuth();
  const router = useRouter();

  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginBg = PlaceHolderImages.find((img) => img.id === 'login-background');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await registerOrg(orgName, orgAddress, email, fullName, password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[380px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <h1 className="text-3xl font-bold font-headline">Create Account</h1>
            <p className="text-balance text-muted-foreground">
              Set up your organization and admin account.
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
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" placeholder="The Good Food Place" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="orgAddress">Organization Address</Label>
              <Input id="orgAddress" placeholder="123 Main St, City, Country" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Your Full Name</Label>
              <Input id="fullName" placeholder="Jane Smith" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Min. 8 chars, uppercase, number, special char" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/" className="underline">Login</Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginBg && (
          <Image src={loginBg.imageUrl} alt={loginBg.description} width="1920" height="1080" data-ai-hint={loginBg.imageHint} className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
        )}
      </div>
    </div>
  );
}
