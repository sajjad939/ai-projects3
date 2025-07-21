const MoodDetectionService = require('../services/MoodDetectionService');
const MoodEntry = require('../models/MoodEntry');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

/**
 * Enhanced Mood Detection Controller
 * Handles all mood analysis endpoints with comprehensive validation and error handling
 */

// Rate limiting for mood analysis
const moodAnalysisRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 analyses per minute per user
    message: {
        success: false,
        error: 'Too many mood analyses. Please wait a moment before analyzing again.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId || req.ip
});

// Premium rate limiting for high-priority requests
const premiumRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 40, // Higher limit for premium users
    keyGenerator: (req) => req.userId || req.ip
});

/**
 * Validation middleware for mood analysis
 */
const validateMoodAnalysis = [
    body('input.type')
        .isIn(['text', 'voice', 'image', 'combined'])
        .withMessage('Invalid input type. Must be text, voice, image, or combined'),
    
    body('input.content')
        .optional()
        .isLength({ max: 5000 })
        .withMessage('Text content too long. Maximum 5000 characters allowed.'),
    
    body('input.context')
        .optional()
        .isObject()
        .withMessage('Context must be an object'),
    
    body('options.includeInsights')
        .optional()
        .isBoolean()
        .withMessage('includeInsights must be a boolean'),
    
    body('options.includeSuggestions')
        .optional()
        .isBoolean()
        .withMessage('includeSuggestions must be a boolean'),
    
    body('options.saveToHistory')
        .optional()
        .isBoolean()
        .withMessage('saveToHistory must be a boolean')
];

/**
 * Validation middleware for history queries
 */
const validateHistoryQuery = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
    
    query('timeframe')
        .optional()
        .isIn(['1d', '7d', '30d', '90d'])
        .withMessage('Invalid timeframe'),
    
    query('emotions')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                const emotions = value.split(',');
                const validEmotions = ['peaceful', 'grateful', 'anxious', 'sad', 'joyful', 'spiritual', 'angry', 'hopeful', 'neutral'];
                return emotions.every(emotion => validEmotions.includes(emotion.trim()));
            }
            return true;
        })
        .withMessage('Invalid emotions filter')
];

/**
 * Validation middleware for feedback submission
 */
const validateFeedback = [
    param('entryId')
        .isMongoId()
        .withMessage('Invalid mood entry ID'),
    
    body('accuracyRating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Accuracy rating must be between 1 and 5'),
    
    body('helpfulnessRating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Helpfulness rating must be between 1 and 5'),
    
    body('comments')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Comments too long. Maximum 1000 characters allowed.')
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

/**
 * Analyze mood from various input types
 */
exports.analyzeMood = [
    // Apply appropriate rate limiting
    (req, res, next) => {
        if (req.user?.isPremium || req.body.options?.priority === 'high') {
            return premiumRateLimit(req, res, next);
        }
        return moodAnalysisRateLimit(req, res, next);
    },
    
    // Validation
    ...validateMoodAnalysis,
    handleValidationErrors,
    
    // Main handler
    async (req, res) => {
        const startTime = Date.now();
        
        try {
            const { input, options = {} } = req.body;
            const userId = req.userId;

            // Enhanced logging
            console.log(`[MoodDetection] Analyzing mood for user ${userId}:`, {
                inputType: input.type,
                hasContent: !!input.content,
                hasAudio: !!input.audioData,
                hasImage: !!input.imageData,
                contentLength: input.content?.length || 0,
                timestamp: new Date().toISOString()
            });

            // Validate input based on type
            if (input.type === 'text' && (!input.content || input.content.trim().length === 0)) {
                return res.status(400).json({
                    success: false,
                    error: 'Text content is required for text analysis',
                    errorCode: 'MISSING_TEXT_CONTENT'
                });
            }

            if (input.type === 'voice' && !input.audioData && !input.content) {
                return res.status(400).json({
                    success: false,
                    error: 'Audio data or transcript is required for voice analysis',
                    errorCode: 'MISSING_VOICE_DATA'
                });
            }

            if (input.type === 'image' && !input.imageData) {
                return res.status(400).json({
                    success: false,
                    error: 'Image data is required for image analysis',
                    errorCode: 'MISSING_IMAGE_DATA'
                });
            }

            // Perform mood analysis
            const analysis = await MoodDetectionService.analyzeMood(userId, input, options);

            const responseTime = Date.now() - startTime;

            // Enhanced response
            const response = {
                success: true,
                data: {
                    ...analysis,
                    responseTime,
                    serverTimestamp: new Date().toISOString(),
                    apiVersion: '2.0'
                }
            };

            // Add performance headers
            res.set({
                'X-Response-Time': `${responseTime}ms`,
                'X-Cache-Status': analysis.cacheUsed ? 'HIT' : 'MISS',
                'X-Confidence-Score': analysis.confidence || 0,
                'X-Primary-Emotion': analysis.primaryEmotion || 'unknown'
            });

            res.json(response);

        } catch (err) {
            const responseTime = Date.now() - startTime;
            
            console.error('Mood Analysis Error:', {
                error: err.message,
                userId: req.userId,
                responseTime,
                stack: err.stack
            });
            
            const errorResponse = {
                success: false,
                error: err.message || 'Failed to analyze mood',
                errorCode: this.getErrorCode(err),
                responseTime,
                timestamp: new Date().toISOString()
            };

            // Add retry information for specific errors
            if (err.message.includes('rate limit')) {
                errorResponse.retryAfter = 60;
            } else if (err.message.includes('timeout')) {
                errorResponse.retryAfter = 5;
            }

            const statusCode = this.getStatusCode(err);
            res.status(statusCode).json(errorResponse);
        }
    }
];

/**
 * Get mood history for a user
 */
exports.getMoodHistory = [
    ...validateHistoryQuery,
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const userId = req.userId;
            const {
                limit = 20,
                offset = 0,
                timeframe = '30d',
                emotions,
                includeInsights = false,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Parse emotions filter
            let emotionsFilter = null;
            if (emotions) {
                emotionsFilter = typeof emotions === 'string' ? 
                    emotions.split(',').map(e => e.trim()) : 
                    emotions;
            }

            const options = {
                limit: parseInt(limit),
                offset: parseInt(offset),
                timeframe,
                emotions: emotionsFilter,
                includeInsights: includeInsights === 'true',
                sortBy,
                sortOrder
            };

            const history = await MoodDetectionService.getMoodHistory(userId, options);

            res.json({
                success: true,
                data: history
            });

        } catch (err) {
            console.error('Get Mood History Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve mood history',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Get mood analytics and insights
 */
exports.getMoodAnalytics = [
    query('timeframe')
        .optional()
        .isIn(['1d', '7d', '30d', '90d'])
        .withMessage('Invalid timeframe'),
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const userId = req.userId;
            const { timeframe = '30d' } = req.query;

            const analytics = await MoodDetectionService.getMoodAnalytics(userId, timeframe);

            res.json({
                success: true,
                data: {
                    ...analytics,
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('Get Mood Analytics Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to generate mood analytics',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Get specific mood entry by ID
 */
exports.getMoodEntry = [
    param('entryId')
        .isMongoId()
        .withMessage('Invalid mood entry ID'),
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const { entryId } = req.params;
            const userId = req.userId;

            const entry = await MoodEntry.findOne({
                _id: entryId,
                userId,
                isActive: true
            });

            if (!entry) {
                return res.status(404).json({
                    success: false,
                    error: 'Mood entry not found',
                    errorCode: 'ENTRY_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                data: entry
            });

        } catch (err) {
            console.error('Get Mood Entry Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve mood entry',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Submit feedback on mood analysis accuracy
 */
exports.submitFeedback = [
    ...validateFeedback,
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const { entryId } = req.params;
            const { accuracyRating, helpfulnessRating, comments } = req.body;
            const userId = req.userId;

            const entry = await MoodEntry.findOne({
                _id: entryId,
                userId,
                isActive: true
            });

            if (!entry) {
                return res.status(404).json({
                    success: false,
                    error: 'Mood entry not found',
                    errorCode: 'ENTRY_NOT_FOUND'
                });
            }

            // Update entry with feedback
            entry.userFeedback = {
                accuracyRating,
                helpfulnessRating,
                comments: comments || '',
                submittedAt: new Date()
            };

            await entry.save();

            res.json({
                success: true,
                message: 'Feedback submitted successfully',
                data: {
                    entryId,
                    feedback: entry.userFeedback
                }
            });

        } catch (err) {
            console.error('Submit Feedback Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to submit feedback',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Delete mood entry (soft delete)
 */
exports.deleteMoodEntry = [
    param('entryId')
        .isMongoId()
        .withMessage('Invalid mood entry ID'),
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const { entryId } = req.params;
            const userId = req.userId;

            const entry = await MoodEntry.findOne({
                _id: entryId,
                userId,
                isActive: true
            });

            if (!entry) {
                return res.status(404).json({
                    success: false,
                    error: 'Mood entry not found',
                    errorCode: 'ENTRY_NOT_FOUND'
                });
            }

            // Soft delete
            entry.isActive = false;
            entry.updatedAt = new Date();
            await entry.save();

            res.json({
                success: true,
                message: 'Mood entry deleted successfully',
                data: {
                    entryId,
                    deletedAt: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('Delete Mood Entry Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to delete mood entry',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Get mood suggestions based on current emotion
 */
exports.getMoodSuggestions = [
    query('emotion')
        .optional()
        .isIn(['peaceful', 'grateful', 'anxious', 'sad', 'joyful', 'spiritual', 'angry', 'hopeful', 'neutral'])
        .withMessage('Invalid emotion'),
    
    query('intensity')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Invalid intensity'),
    
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const userId = req.userId;
            const { emotion = 'neutral', intensity = 'medium', context } = req.query;

            // Create mock analysis for suggestion generation
            const mockAnalysis = {
                primaryEmotion: emotion,
                intensity,
                confidence: 0.7,
                spiritualContext: context ? JSON.parse(context) : {}
            };

            const suggestions = await MoodDetectionService.generateSuggestions(mockAnalysis, userId);

            res.json({
                success: true,
                data: {
                    emotion,
                    intensity,
                    suggestions,
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('Get Mood Suggestions Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to generate mood suggestions',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Export mood data
 */
exports.exportMoodData = [
    query('format')
        .optional()
        .isIn(['json', 'csv'])
        .withMessage('Invalid export format'),
    
    query('timeframe')
        .optional()
        .isIn(['1d', '7d', '30d', '90d', 'all'])
        .withMessage('Invalid timeframe'),
    
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const userId = req.userId;
            const { format = 'json', timeframe = '30d' } = req.query;

            // Get mood history
            const history = await MoodDetectionService.getMoodHistory(userId, {
                timeframe: timeframe === 'all' ? '365d' : timeframe,
                limit: 1000,
                includeInsights: true
            });

            if (format === 'csv') {
                const csv = this.convertToCSV(history.entries);
                const filename = `mood-data-${userId}-${new Date().toISOString().split('T')[0]}.csv`;
                
                res.set({
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${filename}"`
                });
                
                res.send(csv);
            } else {
                const filename = `mood-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
                
                res.set({
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="${filename}"`
                });
                
                res.json({
                    exportedAt: new Date().toISOString(),
                    userId,
                    timeframe,
                    totalEntries: history.entries.length,
                    data: history.entries
                });
            }

        } catch (err) {
            console.error('Export Mood Data Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to export mood data',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Health check endpoint
 */
exports.healthCheck = async (req, res) => {
    try {
        const healthMetrics = MoodDetectionService.getHealthMetrics();
        
        // Additional health checks
        const systemHealth = {
            ...healthMetrics,
            database: await this.checkDatabaseHealth(),
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };

        const isHealthy = systemHealth.database.status === 'connected';

        res.status(isHealthy ? 200 : 503).json({
            success: isHealthy,
            data: systemHealth
        });

    } catch (err) {
        console.error('Health Check Error:', err);
        res.status(503).json({
            success: false,
            error: 'Service unhealthy',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/**
 * Helper methods
 */

// Convert mood entries to CSV format
exports.convertToCSV = (entries) => {
    if (entries.length === 0) return 'No data available';

    const headers = [
        'Date',
        'Primary Emotion',
        'Confidence',
        'Intensity',
        'Analysis Type',
        'Spiritual Context',
        'Insights Count',
        'Suggestions Count'
    ];

    const rows = entries.map(entry => [
        entry.createdAt.toISOString(),
        entry.primaryEmotion,
        entry.confidence,
        entry.intensity,
        entry.analysisType,
        entry.spiritualContext?.isSpiritual ? 'Yes' : 'No',
        entry.insights?.length || 0,
        entry.suggestions?.length || 0
    ]);

    return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
};

// Get appropriate HTTP status code for errors
exports.getStatusCode = (error) => {
    if (error.message.includes('too long') || 
        error.message.includes('required') ||
        error.message.includes('Invalid')) {
        return 400;
    } else if (error.message.includes('rate limit')) {
        return 429;
    } else if (error.message.includes('not found')) {
        return 404;
    } else if (error.message.includes('timeout') || 
               error.message.includes('unavailable')) {
        return 503;
    } else {
        return 500;
    }
};

// Get error code for client handling
exports.getErrorCode = (error) => {
    if (error.message.includes('too long')) {
        return 'CONTENT_TOO_LONG';
    } else if (error.message.includes('required')) {
        return 'MISSING_REQUIRED_DATA';
    } else if (error.message.includes('Invalid')) {
        return 'INVALID_INPUT';
    } else if (error.message.includes('rate limit')) {
        return 'RATE_LIMIT_EXCEEDED';
    } else if (error.message.includes('timeout')) {
        return 'TIMEOUT_ERROR';
    } else if (error.message.includes('not found')) {
        return 'NOT_FOUND';
    } else {
        return 'INTERNAL_ERROR';
    }
};

// Check database health
exports.checkDatabaseHealth = async () => {
    try {
        const mongoose = require('mongoose');
        const state = mongoose.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
        return {
            status: states[state] || 'unknown',
            readyState: state,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message
        };
    }
};