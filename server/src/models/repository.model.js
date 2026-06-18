import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    lastIngestedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Repository = mongoose.model('Repository', repositorySchema);