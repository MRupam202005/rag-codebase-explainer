import ChatMessage from "../models/ChatMessage.js";

export const getChatHistory = async (req, res) => {
    const { githubUrl } = req.query;

    if (!githubUrl) {
        return res.status(400).json({ error: "Please provide a githubUrl query parameter." });
    }

    try {
        // Fetch all messages for this repository, sorted by oldest to newest
        const messages = await ChatMessage.find({ repositoryUrl: githubUrl }).sort({ createdAt: 1 });
        
        // Format them the way the React frontend expects
        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        res.status(200).json({ history: formattedMessages });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history." });
    }
};
