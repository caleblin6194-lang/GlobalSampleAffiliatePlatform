'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/i18n/language-provider';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

        const role = profile?.role || 'creator';
        router.push(`/${role}/dashboard`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('login.unexpectedError', 'An unexpected error occurred. Please try again.'));
      setLoading(false);
    }
  }, [email, password, router, t]);

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
