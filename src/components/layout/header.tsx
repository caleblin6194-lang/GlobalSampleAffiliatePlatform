"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface HeaderProps {
  user?: { id?: string; email?: string; full_name?: string; avatar_url?: string };
  role: string;
}

export function Header({ user, role }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { t } = useLanguage();
  const [switchingRole, setSwitchingRole] = useState(false);
  const [switchError, setSwitchError] = useState('');

  const roleFromPath = (() => {
    const topSegment = pathname.split('/')[1];
    if (topSegment === 'admin' || topSegment === 'merchant' || topSegment === 'creator' || topSegment === 'vendor' || topSegment === 'buyer') {
      return topSegment;
    }
    return null;
  })();
  const effectiveRole = roleFromPath ?? role;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const roleLabels: Record<string, string> = {
    admin: t('header.role.admin', 'Administrator'),
    merchant: t('header.role.merchant', 'Brand Merchant'),
    creator: t('header.role.creator', 'Content Creator'),
    vendor: t('header.role.vendor', 'Supplier Vendor'),
    buyer: t('header.role.buyer', 'Buyer'),
  };

  const canSwitchRole = effectiveRole !== 'admin';

  const handleRoleChange = async (nextRole: string) => {
    if (!user?.id || !canSwitchRole || nextRole === effectiveRole) {
      return;
    }

    setSwitchingRole(true);
    setSwitchError('');

    const response = await fetch('/api/auth/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
    });
    const result = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setSwitchError(result.message || t('header.roleSwitchFailed', 'Failed to switch role. Please try again.'));
      setSwitchingRole(false);
      return;
    }

    router.push(`/${nextRole}/dashboard`);
    router.refresh();
    setSwitchingRole(false);
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            {roleLabels[effectiveRole] || effectiveRole}
          </span>
          {canSwitchRole && (
            <div className="w-[170px]">
              <Select value={effectiveRole} onValueChange={handleRoleChange} disabled={switchingRole}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t('header.switchRole', 'Switch role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator">{t('header.role.creator', 'Content Creator')}</SelectItem>
                  <SelectItem value="merchant">{t('header.role.merchant', 'Brand Merchant')}</SelectItem>
                  <SelectItem value="vendor">{t('header.role.vendor', 'Supplier Vendor')}</SelectItem>
                  <SelectItem value="buyer">{t('header.role.buyer', 'Buyer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {switchError && <span className="text-xs text-destructive">{switchError}</span>}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
            <span className="sr-only">{t('header.notifications', 'Notifications')}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name || ""} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.full_name || t('header.user', 'User')}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t('header.profile', 'Profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('header.settings', 'Settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('header.signOut', 'Sign out')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
