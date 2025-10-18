import { useEffect, useMemo, useState } from "react";
import { ChatList } from "@/components/conversations/ChatList";
import { ChatHeader } from "@/components/conversations/ChatHeader";
import { MessageList } from "@/components/conversations/MessageList";
import { MessageComposer } from "@/components/conversations/MessageComposer";

import { Message } from "@/types/chat";
import { useConversationsOptimized as useConversations } from "@/hooks/useConversationsOptimized";
import { useToast } from "@/hooks/use-toast";
import { GroupInfo } from "@/components/conversations/GroupInfo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { 
  MessageCircle, 
  Copy, 
  Share2, 
  Download, 
  RefreshCw, 
  QrCode, 
  Plus 
} from "lucide-react";

const CURRENT_USER_ID = "me";
const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

export default function Conversations() {
  const {
    chats,
    selectedChatId,
    selectedChat,
    currentMessages,
    groupMetadata,
    userProfiles,
    isLoading,
    setSelectedChatId,
    createGroup,
    sendMessage,
    markAsRead,
    markAllAsRead,
    toggleReaction,
    toggleStarred,
    deleteMessage,
    editMessage,
    forwardMessage,
    markMessagePinned,
    createPoll,
    startCall,
    exportChat,
    updateGroupSettings,
    updateDisappearing,
    togglePinChat,
    toggleArchive,
    toggleMarkUnread,
    muteChat,
    generateInviteLink,
    joinViaInvite,
    regenerateInviteLink,
    typingIndicators,
    broadcastTyping,
    clearChatHistory,
    leaveGroup,
    deleteChat,
    startDirectMessage,
  } = useConversations();

  
  const { toast } = useToast();
  const [forwardOpen, setForwardOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [pollQuestion, setPollQuestion] = useState("What's the plan for retro snacks?");
  const [pollOptions, setPollOptions] = useState(["Pizza", "Sushi", "Healthy bowls"]);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "groups">("all");
  const [dmDialogOpen, setDmDialogOpen] = useState(false);
  const [dmInput, setDmInput] = useState("");
  const [groupDialogMode, setGroupDialogMode] = useState<"create" | "join">("create");

  // Simplified data structures for compatibility
  const activeMessages = currentMessages;
  const activeChatId = selectedChatId;
  const activeChat = selectedChat;
  const filteredChats = useMemo(() => {
    let filtered = chats;
    if (chatFilter === "unread") {
      filtered = filtered.filter(c => c.unreadCount > 0);
    } else if (chatFilter === "groups") {
      filtered = filtered.filter(c => c.type === "group");
    }
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort: pinned chats first, then by last activity
    return filtered.sort((a, b) => {
      // Pinned chats always come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Within same pinned status, sort by last activity
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });
  }, [chats, chatFilter, searchTerm]);

  const replyToMessage = useMemo(() => {
    if (!replyToId || !activeMessages.length) return null;
    return activeMessages.find((message) => message.id === replyToId) ?? null;
  }, [replyToId, activeMessages]);

  const selectedChatParticipants = useMemo(() => {
    if (!activeChat) return [];
    const metadata = groupMetadata[activeChatId || ''];
    return activeChat.participants.map((id) => {
      const profile = userProfiles[id];
      // Provide fallback if profile hasn't loaded yet
      return {
        id: id,
        name: profile?.name || `User ${id.slice(0, 6)}`,
        avatarUrl: profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
        role: (metadata?.settings?.admins?.includes(id) ? 'admin' : 'member') as 'admin' | 'member',
      };
    });
  }, [activeChat, userProfiles, groupMetadata, activeChatId]);

  const pinnedMessages = useMemo(
    () => activeMessages.filter((message) => message.isPinned),
    [activeMessages]
  );

  const starredMessages = useMemo(() => {
    if (!activeChat?.starredMessageIds) return [] as Message[];
    return activeMessages.filter((message) => activeChat.starredMessageIds?.includes(message.id));
  }, [activeMessages, activeChat]);

  const chatPolls = useMemo(() => [], []);  // No polls in real version yet
  const typingList: string[] = useMemo(() => {
    if (!activeChatId || !typingIndicators[activeChatId]) return [];
    const typingUsers = typingIndicators[activeChatId];
    return typingUsers.map(t => userProfiles[t.userId]?.name).filter(Boolean) as string[];
  }, [activeChatId, typingIndicators, userProfiles]);

  // Convert typing indicators to the format ChatList expects
  const chatListTypingIndicators = useMemo(() => {
    const converted: Record<string, string[]> = {};
    Object.keys(typingIndicators).forEach(chatId => {
      converted[chatId] = typingIndicators[chatId].map(t => t.userId);
    });
    return converted;
  }, [typingIndicators]);

  const isDirectChat = activeChat?.type === "direct";

  // Real function wrappers (no longer stubs)
  const pushMessage = sendMessage;
  
  const [forwardSource, setForwardSource] = useState<Message | null>(null);
  const linkPreviews = {};
  const preferences = { 
    readReceipts: true, 
    multiDevice: false,
    readReceiptsEnabled: true,
    backupFrequency: "daily" as const,
    multiDeviceEnabled: false,
  };
  
  const filteredSearchMatches: { chatId: string; message: Message }[] = [];
  
  // Build messages map: chatId -> Message[]
  const messages = useMemo(() => {
    const messageMap: Record<string, Message[]> = {};
    chats.forEach(chat => {
      // For now, use empty array - messages will be loaded when chat is selected
      messageMap[chat.id] = chat.id === selectedChatId ? currentMessages : [];
    });
    return messageMap;
  }, [chats, selectedChatId, currentMessages]);
  
  const setActiveChatId = setSelectedChatId;
  const users = userProfiles;
  const toggleReadReceipts = () => toast({ title: "Feature coming soon" });
  const toggleMultiDevice = () => toast({ title: "Feature coming soon" });
  const triggerBackup = () => toast({ title: "Feature coming soon" });

  const filteredMessages = useMemo(() => {
    if (!messageSearchTerm) return activeMessages;
    return activeMessages.filter((message) =>
      message.body.toLowerCase().includes(messageSearchTerm.toLowerCase())
    );
  }, [activeMessages, messageSearchTerm]);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setSidebarOpen(false);
    setGroupInfoOpen(false);
  };

  // Mark unread as read when opening a chat or receiving new messages
  useEffect(() => {
    if (!activeChatId) return;
    markAllAsRead(activeChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  const handleSendText = (text: string) => {
    if (!activeChatId) return;
    sendMessage(activeChatId, text, undefined, replyToId ?? undefined);
    setReplyToId(null);
  };

  const handleSendMedia = (attachments: Message["attachments"] = [], caption?: string) => {
    if (!activeChatId || !attachments.length) return;
    sendMessage(activeChatId, caption ?? "", attachments, replyToId ?? undefined);
    setReplyToId(null);
  };

  const handleSendSticker = (url: string) => {
    if (!activeChatId) return;
    handleSendMedia([
      {
        id: createId(),
        type: "sticker",
        url,
      },
    ]);
  };

  const handleSendGif = (url: string) => {
    if (!activeChatId) return;
    handleSendMedia([
      {
        id: createId(),
        type: "gif",
        url,
      },
    ]);
  };

  const handleSendVoice = (durationSeconds: number) => {
    if (!activeChatId) return;
    handleSendMedia([
      {
        id: createId(),
        type: "voice-note",
        url: "https://example.com/audio/demo.m4a",
        durationSeconds,
      },
    ]);
  };

  const handleSaveEdit = (text: string) => {
    if (!activeChatId || !editingMessage) return;
    editMessage(activeChatId, editingMessage.id, text);
    setEditingMessage(null);
  };

  const handleForward = (targetChatId: string) => {
    if (!forwardSource || !activeChatId) return;
    forwardMessage(activeChatId, forwardSource.id, targetChatId);
    setForwardSource(null);
    setForwardOpen(false);
  };

  const handleCreatePoll = () => {
    if (!activeChatId) return;
    createPoll(activeChatId, pollQuestion, pollOptions, false);
    setPollOpen(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Group name is required",
        variant: "destructive",
      });
      return;
    }
    const groupId = await createGroup(newGroupName, newGroupDescription);
    if (groupId) {
      setGroupOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedChatId(groupId);
      toast({
        title: "Group created",
        description: "You can now start conversations in your new group.",
      });
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCodeInput.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    const result = await joinViaInvite(inviteCodeInput.trim());
    if (result?.success) {
      setGroupOpen(false);
      setInviteCodeInput("");
      // Optionally navigate to the newly joined group
      if (result.groupId) {
        setSelectedChatId(result.groupId);
      }
    }
  };

  const handleCopyInvite = async () => {
    if (!activeChat?.inviteLink) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(activeChat.inviteLink);
        toast({
          title: "Invite link copied",
          description: "Share it with your favourite collaborators.",
        });
      } else {
        toast({
          title: "Invite link",
          description: activeChat.inviteLink,
        });
      }
    } catch (error) {
      console.warn("Clipboard copy failed", error);
      toast({ title: "Copy failed", description: "We couldn't copy the link. Try again or share manually.", variant: "destructive" });
    }
  };

  const handleShareInvite = async () => {
    if (!activeChat?.inviteLink) return;
    const shareData = {
      url: activeChat.inviteLink,
      title: activeChat.title,
      text: `Join our ${activeChat.title} chat!`,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Invite shared", description: "Your contacts just got the link." });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(activeChat.inviteLink);
        toast({
          title: "Invite link copied",
          description: "Share it anywhere – we saved it to your clipboard.",
        });
      } else {
        toast({ title: "Invite link", description: activeChat.inviteLink });
      }
    } catch (error) {
      console.warn("Invite share aborted", error);
    }
  };

  const handleToggleAdminOnly = (field: "send" | "edit") => {
    toast({ title: "Admin settings coming soon" });
  };

  const handleDisappearingMode = (mode: "off" | "24h" | "7d" | "90d") => {
    toast({ title: "Disappearing messages coming soon" });
  };

  useEffect(() => {
    if (isDirectChat) {
      setCompactMode(true);
    } else {
      setCompactMode(false);
      setSidebarOpen(false);
    }
  }, [isDirectChat]);

  return (
    <div className="flex h-[calc(100vh-var(--app-header-height,0px))] bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
      {!compactMode && (
        <ResizablePanelGroup direction="horizontal" className="hidden md:flex">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="h-full">
            <div className="h-full border-r border-border/40 shadow-lg">
              <ChatList
                chats={filteredChats}
                messages={messages}
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                filter={chatFilter}
                onFilterChange={setChatFilter}
                onTogglePin={togglePinChat}
                onMute={muteChat}
                onMarkUnread={toggleMarkUnread}
                onArchive={toggleArchive}
                onDeleteChat={deleteChat}
                onCreateGroup={() => setGroupOpen(true)}
                onJoinGroup={() => {
                  setGroupDialogMode("join");
                  setGroupOpen(true);
                }}
                onStartDM={() => setDmDialogOpen(true)}
                typingIndicators={chatListTypingIndicators}
                searchMatches={filteredSearchMatches}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={70} minSize={50}>
            <div
              className={cn(
                "flex flex-1 flex-col h-full min-h-0 transition-all duration-300"
              )}
            >
              {activeChat ? (
                <>
                  <ChatHeader
                    chat={activeChat}
                    participants={selectedChatParticipants}
              onSearchChat={() => setMessageSearchOpen(true)}
              onStartCall={(type) => activeChatId && startCall(activeChatId, type)}
              preferences={preferences}
              onToggleReadReceipts={toggleReadReceipts}
              onToggleMultiDevice={toggleMultiDevice}
              onExportChat={(includeMedia) => activeChatId && exportChat(activeChatId, includeMedia)}
              onTriggerBackup={triggerBackup}
              onOpenInfo={() => setGroupInfoOpen(true)}
              onShareInvite={handleShareInvite}
              onShowQr={() => setQrOpen(true)}
              onMute={(duration?: "8h" | "1w" | "always" | "off") => activeChatId && muteChat(activeChatId, duration)}
              onClearHistory={() => activeChatId && clearChatHistory(activeChatId)}
              onDeleteChat={() => activeChatId && deleteChat(activeChatId)}
              onLeaveGroup={() => activeChatId && leaveGroup(activeChatId)}
              pinnedMessages={pinnedMessages}
              typingUsers={typingList}
              groupMetadata={groupMetadata[activeChatId]}
              variant={compactMode ? "compact" : "default"}
              onOpenSidebar={() => setSidebarOpen(true)}
            />

            <div className="flex-1 overflow-y-auto scroll-smooth bg-gradient-to-b from-muted/5 to-background">
              <MessageList
                messages={filteredMessages}
                allMessages={activeMessages}
                users={users}
                currentUserId={CURRENT_USER_ID}
                readReceiptsEnabled={preferences.readReceiptsEnabled}
                linkPreviews={linkPreviews}
                onReply={(message) => setReplyToId(message.id)}
                onForward={(message) => {
                  setForwardSource(message);
                  setForwardOpen(true);
                }}
                onStar={(message) => activeChatId && toggleStarred(activeChatId, message.id)}
                onDelete={(message, scope) => activeChatId && deleteMessage(activeChatId, message.id, scope)}
                onEdit={(message) => {
                  setEditingMessage(message);
                  setReplyToId(null);
                }}
                onPinChange={(message, pinned) => activeChatId && markMessagePinned(activeChatId, message.id, pinned)}
                onReact={(message, emoji) => activeChatId && toggleReaction(activeChatId, message.id, emoji)}
                typingUsers={typingList}
              />
            </div>

            <MessageComposer
              participants={selectedChatParticipants}
              onSendText={handleSendText}
              onSendMedia={(attachments, caption) => handleSendMedia(attachments, caption)}
              onSendSticker={handleSendSticker}
              onSendGif={handleSendGif}
              onSendVoice={handleSendVoice}
              onCreatePoll={() => setPollOpen(true)}
              onTyping={() => void 0}
              replyTo={replyToMessage}
              onCancelReply={() => setReplyToId(null)}
              editingMessage={editingMessage}
              onSaveEdit={handleSaveEdit}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center text-muted-foreground p-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <MessageCircle className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Pick a chat to get started</h2>
            <p className="max-w-md text-muted-foreground">
              Conversations support text, voice notes, media, polls, and more. Create a new group to
              experience the full demo.
            </p>
            <Button 
              onClick={() => setGroupOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Create a group
            </Button>
          </div>
        )}
      </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {compactMode && (
        <div
          className={cn(
            "flex flex-1 flex-col min-h-0 transition-all duration-300",
            "mx-auto w-full max-w-3xl border-x border-border/40 shadow-2xl"
          )}
        >
          {activeChat ? (
            <>
              <ChatHeader
                chat={activeChat}
                participants={selectedChatParticipants}
                onSearchChat={() => setMessageSearchOpen(true)}
                onStartCall={(type) => activeChatId && startCall(activeChatId, type)}
                preferences={preferences}
                onToggleReadReceipts={toggleReadReceipts}
                onToggleMultiDevice={toggleMultiDevice}
                onExportChat={(includeMedia) => activeChatId && exportChat(activeChatId, includeMedia)}
                onTriggerBackup={triggerBackup}
                onOpenInfo={() => setGroupInfoOpen(true)}
                onShareInvite={handleShareInvite}
                onShowQr={() => setQrOpen(true)}
                onMute={(duration?: "8h" | "1w" | "always" | "off") => activeChatId && muteChat(activeChatId, duration)}
                onClearHistory={() => activeChatId && clearChatHistory(activeChatId)}
                onDeleteChat={() => activeChatId && deleteChat(activeChatId)}
                onLeaveGroup={() => activeChatId && leaveGroup(activeChatId)}
                pinnedMessages={pinnedMessages}
                typingUsers={typingList}
                groupMetadata={groupMetadata[activeChatId]}
                variant="compact"
                onOpenSidebar={() => setSidebarOpen(true)}
              />

              <div className="flex-1 overflow-y-auto scroll-smooth bg-gradient-to-b from-muted/5 to-background">
                <MessageList
                  messages={filteredMessages}
                  allMessages={activeMessages}
                  users={users}
                  currentUserId={CURRENT_USER_ID}
                  readReceiptsEnabled={preferences.readReceiptsEnabled}
                  linkPreviews={linkPreviews}
                  onReply={(message) => setReplyToId(message.id)}
                  onForward={(message) => {
                    setForwardSource(message);
                    setForwardOpen(true);
                  }}
                  onStar={(message) => activeChatId && toggleStarred(activeChatId, message.id)}
                  onDelete={(message, scope) => activeChatId && deleteMessage(activeChatId, message.id, scope)}
                  onEdit={(message) => {
                    setEditingMessage(message);
                    setReplyToId(null);
                  }}
                  onPinChange={(message, pinned) => activeChatId && markMessagePinned(activeChatId, message.id, pinned)}
                  onReact={(message, emoji) => activeChatId && toggleReaction(activeChatId, message.id, emoji)}
                  typingUsers={typingList}
                />
              </div>

              <MessageComposer
                participants={selectedChatParticipants}
                onSendText={handleSendText}
                onSendMedia={(attachments, caption) => handleSendMedia(attachments, caption)}
                onSendSticker={handleSendSticker}
                onSendGif={handleSendGif}
                onSendVoice={handleSendVoice}
                onCreatePoll={() => setPollOpen(true)}
                onTyping={() => void 0}
                replyTo={replyToMessage}
                onCancelReply={() => setReplyToId(null)}
                editingMessage={editingMessage}
                onSaveEdit={handleSaveEdit}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center text-muted-foreground p-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <MessageCircle className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Pick a chat to get started</h2>
              <p className="max-w-md text-muted-foreground">
                Conversations support text, voice notes, media, polls, and more. Create a new group to
                experience the full demo.
              </p>
              <Button 
                onClick={() => setGroupOpen(true)}
                className="bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                Create a group
              </Button>
            </div>
          )}
        </div>
      )}

      {activeChat && activeChat.type === "group" && (
        <div
          className={cn(
            "hidden w-full max-w-sm flex-col",
            groupInfoOpen && "md:flex"
          )}
        >
          <GroupInfo
            chat={activeChat}
            participants={selectedChatParticipants}
            starredMessages={starredMessages}
            onClose={() => setGroupInfoOpen(false)}
            onMute={(duration) => activeChatId && muteChat(activeChatId, duration)}
            onAddParticipants={() => toast({ title: "Coming soon" })}
            onInviteViaLink={() => setQrOpen(true)}
            onLeaveGroup={() => {
              if (activeChatId) {
                leaveGroup(activeChatId);
                setGroupInfoOpen(false);
              }
            }}
          />
        </div>
      )}

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-full max-w-sm border-r p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>Chats</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-4rem)]">
            <ChatList
              chats={filteredChats}
              messages={messages}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              filter={chatFilter}
              onFilterChange={setChatFilter}
              onTogglePin={togglePinChat}
              onMute={muteChat}
              onMarkUnread={toggleMarkUnread}
              onArchive={toggleArchive}
              onDeleteChat={deleteChat}
              onCreateGroup={() => {
                setSidebarOpen(false);
                setGroupOpen(true);
              }}
              onJoinGroup={() => {
                setSidebarOpen(false);
                setGroupDialogMode("join");
                setGroupOpen(true);
              }}
              onStartDM={() => {
                setSidebarOpen(false);
                setDmDialogOpen(true);
              }}
              typingIndicators={chatListTypingIndicators}
              searchMatches={filteredSearchMatches}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward message</DialogTitle>
            <DialogDescription>Select a chat to forward the message to.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-60">
            <div className="space-y-2 py-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left",
                    chat.id === activeChatId ? "border-primary" : "border-transparent"
                  )}
                  onClick={() => handleForward(chat.id)}
                >
                  <span className="font-medium">{chat.title}</span>
                  {chat.type === "group" && <Badge>Group</Badge>}
                </button>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pollOpen} onOpenChange={setPollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create poll</DialogTitle>
            <DialogDescription>Gather opinions quickly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="poll-question">Question</Label>
              <Textarea
                id="poll-question"
                value={pollQuestion}
                onChange={(event) => setPollQuestion(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              {pollOptions.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(event) =>
                    setPollOptions((prev) =>
                      prev.map((value, idx) => (idx === index ? event.target.value : value))
                    )
                  }
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPollOptions((prev) => [...prev, `Option ${prev.length + 1}`])}
              >
                Add option
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPollOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePoll}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Chat</DialogTitle>
            <DialogDescription>Create a new group or join an existing one.</DialogDescription>
          </DialogHeader>
          <Tabs value={groupDialogMode} onValueChange={(v) => setGroupDialogMode(v as "create" | "join")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="join">Join Group</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group name</Label>
                <Input 
                  id="group-name" 
                  placeholder="Team Nebula" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Project goals, daily stand-ups, etc."
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Note: For this demo, creating a group will add some predefined members.
              </p>
            </TabsContent>
            <TabsContent value="join" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input
                  id="invite-code"
                  placeholder="abc123"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the invite code or link you received to join a group.
              </p>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupOpen(false)}>
              Cancel
            </Button>
            {groupDialogMode === "create" ? (
              <Button onClick={handleCreateGroup}>Create</Button>
            ) : (
              <Button onClick={handleJoinGroup}>Join</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dmDialogOpen} onOpenChange={setDmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Direct Message</DialogTitle>
            <DialogDescription>Enter email or username to start a conversation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="dm-input">Email or Username</Label>
              <Input
                id="dm-input"
                placeholder="user@example.com or username"
                value={dmInput}
                onChange={(e) => setDmInput(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Search by email address or username to find and message users.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (dmInput.trim()) {
                await startDirectMessage(dmInput.trim());
                setDmDialogOpen(false);
                setDmInput("");
              }
            }}>Start Chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={messageSearchOpen} onOpenChange={setMessageSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search messages</DialogTitle>
            <DialogDescription>Find any discussion quickly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Search this chat"
              value={messageSearchTerm}
              onChange={(event) => setMessageSearchTerm(event.target.value)}
            />
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches yet.</p>
              ) : (
                filteredMessages.map((message) => (
                  <div key={message.id} className="rounded-lg border bg-muted/30 p-2 text-sm">
                    <p className="font-medium">{message.body || message.attachments?.[0]?.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.timeline.sentAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageSearchOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Invite Link</DialogTitle>
            <DialogDescription>
              Scan the QR code or share the link to invite people to this group.
            </DialogDescription>
          </DialogHeader>
          {activeChat?.inviteLink ? (
            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              <div className="rounded-xl border bg-white p-6 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
                    activeChat.inviteLink
                  )}&margin=10&ecc=M`}
                  alt="Group invite QR code"
                  className="h-64 w-64"
                  loading="lazy"
                />
              </div>

              {/* Invite Link Display */}
              <div className="w-full rounded-lg border bg-muted/50 p-3">
                <p className="break-all text-center text-sm font-mono">
                  {activeChat.inviteLink}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex w-full gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={handleCopyInvite}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={handleShareInvite}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Download QR Code Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `${activeChat.title}-qr-code.png`;
                  link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                    activeChat.inviteLink
                  )}&margin=20&ecc=H&format=png`;
                  link.click();
                  toast({ title: "QR code downloaded" });
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>

              {/* Regenerate Link Button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={async () => {
                  if (activeChat && !activeChat.id.startsWith('dm-')) {
                    await regenerateInviteLink(activeChat.id);
                  }
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Link
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="rounded-full bg-muted p-4">
                <QrCode className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No Invite Link</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate an invite link to share this group
                </p>
              </div>
              <Button
                onClick={async () => {
                  if (activeChat && !activeChat.id.startsWith('dm-')) {
                    await generateInviteLink(activeChat.id, 168); // 7 days
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate Invite Link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
    </div>
  );
}
