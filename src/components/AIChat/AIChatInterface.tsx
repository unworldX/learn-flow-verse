import { AIMessage, PersistedChatMessage } from '@/types/ai';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import ChatMessage from './ChatMessage';
import { useAIChatMessages } from '@/hooks/useAIChatMessages';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useAuth } from '@/contexts/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, PanelRightOpen, Send, Upload, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const AIChatInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [reasoning, setReasoning] = useState(false);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'left' | 'right'>('none');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    addMessage,
    setMessages,
    clearMessages,
    isLoading,
    sendMessage,
  } = useAIChatMessages();

  const {
    sessions,
    loadingSessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    appendMessages,
    loadSession,
    deleteSession,
    listSessions,
  } = useChatSessions();

  useEffect(() => {
    if (user) {
      listSessions();
    }
  }, [user, listSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() && !file) return;

    const messageContent = input.trim();
    setInput('');
    setFile(null);

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    addMessage(userMessage);

    let activeSessionId = currentSessionId;

    try {
      const userMessageForHistory: Omit<PersistedChatMessage, 'session_id'> = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        created_at: userMessage.timestamp.toISOString(),
      };

      if (!activeSessionId) {
        const newSessionId = await createSession([userMessageForHistory]);
        if (newSessionId) {
          activeSessionId = newSessionId;
          setCurrentSessionId(newSessionId);
        } else {
          throw new Error("Failed to create a new session.");
        }
      } else {
        await appendMessages([userMessageForHistory]);
      }

      const aiResponse = await sendMessage(messageContent, reasoning);

      if (aiResponse && activeSessionId) {
        const aiMessageForHistory: Omit<PersistedChatMessage, 'session_id'> = {
          id: aiResponse.id,
          role: 'assistant',
          content: aiResponse.content,
          created_at: aiResponse.timestamp.toISOString(),
        };
        await appendMessages([aiMessageForHistory]);
      }
    } catch (error) {
      console.error("Error during chat operation:", error);
      toast({
        title: "Error",
        description: "Could not save or send the message.",
        variant: "destructive",
      });
    }
  }, [
    input, file, reasoning, addMessage, sendMessage, toast,
    currentSessionId, createSession, appendMessages, setCurrentSessionId
  ]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    clearMessages();
    setInput('');
  };

  const handleLoadSession = async (sessionId: string) => {
    const sessionDetail = await loadSession(sessionId);
    if (sessionDetail) {
      const loadedMessages: AIMessage[] = sessionDetail.messages.map(m => ({
        id: m.id || crypto.randomUUID(),
        type: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content,
        timestamp: new Date(m.created_at)
      }));
      setMessages(loadedMessages);
      setCurrentSessionId(sessionId);
    }
  };

  if (!user) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-3 md:p-4">
        <Card className="w-full max-w-md text-center shadow-xl rounded-2xl bg-card border border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-lg md:text-xl font-semibold mb-2 text-foreground">AI Assistant</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-4">Please sign in to chat with your AI study assistant</p>
            <Link to="/login">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {showCommandPalette && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-28 px-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCommandPalette(false)} />
          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-11 border-b bg-muted">
              <Input autoFocus placeholder="Type a command… (reason / right)" className="h-7 text-sm border-0 focus-visible:ring-0 bg-transparent" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.toLowerCase();
                  if (val.includes('reason')) setReasoning(r => !r);
                  if (val.includes('right')) setShowRight(r => !r);
                  setShowCommandPalette(false);
                }
              }} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCommandPalette(false)} aria-label="Close"><X className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 hidden xl:grid border-t border-border" style={{ gridTemplateColumns: `${showLeft ? '260px' : '0px'} minmax(0,1fr)` }}>
        {/* Left Sidebar - Saved Chat Sessions */}
        <div className={`${showLeft ? 'opacity-100 w-full border-r border-border' : 'opacity-0 w-0'} transition-all duration-300 overflow-hidden bg-card flex flex-col p-0`} aria-hidden={!showLeft}>
          <div className="flex items-center justify-between gap-2 px-4 h-10 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground tracking-wide uppercase">History</span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={handleNewChat}>New Chat</Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {loadingSessions ? <p className="text-xs text-muted-foreground">Loading...</p> : sessions.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">No saved chats yet.</p>
              )}
              {sessions.map(session => (
                <div key={session.id} className={`group border rounded-md p-2 transition ${currentSessionId === session.id ? 'bg-muted ring-1 ring-primary/30 border-transparent' : 'bg-card hover:bg-muted border-border'}`}>
                  <button className="w-full text-left" onClick={() => handleLoadSession(session.id)}>
                    <p className="text-[11px] font-medium text-foreground line-clamp-2">{session.derived_title || 'Untitled Chat'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{session.message_count} msgs • {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </button>
                  <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition">
                    <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px] text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}>Del</Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 border-t border-border bg-card text-[10px] text-muted-foreground flex justify-between">
            <span>{sessions.length} saved</span>
          </div>
        </div>

        {/* Chat Column */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                {messages.length === 0 ? <WelcomeScreen onPromptClick={(p) => setInput(p)} /> : messages.map((m) => <ChatMessage key={m.id} message={m} />)}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
          {/* Input Bar */}
          <div className="border-t border-border bg-card p-3">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hidden xl:inline-flex"
                  aria-label={showLeft ? 'Hide history panel' : 'Show history panel'}
                  onClick={() => setShowLeft(v => !v)}
                >
                  {showLeft ? <X className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                </Button>
                <label htmlFor="file-upload" className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 cursor-pointer transition text-foreground">
                  <Upload className="w-3 h-3" /> File
                  <input id="file-upload" type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={e => {
                    const f = e.target.files && e.target.files[0]; if (!f) return; const ext = f.name.split('.').pop()?.toLowerCase(); const allowed = ['txt', 'pdf', 'doc', 'docx']; if (!ext || !allowed.includes(ext)) { toast({ title: 'Unsupported file', description: 'Only .txt, .pdf, .doc, .docx are allowed', variant: 'destructive' }); e.currentTarget.value = ''; return; } setFile(f);
                  }} disabled={isLoading} />
                </label>
                {file && <span className="truncate max-w-[140px] text-foreground">{file.name}</span>}
                <div className="ml-auto hidden md:flex items-center gap-1">
                  <Switch id="reasoning-bottom" checked={reasoning} onCheckedChange={setReasoning} className="scale-75" />
                  <label htmlFor="reasoning-bottom" className="cursor-pointer">Reasoning</label>
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask anything about your studies..." disabled={isLoading} className="h-11 md:h-12 border border-border rounded-2xl bg-background text-sm" />
                <Button onClick={handleSend} disabled={(!input.trim() && !file) || isLoading} className="h-11 md:h-12 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Enter to send • Ctrl/⌘+K commands • Ctrl/⌘+P reasoning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Panels */}
      {mobilePanel === 'left' && (
        <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobilePanel('none')} />
          <div className="absolute top-0 bottom-0 left-0 w-72 bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-2 px-4 h-11 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase">History</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" aria-label="Close" onClick={() => setMobilePanel('none')}><X className="w-4 h-4" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {sessions.map(session => (
                  <button key={session.id} type="button" onClick={() => { handleLoadSession(session.id); setMobilePanel('none'); }} className="w-full text-left text-[11px] px-2 py-2 rounded-md border border-border hover:bg-muted transition">
                    <p className="line-clamp-2 text-foreground">{session.derived_title || 'Untitled Chat'}</p>
                    <p className="text-[10px] text-muted-foreground">{session.message_count} msgs</p>
                  </button>
                ))}
                {sessions.length === 0 && <p className="text-[11px] text-muted-foreground italic">No saved chats yet.</p>}
              </div>
            </ScrollArea>
            <div className="p-2 border-t border-border bg-card text-[10px] text-muted-foreground flex justify-between">
              <span>{sessions.length} saved</span>
              <button onClick={handleNewChat} className="underline-offset-2 hover:underline">New Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Mobile Chat (always shown below header) */}
      <div className="flex-1 xl:hidden flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">
            {messages.length === 0 ? <WelcomeScreen onPromptClick={(p) => setInput(p)} /> : messages.map((m) => <ChatMessage key={m.id} message={m} />)}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t border-border bg-card p-3">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={mobilePanel === 'left' ? 'Hide history panel' : 'Show history panel'}
                onClick={() => setMobilePanel(p => p === 'left' ? 'none' : 'left')}
              >
                {mobilePanel === 'left' ? <X className="w-4 h-4" /> : <History className="w-4 h-4" />}
              </Button>
              <label htmlFor="file-upload-mobile" className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 cursor-pointer transition text-foreground">
                <Upload className="w-3 h-3" /> File
                <input id="file-upload-mobile" type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={e => {
                  const f = e.target.files && e.target.files[0]; if (!f) return; const ext = f.name.split('.').pop()?.toLowerCase(); const allowed = ['txt', 'pdf', 'doc', 'docx']; if (!ext || !allowed.includes(ext)) { toast({ title: 'Unsupported file', description: 'Only .txt, .pdf, .doc, .docx are allowed', variant: 'destructive' }); e.currentTarget.value = ''; return; } setFile(f);
                }} disabled={isLoading} />
              </label>
              {file && <span className="truncate max-w-[120px] text-foreground">{file.name}</span>}
              <div className="ml-auto flex items-center gap-1">
                <Switch id="reasoning-mobile" checked={reasoning} onCheckedChange={setReasoning} className="scale-75" />
                <label htmlFor="reasoning-mobile" className="cursor-pointer">Reason</label>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask anything..." disabled={isLoading} className="h-11 border border-border rounded-2xl bg-background text-sm" />
              <Button onClick={handleSend} disabled={(!input.trim() && !file) || isLoading} className="h-11 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-2xl shadow-lg">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Enter to send • Ctrl/⌘+K commands</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
