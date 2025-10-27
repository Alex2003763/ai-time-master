import { Task } from '../types';
import { sendNotification } from './notifications';

// Use a Map to store scheduled reminder timeouts, mapping taskId to the timeout ID.
const scheduledReminders = new Map<string, number>();

/**
 * Schedules a new notification reminder for a given task.
 * @param {Task} task - The task to schedule a reminder for.
 */
const scheduleReminder = (task: Task): void => {
  // A reminder can only be scheduled if reminderMinutes is set, the task is not completed,
  // and the task has a specific start time (not just a date).
  if (task.reminderMinutes === undefined || task.completed || task.startTime.endsWith('T00:00:00.000Z')) {
    return;
  }

  const startTime = new Date(task.startTime).getTime();
  const reminderTime = startTime - (task.reminderMinutes * 60 * 1000);
  const now = Date.now();
  
  // Only schedule reminders that are in the future.
  if (reminderTime > now) {
    const delay = reminderTime - now;
    
    // Set a timeout to send the notification.
    const timeoutId = window.setTimeout(() => {
      sendNotification(`Reminder: ${task.title}`, {
        body: `Your task is scheduled to start in ${task.reminderMinutes} minutes.`,
      });
      // Clean up the reminder from the map once it has fired.
      scheduledReminders.delete(task.id);
    }, delay);

    // Store the timeout ID so we can cancel it later if needed.
    scheduledReminders.set(task.id, timeoutId);
  }
};

/**
 * Cancels an existing reminder for a given task ID.
 * @param {string} taskId - The ID of the task whose reminder should be cancelled.
 */
const cancelReminder = (taskId: string): void => {
  if (scheduledReminders.has(taskId)) {
    const timeoutId = scheduledReminders.get(taskId);
    clearTimeout(timeoutId);
    scheduledReminders.delete(taskId);
  }
};

/**
 * Updates all reminders based on the current list of tasks.
 * This function first clears all existing reminders and then schedules new ones.
 * This is a robust way to ensure reminders are always in sync with the task state.
 * @param {Task[]} tasks - The complete list of current tasks.
 */
export const updateAllReminders = (tasks: Task[]): void => {
  // First, clear all previously scheduled reminders.
  for (const timeoutId of scheduledReminders.values()) {
    clearTimeout(timeoutId);
  }
  scheduledReminders.clear();

  // Then, iterate through all tasks and schedule new reminders.
  for (const task of tasks) {
    scheduleReminder(task);
  }
};
