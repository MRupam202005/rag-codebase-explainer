import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";
import { connectRedis } from "./config/redis.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount our API routes under the /api prefix
app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "API Gateway is running" });
});

// Connect to DBs, then start the server
const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();

