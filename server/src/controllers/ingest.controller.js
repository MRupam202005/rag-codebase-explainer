import { v4 as uuidv4 } from "uuid";
import redisClient from "../config/redis.js";
import {Repository} from "../models/repository.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const ingestRepository = asyncHandler(async (req, res) => {
    const { githubUrl } = req.body;

    // 1. Basic validation
    if (!githubUrl || !githubUrl.includes("github.com")) {
        throw new ApiError(400, "Please provide a valid GitHub URL.");
    }

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

        return res.status(202).json(new ApiResponse(202, { jobId, status: "completed" }, "Repository already cached."));
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
    return res.status(202).json(new ApiResponse(202, { jobId, status: "processing" }, "Repository submitted for processing."));
});
