const mongoose = require('mongoose');

/**
 * MoodEntry Schema for storing mood analysis results
 * Comprehensive schema to track user emotions over time
 */
const MoodEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Primary mood analysis results
    primaryEmotion: {
        type: String,
        required: true,
        enum: ['peaceful', 'grateful', 'anxious', 'sad', 'joyful', 'spiritual', 'angry', 'hopeful', 'neutral'],
        index: true
    },
    
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    
    intensity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
    },
    
    // Detailed emotion breakdown
    emotions: {
        type: Map,
        of: Number,
        default: new Map()
    },
    
    // Analysis metadata
    analysisType: {
        type: String,
        required: true,
        enum: ['text', 'voice', 'image', 'combined']
    },
    
    // Input data information (without storing actual content for privacy)
    inputData: {
        type: {
            type: String,
            required: true
        },
        hasText: {
            type: Boolean,
            default: false
        },
        hasAudio: {
            type: Boolean,
            default: false
        },
        hasImage: {
            type: Boolean,
            default: false
        },
        textLength: {
            type: Number,
            default: 0
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    
    // Spiritual context
    spiritualContext: {
        isSpiritual: {
            type: Boolean,
            default: false
        },
        score: {
            type: Number,
            default: 0
        },
        detectedTerms: {
            spiritual: [String],
            religious: [String],
            practices: [String]
        },
        suggestedTradition: {
            type: String,
            default: null
        }
    },
    
    // Generated insights
    insights: [{
        type: {
            type: String,
            enum: ['confidence', 'uncertainty', 'trend', 'spiritual', 'temporal', 'pattern']
        },
        message: String,
        icon: String,
        relevance: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        }
    }],
    
    // Personalized suggestions
    suggestions: [{
        type: {
            type: String,
            enum: ['spiritual', 'breathing', 'prayer', 'gratitude', 'connection', 'sharing', 'meditation', 'study', 'tasbih']
        },
        title: String,
        description: String,
        action: String,
        icon: String,
        priority: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        }
    }],
    
    // User context at time of analysis
    userContext: {
        spiritualBackground: String,
        emotionalPatterns: {
            dominantEmotions: [String],
            recentTrend: {
                type: String,
                enum: ['improving', 'declining', 'stable']
            },
            totalAnalyses: {
                type: Number,
                default: 0
            }
        },
        analysisHistory: {
            type: Number,
            default: 0
        }
    },
    
    // Personalized guidance
    personalizedGuidance: {
        general: String,
        specific: String,
        practices: [String],
        tradition: String
    },
    
    // User feedback on analysis accuracy (optional)
    userFeedback: {
        accuracyRating: {
            type: Number,
            min: 1,
            max: 5
        },
        helpfulnessRating: {
            type: Number,
            min: 1,
            max: 5
        },
        comments: String,
        submittedAt: Date
    },
    
    // Technical metadata
    metadata: {
        processingTime: {
            type: Number,
            default: 0
        },
        cacheUsed: {
            type: Boolean,
            default: false
        },
        modelVersion: {
            type: String,
            default: '1.0'
        },
        apiVersion: {
            type: String,
            default: '2.0'
        },
        userAgent: String,
        ipAddress: String,
        location: {
            country: String,
            timezone: String
        }
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Soft delete flag
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'mood_entries'
});

// Indexes for efficient queries
MoodEntrySchema.index({ userId: 1, createdAt: -1 });
MoodEntrySchema.index({ userId: 1, primaryEmotion: 1 });
MoodEntrySchema.index({ userId: 1, 'spiritualContext.isSpiritual': 1 });
MoodEntrySchema.index({ createdAt: -1, isActive: 1 });
MoodEntrySchema.index({ userId: 1, analysisType: 1, createdAt: -1 });

// Compound index for analytics queries
MoodEntrySchema.index({ 
    userId: 1, 
    createdAt: -1, 
    primaryEmotion: 1, 
    isActive: 1 
});

// Text index for searching insights and suggestions
MoodEntrySchema.index({
    'insights.message': 'text',
    'suggestions.description': 'text',
    'personalizedGuidance.general': 'text'
});

// Virtual for emotion category
MoodEntrySchema.virtual('emotionCategory').get(function() {
    const positiveEmotions = ['peaceful', 'grateful', 'joyful', 'spiritual', 'hopeful'];
    const negativeEmotions = ['anxious', 'sad', 'angry'];
    
    if (positiveEmotions.includes(this.primaryEmotion)) {
        return 'positive';
    } else if (negativeEmotions.includes(this.primaryEmotion)) {
        return 'negative';
    } else {
        return 'neutral';
    }
});

// Virtual for days since entry
MoodEntrySchema.virtual('daysSinceEntry').get(function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.createdAt);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update timestamps
MoodEntrySchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});

// Static methods for analytics
MoodEntrySchema.statics.getEmotionDistribution = async function(userId, timeframe = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);
    
    return this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: '$primaryEmotion',
                count: { $sum: 1 },
                avgConfidence: { $avg: '$confidence' },
                avgIntensity: { $avg: { $cond: [
                    { $eq: ['$intensity', 'high'] }, 3,
                    { $cond: [{ $eq: ['$intensity', 'medium'] }, 2, 1] }
                ]}}
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

MoodEntrySchema.statics.getMoodTrend = async function(userId, days = 14) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                },
                emotions: { $push: '$primaryEmotion' },
                avgConfidence: { $avg: '$confidence' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.date': 1 }
        }
    ]);
};

MoodEntrySchema.statics.getSpiritualInsights = async function(userId, timeframe = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);
    
    return this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate },
                'spiritualContext.isSpiritual': true,
                isActive: true
            }
        },
        {
            $group: {
                _id: null,
                totalSpiritual: { $sum: 1 },
                avgSpiritualScore: { $avg: '$spiritualContext.score' },
                detectedTraditions: { $addToSet: '$spiritualContext.suggestedTradition' },
                commonPractices: { $push: '$spiritualContext.detectedTerms.practices' }
            }
        }
    ]);
};

// Instance methods
MoodEntrySchema.methods.isPositiveEmotion = function() {
    const positiveEmotions = ['peaceful', 'grateful', 'joyful', 'spiritual', 'hopeful'];
    return positiveEmotions.includes(this.primaryEmotion);
};

MoodEntrySchema.methods.getSpiritualGuidance = function() {
    return this.personalizedGuidance || null;
};

MoodEntrySchema.methods.getRelevantSuggestions = function(limit = 3) {
    return this.suggestions
        .sort((a, b) => (b.priority || 3) - (a.priority || 3))
        .slice(0, limit);
};

// Export the model
module.exports = mongoose.model('MoodEntry', MoodEntrySchema);