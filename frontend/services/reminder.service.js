import { api } from "../config/axios";
import { cancelReminderNotification, scheduleReminderNotification } from "../utils/reminderScheduler";

export const addReminder = async(title, description, reminderTime, repeatType) => {
    try {
        const response = await api.post("/reminders", {
            title,
            description,
            reminderTime: reminderTime.toISOString(),
            repeatType
        });

        const reminder = response.data;

        try {
            const notificationId = await scheduleReminderNotification({
                ...reminder,
                reminderTime: new Date(reminder.reminderTime)
            });

            await updateReminder(reminder._id, {
                notificationId
            });

            return reminder;

        } catch (notificationError) {
            console.error(`❌ Reminder created but notification failed:`, notificationError);
            // Still return the reminder even if notification fails
            return reminder;
        }

    } catch(error) {
        console.error(`❌ Failed to add reminder:`, error.message);
        throw error;
    }
}

export const deleteReminder = async(reminderId, notificationId) => {
    try {
        await cancelReminderNotification(notificationId); // 🔥 important

        const response = await api.delete(`/reminders/${reminderId}`);
        return response.data;
    }catch(error) {
        console.error(`❌ Failed to delete reminder:`, error.message);
        throw error;
    }
}

export const updateReminder = async(reminderId, data) => {
    try {
        const response = await api.put(`/reminders/${reminderId}`, data);
        return response.data;
    } catch(error) {
        console.error(`❌ Failed to update reminder:`, error.message);
        throw error;
    }
}

export const getAllReminders = async() => {
    try {
        const response = await api.get("/reminders");
        return response.data || [];
    }catch(error) {
        if (error.response?.status === 401) {
            console.warn(`⏳ User not yet authenticated (401), reminders will load after auth`);
            return [];
        }
        console.error(`❌ Failed to fetch reminders:`, error.message);
        return [];
    }
}

