import redisClient from "../config/redis.js";
import Repository from "../models/Repository.js";

export const getJobStatus = async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the job status from Redis
        const jobDataString = await redisClient.get(`job:${id}`);

        if (!jobDataString) {
            return res.status(404).json({ error: "Job not found or expired." });
        }

        const jobData = JSON.parse(jobDataString);
        console.log("Job Status: ", jobData);
        
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

        res.status(200).json({
            jobId: id,
            ...jobData
        });

    } catch (error) {
        console.error("Error fetching job status:", error);
        res.status(500).json({ error: "Failed to fetch job status." });
    }
};
