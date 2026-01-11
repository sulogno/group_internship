import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupChatClient } from "./group-chat-client"; // Ensure your client file is named exactly this!

interface ChatPageProps {
  params: {
    id: string;
  };
}

// Force dynamic rendering so messages are always fresh on page load
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createClient();
  
  // 1. Check User Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  // 3. Fetch Group Details
  // We use standard selects. If you get an "Ambiguous Relationship" error here,
  // it means we need to be more specific with the foreign keys, but this standard query usually works for groups.
  const { data: group } = await supabase
    .from("groups")
    .select(`
      *,
      cluster:clusters(*),
      group_members(
        *,
        profile:profiles(*)
      )
    `)
    .eq("id", params.id)
    .single();

  if (!group) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Group not found
      </div>
    );
  }

  // 4. Security Check: Ensure user is a member
  // We check if the current user's ID exists in the group_members list
  const isMember = group.group_members?.some((m: any) => m.user_id === user.id);
  
  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600">You are not a member of this group.</p>
        <a href="/dashboard" className="text-violet-600 hover:underline">Return to Dashboard</a>
      </div>
    );
  }

  // 5. Fetch Initial Messages (Last 100)
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles(*)
    `)
    .eq("group_id", params.id)
    .order("created_at", { ascending: true })
    .limit(100);

  // 6. Fetch Pinned Messages
  const { data: pinnedMessages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles(*)
    `)
    .eq("group_id", params.id)
    .eq("is_pinned", true)
    .order("created_at", { ascending: true });

  // 7. Pass everything to the Client Component
  return (
    <GroupChatClient
      profile={profile}
      group={group}
      initialMessages={messages || []}
      pinnedMessages={pinnedMessages || []}
    />
  );
}