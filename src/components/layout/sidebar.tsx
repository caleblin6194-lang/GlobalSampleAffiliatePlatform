"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, ShoppingBag, Users, Package, Megaphone, BarChart3, Menu, Store, Video, User, CheckCircle, FileText, ClipboardList, DollarSign, Link2, ShoppingCart, MousePointer, Truck, PackageCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/i18n/language-provider";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
}

const roleNavItems: Record<string, NavItem[]> = {
  admin: [
    { labelKey: "sidebar.nav.dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { labelKey: "sidebar.nav.users", href: "/admin/users", icon: Users },
    { labelKey: "sidebar.nav.platformStats", href: "/admin/stats", icon: BarChart3 },
  ],
  merchant: [
    { labelKey: "sidebar.nav.dashboard", href: "/merchant/dashboard", icon: LayoutDashboard },
    { labelKey: "sidebar.nav.brands", href: "/merchant/brands", icon: Store },
    { labelKey: "sidebar.nav.products", href: "/merchant/products", icon: Package },
    { labelKey: "sidebar.nav.campaigns", href: "/merchant/campaigns", icon: Megaphone },
    { labelKey: "sidebar.nav.applications", href: "/merchant/applications", icon: CheckCircle },
    { labelKey: "sidebar.nav.contentReview", href: "/merchant/content", icon: FileText },
    { labelKey: "sidebar.nav.orders", href: "/merchant/orders", icon: ShoppingCart },
    { labelKey: "sidebar.nav.fulfillment", href: "/merchant/fulfillment", icon: Truck },
    { labelKey: "sidebar.nav.analytics", href: "/merchant/analytics", icon: BarChart3 },
  ],
  creator: [
    { labelKey: "sidebar.nav.dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
    { labelKey: "sidebar.nav.campaigns", href: "/creator/campaigns", icon: Megaphone },
    { labelKey: "sidebar.nav.myApplications", href: "/creator/applications", icon: CheckCircle },
    { labelKey: "sidebar.nav.myTasks", href: "/creator/tasks", icon: ClipboardList },
    { labelKey: "sidebar.nav.earnings", href: "/creator/earnings", icon: DollarSign },
    { labelKey: "sidebar.nav.myChannels", href: "/creator/channels", icon: Video },
    { labelKey: "sidebar.nav.samples", href: "/creator/samples", icon: ShoppingBag },
  ],
  vendor: [
    { labelKey: "sidebar.nav.dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
    { labelKey: "sidebar.nav.orders", href: "/vendor/orders", icon: PackageCheck },
    { labelKey: "sidebar.nav.shipments", href: "/vendor/shipments", icon: Truck },
    { labelKey: "sidebar.nav.products", href: "/vendor/products", icon: Package },
    { labelKey: "sidebar.nav.inventory", href: "/vendor/inventory", icon: BarChart3 },
  ],
  buyer: [
    { labelKey: "sidebar.nav.dashboard", href: "/buyer/dashboard", icon: LayoutDashboard },
    { labelKey: "sidebar.nav.myOrders", href: "/buyer/orders", icon: ShoppingCart },
    { labelKey: "sidebar.nav.becomeCreator", href: "/become-creator", icon: Video },
  ],
};

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const navItems = roleNavItems[role] || roleNavItems.creator;

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <div className="flex flex-col h-full">
            <div className="px-4 py-4">
              <h2 className="text-lg font-bold">GSAP</h2>
              <p className="text-xs text-muted-foreground">{t('sidebar.subtitle', 'Global Sample Affiliate')}</p>
            </div>
            <Separator />
            <ScrollArea className="flex-1 px-4 py-4">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn("w-full justify-start", isActive && "bg-muted font-medium")}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {t(item.labelKey, item.labelKey)}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
        <div className="px-4 py-6">
          <h2 className="text-xl font-bold">GSAP</h2>
          <p className="text-xs text-muted-foreground">{t('sidebar.subtitle', 'Global Sample Affiliate')}</p>
        </div>
        <Separator />
        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn("w-full justify-start", isActive && "bg-muted font-medium")}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {t(item.labelKey, item.labelKey)}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
