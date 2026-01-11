"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  Shield,
  Lock,
  Unlock,
  Download,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Search,
  UserX,
} from "lucide-react";
import type { Profile, Cluster, Group, SystemSettings, AdminLog } from "@/lib/types";

interface AdminDashboardClientProps {
  profile: Profile;
  clusters: Cluster[];
  groups: (Group & { cluster: Cluster; group_members: { count: number }[] })[];
  studentsWithoutGroups: (Profile & { current_cluster: Cluster | null })[];
  systemSettings: SystemSettings | null;
  adminLogs: (AdminLog & { admin: { full_name: string } })[];
}

export function AdminDashboardClient({
  profile,
  clusters,
  groups,
  studentsWithoutGroups,
  systemSettings,
  adminLogs,
}: AdminDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const filteredStudents = studentsWithoutGroups.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const incompleteGroups = groups.filter((g) => {
    const count = g.group_members?.[0]?.count || 0;
    return count < 3;
  });

  const groupsByCluster = clusters.map((cluster) => ({
    cluster,
    groups: groups.filter((g) => g.cluster_id === cluster.id),
    totalMembers: groups
      .filter((g) => g.cluster_id === cluster.id)
      .reduce((acc, g) => acc + (g.group_members?.[0]?.count || 0), 0),
  }));

  const toggleSystemFreeze = async () => {
    setIsProcessing(true);

    const newFrozenState = !systemSettings?.is_system_frozen;

    await supabase
      .from("system_settings")
      .update({
        is_system_frozen: newFrozenState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", systemSettings?.id || 1);

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: newFrozenState ? "System frozen" : "System unfrozen",
      target_type: "system",
      details: { previous_state: systemSettings?.is_system_frozen },
    });

    setShowFreezeDialog(false);
    setIsProcessing(false);
    router.refresh();
  };

  const exportData = async () => {
    const data = {
      exportedAt: new Date().toISOString(),
      clusters: clusters,
      groups: groups.map((g) => ({
        name: g.name,
        cluster: g.cluster?.name,
        memberCount: g.group_members?.[0]?.count || 0,
        maxMembers: g.max_members,
        status: g.status,
      })),
      studentsWithoutGroups: studentsWithoutGroups.map((s) => ({
        name: s.full_name,
        rollNumber: s.roll_number,
        cluster: s.current_cluster?.name,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `groupify-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const resetStudent = async (studentId: string) => {
    await supabase
      .from("profiles")
      .update({
        current_group_id: null,
        role: "student",
      })
      .eq("id", studentId);

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: "Student reset",
      target_type: "profile",
      target_id: studentId,
    });

    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600" />
                <span className="font-bold text-lg">Admin Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportData} className="gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Button
                variant={systemSettings?.is_system_frozen ? "default" : "destructive"}
                onClick={() => setShowFreezeDialog(true)}
                className="gap-2"
              >
                {systemSettings?.is_system_frozen ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unfreeze System
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Freeze System
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Groups</CardDescription>
              <CardTitle className="text-3xl">{groups.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Incomplete Groups</CardDescription>
              <CardTitle className="text-3xl text-amber-600">
                {incompleteGroups.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Students Without Groups</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {studentsWithoutGroups.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>System Status</CardDescription>
              <CardTitle className="flex items-center gap-2">
                {systemSettings?.is_system_frozen ? (
                  <>
                    <Lock className="w-5 h-5 text-red-500" />
                    <span className="text-red-600">Frozen</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5 text-green-500" />
                    <span className="text-green-600">Active</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">
              Without Group
              {studentsWithoutGroups.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {studentsWithoutGroups.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="incomplete">Incomplete Groups</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupsByCluster.map(({ cluster, groups, totalMembers }) => (
                <Card key={cluster.id}>
                  <CardHeader>
                    <CardTitle>{cluster.name}</CardTitle>
                    <CardDescription>{cluster.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Groups</span>
                      <span className="font-medium">{groups.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Members</span>
                      <span className="font-medium">{totalMembers}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Capacity</span>
                        <span className="font-medium">
                          {Math.round(
                            (totalMembers /
                              (groups.reduce((acc, g) => acc + g.max_members, 0) || 1)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (totalMembers /
                            (groups.reduce((acc, g) => acc + g.max_members, 0) || 1)) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-red-500" />
                      Students Without Groups
                    </CardTitle>
                    <CardDescription>
                      {studentsWithoutGroups.length} students need to be assigned
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">
                      {searchQuery
                        ? "No students match your search"
                        : "All students are assigned to groups"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                            {student.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.full_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {student.roll_number} • {student.current_cluster?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {student.skills?.length || 0} skills
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incomplete">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Incomplete Groups
                </CardTitle>
                <CardDescription>
                  Groups with less than 3 members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incompleteGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">All groups have minimum members</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incompleteGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{group.name}</p>
                          <p className="text-sm text-gray-600">{group.cluster?.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="bg-amber-100">
                            {group.group_members?.[0]?.count || 0}/{group.max_members}{" "}
                            members
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Admin actions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                {adminLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No activity logs yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{log.action}</p>
                          <p className="text-sm text-gray-600">
                            by {log.admin?.full_name}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {systemSettings?.is_system_frozen ? "Unfreeze System" : "Freeze System"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {systemSettings?.is_system_frozen
                ? "This will allow students to create/join groups and make changes again."
                : "This will prevent all students from creating new groups, joining groups, or making any changes. Use this after the deadline."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={toggleSystemFreeze}
              className={
                systemSettings?.is_system_frozen
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : systemSettings?.is_system_frozen ? (
                "Unfreeze"
              ) : (
                "Freeze"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
