import { v4 as uuidv4 } from "uuid";
import redisClient from "../config/redis.js";

export const ingestRepository = async (req, res) => {
    const { githubUrl } = req.body;

    // 1. Basic validation
    if (!githubUrl || !githubUrl.includes("github.com")) {
        return res.status(400).json({ error: "Please provide a valid GitHub URL." });
    }

    try {
        // 2. Generate a unique Job ID for tracking this task
        const jobId = uuidv4();

        console.log("Job ID: ", jobId);
        console.log("Github URL: ", githubUrl);

        // 3. Create a status key in Redis that expires in 24 hours (86400 seconds)
        // This allows the frontend to poll the status of this specific job.
        await redisClient.set(
            `job:${jobId}`, 
            JSON.stringify({ status: "processing", url: githubUrl }),
            { EX: 86400 } 
        );

        // 4. Push this Job to the Redis Queue for the Python Worker!
        await redisClient.lPush("ingest_queue", JSON.stringify({ jobId, githubUrl }));

        // 5. Immediately return a success response with the Job ID
        res.status(202).json({
            message: "Repository submitted for processing.",
            jobId: jobId,
            status: "processing"
        });

    } catch (error) {
        console.error("Error submitting ingest job:", error);
        res.status(500).json({ error: "Failed to submit repository for ingestion." });
    }
};
