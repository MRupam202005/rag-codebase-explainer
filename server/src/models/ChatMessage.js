import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    repositoryUrl: {
        type: String,
        required: true,
        index: true // We will query by this a lot
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { timestamps: true });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
