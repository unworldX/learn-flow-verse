
import React, { useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Smile, Send, Mic } from 'lucide-react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  onPickEmoji: (emoji: string) => void;
  onUpload: (file: File) => void;
  showEmoji: boolean;
  setShowEmoji: (v: boolean) => void;
};
const MessageInput: React.FC<Props> = ({
  value, onChange, onSend, disabled,
  onPickEmoji, onUpload, showEmoji, setShowEmoji
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 relative">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={e => e.key === "Enter" && !e.shiftKey && onSend()}
          className="pr-20 py-3 rounded-full border-gray-300 focus:border-blue-500 bg-gray-50"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
          <Button variant="ghost" size="icon"
            onClick={() => inputRef.current?.click()} className="rounded-full w-8 h-8">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon"
            className="rounded-full w-8 h-8"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>
        {showEmoji && (
          <div className="absolute bottom-14 left-0 bg-white shadow rounded z-20">
            <div className="p-2 grid grid-cols-8 gap-1 text-2xl">
              {['😀', '😂', '😍', '😎', '👏', '🙏', '👍', '🎉', '🤖', '🔥', '😭', '🤔', '🙌', '😢', '🥳', '👀'].map(e =>
                <button key={e} className="hover-scale px-1"
                  onClick={() => { onPickEmoji(e); setShowEmoji(false); }}>{e}</button>
              )}
            </div>
          </div>
        )}
      </div>
      <Button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 p-0"
      >
        {value.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>
    </div>
  );
};
export default MessageInput;
