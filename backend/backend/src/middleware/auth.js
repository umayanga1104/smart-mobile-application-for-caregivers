import admin from "../config/firebaseAdmin.js";

export const verifyFirebaseToken = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        const decodedToken = await admin.auth().verifyIdToken(token);

        req.firebaseUser = decodedToken;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }
};