import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentsListClient } from "./students-client"; 

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const supabase = await createClient();
  
  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch Viewer Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_completed) redirect("/onboarding");

  const myClusterId = profile.current_cluster_id;

  // 3. Fetch the Actual List
  // Only run the query if the viewer actually has a cluster ID
  let students = [];
  
  if (myClusterId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("current_cluster_id", myClusterId)
      .eq("profile_completed", true)
      .is("current_group_id", null) // Only show students NOT in a group
      .neq("id", user.id)           // Don't show myself
      .order("full_name", { ascending: true });
      
    students = data || [];
  }

  // 4. Fetch Cluster Name (Optional cosmetic)
  let clusterName = "Your Cluster";
  if (myClusterId) {
    const { data: cluster } = await supabase
      .from("clusters")
      .select("name")
      .eq("id", myClusterId)
      .single();
    if (cluster) clusterName = cluster.name;
  }

  return (
    <div className="flex flex-col">
      <StudentsListClient 
        profile={profile} 
        students={students} 
        clusterName={clusterName} 
      />
    </div>
  );
}