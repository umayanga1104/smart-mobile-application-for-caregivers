import * as Notifications from "expo-notifications";

//Calculate Next Occurrence
export function calculateNextOccurrence(reminderTime, repeatType) {

    const next = new Date(reminderTime);

    switch (repeatType) {
        case "daily":
        next.setDate(next.getDate() + 1);
        break;

        case "weekly":
        next.setDate(next.getDate() + 7);
        break;

        case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;

        default:
        return null;
    }

    return next;
}

//Schedule Local Notification
export async function scheduleReminderNotification(reminder) {

    if (reminder.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
            reminder.notificationId
        );
    }

    let triggerDate = new Date(reminder.reminderTime);
    const now = new Date();

    // ✅ FIX: For recurring reminders, calculate next occurrence if in the past
    if (triggerDate <= now) {
        if (reminder.repeatType && reminder.repeatType !== "none") {
            console.warn(`⚠️ Recurring reminder "${reminder.title}" is in the past. Calculating next occurrence...`);
            const nextOccurrence = calculateNextOccurrence(
                reminder.reminderTime,
                reminder.repeatType
            );
            triggerDate = nextOccurrence;
            console.log(`✅ Next occurrence calculated for "${reminder.title}": ${triggerDate}`);
        } else {
            // For one-time reminders in the past, don't schedule
            console.warn(`⚠️ One-time reminder "${reminder.title}" is in the past. Skipping scheduling.`);
            return null;
        }
    }

    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: reminder.title || "Reminder",
                body: reminder.description || "You have a reminder",
                sound: true,
                priority: "high",
            },
            trigger: {
                type: "date",
                date: triggerDate,
                channelId: "default"
            },
        });

        console.log(`✅ Scheduled notification: ${notificationId} for ${triggerDate}`);
        return notificationId;

    } catch (error) {
        console.error(`❌ Failed to schedule notification:`, error);
        // Retry with a fallback date 10 seconds in future
        try {
            const fallbackDate = new Date(now.getTime() + 10000);
            const fallbackId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: reminder.title || "Reminder",
                    body: reminder.description || "You have a reminder",
                    sound: true,
                    priority: "high",
                },
                trigger: {
                    type: "date",
                    date: fallbackDate,
                    channelId: "default"
                },
            });
            console.warn(`⚠️ Scheduled notification with fallback date: ${fallbackId}`);
            return fallbackId;
        } catch (retryError) {
            console.error(`❌ Retry failed for notification:`, retryError);
            throw retryError;
        }
    }
}

//Cancel Notification
export async function cancelReminderNotification(notificationId) {

    if (!notificationId) return;

    await Notifications.cancelScheduledNotificationAsync(notificationId);
}

//Sync All Reminders
export async function syncReminderNotifications(reminders) {
    if (!Array.isArray(reminders) || reminders.length === 0) {
        console.log('📭 No reminders to sync');
        return;
    }

    try {
        console.log(`🔄 Syncing ${reminders.length} reminders...`);
        
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        console.log(`🗑️ Cancelling ${scheduled.length} existing scheduled notifications`);

        for (const notification of scheduled) {
            try {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            } catch (cancelError) {
                console.error(`❌ Failed to cancel notification ${notification.identifier}:`, cancelError);
            }
        }

        console.log('📅 Scheduling new notifications...');
        for (const reminder of reminders) {
            try {
                // ✅ FIX: Skip completed reminders entirely
                if (reminder.isCompleted) {
                    if (reminder.notificationId) {
                        console.log(`🧹 Completed reminder has stale notificationId: ${reminder.title} (ID: ${reminder.notificationId})`);
                    }
                    console.log(`⏭️ Skipping completed reminder: ${reminder.title}`);
                    continue;
                }

                // ✅ FIX: Skip notified reminders that already have scheduled notifications
                if (reminder.isNotified && reminder.notificationId) {
                    console.log(`⏭️ Skipping already-notified reminder with active notification: ${reminder.title}`);
                    continue;
                }

                // ✅ FIX: Skip one-time reminders that already fired or are notified
                const triggerDate = new Date(reminder.reminderTime);
                const now = new Date();
                
                if ((reminder.repeatType === "none" || !reminder.repeatType)) {
                    if (triggerDate <= now) {
                        console.log(`⏭️ Skipping one-time reminder that already fired: ${reminder.title}`);
                        continue;
                    }
                    if (reminder.isNotified) {
                        console.log(`⏭️ Skipping one-time notified reminder: ${reminder.title}`);
                        continue;
                    }
                }
                
                const notificationId = await scheduleReminderNotification(reminder);
                if (notificationId) {
                    console.log(`✅ Scheduled ${reminder.title} with ID: ${notificationId}`);
                } else {
                    console.warn(`⚠️ Failed to schedule ${reminder.title}, will retry on next sync`);
                }
            } catch (scheduleError) {
                console.error(`❌ Failed to schedule reminder ${reminder.title}:`, scheduleError);
            }
        }

        console.log('✅ Reminder sync completed');
    } catch (error) {
        console.error('❌ Sync reminders error:', error);
    }
}

//Handle Recurring Notifications
export async function handleRecurringReminder(reminder) {

    if (reminder.repeatType === "none") return null;

    const nextTime = calculateNextOccurrence(
        reminder.reminderTime,
        reminder.repeatType
    );

    return nextTime;
}