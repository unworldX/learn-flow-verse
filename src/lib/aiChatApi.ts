
// This file is no longer needed as we're using real APIs through the edge function
export const callAIChat = async (params: {
  message: string;
  provider: string;
  model: string;
  reasoning: boolean;
  userId: string;
}) => {
  // This functionality has been moved to the Supabase edge function
  throw new Error('This API has been replaced by the ai-chat edge function');
};
