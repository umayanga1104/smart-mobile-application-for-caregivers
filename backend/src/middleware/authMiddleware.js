import admin from "../config/firebaseAdmin.js";

//Verify firebase token
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = decodedToken; // contains uid, email
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default protect;