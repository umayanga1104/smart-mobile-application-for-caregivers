import { Router } from "express";
import reminderService from "../services/reminderService.js";

export const reminderRouter = Router();

reminderRouter.post("/", reminderService.addReminder)
reminderRouter.delete("/:reminderId", reminderService.deleteReminder)
reminderRouter.put("/:reminderId", reminderService.updateReminder)
reminderRouter.get("/", reminderService.getAllReminders)
reminderRouter.patch("/:reminderId/complete", reminderService.completeReminder)