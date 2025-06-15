
// Client-side API handler for AI chat
export const callAIChat = async (params: {
  message: string;
  provider: string;
  model: string;
  reasoning: boolean;
  userId: string;
}) => {
  const response = await fetch('/functions/v1/ai-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get AI response');
  }

  return response.json();
};
