import dns from "dns";
import mongoose from "mongoose";

const DB_NAME="rag-codebase-explainer";
const connectDB = async ()=>{
    try {
        // Workaround for Node.js/Windows DNS c-ares querySrv ECONNREFUSED regression (runs only on Windows)
        if (process.platform === 'win32') {
            dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]);
        }

        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME, family: 4 });
        console.log(`🌱 [MongoDB connected] : [HOST: ${connectionInstance.connection.host}] : [DB: ${connectionInstance.connection.name}]`);    
    } catch (error) {
        console.log(`❌ [Error connecting to MongoDB] ${error}`);
        process.exit(1);
    }
}

export default connectDB;