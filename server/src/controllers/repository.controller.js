import {Repository} from "../models/repository.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getRecentRepositories = asyncHandler(async (req, res) => {
    // Fetch up to 10 successfully ingested repositories
    const repositories = await Repository.find({ status: 'completed' })
        .sort({ lastIngestedAt: -1 })
        .limit(10)
        .lean();
        
    return res.status(200).json(new ApiResponse(200, { repositories }, "Recent repositories fetched successfully"));
});
