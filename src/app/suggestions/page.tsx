import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuggestionsClient } from "./suggestions-client";

export default async function SuggestionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_completed) redirect("/onboarding");

  const { data: groups } = await supabase
    .from("groups")
    .select(`
      *,
      cluster:clusters(*),
      leader:profiles!groups_leader_id_fkey(id, full_name, skills),
      group_members(count)
    `)
    .eq("cluster_id", profile.current_cluster_id)
    .in("status", ["open", "almost_full"]);

  const rankedGroups = (groups || []).map((group) => {
    const userSkills = new Set(profile.skills || []);
    const requiredSkills = group.required_skills || [];
    const leaderSkills = group.leader?.skills || [];

    let matchScore = 0;

    requiredSkills.forEach((skill: string) => {
      if (userSkills.has(skill)) matchScore += 3;
    });

    leaderSkills.forEach((skill: string) => {
      if (userSkills.has(skill)) matchScore += 1;
    });

    return { ...group, matchScore };
  });

  rankedGroups.sort((a, b) => b.matchScore - a.matchScore);

  const { data: studentsWithoutGroups } = await supabase
    .from("profiles")
    .select("*, current_cluster:clusters(*)")
    .is("current_group_id", null)
    .eq("profile_completed", true)
    .eq("current_cluster_id", profile.current_cluster_id)
    .neq("id", user.id);

  const rankedStudents = (studentsWithoutGroups || []).map((student) => {
    const userSkills = new Set(profile.skills || []);
    const studentSkills = student.skills || [];

    let complementScore = 0;
    let overlapScore = 0;

    studentSkills.forEach((skill: string) => {
      if (userSkills.has(skill)) {
        overlapScore += 1;
      } else {
        complementScore += 2;
      }
    });

    return { ...student, matchScore: complementScore + overlapScore * 0.5 };
  });

  rankedStudents.sort((a, b) => b.matchScore - a.matchScore);

  return (
    <SuggestionsClient
      profile={profile}
      suggestedGroups={rankedGroups.slice(0, 6)}
      suggestedStudents={rankedStudents.slice(0, 6)}
    />
  );
}
