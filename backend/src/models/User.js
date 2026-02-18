import { model, Schema } from "mongoose";

const userSchema = new Schema(
    {
        firebaseUID: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        username: {type: String, required: true},
        role: { type: String, default: "caregiver" },
    },
    { timestamps: true }
);

export default model("User", userSchema);