import { supabase } from '@/integrations/supabase/client';
import {
  notifyNewMessage,
  notifyStudyReminder,
  notifyForumReply,
  notifySubscriptionChange,
  notifyNewCourse,
  notifyCourseProgress,
  createUpdateNotification,
  createSystemNotification
} from '@/lib/notificationHelpers';

/**
 * This script demonstrates how to create various types of notifications
 * You can call these functions from anywhere in your application when the events occur
 */

export const createSampleNotifications = async (userId: string) => {
  try {
    console.log('Creating sample notifications for user:', userId);

    // 1. Conversation notification - New message
    await notifyNewMessage(
      userId,
      'John Doe',
      'Hey! Are you ready for the exam tomorrow?',
      'conv-123'
    );

    // 2. Reminder notification - Study session
    await notifyStudyReminder(
      userId,
      'Mathematics',
      '3:00 PM'
    );

    // 3. Forum notification - Someone replied
    await notifyForumReply(
      userId,
      'Best study tips for finals',
      'Sarah Smith',
      'post-456'
    );

    // 4. Subscription notification - Renewal
    await notifySubscriptionChange(
      userId,
      'renewed',
      '2024-12-31'
    );

    // 5. Video course notification - New course available
    await notifyNewCourse(
      userId,
      'Advanced React Patterns',
      'course-789'
    );

    // 6. Video course notification - Progress update
    await notifyCourseProgress(
      userId,
      'Introduction to TypeScript',
      75,
      'course-101'
    );

    // 7. Update notification - App update
    await createUpdateNotification({
      userId,
      title: 'New Features Available',
      message: 'Check out the new collaborative note-taking feature!',
      link: '/features',
      metadata: { version: '2.0.0' }
    });

    // 8. System notification - Important announcement
    await createSystemNotification({
      userId,
      title: 'Maintenance Notice',
      message: 'Scheduled maintenance on Dec 20, 2024 from 2-4 AM EST',
      metadata: { maintenanceDate: '2024-12-20', startTime: '02:00', endTime: '04:00' }
    });

    console.log('Successfully created all sample notifications!');
    return { success: true, message: 'All notifications created successfully' };
  } catch (error) {
    console.error('Error creating sample notifications:', error);
    return { success: false, error };
  }
};

/**
 * Example: How to integrate notifications into your existing features
 */

// When a new message is sent in a conversation:
export const handleNewMessage = async (senderId: string, receiverId: string, message: string, conversationId: string, senderName: string) => {
  // Send the message to the database
  // ... your existing message sending code ...
  
  // Then create a notification for the receiver
  await notifyNewMessage(
    receiverId,
    senderName,
    message.substring(0, 100), // Preview of the message
    conversationId
  );
};

// When a study session time is set:
export const scheduleStudyReminder = async (userId: string, subject: string, scheduledTime: string) => {
  // Save the study session to database
  // ... your existing code ...
  
  // Create a reminder notification
  // You might want to schedule this to appear 15 minutes before the session
  await notifyStudyReminder(userId, subject, scheduledTime);
};

// When someone replies to a forum post:
export const handleForumReply = async (postOwnerId: string, postTitle: string, replierName: string, postId: string) => {
  // Save the reply to database
  // ... your existing code ...
  
  // Notify the post owner
  await notifyForumReply(postOwnerId, postTitle, replierName, postId);
};

// When a subscription is renewed or changed:
export const handleSubscriptionChange = async (userId: string, newStatus: string, expiryDate?: string) => {
  // Update subscription in database
  // ... your existing code ...
  
  // Notify the user
  await notifySubscriptionChange(userId, newStatus, expiryDate);
};

// When a new course is added to the platform:
export const handleNewCourseAdded = async (courseTitle: string, courseId: string, userIds: string[]) => {
  // Notify selected users about the new course
  // You would pass the list of user IDs who should be notified
  // For example, users with active subscriptions or users who bookmarked similar courses
  
  for (const userId of userIds) {
    await notifyNewCourse(userId, courseTitle, courseId);
  }
};

// When a student makes progress in a course:
export const handleCourseProgress = async (userId: string, courseTitle: string, newProgress: number, courseId: string) => {
  // Update progress in database
  // ... your existing code ...
  
  // Notify on milestone achievements (25%, 50%, 75%, 100%)
  if (newProgress % 25 === 0) {
    await notifyCourseProgress(userId, courseTitle, newProgress, courseId);
  }
};

/**
 * Testing function - call this from browser console or a test page
 * Usage: 
 * 1. Import this function in your component
 * 2. Call it with your user ID
 * 3. Check the notifications popover to see the results
 */
export const testNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return await createSampleNotifications(user.id);
  } else {
    console.error('No user logged in');
    return { success: false, error: 'No user logged in' };
  }
};

// Export for use in browser console or components
if (typeof window !== 'undefined') {
  (window as any).testNotifications = testNotifications;
  console.log('Notification test function loaded! Call window.testNotifications() to test.');
}
