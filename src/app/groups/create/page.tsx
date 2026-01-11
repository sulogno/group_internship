"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowLeft, Sparkles, X, AlertCircle } from "lucide-react";
import { SKILLS, type Cluster, type Profile } from "@/lib/types";

export default function CreateGroupPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(5);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // State to hold the combined data
  const [profile, setProfile] = useState<Profile & { current_cluster: Cluster | null } | null>(null);
  const router = useRouter();

  // 1. Memoize Supabase to prevent infinite loops
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        if (!user) {
          router.push("/login");
          return;
        }

        // 2. Fetch Profile WITHOUT the join first (avoids "Ambiguous Relationship" error)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        if (!isMounted) return;

        // Check if already in a group
        if (profileData?.current_group_id) {
          router.push("/dashboard");
          return;
        }

        // 3. Fetch Cluster manually if needed
        let clusterData = null;
        if (profileData.current_cluster_id) {
          const { data: cData } = await supabase
            .from("clusters")
            .select("*")
            .eq("id", profileData.current_cluster_id)
            .single();
          clusterData = cData;
        }

        // 4. Combine and set state
        setProfile({ ...profileData, current_cluster: clusterData });

      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data. Please refresh.");
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [supabase, router]);

  const toggleSkill = (skill: string) => {
    setRequiredSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : prev.length < 5 ? [...prev, skill] : prev
    );
  };

  const handleCreate = async () => {
    if (!profile || !profile.current_cluster_id) return;

    setLoading(true);
    setError("");

    try {
        const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
            name,
            description,
            cluster_id: profile.current_cluster_id,
            leader_id: profile.id,
            max_members: maxMembers,
            required_skills: requiredSkills,
            status: "open",
        })
        .select()
        .single();

        if (groupError) throw groupError;

        const { error: memberError } = await supabase
        .from("group_members")
        .insert({
            group_id: group.id,
            user_id: profile.id,
        });

        if (memberError) throw memberError;

        const { error: profileError } = await supabase
        .from("profiles")
        .update({
            current_group_id: group.id,
            role: "leader",
            updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

        if (profileError) throw profileError;

        router.push(`/groups/${group.id}/manage`);
        router.refresh();

    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Group</h1>
          <p className="text-gray-600 mt-1">
            Start a new team in {profile.current_cluster?.name || "your cluster"}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>Fill in the information about your group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g., AI Innovators, Cloud Warriors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell potential members what your group is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Maximum Members</Label>
                <span className="text-lg font-semibold text-violet-600">{maxMembers}</span>
              </div>
              <Slider
                value={[maxMembers]}
                onValueChange={([value]) => setMaxMembers(value)}
                min={3}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Min: 3</span>
                <span>Max: 10</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Required Skills (Optional)</Label>
              <p className="text-sm text-gray-500">Select skills you&apos;re looking for in teammates (max 5)</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {requiredSkills.map((skill) => (
                  <Badge
                    key={skill}
                    className="px-3 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 cursor-pointer"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                  {SKILLS.filter(s => !requiredSkills.includes(s)).map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="px-3 py-1.5 cursor-pointer hover:bg-violet-50 hover:border-violet-300 transition-colors"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-violet-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-violet-600" />
                <span className="font-medium text-violet-800">Cluster</span>
              </div>
              <p className="text-violet-700">{profile.current_cluster?.name}</p>
              <p className="text-sm text-violet-600 mt-1">Your group will be part of this cluster</p>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!name || loading}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Group
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}