import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
// Make sure this matches your actual filename (e.g. students-list-client or students-client)
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

  // 3. DEBUG: Fetch ALL students to see why they are being filtered
  const { data: allStudents } = await supabase
    .from("profiles")
    .select("id, full_name, current_cluster_id, current_group_id, profile_completed")
    .neq("id", user.id) // Don't show myself
    .limit(20);

  // 4. Generate Debug Report
  const debugReport = allStudents?.map(s => {
    let status = "✅ VISIBLE";
    if (s.current_cluster_id !== profile.current_cluster_id) status = "❌ WRONG CLUSTER";
    else if (!s.profile_completed) status = "❌ PROFILE INCOMPLETE";
    else if (s.current_group_id) status = "❌ ALREADY HAS GROUP";
    
    return {
      name: s.full_name,
      myCluster: profile.current_cluster_id,
      theirCluster: s.current_cluster_id,
      hasGroup: !!s.current_group_id,
      status
    };
  });

  // 5. Fetch the Actual List (The normal logic)
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("current_cluster_id", profile.current_cluster_id)
    .eq("profile_completed", true)
    .is("current_group_id", null)
    .neq("id", user.id)
    .order("full_name", { ascending: true });

  const { data: cluster } = await supabase
    .from("clusters")
    .select("*")
    .eq("id", profile.current_cluster_id)
    .single();

  return (
    <div className="flex flex-col">
      {/* 🛠 DIAGNOSTIC PANEL (Remove this after fixing) */}
      <div className="bg-slate-900 text-green-400 p-4 text-xs font-mono overflow-auto max-h-60 border-b-4 border-red-500">
        <h3 className="font-bold text-white mb-2">🕵️‍♂️ WHY CAN'T I SEE THEM?</h3>
        <p className="mb-2"><strong>My Cluster ID:</strong> {profile.current_cluster_id}</p>
        <table className="w-full text-left">
          <thead>
            <tr className="text-white border-b border-gray-700">
              <th className="py-1">Name</th>
              <th>Cluster ID</th>
              <th>Grouped?</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {debugReport?.map((row, i) => (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5">
                <td className="py-1 text-blue-300">{row.name}</td>
                <td>{row.theirCluster}</td>
                <td>{row.hasGroup ? "Yes" : "No"}</td>
                <td className={row.status.includes("✅") ? "text-green-400 font-bold" : "text-red-400"}>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StudentsListClient
        profile={profile}
        students={students || []}
        clusterName={cluster?.name || "Your Cluster"}
      />
    </div>
  );
}