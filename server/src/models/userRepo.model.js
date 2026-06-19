import mongoose from 'mongoose';

const userRepoSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    repository: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Repository', 
        required: true 
    },
    ingestedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Ensure a user can only have one link to a specific repo
userRepoSchema.index({ user: 1, repository: 1 }, { unique: true });

export const UserRepo = mongoose.model('UserRepo', userRepoSchema);
