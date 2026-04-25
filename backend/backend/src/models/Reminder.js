import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({

    firebaseUID: {
        type: String,
        required: true,
        index: true
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    reminderTime: {
        type: Date,
        required: true,
        index: true
    },

    repeatType: {
        type: String,
        enum: ["none","daily","weekly","monthly"],
        default: "none"
    },

    isCompleted: {
        type: Boolean,
        default: false
    },

    isNotified: {
        type: Boolean,
        default: false
    },

    //for local notification scheduling purposes
    notificationId: {
        type: String,
        default: null
    }

}, { timestamps: true });

reminderSchema.index({ reminderTime: 1, isNotified: 1 });

export const Reminder = mongoose.model('Reminder', reminderSchema);