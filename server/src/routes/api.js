import express from "express";
import { ingestRepository } from "../controllers/ingestController.js";

const router = express.Router();

router.post("/ingest-repository", ingestRepository);

export default router;
