import express from "express";
import { ingestRepository } from "../controllers/ingestController.js";
import { getJobStatus } from "../controllers/jobController.js";

const router = express.Router();

router.post("/ingest-repository", ingestRepository);
router.get("/job/:id", getJobStatus);

export default router;
