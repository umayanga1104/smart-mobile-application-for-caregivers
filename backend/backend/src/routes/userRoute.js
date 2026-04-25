import { Router } from "express";
import userService from "../services/userService.js";

export const userRouter = Router();

userRouter.get("/verify", userService.verify)
userRouter.post("/register", userService.register)
userRouter.put("/profile-picture", userService.updateProfilePicture)
userRouter.delete("/profile-picture", userService.removeProfilePicture)