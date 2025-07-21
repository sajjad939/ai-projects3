const ChatbotService = require('../services/ChatbotService');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

/**
 * Enhanced Chatbot Controller with comprehensive validation and error handling
 */

// Enhanced rate limiting with different tiers
const chatbotRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per user
    message: {
        success: false,
        error: 'Too many messages sent. Please wait a moment before sending another message.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId || req.ip,
    skip: (req) => {
        // Skip rate limiting for premium users (if implemented)
        return req.user?.isPremium || false;
    }
});

// Premium rate limiting for high-priority requests
const premiumRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60, // Higher limit for premium users
    keyGenerator: (req) => req.userId || req.ip
});

/**
 * Validation middleware for message sending
 */
const validateSendMessage = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required and cannot be empty')
        .isLength({ max: 2000 })
        .withMessage('Message too long. Please keep messages under 2000 characters.'),
    
    body('sessionId')
        .optional()
        .isUUID()
        .withMessage('Invalid session ID format'),
    
    body('conversationTone')
        .optional()
        .isIn(['supportive', 'spiritual', 'reflective', 'celebratory'])
        .withMessage('Invalid conversation tone'),
    
    body('inputType')
        .optional()
        .isIn(['text', 'voice', 'image'])
        .withMessage('Invalid input type'),
    
    body('priority')
        .optional()
        .isIn(['normal', 'high'])
        .withMessage('Invalid priority level'),
    
    body('context')
        .optional()
        .isObject()
        .withMessage('Context must be an object')
];

/**
 * Validation middleware for conversation queries
 */
const validateConversationQuery = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
    
    query('timeframe')
        .optional()
        .isIn(['1d', '7d', '30d', '90d'])
        .withMessage('Invalid timeframe')
];

/**
 * Validation middleware for session ID parameter
 */
const validateSessionId = [
    param('sessionId')
        .isUUID()
        .withMessage('Invalid session ID format')
];

/**
 * Validation middleware for conversation title update
 */
const validateTitleUpdate = [
    ...validateSessionId,
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required and cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Title too long. Please keep titles under 100 characters.')
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
 * Send message to chatbot with enhanced features
 */
exports.sendMessage = [
    // Apply appropriate rate limiting
    (req, res, next) => {
        if (req.body.priority === 'high' || req.user?.isPremium) {
            return premiumRateLimit(req, res, next);
        }
        return chatbotRateLimit(req, res, next);
    },
    
    // Validation
    ...validateSendMessage,
    handleValidationErrors,
    
    // Main handler
    async (req, res) => {
        const startTime = Date.now();
        
        try {
            const { 
                message, 
                sessionId, 
                inputType = 'text', 
                conversationTone = 'supportive', 
                context = {},
                priority = 'normal',
                includeEmotion = true,
                includeSuggestions = true
            } = req.body;
            
            const userId = req.userId;

            // Enhanced logging for monitoring
            console.log(`[ChatBot] Processing message for user ${userId}:`, {
                messageLength: message.length,
                sessionId: sessionId || 'new',
                tone: conversationTone,
                priority,
                timestamp: new Date().toISOString()
            });

            const result = await ChatbotService.processMessage(userId, message, {
                sessionId,
                inputType,
                conversationTone,
                context,
                priority,
                includeEmotion,
                includeSuggestions
            });

            const responseTime = Date.now() - startTime;

            // Enhanced response with additional metadata
            const response = {
                success: true,
                data: {
                    ...result,
                    responseTime,
                    serverTimestamp: new Date().toISOString(),
                    apiVersion: '2.0'
                }
            };

            // Add performance headers
            res.set({
                'X-Response-Time': `${responseTime}ms`,
                'X-Cache-Status': result.responseMetadata?.cacheUsed ? 'HIT' : 'MISS',
                'X-Emotion-Confidence': result.emotion?.confidence || 0
            });

            res.json(response);

        } catch (err) {
            const responseTime = Date.now() - startTime;
            
            console.error('Chatbot Controller Error:', {
                error: err.message,
                userId: req.userId,
                responseTime,
                stack: err.stack
            });
            
            // Enhanced error response
            const errorResponse = {
                success: false,
                error: err.message || 'Failed to process message',
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
 * Get conversation history with enhanced filtering
 */
exports.getConversations = [
    ...validateConversationQuery,
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const userId = req.userId;
            const { 
                limit = 10, 
                offset = 0, 
                sortBy = 'lastActivity',
                sortOrder = 'desc',
                filterBy,
                search
            } = req.query;

            const conversations = await ChatbotService.getConversationHistory(
                userId, 
                Math.min(parseInt(limit), 50),
                parseInt(offset),
                {
                    sortBy,
                    sortOrder,
                    filterBy,
                    search
                }
            );

            const totalCount = await ChatbotService.getConversationCount(userId, { filterBy, search });

            res.json({
                success: true,
                data: {
                    conversations,
                    pagination: {
                        total: totalCount,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
                    },
                    filters: {
                        sortBy,
                        sortOrder,
                        filterBy,
                        search
                    }
                }
            });

        } catch (err) {
            console.error('Get Conversations Error:', err);
            res.status(500).json({ 
                success: false,
                error: 'Failed to retrieve conversations',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Get specific conversation with enhanced details
 */
exports.getConversation = [
    ...validateSessionId,
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const { sessionId } = req.params;
            const userId = req.userId;
            const { includeAnalytics = false } = req.query;

            const conversation = await ChatbotService.getConversationById(userId, sessionId, {
                includeAnalytics
            });

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation not found',
                    errorCode: 'CONVERSATION_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                data: conversation
            });

        } catch (err) {
            console.error('Get Conversation Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve conversation',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Update conversation title with validation
 */
exports.updateConversationTitle = [
    ...validateTitleUpdate,
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { title } = req.body;
            const userId = req.userId;

            const success = await ChatbotService.updateConversationTitle(
                userId, 
                sessionId, 
                title.trim()
            );

            if (success) {
                res.json({
                    success: true,
                    message: 'Conversation title updated successfully',
                    data: {
                        sessionId,
                        title: title.trim(),
                        updatedAt: new Date().toISOString()
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Conversation not found or update failed',
                    errorCode: 'UPDATE_FAILED'
                });
            }

        } catch (err) {
            console.error('Update Conversation Title Error:', err);
            res.status(500).json({ 
                success: false,
                error: 'Failed to update conversation title',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Delete conversation with confirmation
 */
exports.deleteConversation = [
    ...validateSessionId,
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const { sessionId } = req.params;
            const userId = req.userId;
            const { confirm = false } = req.body;

            if (!confirm) {
                return res.status(400).json({
                    success: false,
                    error: 'Deletion must be confirmed',
                    errorCode: 'CONFIRMATION_REQUIRED'
                });
            }

            const success = await ChatbotService.deleteConversation(userId, sessionId);

            if (success) {
                res.json({
                    success: true,
                    message: 'Conversation deleted successfully',
                    data: {
                        sessionId,
                        deletedAt: new Date().toISOString()
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Conversation not found or deletion failed',
                    errorCode: 'DELETE_FAILED'
                });
            }

        } catch (err) {
            console.error('Delete Conversation Error:', err);
            res.status(500).json({ 
                success: false,
                error: 'Failed to delete conversation',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Get conversation analytics with enhanced insights
 */
exports.getAnalytics = [
    ...validateConversationQuery,
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const userId = req.userId;
            const { 
                timeframe = '7d',
                includeEmotionTrends = true,
                includeTopics = true,
                includeRecommendations = true
            } = req.query;

            const analytics = await ChatbotService.getAnalytics(userId, timeframe, {
                includeEmotionTrends,
                includeTopics,
                includeRecommendations
            });

            if (!analytics) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate analytics',
                    errorCode: 'ANALYTICS_GENERATION_FAILED'
                });
            }

            res.json({
                success: true,
                data: {
                    ...analytics,
                    generatedAt: new Date().toISOString(),
                    timeframe
                }
            });

        } catch (err) {
            console.error('Get Analytics Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve analytics',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Health check endpoint with detailed metrics
 */
exports.healthCheck = async (req, res) => {
    try {
        const healthMetrics = ChatbotService.getHealthMetrics();
        
        // Additional system health checks
        const systemHealth = {
            ...healthMetrics,
            database: await this.checkDatabaseHealth(),
            geminiApi: await this.checkGeminiApiHealth(),
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };

        const isHealthy = systemHealth.database.status === 'connected' && 
                         systemHealth.geminiApi.status === 'available';

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
 * Export conversation data
 */
exports.exportConversations = [
    ...validateConversationQuery,
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const userId = req.userId;
            const { format = 'json', timeframe = '30d' } = req.query;

            const exportData = await ChatbotService.exportConversations(userId, {
                format,
                timeframe
            });

            const filename = `conversations-${userId}-${new Date().toISOString().split('T')[0]}.${format}`;
            
            res.set({
                'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            });

            res.send(exportData);

        } catch (err) {
            console.error('Export Conversations Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to export conversations',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Bulk operations on conversations
 */
exports.bulkOperations = [
    body('operation')
        .isIn(['delete', 'archive', 'export'])
        .withMessage('Invalid operation'),
    
    body('sessionIds')
        .isArray({ min: 1 })
        .withMessage('Session IDs array is required'),
    
    body('sessionIds.*')
        .isUUID()
        .withMessage('Invalid session ID format'),
    
    handleValidationErrors,
    
    async (req, res) => {
        try {
            const { operation, sessionIds, confirm = false } = req.body;
            const userId = req.userId;

            if (operation === 'delete' && !confirm) {
                return res.status(400).json({
                    success: false,
                    error: 'Bulk deletion must be confirmed',
                    errorCode: 'CONFIRMATION_REQUIRED'
                });
            }

            const result = await ChatbotService.bulkOperations(userId, operation, sessionIds);

            res.json({
                success: true,
                data: {
                    operation,
                    processed: result.processed,
                    failed: result.failed,
                    total: sessionIds.length,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('Bulk Operations Error:', err);
            res.status(500).json({
                success: false,
                error: 'Failed to perform bulk operation',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
];

/**
 * Helper methods
 */

// Get appropriate HTTP status code for errors
exports.getStatusCode = (error) => {
    if (error.message.includes('Message too long') || 
        error.message.includes('Validation failed')) {
        return 400;
    } else if (error.message.includes('rate limit')) {
        return 429;
    } else if (error.message.includes('API key') || 
               error.message.includes('unauthorized')) {
        return 401;
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
    if (error.message.includes('Message too long')) {
        return 'MESSAGE_TOO_LONG';
    } else if (error.message.includes('rate limit')) {
        return 'RATE_LIMIT_EXCEEDED';
    } else if (error.message.includes('API key')) {
        return 'API_KEY_ERROR';
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

// Check Gemini API health
exports.checkGeminiApiHealth = async () => {
    try {
        const hasApiKey = !!process.env.GEMINI_API_KEY;
        return {
            status: hasApiKey ? 'available' : 'not configured',
            configured: hasApiKey
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message
        };
    }
};