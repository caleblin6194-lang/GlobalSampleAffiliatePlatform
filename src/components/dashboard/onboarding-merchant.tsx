'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package, Megaphone, Truck, Lightbulb, ArrowRight } from 'lucide-react';
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
    icon: Package,
    title: 'Add Your First Product',
    description: 'List a 3C product — phone case, charger, or headphones. These win the most applications.',
    href: '/merchant/products/new',
    cta: 'Add Product',
  },
  {
    icon: Megaphone,
    title: 'Create a Campaign',
    description: 'Set sample quantity, commission rate, and target creator requirements.',
    href: '/merchant/campaigns/new',
    cta: 'New Campaign',
  },
  {
    icon: Truck,
    title: 'Ship to Creators & Track',
    description: 'Approve applications, fulfill orders, and monitor content performance.',
    href: '/merchant/orders',
    cta: 'View Orders',
  },
];

export function MerchantOnboarding() {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Getting Started as a Merchant</CardTitle>
          <Badge variant="outline" className="ml-auto text-xs">New here? Start here ↓</Badge>
        </div>
        <CardDescription>
          3 steps to launch your first sampling campaign
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-blue-100">
              <div className="flex h-8 w-8 rounded-full bg-blue-100 items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600">Step {i + 1}</span>
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
            <strong>Pro tip:</strong> Phone cases, wireless chargers, and TWS earbuds get 3× more applications than other 3C categories.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
