"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Send,
  Pin,
  Users,
  Crown,
  Settings,
  Megaphone,
  Link as LinkIcon,
} from "lucide-react";
import type { Profile, Group, Cluster, GroupMember, Message } from "@/lib/types";

interface GroupChatClientProps {
  profile: Profile;
  group: Group & {
    cluster: Cluster;
    group_members: (GroupMember & { profile: Profile })[];
  };
  initialMessages: (Message & { sender: Profile })[];
  pinnedMessages: (Message & { sender: Profile })[];
}

export function GroupChatClient({
  profile,
  group,
  initialMessages,
  pinnedMessages,
}: GroupChatClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const isLeader = profile.id === group.leader_id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`group-${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${group.id}`,
        },
        async (payload) => {
          const { data: newMsg } = await supabase
            .from("messages")
            .select("*, sender:profiles(*)")
            .eq("id", payload.new.id)
            .single();

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, group.id]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);

    const isResource = newMessage.includes("http://") || newMessage.includes("https://");

    await supabase.from("messages").insert({
      group_id: group.id,
      sender_id: profile.id,
      content: newMessage,
      is_announcement: isAnnouncement && isLeader,
      message_type: isResource ? "resource" : "text",
    });

    setNewMessage("");
    setIsAnnouncement(false);
    setSending(false);
  };

  const togglePin = async (messageId: string, currentlyPinned: boolean) => {
    if (!isLeader) return;

    await supabase
      .from("messages")
      .update({ is_pinned: !currentlyPinned })
      .eq("id", messageId);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, is_pinned: !currentlyPinned } : m
      )
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };

  let lastDate = "";

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <nav className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{group.name}</h1>
              <p className="text-xs text-gray-600">
                {group.group_members?.length} members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Users className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Group Members</SheetTitle>
                  <SheetDescription>{group.cluster?.name}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {group.group_members?.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                        {member.profile?.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {member.profile?.full_name}
                          </p>
                          {member.user_id === group.leader_id && (
                            <Crown className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {member.profile?.roll_number}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {pinnedMessages.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Pin className="w-4 h-4" />
                      Pinned Messages
                    </h3>
                    <div className="space-y-3">
                      {pinnedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm"
                        >
                          <p className="text-gray-800">{msg.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            — {msg.sender?.full_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {isLeader && (
              <Link href={`/groups/${group.id}/manage`}>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <ScrollArea className="flex-1 px-4">
        <div className="max-w-4xl mx-auto py-4 space-y-4">
          {messages.map((message, index) => {
            const messageDate = formatDate(message.created_at);
            const showDate = messageDate !== lastDate;
            lastDate = messageDate;

            const isOwnMessage = message.sender_id === profile.id;
            const isSystemMessage = message.message_type === "system";

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                      {messageDate}
                    </span>
                  </div>
                )}

                {isSystemMessage ? (
                  <div className="flex justify-center">
                    <div className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOwnMessage ? "order-2" : "order-1"
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                          <span className="text-xs font-medium text-gray-700">
                            {message.sender?.full_name}
                          </span>
                          {message.sender_id === group.leader_id && (
                            <Crown className="w-3 h-3 text-amber-500" />
                          )}
                        </div>
                      )}
                      <div
                        className={`relative group px-4 py-2.5 rounded-2xl ${
                          message.is_announcement
                            ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                            : isOwnMessage
                            ? "bg-violet-600 text-white rounded-br-sm"
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                        }`}
                      >
                        {message.is_announcement && (
                          <div className="flex items-center gap-1.5 mb-1 text-white/80">
                            <Megaphone className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              Announcement
                            </span>
                          </div>
                        )}
                        {message.is_pinned && (
                          <Pin className="absolute -top-2 -right-2 w-4 h-4 text-amber-500" />
                        )}
                        {message.message_type === "resource" ? (
                          <a
                            href={message.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 underline"
                          >
                            <LinkIcon className="w-4 h-4" />
                            {message.content}
                          </a>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage || message.is_announcement
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                        {isLeader && !isOwnMessage && (
                          <button
                            onClick={() => togglePin(message.id, message.is_pinned)}
                            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                          >
                            <Pin
                              className={`w-4 h-4 ${
                                message.is_pinned
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          {isLeader && (
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant={isAnnouncement ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAnnouncement(!isAnnouncement)}
                className={isAnnouncement ? "bg-violet-600" : ""}
              >
                <Megaphone className="w-4 h-4 mr-1" />
                Announcement
              </Button>
            </div>
          )}
          <div className="flex gap-3">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 h-12"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="h-12 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
