import { v4 as uuidv4 } from "uuid";
import redisClient from "../config/redis.js";
import {Repository} from "../models/repository.model.js";
import {UserRepo} from "../models/userRepo.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const ingestRepository = asyncHandler(async (req, res) => {
    const { githubUrl } = req.body;
    const userId = req.user._id;

    // 1. Basic validation
    if (!githubUrl || !githubUrl.includes("github.com")) {
        throw new ApiError(400, "Please provide a valid GitHub URL.");
    }

    // 2. Check the Idempotency Cache (Now using MongoDB as the Source of Truth!)
    let repo = await Repository.findOne({ url: githubUrl });
    const jobId = uuidv4();

    // 2.5 Check Repository Quota limit
    const existingUserRepo = repo ? await UserRepo.findOne({ user: userId, repository: repo._id }) : null;
    if (!existingUserRepo) {
        const repoCount = await UserRepo.countDocuments({ user: userId });
        const MAX_REPOS_PER_USER = process.env.MAX_REPOS_PER_USER || 3;
        if (repoCount >= MAX_REPOS_PER_USER) {
            throw new ApiError(403, `You have reached the maximum limit of ${MAX_REPOS_PER_USER} repositories.`);
        }
    }

    // 3. Save to MongoDB so we know it is 'processing'
    if (!repo) {
        repo = await Repository.create({ url: githubUrl, status: 'processing' });
    } else if (repo.status === 'failed') {
        // If it failed before and they are retrying
        repo.status = 'processing';
        await repo.save();
    }

    // 4. Link the user to this repository
    if (!existingUserRepo) {
        await UserRepo.create({ user: userId, repository: repo._id });
    }

    if (repo.status === 'completed') {
        console.log(`[CACHE HIT] ${githubUrl} is already processed in MongoDB! Bypassing Python Worker.`);
        // Fake a completed job instantly!
        await redisClient.set(
            `job:${jobId}`, 
            JSON.stringify({ status: "completed", url: githubUrl }),
            { EX: 86400 } 
        );

        return res.status(202).json(new ApiResponse(202, { jobId, status: "completed" }, "Repository already cached."));
    }

    // 5. Create a status key in Redis that expires in 24 hours (86400 seconds)
    // This allows the frontend to poll the status of this specific job.
    await redisClient.set(
        `job:${jobId}`, 
        JSON.stringify({ status: "processing", url: githubUrl }),
        { EX: 86400 } 
    );

    // 6. Push this Job to the Redis Queue for the Python Worker!
    await redisClient.rPush("ingest_queue", JSON.stringify({ jobId, githubUrl }));

    // 7. Immediately return a success response with the Job ID
    return res.status(202).json(new ApiResponse(202, { jobId, status: "processing" }, "Repository submitted for processing."));
});
