import {Repository} from "../models/repository.model.js";
import {UserRepo} from "../models/userRepo.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getRecentRepositories = asyncHandler(async (req, res) => {
    // 1. Fetch UserRepo mappings for this user
    const userRepos = await UserRepo.find({ user: req.user._id })
        .sort({ ingestedAt: -1 })
        .populate('repository')
        .limit(10)
        .lean();
        
    // 2. Extract the actual repository objects and filter out any that aren't completed
    const repositories = userRepos
        .map(ur => ur.repository)
        .filter(repo => repo && repo.status === 'completed');

    return res.status(200).json(new ApiResponse(200, { repositories }, "Recent repositories fetched successfully"));
});
