import express from "express";
import { ingestRepository } from "../controllers/ingest.controller.js";
import { getJobStatus } from "../controllers/job.controller.js";
import { getRecentRepositories } from "../controllers/repository.controller.js";
import { chatWithCodebase } from "../controllers/chat.controller.js";
import { getChatHistory } from "../controllers/chatHistory.controller.js";
import { registerUser, loginUser, verifyEmail, logoutUser, refreshAccessToken, resendVerificationEmail } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

// Auth Routes
router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.get("/auth/verify/:token", verifyEmail);
router.post("/auth/resend-verification", resendVerificationEmail);
router.post("/auth/logout", verifyJWT, logoutUser);
router.post("/refresh-access-token", refreshAccessToken);

// Protected Routes
router.post("/ingest-repository", verifyJWT, ingestRepository);
router.get("/job/:id", verifyJWT, getJobStatus);
router.get("/repositories", verifyJWT, getRecentRepositories);
router.post("/chat", verifyJWT, chatWithCodebase);
router.get("/chat/history", verifyJWT, getChatHistory);

export default router;
