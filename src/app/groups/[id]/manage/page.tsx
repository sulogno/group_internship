import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupManageClient } from "./manage-client";

export default async function GroupManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: group } = await supabase
    .from("groups")
    .select(`
      *,
      cluster:clusters(*),
      group_members(*, profile:profiles(*))
    `)
    .eq("id", id)
    .single();

  if (!group || group.leader_id !== user.id) {
    redirect("/dashboard");
  }

  const { data: applications } = await supabase
    .from("group_applications")
    .select("*, applicant:profiles(*)")
    .eq("group_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <GroupManageClient
      profile={profile!}
      group={group}
      applications={applications || []}
    />
  );
}
