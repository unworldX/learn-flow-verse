
import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
const emojis = ['😀', '😂', '😍', '😎', '👏', '🙏', '👍', '🎉', '🔥'];

const Reactions = ({ messageId, currentUser, onReact }: { messageId: string, currentUser: string, onReact: (emoji: string) => void }) => {
  const [reactions, setReactions] = useState<{ [emoji: string]: number }>({});
  useEffect(() => {
    // Fetch or subscribe to message reactions from Supabase
    // For brevity, assume ready data shape
  }, [messageId]);
  return (
    <div className="flex gap-1 pt-1">
      {emojis.map(e => (
        <button key={e}
          onClick={() => onReact(e)}
          className="px-1 rounded-full bg-gray-100 hover:bg-blue-100 text-lg"
        >
          {e} {reactions[e] || ''}
        </button>
      ))}
    </div>
  );
};
export default Reactions;
