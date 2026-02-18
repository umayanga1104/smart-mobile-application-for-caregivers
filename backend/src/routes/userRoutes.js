import express from "express";
import { loginUser, registerUser } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", protect, loginUser);
router.post("/register", protect, registerUser)

export default router;