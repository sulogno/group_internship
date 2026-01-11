"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Check, Sparkles, X, Loader2, ShieldCheck } from "lucide-react";
import { SKILLS, BRANCHES, type Cluster } from "@/lib/types";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [branch, setBranch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [preferredCluster, setPreferredCluster] = useState("");
  const [clusters, setClusters] = useState<Cluster[]>([]);
  
  // New State: Handle the "Already Completed" scenario safely
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  const [isChecking, setIsChecking] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState("");
  
  const router = useRouter();
  
  // MEMOIZE SUPABASE: Prevents 'locks.js' errors
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true; 

    const initializeOnboarding = async () => {
      try {
        // 1. Check User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          if (isMounted) setIsChecking(false);
          // Don't auto-redirect to login here to avoid loops, let the UI handle it or user manually navigate
          return;
        }

        // 2. Fetch Data
        const clustersPromise = supabase.from("clusters").select("*");
        const profilePromise = supabase
          .from("profiles")
          .select("profile_completed")
          .eq("id", user.id)
          .single();

        const [clustersResult, profileResult] = await Promise.all([clustersPromise, profilePromise]);

        if (!isMounted) return;

        // Handle Clusters
        if (clustersResult.data) setClusters(clustersResult.data);

        // Handle Profile
        const profile = profileResult.data;

        if (profile?.profile_completed) {
          // STOP THE LOOP: Do not router.push() here.
          // Just show the "Success" screen so user can manually force the dashboard load.
          setIsAlreadyCompleted(true);
        } else if (!profile) {
          // Create profile if missing
          try {
            await supabase.from("profiles").insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || "",
              roll_number: user.user_metadata?.roll_number || "",
              profile_completed: false,
              branch: ""
            });
          } catch (e) {
             console.log("Profile insert deferred");
          }
        }

      } catch (err) {
        console.error("Init error:", err);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    initializeOnboarding();

    return () => { isMounted = false; };
  }, [supabase]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : prev.length < 10 ? [...prev, skill] : prev
    );
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          branch,
          specialization,
          skills: selectedSkills,
          preferred_cluster_id: parseInt(preferredCluster),
          current_cluster_id: parseInt(preferredCluster),
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Force Hard Reload to clear cache
      window.location.href = "/dashboard?refresh=true";
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          <p className="text-sm text-gray-500">Checking profile...</p>
        </div>
      </div>
    );
  }

  // 2. Loop Protection State (FIXED with Hard Refresh)
  if (isAlreadyCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You are all set!</h2>
          <p className="text-gray-600 mb-8">
            Your profile is already completed.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => {
                // HARD RELOAD: Clears cache and forces Dashboard load
                window.location.href = "/dashboard?refresh=true";
              }}
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button 
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="w-full h-12"
            >
              Sign Out & Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Groupify</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step > s ? "bg-green-500 text-white" : step === s ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-1 mx-2 rounded-full transition-all ${step > s ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {step === 1 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Tell us about yourself</h2>
                <p className="text-gray-600 mt-2">Help us personalize your experience</p>
              </div>
              <div className="space-y-2">
                <Label>Branch / Department</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Select your branch" /></SelectTrigger>
                  <SelectContent>{BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Specialization (Optional)</Label>
                <Input 
                  placeholder="e.g., Machine Learning, Cybersecurity" 
                  value={specialization} 
                  onChange={(e) => setSpecialization(e.target.value)} 
                  className="h-12" 
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  spellCheck="false"
                />
              </div>
              <Button onClick={() => setStep(2)} disabled={!branch} className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl">Continue <ArrowRight className="w-5 h-5 ml-2" /></Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-8"><h2 className="text-2xl font-bold text-gray-900">What are your skills?</h2></div>
              <div className="flex flex-wrap gap-2 mb-4">{selectedSkills.map(skill => (<Badge key={skill} className="px-3 py-1.5 bg-violet-100 text-violet-700 cursor-pointer" onClick={() => toggleSkill(skill)}>{skill}<X className="w-3 h-3 ml-1" /></Badge>))}</div>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4"><div className="flex flex-wrap gap-2">{SKILLS.filter(s => !selectedSkills.includes(s)).map(skill => (<Badge key={skill} variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-violet-50" onClick={() => toggleSkill(skill)}>{skill}</Badge>))}</div></div>
              <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">Back</Button><Button onClick={() => setStep(3)} disabled={selectedSkills.length === 0} className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl">Continue <ArrowRight className="w-5 h-5 ml-2" /></Button></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-8"><h2 className="text-2xl font-bold text-gray-900">Choose your cluster</h2></div>
              {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}
              <div className="space-y-3">{clusters.map(cluster => (<div key={cluster.id} onClick={() => setPreferredCluster(cluster.id.toString())} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${preferredCluster === cluster.id.toString() ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-violet-300"}`}><div className="flex items-center justify-between"><div><h3 className="font-semibold text-gray-900">{cluster.name}</h3><p className="text-sm text-gray-600 mt-1">{cluster.description}</p></div>{preferredCluster === cluster.id.toString() && <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}</div></div>))}</div>
              <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">Back</Button><Button onClick={handleComplete} disabled={!preferredCluster || isSubmitting} className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" />Complete Setup</>}</Button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}