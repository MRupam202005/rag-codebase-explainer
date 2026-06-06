import ChatMessage from "../models/ChatMessage.js";

export const chatWithCodebase = async (req, res) => {
    const { githubUrl, question } = req.body;

    if (!githubUrl || !question) {
        return res.status(400).json({ error: "Please provide both a GitHub URL and a question." });
    }

    try {
        // SAVE USER MESSAGE TO MONGODB
        await ChatMessage.create({
            repositoryUrl: githubUrl,
            role: 'user',
            content: question
        });

        // We act as the API Gateway! Forward the request to our internal Python FastAPI server.
        // We use the built-in fetch API (available in modern Node.js).
        const pythonResponse = await fetch("http://127.0.0.1:8000/chat", {    // why it is "http://127.0.0.1:8000/chat"? ans: because we are using FastAPI server at port 8000 and the chat endpoint is /chat
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ githubUrl, question })
        });

        if (!pythonResponse.ok) {
            const errorText = await pythonResponse.text();
            throw new Error(`Python API responded with status: ${pythonResponse.status}. ${errorText}`);
        }

        const data = await pythonResponse.json();
        
        // SAVE AI RESPONSE TO MONGODB
        await ChatMessage.create({
            repositoryUrl: githubUrl,
            role: 'assistant',
            content: data.answer
        });

        // Send the answer back to the React frontend
        res.status(200).json(data);

    } catch (error) {
        console.error("Error communicating with Python Chat API:", error);
        res.status(500).json({ error: "Failed to generate AI response." });
    }
};
