import { v4 as uuidv4 } from "uuid";
import redisClient from "../config/redis.js";
import Repository from "../models/Repository.js";

export const ingestRepository = async (req, res) => {
    const { githubUrl } = req.body;

    // 1. Basic validation
    if (!githubUrl || !githubUrl.includes("github.com")) {
        return res.status(400).json({ error: "Please provide a valid GitHub URL." });
    }

    try {
        // 2. Check the Idempotency Cache (Now using MongoDB as the Source of Truth!)
        let repo = await Repository.findOne({ url: githubUrl });
        const jobId = uuidv4();
        
        console.log("Job ID: ", jobId);
        console.log("Github URL: ", githubUrl);

        if (repo && repo.status === 'completed') {
            console.log(`[CACHE HIT] ${githubUrl} is already processed in MongoDB! Bypassing Python Worker.`);
            // Fake a completed job instantly!
            await redisClient.set(
                `job:${jobId}`, 
                JSON.stringify({ status: "completed", url: githubUrl }),
                { EX: 86400 } 
            );

            return res.status(202).json({
                message: "Repository already cached.",
                jobId: jobId,
                status: "completed"
            });
        }

        // 3. Create a status key in Redis that expires in 24 hours (86400 seconds)
        // This allows the frontend to poll the status of this specific job.
        await redisClient.set(
            `job:${jobId}`, 
            JSON.stringify({ status: "processing", url: githubUrl }),
            { EX: 86400 } 
        );

        // 4. Push this Job to the Redis Queue for the Python Worker!
        await redisClient.lPush("ingest_queue", JSON.stringify({ jobId, githubUrl }));

        // 5. Save to MongoDB so we know it is 'processing'
        if (!repo) {
            await Repository.create({ url: githubUrl, status: 'processing' });
        } else {
            // If it failed before and they are retrying
            repo.status = 'processing';
            await repo.save();
        }

        // 6. Immediately return a success response with the Job ID
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
