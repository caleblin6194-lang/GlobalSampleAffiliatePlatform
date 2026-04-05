'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/i18n/language-provider';

const VALID_ROLES = ['creator', 'merchant', 'vendor', 'buyer'] as const;
type Role = typeof VALID_ROLES[number];
type SignUpResult = {
  user: {
    id: string;
    email: string;
    confirmation_sent_at: string | null;
    email_confirmed_at: string | null;
    identities: unknown[];
  } | null;
  needsEmailConfirmation: boolean;
  existingAccount: boolean;
  alreadyConfirmed: boolean;
};

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requestedRole = new URLSearchParams(window.location.search).get('role');
    if (requestedRole && VALID_ROLES.includes(requestedRole as Role)) {
      setRole(requestedRole as Role);
    }
  }, []);

  const signUpWithFallback = useCallback(
    async (
      emailValue: string,
      passwordValue: string,
      confirmPasswordValue: string,
      nameValue: string
    ) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailValue,
            password: passwordValue,
            confirmPassword: confirmPasswordValue,
            fullName: nameValue,
            role,
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload.ok) {
          const message = [payload.message, payload.hint].filter(Boolean).join(' ');
          return {
            data: null,
            error: {
              message: message || t('register.unexpectedError', 'An unexpected error occurred. Please try again.'),
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
                  email_confirmed_at: payload.alreadyConfirmed
                    ? new Date().toISOString()
                    : null,
                  identities: [],
                }
              : null,
            needsEmailConfirmation: Boolean(payload.needsEmailConfirmation),
            existingAccount: Boolean(payload.existingAccount),
            alreadyConfirmed: Boolean(payload.alreadyConfirmed),
          } as SignUpResult,
          error: null,
          usedServerFallback: true,
        };
      } catch {
        return {
          data: null,
          error: { message: t('register.networkError', 'Network error while registering. Please try again.') },
          usedServerFallback: true,
        };
      }
    },
    [role, t]
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setResendMessage('');

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch', 'Passwords do not match. Please enter the same password twice.'));
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await signUpWithFallback(
        email,
        password,
        confirmPassword,
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
      const alreadyConfirmed = Boolean(data?.alreadyConfirmed || data?.user?.email_confirmed_at);
      const existingAccount = Boolean(data?.existingAccount);

      if (confirmationRequired) {
        setNeedsEmailConfirmation(true);
        setSuccess(true);
        setLoading(false);
        return;
      }

      if (existingAccount && alreadyConfirmed) {
        setError(t('register.alreadyRegisteredConfirmed', 'This email is already registered and confirmed. Please sign in directly.'));
        setLoading(false);
        return;
      }

      if (existingAccount && !alreadyConfirmed) {
        setNeedsEmailConfirmation(true);
        setSuccess(true);
        setResendMessage(t('register.alreadyRegisteredUnconfirmed', 'This email is already registered but not confirmed. You can resend the confirmation email.'));
        setLoading(false);
        return;
      }

      // If confirmation is not required, allow the user to sign in directly.
      router.push('/login?registered=true');
      setLoading(false);
      return;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || t('register.unexpectedError', 'An unexpected error occurred. Please try again.'));
      setLoading(false);
    }
  }, [confirmPassword, email, password, fullName, router, signUpWithFallback, t]);

  const handleResendConfirmation = useCallback(async () => {
    if (!email) return;

    setResendLoading(true);
    setResendMessage('');
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        const message = [payload.message, payload.hint].filter(Boolean).join(' ');
        setResendMessage(message || t('register.resendNetworkError', 'Network error while resending. Please try again.'));
        setResendLoading(false);
        return;
      }

      setResendMessage(t('register.resendSuccess', 'Confirmation email resent. Please check inbox/spam.'));
      setResendLoading(false);
    } catch {
      setResendMessage(t('register.resendNetworkError', 'Network error while resending. Please try again.'));
      setResendLoading(false);
    }
  }, [email, t]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('register.title', 'Create Account')}</CardTitle>
          <CardDescription>{t('register.description', 'Join the Global Sample Affiliate Platform')}</CardDescription>
        </CardHeader>
        
        {success ? (
          <CardContent className="space-y-4">
            {needsEmailConfirmation ? (
              <>
                <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-500">
                  <p className="font-medium mb-1">{t('register.checkEmailTitle', 'Check your email!')}</p>
                  <p>
                    {t('register.checkEmailBody', "We've sent a confirmation link to {email}. Please click the link to activate your account.").replace('{email}', email)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {t('register.didNotReceiveEmail', "Didn't receive the email?")}{' '}
                  <button
                    onClick={handleResendConfirmation}
                    className="text-primary hover:underline"
                    disabled={resendLoading}
                  >
                    {resendLoading
                      ? t('register.resending', 'Resending...')
                      : t('register.resendEmail', 'Resend email')}
                  </button>
                </p>
                {resendMessage && (
                  <p className="text-sm text-muted-foreground text-center">{resendMessage}</p>
                )}
              </>
            ) : (
              <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-500">
                <p className="font-medium mb-1">{t('register.successTitle', 'Account created successfully.')}</p>
                <p>{t('register.successBody', 'You can sign in now.')}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              {t('register.alreadyConfirmed', 'Already confirmed?')}{' '}
              <Link href="/login" className="text-primary hover:underline">
                {t('register.signIn', 'Sign in')}
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
                <Label htmlFor="fullName">{t('register.fullName', 'Full Name')}</Label>
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
                <Label htmlFor="email">{t('register.email', 'Email')}</Label>
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
                <Label htmlFor="password">{t('register.password', 'Password')}</Label>
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
                <Label htmlFor="confirmPassword">{t('register.confirmPassword', 'Confirm Password')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('register.accountType', 'Account Type')}</Label>
                <Select value={role} onValueChange={(val) => setRole(val as Role)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">{t('register.roleBuyer', 'Shop & Earn')}</SelectItem>
                    <SelectItem value="creator">{t('register.roleCreator', 'Content Creator')}</SelectItem>
                    <SelectItem value="merchant">{t('register.roleMerchant', 'Brand Merchant')}</SelectItem>
                    <SelectItem value="vendor">{t('register.roleVendor', 'Supplier Vendor')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('register.creatingAccount', 'Creating account...') : t('register.createAccount', 'Create Account')}
              </Button>
              <div className="w-full rounded-md border p-3 text-sm">
                <p className="mb-2 text-muted-foreground">{t('register.didNotReceiveConfirmEmail', "Didn't receive confirmation email?")}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading || !email}
                >
                  {resendLoading
                    ? t('register.resending', 'Resending...')
                    : t('register.resendConfirmationEmail', 'Resend Confirmation Email')}
                </Button>
                {resendMessage && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">{resendMessage}</p>
                )}
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {t('register.needDiagnostics', 'Need diagnostics?')}{' '}
                  <Link href="/api/auth/email-health" className="text-primary hover:underline">
                    {t('register.openEmailHealthCheck', 'Open email health check')}
                  </Link>
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {t('register.alreadyHaveAccount', 'Already have an account?')}{' '}
                <Link href="/login" className="text-primary hover:underline">
                  {t('register.signIn', 'Sign in')}
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
