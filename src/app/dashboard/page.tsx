import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

// Force dynamic rendering to ensure fresh data and prevent redirect loops
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // 1. Check User Auth
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Profile WITHOUT the join first
  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 3. Logic Check: If no profile or not completed, send to onboarding
  if (!rawProfile?.profile_completed) {
    redirect("/onboarding");
  }

  // 4. Manual Join: Fetch the Cluster Separately
  let currentCluster = null;
  if (rawProfile.current_cluster_id) {
    const { data: clusterData } = await supabase
      .from("clusters")
      .select("*")
      .eq("id", rawProfile.current_cluster_id)
      .single();
    currentCluster = clusterData;
  }

  // Combine them for the Client Component
  const profile = {
    ...rawProfile,
    current_cluster: currentCluster,
  };

  // 5. Fetch Clusters List (for the dropdown/info)
  const { data: clusters } = await supabase.from("clusters").select("*");

  // 6. Fetch My Group (if exists)
  const { data: myGroup } = profile.current_group_id
    ? await supabase
        .from("groups")
        .select(`
          *,
          cluster:clusters(*),
          group_members(*, profile:profiles(*))
        `)
        .eq("id", profile.current_group_id)
        .single()
    : { data: null };

  // 7. Fetch Pending Applications
  const { data: pendingApplications } = await supabase
    .from("group_applications")
    .select("*, group:groups(*, cluster:clusters(*))")
    .eq("applicant_id", user.id)
    .eq("status", "pending");

  // 8. Fetch Pending Invitations (NEW CODE)
  const { data: invitations } = await supabase
    .from("group_invitations")
    .select(`
      *,
      group:groups(id, name),
      inviter:profiles!group_invitations_inviter_id_fkey(full_name)
    `)
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  // 9. Fetch System Settings
  const { data: systemSettings } = await supabase
    .from("system_settings")
    .select("*")
    .single();

  return (
    <DashboardClient
      profile={profile}
      clusters={clusters || []}
      myGroup={myGroup}
      pendingApplications={pendingApplications || []}
      systemSettings={systemSettings}
      invitations={invitations || []} // Pass the invitations here
    />
  );
}