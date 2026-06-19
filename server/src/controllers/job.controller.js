import redisClient from "../config/redis.js";
import {Repository} from "../models/repository.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getJobStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Fetch the job status from Redis
    const jobDataString = await redisClient.get(`job:${id}`);

    if (!jobDataString) {
        throw new ApiError(404, "Job not found or expired.");
    }

    const jobData = JSON.parse(jobDataString);
    
    // SYNC REDIS TO MONGODB: 
    // If Python tells Redis it's done, Node.js tells MongoDB it's done.
    if (jobData.status === 'completed' && jobData.url) {
        await Repository.findOneAndUpdate(
            { url: jobData.url },
            { status: 'completed' }
        );
    } else if (jobData.status === 'failed' && jobData.url) {
        await Repository.findOneAndUpdate(
            { url: jobData.url },
            { status: 'failed' }
        );
    }

    return res.status(200).json(new ApiResponse(200, { jobId: id, ...jobData }, "Job status fetched successfully"));
});
