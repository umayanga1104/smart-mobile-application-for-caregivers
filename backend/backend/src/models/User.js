// models/User.js
import mongoose from 'mongoose'
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firebaseUID: {
        type: String,
        unique: true // ensures unique Firebase uid
    },
    username: {
        type: String,
        required: true // built-in validation
    },
    email: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: null,
    },
}, {
    timestamps: true // automatically adds createdAt and updatedAt fields
});

export const User = mongoose.model('User', userSchema);
