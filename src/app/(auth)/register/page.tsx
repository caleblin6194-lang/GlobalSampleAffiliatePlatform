'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const VALID_ROLES = ['creator', 'merchant', 'vendor', 'buyer'] as const;
type Role = typeof VALID_ROLES[number];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const signUpWithFallback = useCallback(
    async (emailValue: string, passwordValue: string, nameValue: string) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailValue,
            password: passwordValue,
            fullName: nameValue,
            role,
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload.ok) {
          return {
            data: null,
            error: {
              message: payload.message || 'Registration failed.',
            },
            usedServerFallback: true,
          };
        }

        return {
          data: {
            user: payload.userId
              ? {
                  id: payload.userId,
                  email: emailValue,
                  confirmation_sent_at: payload.needsEmailConfirmation
                    ? new Date().toISOString()
                    : null,
                }
              : null,
            needsEmailConfirmation: Boolean(payload.needsEmailConfirmation),
          },
          error: null,
          usedServerFallback: true,
        };
      } catch {
        return {
          data: null,
          error: { message: 'Network error while registering. Please try again.' },
          usedServerFallback: true,
        };
      }
    },
    [role]
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
      const confirmationRequired = Boolean(
        data?.needsEmailConfirmation || data?.user?.confirmation_sent_at
      );

      if (confirmationRequired) {
        setNeedsEmailConfirmation(true);
        setSuccess(true);
        setLoading(false);
        return;
      }

      // If confirmation is not required, allow the user to sign in directly.
      router.push('/login?registered=true');
      setLoading(false);
      return;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }, [email, password, fullName, router, signUpWithFallback]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join the Global Sample Affiliate Platform</CardDescription>
        </CardHeader>
        
        {success ? (
          <CardContent className="space-y-4">
            {needsEmailConfirmation ? (
              <>
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
              </>
            ) : (
              <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-500">
                <p className="font-medium mb-1">Account created successfully.</p>
                <p>You can sign in now.</p>
              </div>
            )}
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
