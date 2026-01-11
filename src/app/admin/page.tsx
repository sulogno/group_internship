import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboardClient } from "./admin-client";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: clusters } = await supabase.from("clusters").select("*");

  const { data: groups } = await supabase
    .from("groups")
    .select(`
      *,
      cluster:clusters(*),
      group_members(count)
    `)
    .order("created_at", { ascending: false });

  const { data: studentsWithoutGroups } = await supabase
    .from("profiles")
    .select("*, current_cluster:clusters(*)")
    .is("current_group_id", null)
    .eq("profile_completed", true)
    .neq("role", "admin");

  const { data: systemSettings } = await supabase
    .from("system_settings")
    .select("*")
    .single();

  const { data: adminLogs } = await supabase
    .from("admin_logs")
    .select("*, admin:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AdminDashboardClient
      profile={profile}
      clusters={clusters || []}
      groups={groups || []}
      studentsWithoutGroups={studentsWithoutGroups || []}
      systemSettings={systemSettings}
      adminLogs={adminLogs || []}
    />
  );
}
