'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/i18n/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLE_OPTIONS = ['creator', 'merchant', 'vendor', 'buyer'] as const;
type Role = typeof ROLE_OPTIONS[number];
type LoginRole = Role | 'auto';
type ProfileRole = Role | 'admin';

function isRole(value: string | null): value is Role {
  return value !== null && ROLE_OPTIONS.includes(value as Role);
}

function isProfileRole(value: unknown): value is ProfileRole {
  return (
    value === 'admin' ||
    value === 'creator' ||
    value === 'merchant' ||
    value === 'vendor' ||
    value === 'buyer'
  );
}

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState<LoginRole>('auto');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requestedRole = new URLSearchParams(window.location.search).get('role');
    if (isRole(requestedRole)) {
      setLoginRole(requestedRole);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const currentRole = isProfileRole(profile?.role) ? profile.role : null;
        if (currentRole === 'admin') {
          router.push('/admin/dashboard');
          return;
        }

        let targetRole: Role = currentRole ?? 'creator';

        if (loginRole !== 'auto') {
          if (currentRole !== loginRole) {
            const roleResponse = await fetch('/api/auth/role', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: loginRole }),
            });
            const roleResult = (await roleResponse.json().catch(() => ({}))) as {
              ok?: boolean;
              message?: string;
            };

            if (!roleResponse.ok || !roleResult.ok) {
              setError(roleResult.message || t('login.roleSwitchFailed', 'Failed to switch role. Please try again.'));
              setLoading(false);
              return;
            }
          }

          targetRole = loginRole;
        }

        router.push(`/${targetRole}/dashboard`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('login.unexpectedError', 'An unexpected error occurred. Please try again.'));
      setLoading(false);
    }
  }, [email, loginRole, password, router, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('login.title', 'Sign In')}</CardTitle>
        <CardDescription>{t('login.description', 'Enter your credentials to access your account')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.email', 'Email')}</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('login.password', 'Password')}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginRole">{t('login.loginAs', 'Login as')}</Label>
            <Select value={loginRole} onValueChange={(value) => setLoginRole(value as LoginRole)}>
              <SelectTrigger id="loginRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t('login.autoRole', 'Auto (use account role)')}</SelectItem>
                <SelectItem value="creator">{t('header.role.creator', 'Content Creator')}</SelectItem>
                <SelectItem value="merchant">{t('header.role.merchant', 'Brand Merchant')}</SelectItem>
                <SelectItem value="vendor">{t('header.role.vendor', 'Supplier Vendor')}</SelectItem>
                <SelectItem value="buyer">{t('header.role.buyer', 'Buyer')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('login.roleHint', 'Auto will keep your existing account role. Choose another role to switch.')}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('login.signingIn', 'Signing in...') : t('login.signIn', 'Sign In')}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t('login.noAccount', 'No account?')}{' '}
            <Link href="/register" className="text-primary hover:underline">{t('login.createOne', 'Create one')}</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
