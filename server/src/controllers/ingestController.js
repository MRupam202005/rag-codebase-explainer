import { v4 as uuidv4 } from "uuid";

// We will import our Redis client here later!

export const ingestRepository = async (req, res) => {
    const { githubUrl } = req.body;

    // 1. Basic validation
    if (!githubUrl || !githubUrl.includes("github.com")) {
        return res.status(400).json({ error: "Please provide a valid GitHub URL." });
    }

    try {
        // 2. Generate a unique Job ID for tracking this task
        const jobId = uuidv4();

        console.log("Job ID: ", jobId);
        console.log("Github URL: ", githubUrl);

        // 3. TODO : Push this Job to the Redis Queue for the Python Worker!
        // await redis.lPush("ingest_queue", JSON.stringify({ jobId, githubUrl }));

        // 4. Immediately return a success response with the Job ID
        res.status(202).json({
            message: "Repository submitted for processing.",
            jobId: jobId,
            status: "pending"
        });

    } catch (error) {
        console.error("Error submitting ingest job:", error);
        res.status(500).json({ error: "Failed to submit repository for ingestion." });
    }
};
