"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Search, Users, Crown, Filter, X, Send } from "lucide-react";
import type { Profile, Group, Cluster } from "@/lib/types";

interface GroupsListClientProps {
  profile: Profile;
  groups: (Group & { 
    cluster: Cluster; 
    leader: { id: string; full_name: string; skills: string[] };
    group_members: { count: number }[];
  })[];
  clusters: Cluster[];
}

export function GroupsListClient({ profile, groups, clusters }: GroupsListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<typeof groups[0] | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApply = async () => {
    if (!selectedGroup) return;

    setIsApplying(true);

    const { error } = await supabase.from("group_applications").insert({
      group_id: selectedGroup.id,
      applicant_id: profile.id,
      message: applicationMessage,
      skills_offered: selectedSkills,
    });

    if (error) {
      alert(error.message);
      setIsApplying(false);
      return;
    }

    setShowDialog(false);
    setApplicationMessage("");
    setSelectedSkills([]);
    router.refresh();
    alert("Application submitted! The group leader will review it.");
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const getMemberCount = (group: typeof groups[0]) => {
    // Handle different Supabase return structures safely
    if (Array.isArray(group.group_members) && group.group_members[0]) {
      return group.group_members[0].count;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Groups</h1>
          <p className="text-gray-600 mt-1">
            Find and apply to groups in <strong>{profile.current_cluster?.name || "your cluster"}</strong>
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? "Try a different search term" : "No open groups in your cluster yet."}
              </p>
              <Link href="/groups/create">
                <Button>Create a Group</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredGroups.map((group) => {
              const memberCount = getMemberCount(group);
              const progress = (memberCount / group.max_members) * 100;
              const isMyGroup = group.id === profile.current_group_id;
              
              return (
                <Card key={group.id} className={`hover:shadow-lg transition-shadow ${isMyGroup ? "border-violet-500 border-2" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {group.name}
                          {isMyGroup && <Badge variant="secondary">My Group</Badge>}
                        </CardTitle>
                        <CardDescription className="mt-1">{group.cluster?.name}</CardDescription>
                      </div>
                      <Badge className={group.status === "open" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                        {group.status === "open" ? "Open" : "Almost Full"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {group.description && <p className="text-gray-600">{group.description}</p>}

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-sm font-medium">
                        {group.leader?.full_name?.charAt(0) || "?"}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{group.leader?.full_name}</span>
                      <Crown className="w-4 h-4 text-amber-500" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Team Size</span>
                        <span className="font-medium">{memberCount}/{group.max_members}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {group.required_skills && group.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {group.required_skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    )}

                    {!isMyGroup && !profile.current_group_id && (
                      <Button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowDialog(true);
                        }}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                      >
                        Apply to Join
                      </Button>
                    )}
                    
                    {isMyGroup && (
                        <Link href={`/groups/${group.id}/manage`}>
                            <Button variant="outline" className="w-full">Manage My Group</Button>
                        </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to {selectedGroup?.name}</DialogTitle>
            <DialogDescription>Tell the group leader why you&apos;d be a great fit</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Why do you want to join?</Label>
              <Textarea
                placeholder="Share your motivation..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Skills you bring</Label>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={!applicationMessage || isApplying}>
              {isApplying ? "Sending..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}