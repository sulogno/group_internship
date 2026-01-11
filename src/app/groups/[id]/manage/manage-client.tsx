"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Users,
  Crown,
  Check,
  X,
  UserMinus,
  MessageSquare,
  Lock,
  Unlock,
  Sparkles,
} from "lucide-react";
import type { Profile, Group, Cluster, GroupMember, GroupApplication } from "@/lib/types";

interface GroupManageClientProps {
  profile: Profile;
  group: Group & {
    cluster: Cluster;
    group_members: (GroupMember & { profile: Profile })[];
  };
  applications: (GroupApplication & { applicant: Profile })[];
}

export function GroupManageClient({ profile, group, applications }: GroupManageClientProps) {
  const [processingApp, setProcessingApp] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember & { profile: Profile } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const memberCount = group.group_members?.length || 0;
  const progress = (memberCount / group.max_members) * 100;

  const handleApplication = async (applicationId: string, status: "accepted" | "rejected") => {
    setProcessingApp(applicationId);
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return;

    if (status === "accepted") {
      if (memberCount >= group.max_members) {
        alert("Group is already full!");
        setProcessingApp(null);
        return;
      }

      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: application.applicant_id,
      });

      if (memberError) {
        alert(memberError.message);
        setProcessingApp(null);
        return;
      }

      await supabase
        .from("profiles")
        .update({
          current_group_id: group.id,
          role: "student",
        })
        .eq("id", application.applicant_id);

      const newMemberCount = memberCount + 1;
      let newStatus = group.status;
      if (newMemberCount >= group.max_members) {
        newStatus = "full";
      } else if (newMemberCount >= group.max_members - 2) {
        newStatus = "almost_full";
      }

      if (newStatus !== group.status) {
        await supabase.from("groups").update({ status: newStatus }).eq("id", group.id);
      }

      await supabase
        .from("group_applications")
        .update({ status: "rejected" })
        .eq("applicant_id", application.applicant_id)
        .neq("id", applicationId);
    }

    await supabase
      .from("group_applications")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    await supabase.from("messages").insert({
      group_id: group.id,
      sender_id: profile.id,
      content: status === "accepted" 
        ? `${application.applicant.full_name} has joined the group!` 
        : `Application from ${application.applicant.full_name} was declined.`,
      message_type: "system",
    });

    setProcessingApp(null);
    router.refresh();
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemovingMember(memberToRemove.user_id);

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", memberToRemove.user_id);

    await supabase
      .from("profiles")
      .update({ current_group_id: null, role: "student" })
      .eq("id", memberToRemove.user_id);

    const newCount = memberCount - 1;
    let newStatus = "open";
    if (newCount >= group.max_members) {
      newStatus = "full";
    } else if (newCount >= group.max_members - 2) {
      newStatus = "almost_full";
    }

    await supabase.from("groups").update({ status: newStatus }).eq("id", group.id);

    await supabase.from("messages").insert({
      group_id: group.id,
      sender_id: profile.id,
      content: `${memberToRemove.profile.full_name} has left the group.`,
      message_type: "system",
    });

    setShowRemoveDialog(false);
    setMemberToRemove(null);
    setRemovingMember(null);
    router.refresh();
  };

  const toggleGroupStatus = async () => {
    const newStatus = group.is_frozen ? "open" : "frozen";
    await supabase
      .from("groups")
      .update({ is_frozen: !group.is_frozen, status: newStatus })
      .eq("id", group.id);
    router.refresh();
  };

  const skillCoverage = new Map<string, number>();
  group.group_members?.forEach((member) => {
    member.profile?.skills?.forEach((skill) => {
      skillCoverage.set(skill, (skillCoverage.get(skill) || 0) + 1);
    });
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link href={`/groups/${group.id}/chat`}>
              <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600">
                <MessageSquare className="w-4 h-4" />
                Group Chat
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          </div>
          <p className="text-gray-600">{group.cluster?.name}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Team Size</CardDescription>
              <CardTitle className="text-3xl">{memberCount}/{group.max_members}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Applications</CardDescription>
              <CardTitle className="text-3xl">{applications.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Awaiting your review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Group Status</CardDescription>
              <CardTitle className="flex items-center gap-2">
                {group.is_frozen ? (
                  <>
                    <Lock className="w-5 h-5 text-gray-500" />
                    Frozen
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5 text-green-500" />
                    {group.status === "open" ? "Open" : group.status === "almost_full" ? "Almost Full" : "Full"}
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={toggleGroupStatus}>
                {group.is_frozen ? "Unfreeze Group" : "Freeze Group"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="applications" className="relative">
              Applications
              {applications.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {applications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="skills">Skill Balance</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your group members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.group_members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white font-semibold">
                        {member.profile?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{member.profile?.full_name}</p>
                          {member.user_id === group.leader_id && (
                            <Badge className="bg-amber-100 text-amber-700">Leader</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.profile?.roll_number}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.profile?.skills?.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {member.user_id !== group.leader_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setMemberToRemove(member);
                          setShowRemoveDialog(true);
                        }}
                      >
                        <UserMinus className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription>Review and manage join requests</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No pending applications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                              {app.applicant?.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{app.applicant?.full_name}</p>
                              <p className="text-sm text-gray-600">{app.applicant?.roll_number}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700">{app.message}</p>
                        </div>

                        {app.skills_offered && app.skills_offered.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-600 mb-2">Skills offered:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {app.skills_offered.map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApplication(app.id, "accepted")}
                            disabled={processingApp === app.id || memberCount >= group.max_members}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {processingApp === app.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleApplication(app.id, "rejected")}
                            disabled={processingApp === app.id}
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  Skill Balance Indicator
                </CardTitle>
                <CardDescription>See your team&apos;s skill coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from(skillCoverage.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([skill, count]) => (
                      <div
                        key={skill}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-700">{skill}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
                {skillCoverage.size === 0 && (
                  <p className="text-center text-gray-600 py-8">No skills data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.profile?.full_name} from the group?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
            >
              {removingMember ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
