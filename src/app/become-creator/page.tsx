'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, DollarSign, Gift, Zap, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Earn Commission',
    description: 'Get paid for every sale made through your unique affiliate link.',
  },
  {
    icon: Gift,
    title: 'Free Products',
    description: 'Receive free samples from brands looking for authentic content.',
  },
  {
    icon: Video,
    title: 'Create Content',
    description: 'Share your honest reviews on TikTok, Instagram, or YouTube.',
  },
  {
    icon: Zap,
    title: 'Flexible Work',
    description: 'Work on your own schedule. Create content when inspiration strikes.',
  },
];

export default function BecomeCreatorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'creator' })
      .eq('id', user.id);

    if (error) {
      setError('Upgrade failed. Please try again.');
      setLoading(false);
    } else {
      router.push('/creator/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-2">
            <Video className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Become a Creator
          </h1>
          <p className="text-muted-foreground text-lg">
            Turn your purchases into content. Earn commissions while sharing products you love.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} className="border-purple-100">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-purple-100 p-2 mt-0.5">
                      <Icon className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {error && (
                <div className="text-sm text-destructive text-center">{error}</div>
              )}
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    Start Earning as a Creator
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Takes 30 seconds. No new account needed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Browse campaigns and apply to products you love',
              'Receive free samples delivered to your door',
              'Create authentic content (photos, videos, reviews)',
              'Share your unique link — earn commission on every sale',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-6 w-6 rounded-full bg-purple-100 items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-purple-600" />
                </div>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
