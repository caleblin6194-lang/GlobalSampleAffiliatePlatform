'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const VALID_ROLES = ['creator', 'merchant', 'vendor', 'buyer'] as const;
type Role = typeof VALID_ROLES[number];

function getDashboardPath(role: string): string {
  switch (role) {
    case 'merchant': return '/merchant/dashboard';
    case 'creator': return '/creator/dashboard';
    case 'vendor': return '/vendor/dashboard';
    case 'buyer': return '/buyer/dashboard';
    default: return '/login';
  }
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signUpWithFallback = useCallback(
    async (emailValue: string, passwordValue: string, nameValue: string) => {
      const supabase = createClient();

      // Sign up with only full_name in metadata — no role to avoid invalid param errors
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailValue,
        password: passwordValue,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: nameValue },
        },
      });

      return { data, error: signUpError };
    },
    []
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { data, error: signUpError } = await signUpWithFallback(
        email,
        password,
        fullName
      );

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Check if user was created successfully
      if (data?.user) {
        // Create profile with the selected role (after auth user is created)
        const supabase = createClient();
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't block signup for profile errors — user can be created without profile
        }

        // Check if email confirmation is required
        if (data.user.confirmation_sent_at) {
          setSuccess(true);
          setLoading(false);
          return;
        }

        // If no confirmation needed, redirect to dashboard
        router.push(getDashboardPath(role));
      } else {
        // User might need email confirmation
        setSuccess(true);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }, [email, password, fullName, role, router, signUpWithFallback]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join the Global Sample Affiliate Platform</CardDescription>
        </CardHeader>
        
        {success ? (
          <CardContent className="space-y-4">
            <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-500">
              <p className="font-medium mb-1">Check your email!</p>
              <p>We&apos;ve sent a confirmation link to <strong>{email}</strong>. Please click the link to activate your account.</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Didn&apos;t receive the email?{' '}
              <button 
                onClick={() => setSuccess(false)} 
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Already confirmed?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <Select value={role} onValueChange={(val) => setRole(val as Role)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Shop & Earn</SelectItem>
                    <SelectItem value="creator">Content Creator</SelectItem>
                    <SelectItem value="merchant">Brand Merchant</SelectItem>
                    <SelectItem value="vendor">Supplier Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
