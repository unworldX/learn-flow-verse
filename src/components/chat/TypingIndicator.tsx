
import React from 'react';

const TypingIndicator = ({ users }: { users: string[] }) =>
  users.length ? (
    <div className="text-xs text-blue-500 font-medium pl-6 py-1 animate-fade-in">
      {users.join(', ')} typing...
    </div>
  ) : null;

export default TypingIndicator;
