"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Mail, Lock, ArrowRight, AlertCircle, User, Hash } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          roll_number: rollNumber,
        },
      },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          roll_number: rollNumber,
          branch: "",
          profile_completed: false,
        });

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }

        // If no session was returned (because confirmation was pending), 
        // try to sign in immediately since our trigger auto-confirms
        if (!authData.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) {
            // If sign in fails, maybe the trigger hasn't finished or something
            // but we'll redirect to login as a fallback
            router.push("/login?message=Account created. Please log in.");
            return;
          }
        }
      }

      router.push("/onboarding");
      router.refresh();

  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-violet-600 p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-40 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-20 left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">Groupify</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Join the
              <br />
              movement!
            </h1>
            <p className="text-xl text-white/80 max-w-md">
              Create your account, complete your profile, and start forming or joining groups for your internship clusters.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm">✓</div>
              <span>Find teammates with matching skills</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm">✓</div>
              <span>Apply to groups that interest you</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm">✓</div>
              <span>Chat and collaborate in real-time</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Groupify</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-violet-600 hover:text-violet-700">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-violet-500 focus:ring-violet-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rollNumber" className="text-gray-700">Roll Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="21CS1001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-violet-500 focus:ring-violet-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">College Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-violet-500 focus:ring-violet-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-violet-500 focus:ring-violet-500"
                  minLength={6}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
