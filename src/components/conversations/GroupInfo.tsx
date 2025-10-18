import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatSummary, Message, UserProfile } from "@/types/chat";
import { Bell, Link, Lock, Search, Star, Users, X } from "lucide-react";

interface GroupInfoProps {
  chat: ChatSummary;
  participants: UserProfile[];
  starredMessages: Message[];
  onClose: () => void;
  onMute?: (duration?: "8h" | "1w" | "always" | "off") => void;
  onAddParticipants?: () => void;
  onInviteViaLink?: () => void;
  onLeaveGroup?: () => void;
}

export function GroupInfo({ chat, participants, starredMessages, onClose, onMute, onAddParticipants, onInviteViaLink, onLeaveGroup }: GroupInfoProps) {
  const admins = participants.filter((p) => p.role === "admin");
  const regularMembers = participants.filter((p) => p.role !== "admin");

  return (
    <div className="flex h-full flex-col border-l bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
        <h3 className="text-lg font-semibold">Group Info</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 text-center">
          <Avatar className="mx-auto h-24 w-24">
            <AvatarImage src={chat.avatarUrl} />
            <AvatarFallback>{chat.title.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="mt-4 text-xl font-bold">{chat.title}</h2>
          <p className="text-sm text-muted-foreground">
            Group · {participants.length} members
          </p>
        </div>

        <Separator />

        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            {chat.description ?? "No group description."}
          </p>
        </div>

        <Separator />

        <Card className="m-4 rounded-lg border shadow-none">
          <CardHeader className="flex-row items-center justify-between p-3">
            <CardTitle className="text-base">{participants.length} Members</CardTitle>
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {admins.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.avatarUrl} />
                      <AvatarFallback>{p.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="text-xs text-primary">Admin</span>
                </li>
              ))}
              {regularMembers.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.avatarUrl} />
                    <AvatarFallback>{p.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{p.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Separator />

        <Card className="m-4 rounded-lg border shadow-none">
          <CardHeader className="flex-row items-center justify-between p-3">
            <CardTitle className="text-base">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Starred Messages
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {starredMessages.length > 0 ? (
              <ul className="divide-y">
                {starredMessages.map((message) => (
                  <li key={message.id} className="p-3 text-sm">
                    <p className="truncate">{message.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.timeline.sentAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-center text-muted-foreground">
                No starred messages yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-1 p-4">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => onMute?.("always")}>
            <Bell className="h-5 w-5 text-muted-foreground" /> Mute Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={onAddParticipants}>
            <Users className="h-5 w-5 text-muted-foreground" /> Add Participants
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={onInviteViaLink}>
            <Link className="h-5 w-5 text-muted-foreground" /> Invite via Link
          </Button>
        </div>

        <Separator />

        <div className="p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" 
            onClick={onLeaveGroup}
          >
            <Users className="h-5 w-5" /> Leave Group
          </Button>
        </div>

        <Separator />

        <div className="p-4 text-center text-sm text-muted-foreground">
          <Lock className="mx-auto mb-2 h-5 w-5" />
          <p>End-to-end encrypted</p>
        </div>
      </ScrollArea>
    </div>
  );
}
