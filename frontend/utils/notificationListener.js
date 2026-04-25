import * as Notifications from "expo-notifications";
import { updateReminder } from "../services/reminder.service";
import { calculateNextOccurrence, scheduleReminderNotification } from "./reminderScheduler";

let notificationListener;
let reminderUpdateCallback = null;

// Set callback to be called when reminder is updated
export function setReminderUpdateCallback(callback) {
    reminderUpdateCallback = callback;
    console.log('✅ Reminder update callback registered');
}

// Remove callback
export function clearReminderUpdateCallback() {
    reminderUpdateCallback = null;
    console.log('✅ Reminder update callback cleared');
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications() {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        console.log(`🗑️ Cancelling ${scheduled.length} scheduled notifications`);
        
        for (const notification of scheduled) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
        
        console.log(`✅ All notifications cancelled`);
    } catch (error) {
        console.error(`❌ Failed to cancel notifications:`, error);
    }
}

// Cleanup notification listener
export function stopNotificationListener() {
    if (notificationListener) {
        notificationListener.remove();
        notificationListener = null;
        console.log(`✅ Notification listener stopped`);
    }
}

export function startNotificationListener(getReminders) {
    // Stop previous listener if one exists
    stopNotificationListener();

    notificationListener = Notifications.addNotificationReceivedListener(async notification => {
        try {
            const notificationId = notification.request.identifier;
            const reminders = getReminders();

            if (!Array.isArray(reminders) || reminders.length === 0) {
                // Silently ignore - reminders may not be loaded yet during startup
                return;
            }

            const reminder = reminders.find(
                r => r.notificationId === notificationId
            );

            if (!reminder) {
                console.warn(`⚠️ No reminder found for notification: ${notificationId}`);
                return;
            }

            console.log(`📬 Notification received for: ${reminder.title}`);
            
            // ✅ FIX: Check both isCompleted AND isNotified to prevent duplicate processing
            if (reminder.isCompleted || reminder.isNotified) {
                console.warn(`⚠️ Ignoring duplicate notification for already-processed reminder: ${reminder.title}`);
                return;
            }
            
            reminder.isNotified = true;

            if (reminder.repeatType === "none") {
                // One-time reminder
                
                console.log(`✅ One-time reminder completed`);
                try {
                    const updateData = {
                        isCompleted: true,
                        isNotified: true,
                        notificationId: null  // ✅ FIX: Clear stale notificationId
                    };
                    await updateReminder(reminder._id, updateData);
                    console.log(`✅ Marked reminder as completed on backend & cleared notificationId`);
                    
                    // Update local state and notify the reminders screen
                    reminder.isCompleted = true;
                    reminder.notificationId = null;  // ✅ Update local state
                    if (reminderUpdateCallback) {
                        console.log(`📢 Calling reminder update callback...`);
                        reminderUpdateCallback(reminder._id);
                    }
                } catch (completeError) {
                    console.error(`❌ Failed to mark reminder as completed:`, completeError);
                }
                return;
            }

            const nextTime = calculateNextOccurrence(
                reminder.reminderTime,
                reminder.repeatType
            );

            try {
                // ✅ FIX: Update both reminderTime AND isNotified for recurring reminders
                await updateReminder(reminder._id, {
                    reminderTime: nextTime.toISOString(),
                    isNotified: true  // Mark as notified for this occurrence
                });

                const newNotificationId = await scheduleReminderNotification({
                    ...reminder,
                    reminderTime: nextTime
                });

                // ✅ FIX: Handle if scheduling returns null with retry logic
                if (newNotificationId) {
                    await updateReminder(reminder._id, {
                        notificationId: newNotificationId
                    });
                    console.log(`✅ Next reminder scheduled for "${reminder.title}": ${nextTime}`);
                } else {
                    console.error(`❌ Critical: Failed to schedule next occurrence for "${reminder.title}". Reminder time updated but NO notification scheduled!`);
                    // Trigger a manual resync to recover
                    if (reminderUpdateCallback) {
                        console.log(`📢 Calling reminder update callback to trigger recovery resync...`);
                        reminderUpdateCallback(reminder._id);
                    }
                }
                
                // Notify the reminders screen
                if (reminderUpdateCallback) {
                    console.log(`📢 Calling reminder update callback for recurring reminder...`);
                    reminderUpdateCallback(reminder._id);
                }

            } catch (scheduleError) {
                console.error(`❌ Failed to schedule next reminder:`, scheduleError);
            }

        } catch (error) {
            console.error(`❌ Notification listener error:`, error);
        }
    });

    console.log(`✅ Notification listener started`);
}