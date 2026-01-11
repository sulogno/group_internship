"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Save, X, AlertCircle } from "lucide-react";
import { SKILLS, type Profile, type Cluster } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<(Profile & { current_cluster: Cluster | null }) | null>(null);
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      // 1. Check User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // 2. Fetch Profile (WITHOUT the Join to avoid ambiguity error)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        // 3. Fetch Cluster Manually (Safe way)
        let clusterData = null;
        if (profileData.current_cluster_id) {
          const { data: cData } = await supabase
            .from("clusters")
            .select("*")
            .eq("id", profileData.current_cluster_id)
            .single();
          clusterData = cData;
        }

        // 4. Set State
        setProfile({ ...profileData, current_cluster: clusterData });
        setFullName(profileData.full_name || "");
        setSpecialization(profileData.specialization || "");
        setSelectedSkills(profileData.skills || []);
        
      } catch (err: any) {
        console.error("Error loading settings:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase, router]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : prev.length < 10 ? [...prev, skill] : prev
    );
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          specialization,
          skills: selectedSkills,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh(); // Refresh server components to show new name in Navbar
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-8 h-8 text-violet-600" />
            Profile Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
            <Save className="w-4 h-4" />
            Profile updated successfully!
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled className="h-11 bg-gray-50 text-gray-500" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input value={profile?.roll_number || ""} disabled className="h-11 bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={profile?.branch || ""} disabled className="h-11 bg-gray-50 text-gray-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input
                placeholder="e.g., Machine Learning, Web Development"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cluster Information</CardTitle>
            <CardDescription>Your assigned internship cluster</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
              <p className="font-semibold text-violet-800 text-lg">{profile?.current_cluster?.name}</p>
              <p className="text-sm text-violet-600 mt-1">{profile?.current_cluster?.description}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Cluster assignment is locked and cannot be changed.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Select up to 10 skills that highlight your expertise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill}
                  className="px-3 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 cursor-pointer border-violet-200"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <div className="flex flex-wrap gap-2">
                {SKILLS.filter(s => !selectedSkills.includes(s)).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="px-3 py-1.5 cursor-pointer hover:bg-violet-50 hover:border-violet-300 transition-colors bg-white"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-right">
              {selectedSkills.length}/10 skills selected
            </p>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={saving || !fullName}
          className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-200"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </main>
    </div>
  );
}