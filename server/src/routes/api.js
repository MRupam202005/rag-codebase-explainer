import express from "express";
import { ingestRepository } from "../controllers/ingestController.js";
import { getJobStatus } from "../controllers/jobController.js";
import { getRecentRepositories } from "../controllers/repositoryController.js";
import { chatWithCodebase } from "../controllers/chatController.js";
import { getChatHistory } from "../controllers/chatHistoryController.js";

const router = express.Router();

router.post("/ingest-repository", ingestRepository);
router.get("/job/:id", getJobStatus);
router.get("/repositories", getRecentRepositories);
router.post("/chat", chatWithCodebase);
router.get("/chat/history", getChatHistory);

export default router;
