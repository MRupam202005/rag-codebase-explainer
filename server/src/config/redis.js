import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis gracefully!");
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
    }
};

export default redisClient;
