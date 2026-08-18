import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate as any, notificationController.getNotifications);
router.patch("/:id/read", authenticate as any, notificationController.markAsRead);
router.patch("/read-all", authenticate as any, notificationController.markAllAsRead);

export default router;
