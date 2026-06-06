import {ChatMessage} from "../models/chatMessage.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const chatWithCodebase = asyncHandler(async (req, res) => {
    const { githubUrl, question } = req.body;

    if (!githubUrl || !question) {
        throw new ApiError(400, "Please provide both a GitHub URL and a question.");
    }

    try {
        // SAVE USER MESSAGE TO MONGODB
        await ChatMessage.create({
            userId: req.user._id,
            repositoryUrl: githubUrl,
            role: 'user',
            content: question
        });

        // FETCH HISTORY FOR AI CONTEXT
        const rawHistory = await ChatMessage.find({ 
            repositoryUrl: githubUrl,
            userId: req.user._id
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
            
        const history = rawHistory.reverse().map(msg => ({ role: msg.role, content: msg.content }));

        // SET HEADERS FOR SERVER-SENT EVENTS (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Forward to Python's Streaming Endpoint
        const pythonUrl = process.env.PYTHON_WORKER_URL || "http://127.0.0.1:8000";
        const pythonResponse = await fetch(`${pythonUrl}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ githubUrl, question, history })
        });

        if (!pythonResponse.ok) {
            res.write(`data: [ERROR] Failed to connect to AI\n\n`);
            return res.end();
        }

        let fullAnswer = "";

        // Read the stream chunk by chunk from Python
        for await (const chunk of pythonResponse.body) {
            const textChunk = Buffer.from(chunk).toString('utf-8');
            fullAnswer += textChunk;
            // Write it immediately to the React frontend
            res.write(textChunk);
        }

        // When Python is done streaming, save the full captured answer to MongoDB
        await ChatMessage.create({
            userId: req.user._id,
            repositoryUrl: githubUrl,
            role: 'assistant',
            content: fullAnswer
        });

        // Close the connection
        res.end();

    } catch (error) {
        console.error("Error communicating with Python Streaming API:", error);
        res.write(`data: [ERROR] Failed to generate AI response.\n\n`);
        res.end();
    }
});
