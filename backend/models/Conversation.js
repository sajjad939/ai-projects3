const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: { 
        type: String, 
        enum: ['user', 'assistant', 'system'], 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    metadata: {
        emotion: { type: String },
        confidence: { type: Number },
        inputType: { 
            type: String, 
            enum: ['text', 'voice', 'image'],
            default: 'text'
        }
    }
});

const ConversationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    sessionId: { 
        type: String, 
        required: true,
        unique: true
    },
    title: { 
        type: String,
        default: 'New Conversation'
    },
    messages: [MessageSchema],
    context: {
        spiritualPreferences: {
            religion: { type: String },
            practices: [{ type: String }],
            goals: [{ type: String }]
        },
        emotionalState: {
            currentMood: { type: String },
            moodHistory: [{
                mood: { type: String },
                timestamp: { type: Date, default: Date.now }
            }]
        },
        conversationTone: {
            type: String,
            enum: ['supportive', 'guidance', 'reflective', 'celebratory'],
            default: 'supportive'
        }
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    lastActivity: { 
        type: Date, 
        default: Date.now 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Index for efficient queries
ConversationSchema.index({ userId: 1, lastActivity: -1 });
ConversationSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);