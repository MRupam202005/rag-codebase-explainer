import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";
import {connectRedis} from "./config/redis.js";
import connectDB from "./config/db.js";

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Helmet: Secures Express apps by setting HTTP response headers.
// It mitigates common web vulnerabilities like XSS, clickjacking, etc.
app.use(helmet());

// configuring cors (Cross-Origin Resource Sharing)
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// 2. Rate Limiting: Limits repeated requests to public APIs and/or endpoints
// This prevents brute-force attacks and DDoS (Distributed Denial of Service).
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Limit each IP to 500 requests per window
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api", limiter); // apply to API routes only

// configuring express to accept JSON data in requests
app.use(express.json({limit: "16kb"}));

// configuring express to accept URL-encoded data in requests
app.use(express.urlencoded({extended: true}));

// configuring express to serve static files
app.use(express.static("public"));

// configuring express to accept cookies in requests
app.use(cookieParser());

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


app.use((err, req, res, next) => {
    console.log(`[Global Error Handler] ${err.stack || err.message || err}`);
    
    // checking if the error is already an instance of ApiError (defined in utils/ApiError.js)
    const statusCode = err.statusCode || 500;
    // setting the message to be sent to the frontend
    const message = err.message || "Internal Server Error";
    // sending the response to the frontend
    return res.status(statusCode).json({
        success: false, // indicating that an error has occurred
        message: message, // the error message
        errors: err.errors || [] // including errors array if present
    });
});
