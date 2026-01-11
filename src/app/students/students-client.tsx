"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Search,
  UserPlus,
  Filter,
  Loader2
} from "lucide-react";
import type { Profile } from "@/lib/types";

interface StudentsListClientProps {
  profile: Profile;
  students: Profile[];
  clusterName: string;
}

export function StudentsListClient({ profile, students, clusterName }: StudentsListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  
  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleInvite = async (studentId: string) => {
    // 1. Validation: Do you have a group?
    if (!profile.current_group_id) {
      alert("You need to CREATE a group first before you can invite people!");
      router.push("/groups/create");
      return;
    }

    setInvitingId(studentId);

    try {
      // 2. Send the Invite to Database
      const { error } = await supabase
        .from("group_invitations")
        .insert({
          group_id: profile.current_group_id,
          inviter_id: profile.id,
          invitee_id: studentId,
          status: 'pending'
        });

      if (error) {
        if (error.message.includes("unique constraint")) {
          alert("Invite already sent to this student.");
        } else {
          throw error;
        }
      } else {
        alert("Invitation sent successfully!");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
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
          <h1 className="text-3xl font-bold text-gray-900">Find Teammates</h1>
          <p className="text-gray-600 mt-1">
            Students in <strong>{clusterName}</strong> looking for a group
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button variant="outline" className="h-12 gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {filteredStudents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Everyone in your cluster seems to have a group!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium text-lg">
                      {student.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                      <p className="text-sm text-gray-500 mb-3">{student.branch}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {student.skills?.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {student.skills && student.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{student.skills.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2">
                        <Button 
                          className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleInvite(student.id)}
                          disabled={invitingId === student.id}
                        >
                          {invitingId === student.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          Invite to Group
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}