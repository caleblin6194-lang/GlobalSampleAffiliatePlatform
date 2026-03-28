import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "creator";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col">
        <Header
          user={{ email: profile?.email, full_name: profile?.full_name, avatar_url: profile?.avatar_url }}
          role={role}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
