const express = require('express');
const router = express.Router();
const { 
    sendMessage, 
    getConversations, 
    getConversation,
    updateConversationTitle, 
    deleteConversation,
    getAnalytics,
    healthCheck,
    exportConversations,
    bulkOperations
} = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Enhanced Chatbot Routes with comprehensive API endpoints
 * All routes follow RESTful conventions and include proper documentation
 */

// Health check endpoint (no auth required for monitoring)
router.get('/health', healthCheck);

// Apply authentication middleware to all other routes
router.use(authMiddleware);

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message to the chatbot and receive AI response
 * @access  Private
 * @body    {
 *   message: string (required, max 2000 chars),
 *   sessionId?: string (UUID),
 *   conversationTone?: 'supportive'|'spiritual'|'reflective'|'celebratory',
 *   inputType?: 'text'|'voice'|'image',
 *   priority?: 'normal'|'high',
 *   context?: object,
 *   includeEmotion?: boolean,
 *   includeSuggestions?: boolean
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     response: string,
 *     emotion: object,
 *     sessionId: string,
 *     conversationId: string,
 *     messageCount: number,
 *     conversationTitle: string,
 *     suggestedActions: array,
 *     responseMetadata: object
 *   }
 * }
 */
router.post('/message', sendMessage);

/**
 * @route   GET /api/chatbot/conversations
 * @desc    Get user's conversation history with pagination and filtering
 * @access  Private
 * @query   {
 *   limit?: number (1-50, default 10),
 *   offset?: number (default 0),
 *   sortBy?: 'lastActivity'|'createdAt'|'messageCount',
 *   sortOrder?: 'asc'|'desc',
 *   filterBy?: 'emotion'|'tone'|'date',
 *   search?: string
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     conversations: array,
 *     pagination: object,
 *     filters: object
 *   }
 * }
 */
router.get('/conversations', getConversations);

/**
 * @route   GET /api/chatbot/conversations/:sessionId
 * @desc    Get specific conversation with full message history
 * @access  Private
 * @params  sessionId: string (UUID)
 * @query   includeAnalytics?: boolean
 * @returns {
 *   success: boolean,
 *   data: {
 *     sessionId: string,
 *     title: string,
 *     messages: array,
 *     context: object,
 *     stats?: object,
 *     lastActivity: string
 *   }
 * }
 */
router.get('/conversations/:sessionId', getConversation);

/**
 * @route   PUT /api/chatbot/conversations/:sessionId/title
 * @desc    Update conversation title
 * @access  Private
 * @params  sessionId: string (UUID)
 * @body    { title: string (required, max 100 chars) }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     sessionId: string,
 *     title: string,
 *     updatedAt: string
 *   }
 * }
 */
router.put('/conversations/:sessionId/title', updateConversationTitle);

/**
 * @route   DELETE /api/chatbot/conversations/:sessionId
 * @desc    Soft delete a conversation (marks as inactive)
 * @access  Private
 * @params  sessionId: string (UUID)
 * @body    { confirm: boolean (required) }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     sessionId: string,
 *     deletedAt: string
 *   }
 * }
 */
router.delete('/conversations/:sessionId', deleteConversation);

/**
 * @route   GET /api/chatbot/analytics
 * @desc    Get conversation analytics and insights
 * @access  Private
 * @query   {
 *   timeframe?: '1d'|'7d'|'30d'|'90d' (default '7d'),
 *   includeEmotionTrends?: boolean,
 *   includeTopics?: boolean,
 *   includeRecommendations?: boolean
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     totalConversations: number,
 *     totalMessages: number,
 *     averageMessagesPerConversation: number,
 *     mostCommonEmotion: string,
 *     emotionDistribution: object,
 *     emotionTrends?: array,
 *     topics?: array,
 *     recommendations?: array,
 *     timeframe: string,
 *     generatedAt: string
 *   }
 * }
 */
router.get('/analytics', getAnalytics);

/**
 * @route   GET /api/chatbot/export
 * @desc    Export conversation data in various formats
 * @access  Private
 * @query   {
 *   format?: 'json'|'csv' (default 'json'),
 *   timeframe?: '1d'|'7d'|'30d'|'90d' (default '30d')
 * }
 * @returns File download (JSON or CSV)
 */
router.get('/export', exportConversations);

/**
 * @route   POST /api/chatbot/bulk
 * @desc    Perform bulk operations on conversations
 * @access  Private
 * @body    {
 *   operation: 'delete'|'archive'|'export',
 *   sessionIds: string[] (array of UUIDs),
 *   confirm?: boolean (required for delete)
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     operation: string,
 *     processed: number,
 *     failed: number,
 *     total: number,
 *     timestamp: string
 *   }
 * }
 */
router.post('/bulk', bulkOperations);

/**
 * @route   POST /api/chatbot/conversations/:sessionId/share
 * @desc    Generate shareable link for conversation (future feature)
 * @access  Private
 * @params  sessionId: string (UUID)
 * @body    { expiresIn?: number, permissions?: string[] }
 * @returns {
 *   success: boolean,
 *   data: {
 *     shareUrl: string,
 *     expiresAt: string,
 *     permissions: string[]
 *   }
 * }
 */
// router.post('/conversations/:sessionId/share', shareConversation);

/**
 * @route   GET /api/chatbot/suggestions
 * @desc    Get conversation starters and suggestions
 * @access  Private
 * @query   {
 *   tone?: 'supportive'|'spiritual'|'reflective'|'celebratory',
 *   emotion?: string,
 *   context?: string
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     starters: string[],
 *     quickActions: object[],
 *     contextualSuggestions: string[]
 *   }
 * }
 */
// router.get('/suggestions', getSuggestions);

/**
 * @route   POST /api/chatbot/feedback
 * @desc    Submit feedback on AI responses
 * @access  Private
 * @body    {
 *   sessionId: string,
 *   messageId: string,
 *   rating: number (1-5),
 *   feedback?: string,
 *   category?: string
 * }
 * @returns {
 *   success: boolean,
 *   message: string
 * }
 */
// router.post('/feedback', submitFeedback);

/**
 * Error handling middleware specific to chatbot routes
 */
router.use((error, req, res, next) => {
    console.error('Chatbot Route Error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userId: req.userId,
        timestamp: new Date().toISOString()
    });

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;