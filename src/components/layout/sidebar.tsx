"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, ShoppingBag, Users, Package, Megaphone, BarChart3, Menu, Store, Video, User, CheckCircle, FileText, ClipboardList, DollarSign, Link2, ShoppingCart, MousePointer, Truck, PackageCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const roleNavItems: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Platform Stats", href: "/admin/stats", icon: BarChart3 },
  ],
  merchant: [
    { label: "Dashboard", href: "/merchant/dashboard", icon: LayoutDashboard },
    { label: "Brands", href: "/merchant/brands", icon: Store },
    { label: "Products", href: "/merchant/products", icon: Package },
    { label: "Campaigns", href: "/merchant/campaigns", icon: Megaphone },
    { label: "Applications", href: "/merchant/applications", icon: CheckCircle },
    { label: "Content Review", href: "/merchant/content", icon: FileText },
    { label: "Orders", href: "/merchant/orders", icon: ShoppingCart },
    { label: "Fulfillment", href: "/merchant/fulfillment", icon: Truck },
    { label: "Analytics", href: "/merchant/analytics", icon: BarChart3 },
  ],
  creator: [
    { label: "Dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
    { label: "Campaigns", href: "/creator/campaigns", icon: Megaphone },
    { label: "My Applications", href: "/creator/applications", icon: CheckCircle },
    { label: "My Tasks", href: "/creator/tasks", icon: ClipboardList },
    { label: "Earnings", href: "/creator/earnings", icon: DollarSign },
    { label: "My Channels", href: "/creator/channels", icon: Video },
    { label: "Samples", href: "/creator/samples", icon: ShoppingBag },
  ],
  vendor: [
    { label: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
    { label: "Orders", href: "/vendor/orders", icon: PackageCheck },
    { label: "Shipments", href: "/vendor/shipments", icon: Truck },
    { label: "Products", href: "/vendor/products", icon: Package },
    { label: "Inventory", href: "/vendor/inventory", icon: BarChart3 },
  ],
};

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
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
              <p className="text-xs text-muted-foreground">Global Sample Affiliate</p>
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
                        {item.label}
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
          <p className="text-xs text-muted-foreground">Global Sample Affiliate</p>
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
                    {item.label}
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
