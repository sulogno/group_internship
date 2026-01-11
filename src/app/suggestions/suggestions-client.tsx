"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, Users, Crown, Zap } from "lucide-react";
import type { Profile, Group, Cluster } from "@/lib/types";

interface SuggestionsClientProps {
  profile: Profile;
  suggestedGroups: (Group & {
    cluster: Cluster;
    leader: { id: string; full_name: string; skills: string[] };
    group_members: { count: number }[];
    matchScore: number;
  })[];
  suggestedStudents: (Profile & { current_cluster: Cluster | null; matchScore: number })[];
}

export function SuggestionsClient({
  profile,
  suggestedGroups,
  suggestedStudents,
}: SuggestionsClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Smart Suggestions
          </h1>
          <p className="text-gray-600 mt-1">
            Personalized recommendations based on your skills and interests
          </p>
        </div>

        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups">Suggested Groups</TabsTrigger>
            <TabsTrigger value="teammates">Potential Teammates</TabsTrigger>
          </TabsList>

          <TabsContent value="groups">
            {suggestedGroups.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No groups available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No open groups in your cluster right now
                  </p>
                  <Link href="/groups/create">
                    <Button>Create a Group</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {suggestedGroups.map((group, index) => {
                  const memberCount = group.group_members?.[0]?.count || 0;
                  const progress = (memberCount / group.max_members) * 100;

                  return (
                    <Card
                      key={group.id}
                      className="hover:shadow-lg transition-shadow relative overflow-hidden"
                    >
                      {index === 0 && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium rounded-bl-lg">
                          Best Match
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{group.name}</CardTitle>
                            <CardDescription>{group.cluster?.name}</CardDescription>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 rounded-full">
                            <Zap className="w-3 h-3 text-violet-600" />
                            <span className="text-xs font-medium text-violet-700">
                              {Math.round(group.matchScore * 10)}% match
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-gray-700">
                            {group.leader?.full_name}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Team Size</span>
                            <span className="font-medium">
                              {memberCount}/{group.max_members}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {group.required_skills && group.required_skills.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Looking for:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {group.required_skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant={
                                    profile.skills?.includes(skill)
                                      ? "default"
                                      : "outline"
                                  }
                                  className={
                                    profile.skills?.includes(skill)
                                      ? "bg-green-100 text-green-700"
                                      : ""
                                  }
                                >
                                  {skill}
                                  {profile.skills?.includes(skill) && " ✓"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Link href="/groups">
                          <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600">
                            View & Apply
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="teammates">
            {suggestedStudents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No students available
                  </h3>
                  <p className="text-gray-600">
                    All students in your cluster have groups
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {suggestedStudents.map((student, index) => (
                  <Card
                    key={student.id}
                    className="hover:shadow-lg transition-shadow relative overflow-hidden"
                  >
                    {index === 0 && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium rounded-bl-lg">
                        Great Match
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                          {student.full_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {student.full_name}
                            </CardTitle>
                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                              <Zap className="w-3 h-3 text-emerald-600" />
                              <span className="text-xs font-medium text-emerald-700">
                                {Math.round(student.matchScore * 5)}% match
                              </span>
                            </div>
                          </div>
                          <CardDescription>{student.roll_number}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        {student.branch}
                        {student.specialization && ` • ${student.specialization}`}
                      </p>
                      {student.skills && student.skills.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Skills:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {student.skills.map((skill) => (
                              <Badge
                                key={skill}
                                variant={
                                  profile.skills?.includes(skill)
                                    ? "secondary"
                                    : "outline"
                                }
                                className={
                                  !profile.skills?.includes(skill)
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : ""
                                }
                              >
                                {skill}
                                {!profile.skills?.includes(skill) && " ★"}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            ★ = Complementary skill you don&apos;t have
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
