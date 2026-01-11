"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Plus,
  Search,
  Clock,
  MessageSquare,
  UserPlus,
  Crown,
  Sparkles,
  LogOut,
  Settings,
  Bell,
  ChevronRight,
  Zap,
  Shield,
  Check,
  X,
  Mail
} from "lucide-react";
import type { Profile, Cluster, Group, GroupApplication, SystemSettings } from "@/lib/types";

// Update the props interface to include invitations
interface DashboardClientProps {
  profile: Profile & { current_cluster: Cluster | null };
  clusters?: Cluster[];
  myGroup: Group | null;
  pendingApplications?: (GroupApplication & { group: Group & { cluster: Cluster } })[];
  systemSettings?: SystemSettings | null;
  invitations?: any[]; // Added invitations prop
}

export function DashboardClient({
  profile,
  clusters,
  myGroup,
  pendingApplications = [],
  systemSettings,
  invitations = [], // Default to empty array
}: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // --- NEW: Handle Accepting Invites ---
  const handleAcceptInvite = async (invite: any) => {
    setLoadingInvite(invite.id);
    try {
      // 1. Add to group members
      const { error: joinError } = await supabase
        .from("group_members")
        .insert({
          group_id: invite.group_id,
          user_id: profile.id
        });

      if (joinError) throw joinError;

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ current_group_id: invite.group_id })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // 3. Update Invite Status
      await supabase
        .from("group_invitations")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      router.refresh(); // Reload to show the new group
    } catch (error: any) {
      alert("Error joining group: " + error.message);
    } finally {
      setLoadingInvite(null);
    }
  };

  // --- NEW: Handle Rejecting Invites ---
  const handleRejectInvite = async (inviteId: string) => {
    setLoadingInvite(inviteId);
    await supabase
      .from("group_invitations")
      .update({ status: "rejected" })
      .eq("id", inviteId);
    
    router.refresh();
    setLoadingInvite(null);
  };

  const deadline = systemSettings?.deadline ? new Date(systemSettings.deadline) : null;
  const now = new Date();
  const daysLeft = deadline
    ? Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const memberCount = myGroup?.group_members?.length || 0;
  const groupProgress = myGroup ? (memberCount / myGroup.max_members) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Groupify</span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {(pendingApplications.length > 0 || invitations.length > 0) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {pendingApplications.length + invitations.length}
                  </span>
                )}
              </Button>
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              {profile.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.full_name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            {myGroup
              ? "Manage your group and collaborate with teammates"
              : "Find your perfect team for the internship journey"}
          </p>
        </div>

        {/* --- NEW: INVITATION CARD --- */}
        {invitations.length > 0 && !myGroup && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Mail className="w-5 h-5" />
                You have pending invitations!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                    <div>
                      <h3 className="font-bold text-gray-800">{invite.group?.name}</h3>
                      <p className="text-sm text-gray-600">
                        Invited by <span className="text-blue-600 font-medium">{invite.inviter?.full_name}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleRejectInvite(invite.id)}
                        disabled={!!loadingInvite}
                      >
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleAcceptInvite(invite)}
                        disabled={!!loadingInvite}
                      >
                        {loadingInvite === invite.id ? (
                          "Joining..."
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" /> Accept & Join
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* --------------------------- */}

        {daysLeft !== null && daysLeft <= 14 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {daysLeft === 0 ? "Deadline is today!" : `${daysLeft} days left to form groups`}
              </h3>
              <p className="text-sm text-amber-700">
                After the deadline, no new groups can be formed or joined.
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white border-0">
            <CardHeader>
              <CardDescription className="text-white/80">Your Cluster</CardDescription>
              <CardTitle className="text-2xl">{profile.current_cluster?.name || "Not Selected"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 text-sm line-clamp-2">
                {profile.current_cluster?.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Group Status</CardDescription>
              <CardTitle className="flex items-center gap-2">
                {myGroup ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    In a Group
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Looking for Group
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myGroup ? (
                <p className="text-gray-600 text-sm">{myGroup.name}</p>
              ) : (
                <p className="text-gray-600 text-sm">Create or join a group to get started</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Your Skills</CardDescription>
              <CardTitle>{profile.skills?.length || 0} Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills?.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {profile.skills && profile.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.skills.length - 4}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {!myGroup && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link href="/groups/create">
              <Card className="group cursor-pointer hover:shadow-xl hover:border-violet-300 transition-all duration-300 h-full">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Create a Group</h3>
                    <p className="text-gray-600">Start your own team and invite members</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/groups">
              <Card className="group cursor-pointer hover:shadow-xl hover:border-violet-300 transition-all duration-300 h-full">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Browse Groups</h3>
                    <p className="text-gray-600">Find and apply to existing groups</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {myGroup && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {profile.id === myGroup.leader_id && (
                      <Crown className="w-5 h-5 text-amber-500" />
                    )}
                    <CardTitle>{myGroup.name}</CardTitle>
                  </div>
                  <CardDescription>{myGroup.cluster?.name}</CardDescription>
                </div>
                <Badge
                  className={
                    myGroup.status === "open"
                      ? "bg-green-100 text-green-700"
                      : myGroup.status === "almost_full"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                  }
                >
                  {myGroup.status === "open"
                    ? "Open"
                    : myGroup.status === "almost_full"
                    ? "Almost Full"
                    : myGroup.status === "full"
                    ? "Full"
                    : "Frozen"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Team Size</span>
                  <span className="font-medium">
                    {memberCount}/{myGroup.max_members} members
                  </span>
                </div>
                <Progress value={groupProgress} className="h-2" />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Team Members</h4>
                <div className="flex flex-wrap gap-2">
                  {myGroup.group_members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-sm font-medium">
                        {member.profile?.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.profile?.full_name}
                        </p>
                        {member.user_id === myGroup.leader_id && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Leader
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Link href={`/groups/${myGroup.id}/chat`} className="flex-1">
                  <Button className="w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700">
                    <MessageSquare className="w-4 h-4" />
                    Group Chat
                  </Button>
                </Link>
                {profile.id === myGroup.leader_id && (
                  <Link href={`/groups/${myGroup.id}/manage`}>
                    <Button variant="outline" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Manage
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {pendingApplications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Pending Applications
              </CardTitle>
              <CardDescription>Your applications awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{app.group.name}</h4>
                      <p className="text-sm text-gray-600">{app.group.cluster?.name}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/students">
            <Card className="group cursor-pointer hover:shadow-lg hover:border-violet-200 transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Still Looking Board</h3>
                  <p className="text-sm text-gray-600">Students without groups</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/suggestions">
            <Card className="group cursor-pointer hover:shadow-lg hover:border-violet-200 transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Suggestions</h3>
                  <p className="text-sm text-gray-600">AI-matched groups & teammates</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}