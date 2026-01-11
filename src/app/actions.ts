'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteGroupAction(groupId: string) {
  const supabase = await createClient();
  
  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Verify Leader Status
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group || group.leader_id !== user.id) {
    throw new Error("Only the leader can delete the group");
  }

  // 3. Delete Group
  // (Note: Ensure your DB allows cascading deletes, or this might fail if members exist)
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (error) throw new Error("Failed to delete group");

  // 4. Redirect
  redirect("/dashboard");
}