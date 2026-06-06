import {ChatMessage} from "../models/chatMessage.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getChatHistory = asyncHandler(async (req, res) => {
    const { githubUrl } = req.query;

    if (!githubUrl) {
        throw new ApiError(400, "Please provide a githubUrl query parameter.");
    }

    // Fetch all messages for this user and repository, sorted by oldest to newest
    const messages = await ChatMessage.find({ 
        repositoryUrl: githubUrl,
        userId: req.user._id
    }).sort({ createdAt: 1 });
    
    // Format them the way the React frontend expects
    const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    return res.status(200).json(new ApiResponse(200, { history: formattedMessages }, "Chat history fetched successfully"));
});
