
import React from 'react';
import Reactions from './Reactions';

const MessageBubble = ({
  message, isOwn, onReply, onForward, onReact, showThread
}: any) => {
  // ... basic styles, previews, etc.
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group px-4`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium mr-3">{message.avatar || '?'}</div>
      )}
      <div className={`max-w-xs lg:max-w-md`}>
        <div className={`px-4 py-2 rounded-2xl shadow-sm relative ${
            isOwn ? 'bg-blue-500 text-white ml-auto' : 'bg-white border border-gray-200 text-gray-900'
          } ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          {message.type === 'text'
            ? <span>{message.text}</span>
            : <span>{message.preview}</span>
           }
          <Reactions messageId={message.id} currentUser={message.currentUser} onReact={onReact}/>
        </div>
        {showThread && (
          <div className="pl-4 border-l-2 border-blue-100">
            {message.replies?.map((reply: any, idx: number) =>
              <MessageBubble key={idx} {...reply} showThread={false} />
            )}
          </div>
        )}
        <div className="flex items-center gap-1 mt-1 px-1">
          <button onClick={onReply} className="text-xs text-blue-400 underline mr-2">Reply</button>
          <button onClick={onForward} className="text-xs text-blue-400 underline">Forward</button>
        </div>
      </div>
    </div>
  );
};
export default MessageBubble;
