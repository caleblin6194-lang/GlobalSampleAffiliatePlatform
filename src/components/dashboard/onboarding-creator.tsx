'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Video, Compass, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const STEPS: Step[] = [
  {
    icon: Video,
    title: 'Link Your Social Channels',
    description: 'Connect TikTok, Instagram, or YouTube so brands can see your audience.',
    href: '/creator/channels',
    cta: 'Add Channel',
  },
  {
    icon: Compass,
    title: 'Browse Available Campaigns',
    description: 'Find products that match your content style and audience.',
    href: '/creator/campaigns',
    cta: 'Browse Campaigns',
  },
  {
    icon: FileText,
    title: 'Apply & Create Content',
    description: 'Submit your content plan, get approved, receive samples, then post.',
    href: '/creator/campaigns',
    cta: 'Start Applying',
  },
];

export function CreatorOnboarding() {
  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">Getting Started as a Creator</CardTitle>
          <Badge variant="outline" className="ml-auto text-xs">New here? Start here ↓</Badge>
        </div>
        <CardDescription>
          3 steps to start earning with brand partnerships
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-purple-100">
              <div className="flex h-8 w-8 rounded-full bg-purple-100 items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-purple-600">Step {i + 1}</span>
                  <h4 className="text-sm font-semibold">{step.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
              <Link href={step.href}>
                <Button size="sm" variant="outline" className="shrink-0 gap-1">
                  {step.cta} <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          );
        })}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>Pro tip:</strong> Vertical unboxing videos under 60 seconds get the highest approval rates and commission conversions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
