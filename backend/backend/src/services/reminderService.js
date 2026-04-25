import { Reminder } from "../models/Reminder.js";

const reminderService = {
    addReminder: async(req, res) => {
        try {
            const uid = req.firebaseUser.uid;
            const {title, description, reminderTime, repeatType} = req.body;

            console.log(`➕ Adding reminder for user ${uid}: ${title}`);

            if(!title || !reminderTime) {
                console.warn('❌ Missing title or reminderTime');
                return res.status(400).json({
                    message: "Title and reminder time required"
                })
            }else if(new Date(reminderTime) < new Date()) {
                console.warn('❌ Reminder time is in the past');
                return res.status(400).json({
                    message: "Reminder cannot be in the past"
                });
            }

            const newReminder = new Reminder({
                firebaseUID: uid,
                title: title,
                description: description,
                reminderTime: reminderTime,
                repeatType: repeatType,
            });

            await newReminder.save();
            console.log(`✅ Reminder created with ID: ${newReminder._id}`);

            res.status(201).json(newReminder)
        }catch(error) {
            console.error("❌ Server error", error.message);
            res.status(500).json({error: "Server error"})
        }
    },

    deleteReminder: async(req, res) => {
        try {
            const uid = req.firebaseUser.uid;
            const {reminderId} = req.params;

            if (!reminderId) {
                return res.status(400).json({
                    message: "Invalid reminder ID"
                });
            }

            const result = await Reminder.deleteOne({
                _id: reminderId,
                firebaseUID: uid,
            });

            if(result.deletedCount === 0) {
                return res.status(404).json({
                    message: "Reminder not found"
                });
            }

            res.status(200).json({
                code: "SUCCESS",
                message: "Reminder deleted successfully"
            });
        }catch(error) {
            res.status(500).json({error: "Server error"});
            console.log("Server error", error.message);
        }
    },

    updateReminder: async(req, res) => {
        try {
            console.log("📝 UPDATE ID:", req.params.reminderId);
            console.log("📝 Update data:", req.body);

            const uid = req.firebaseUser.uid;
            const { reminderId } = req.params;
            const updateData = req.body;

            if (!reminderId) {
                return res.status(400).json({
                    message: "Invalid reminder ID"
                });
            }

            const updatedReminder = await Reminder.findOneAndUpdate(
                { _id: reminderId, firebaseUID: uid },
                updateData,
                { new: true }
            );

            if (!updatedReminder) {
                console.warn(`⚠️ Reminder not found for ID: ${reminderId}`);
                return res.status(404).json({
                    message: "Reminder not found"
                });
            }

            console.log(`✅ Reminder ${reminderId} updated successfully`);
            console.log(`📋 Updated reminder state:`, {
                isCompleted: updatedReminder.isCompleted,
                isNotified: updatedReminder.isNotified,
                reminderTime: updatedReminder.reminderTime
            });

            res.status(200).json({
                code: "SUCCESS",
                message: "Reminder updated successfully",
                reminder: updatedReminder
            });
        }catch(error) {
            console.error("❌ Server error:", error.message);
            res.status(500).json({error: "Server error"});
        }
    },

    getAllReminders: async(req, res) => {
        try{
            const uid = req.firebaseUser.uid;
            console.log(`📋 Fetching reminders for user: ${uid}`);

            const reminders = await Reminder.find({
                firebaseUID: uid
            });

            console.log(`✅ Found ${reminders.length} reminders for user ${uid}`);
            if (reminders.length > 0) {
                console.log('📋 Reminders:', reminders.map(r => ({
                    _id: r._id,
                    title: r.title,
                    reminderTime: r.reminderTime,
                    notificationId: r.notificationId,
                    isCompleted: r.isCompleted
                })));
            }

            res.status(200).json(reminders);

        }catch(error){
            console.error(`❌ Error fetching reminders: ${error.message}`);
            res.status(500).json({
                error: "Server error"
            });
        }
    },

    completeReminder: async (req, res) => {
        try {
            const uid = req.firebaseUser.uid;
            const { reminderId } = req.params;

            if (!reminderId) {
                return res.status(400).json({
                    message: "Invalid reminder ID"
                });
            }

            const result = await Reminder.updateOne(
                { _id: reminderId, firebaseUID: uid },
                { isCompleted: true }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    message: "Reminder not found"
                });
            }

            res.status(200).json({
                code: "SUCCESS",
                message: "Reminder marked as completed"
            });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
            console.log("Server error", error.message);
        }
    }
}

export default reminderService;