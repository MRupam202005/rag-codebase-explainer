import Repository from "../models/Repository.js";

export const getRecentRepositories = async (req, res) => {
    try {
        // Fetch up to 10 successfully ingested repositories
        const repositories = await Repository.find({ status: 'completed' })
            .sort({ lastIngestedAt: -1 })
            .limit(10)
            .lean();
            
        res.status(200).json({ repositories });
    } catch (error) {
        console.error("Error fetching recent repositories:", error);
        res.status(500).json({ error: "Failed to fetch recent repositories." });
    }
};
