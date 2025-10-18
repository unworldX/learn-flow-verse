import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface NotificationParams {
  userId: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Json;
}

/**
 * Creates a conversation notification when a new message is received
 */
export const createConversationNotification = async (params: NotificationParams) => {
  try {
    const { data, error } = await supabase.rpc('create_conversation_notification', {
      p_user_id: params.userId,
      p_title: params.title,
      p_message: params.message,
      p_link: params.link || null,
      p_metadata: params.metadata || null,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating conversation notification:', error);
    throw error;
  }
};

/**
 * Creates a reminder notification for study sessions or tasks
 */
export const createReminderNotification = async (params: NotificationParams) => {
  try {
    const { data, error } = await supabase.rpc('create_reminder_notification', {
      p_user_id: params.userId,
      p_title: params.title,
      p_message: params.message,
      p_link: params.link || null,
      p_metadata: params.metadata || null,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating reminder notification:', error);
    throw error;
  }
};

/**
 * Creates a forum notification when someone replies or interacts with a post
 */
export const createForumNotification = async (params: NotificationParams) => {
  try {
    const { data, error } = await supabase.rpc('create_forum_notification', {
      p_user_id: params.userId,
      p_title: params.title,
      p_message: params.message,
      p_link: params.link || null,
      p_metadata: params.metadata || null,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating forum notification:', error);
    throw error;
  }
};

/**
 * Creates a subscription notification when subscription status changes
 */
export const createSubscriptionNotification = async (params: NotificationParams) => {
  try {
    const { data, error } = await supabase.rpc('create_subscription_notification', {
      p_user_id: params.userId,
      p_title: params.title,
      p_message: params.message,
      p_link: params.link || null,
      p_metadata: params.metadata || null,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating subscription notification:', error);
    throw error;
  }
};

/**
 * Creates a video course notification for new courses or progress updates
 */
export const createVideoCourseNotification = async (params: NotificationParams) => {
  try {
    const { data, error } = await supabase.rpc('create_video_course_notification', {
      p_user_id: params.userId,
      p_title: params.title,
      p_message: params.message,
      p_link: params.link || null,
      p_metadata: params.metadata || null,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating video course notification:', error);
    throw error;
  }
};

/**
 * Creates a generic update notification for system updates
 */
export const createUpdateNotification = async (params: NotificationParams) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: 'update',
        title: params.title,
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating update notification:', error);
    throw error;
  }
};

/**
 * Creates a system notification for important announcements
 */
export const createSystemNotification = async (params: NotificationParams) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: 'system',
        title: params.title,
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

/**
 * Example usage for creating a notification when a new message is received
 */
export const notifyNewMessage = async (userId: string, senderName: string, messagePreview: string, conversationId: string) => {
  return createConversationNotification({
    userId,
    title: `New message from ${senderName}`,
    message: messagePreview,
    link: `/conversations/${conversationId}`,
    metadata: { senderId: senderName, conversationId },
  });
};

/**
 * Example usage for creating a study reminder notification
 */
export const notifyStudyReminder = async (userId: string, subject: string, time: string) => {
  return createReminderNotification({
    userId,
    title: `Study Reminder: ${subject}`,
    message: `Don't forget your ${subject} study session at ${time}`,
    link: `/study-planner`,
    metadata: { subject, scheduledTime: time },
  });
};

/**
 * Example usage for creating a forum notification
 */
export const notifyForumReply = async (userId: string, postTitle: string, replierName: string, postId: string) => {
  return createForumNotification({
    userId,
    title: `New reply to: ${postTitle}`,
    message: `${replierName} replied to your post`,
    link: `/forums/post/${postId}`,
    metadata: { postId, replierName },
  });
};

/**
 * Example usage for creating a subscription notification
 */
export const notifySubscriptionChange = async (userId: string, status: string, expiryDate?: string) => {
  return createSubscriptionNotification({
    userId,
    title: `Subscription ${status}`,
    message: expiryDate 
      ? `Your subscription ${status} and will expire on ${expiryDate}` 
      : `Your subscription status has been updated to ${status}`,
    link: `/settings/subscription`,
    metadata: { status, expiryDate },
  });
};

/**
 * Example usage for creating a video course notification
 */
export const notifyNewCourse = async (userId: string, courseTitle: string, courseId: string) => {
  return createVideoCourseNotification({
    userId,
    title: `New Course Available: ${courseTitle}`,
    message: `Check out the new course "${courseTitle}" in your library`,
    link: `/courses/${courseId}`,
    metadata: { courseId, courseTitle },
  });
};

/**
 * Example usage for creating a course progress notification
 */
export const notifyCourseProgress = async (userId: string, courseTitle: string, progress: number, courseId: string) => {
  return createVideoCourseNotification({
    userId,
    title: `Course Progress Update`,
    message: `You've completed ${progress}% of "${courseTitle}". Keep going!`,
    link: `/courses/${courseId}`,
    metadata: { courseId, courseTitle, progress },
  });
};
