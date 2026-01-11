import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupsListClient } from "./groups-list-client";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const supabase = await createClient();

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_completed) redirect("/onboarding");

  // 3. Manual Cluster Fetch
  // We fetch the user's current cluster name for the UI
  let currentCluster = null;
  if (profile.current_cluster_id) {
    const { data: cData } = await supabase
      .from("clusters")
      .select("*")
      .eq("id", profile.current_cluster_id)
      .single();
    currentCluster = cData;
  }
  
  const fullProfile = {
      ...profile,
      current_cluster: currentCluster
  };

  // 4. Fetch Groups (The Smart Logic)
  // We fetch groups that match the user's cluster OR are the user's current group
  let query = supabase
    .from("groups")
    .select(`
      *,
      cluster:clusters(*),
      leader:profiles!groups_leader_id_fkey(id, full_name, skills),
      group_members(count)
    `)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  // Apply filter: If user has a group, fetch that specific one + cluster groups.
  // Otherwise, just fetch cluster groups.
  if (profile.current_group_id) {
    query = query.or(`cluster_id.eq.${profile.current_cluster_id},id.eq.${profile.current_group_id}`);
  } else {
    query = query.eq("cluster_id", profile.current_cluster_id);
  }

  const { data: groups } = await query;

  // 5. Fetch all clusters (for filter options)
  const { data: clusters } = await supabase.from("clusters").select("*");

  return (
    <GroupsListClient
      profile={fullProfile}
      groups={groups || []}
      clusters={clusters || []}
    />
  );
}