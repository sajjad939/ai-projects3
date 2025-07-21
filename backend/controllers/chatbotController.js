const ChatbotService = require('../services/ChatbotService');
const rateLimit = require('express-rate-limit');

// Rate limiting for chatbot endpoints
const chatbotRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per user
    message: {
        error: 'Too many messages sent. Please wait a moment before sending another message.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId || req.ip
});

// Send message to chatbot
exports.sendMessage = [chatbotRateLimit, async (req, res) => {
    try {
        const { message, sessionId, inputType, conversationTone, context } = req.body;
        const userId = req.userId;

        // Input validation
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ 
                success: false,
                error: 'Message is required and cannot be empty' 
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                success: false,
                error: 'Message too long. Please keep messages under 2000 characters.'
            });
        }

        // Validate conversation tone
        const validTones = ['supportive', 'spiritual', 'reflective'];
        const tone = validTones.includes(conversationTone) ? conversationTone : 'supportive';

        // Validate input type
        const validInputTypes = ['text', 'voice', 'image'];
        const type = validInputTypes.includes(inputType) ? inputType : 'text';

        const startTime = Date.now();
        
        const result = await ChatbotService.processMessage(userId, message, {
            sessionId,
            inputType: type,
            conversationTone: tone,
            context: context || {}
        });

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                ...result,
                responseTime
            }
        });

    } catch (err) {
        console.error('Chatbot Controller Error:', err);
        
        // Handle specific error types
        if (err.message.includes('Message too long')) {
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        if (err.message.includes('API key')) {
            return res.status(503).json({
                success: false,
                error: 'AI service temporarily unavailable. Please try again later.'
            });
        }

        res.status(500).json({ 
            success: false,
            error: 'Failed to process message. Please try again.',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}];

// Get conversation history
exports.getConversations = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit, offset } = req.query;

        const conversations = await ChatbotService.getConversationHistory(
            userId, 
            Math.min(parseInt(limit) || 10, 50), // Max 50 conversations
            parseInt(offset) || 0
        );

        res.json({
            success: true,
            data: {
                conversations,
                total: conversations.length,
                limit: parseInt(limit) || 10,
                offset: parseInt(offset) || 0
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
};

// Get specific conversation
exports.getConversation = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.userId;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        const conversation = await ChatbotService.getConversationById(userId, sessionId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
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
};

// Update conversation title
exports.updateConversationTitle = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { title } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ 
                success: false,
                error: 'Title is required and cannot be empty' 
            });
        }

        if (title.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Title too long. Please keep titles under 100 characters.'
            });
        }

        const success = await ChatbotService.updateConversationTitle(sessionId, title.trim());

        if (success) {
            res.json({
                success: true,
                message: 'Conversation title updated successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Conversation not found or update failed'
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
};

// Delete conversation
exports.deleteConversation = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.userId;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        const success = await ChatbotService.deleteConversation(userId, sessionId);

        if (success) {
            res.json({
                success: true,
                message: 'Conversation deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Conversation not found or deletion failed'
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
};

// Get conversation analytics
exports.getAnalytics = async (req, res) => {
    try {
        const userId = req.userId;
        const { timeframe } = req.query;

        // Validate timeframe
        const validTimeframes = ['1d', '7d', '30d', '90d'];
        const period = validTimeframes.includes(timeframe) ? timeframe : '7d';

        const analytics = await ChatbotService.getAnalytics(userId, period);

        if (!analytics) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate analytics'
            });
        }

        res.json({
            success: true,
            data: analytics
        });

    } catch (err) {
        console.error('Get Analytics Error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve analytics',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Health check endpoint
exports.healthCheck = async (req, res) => {
    try {
        // Basic health check
        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'chatbot',
            version: '1.0.0'
        };

        // Check Gemini API availability (optional)
        if (process.env.GEMINI_API_KEY) {
            status.geminiApi = 'configured';
        } else {
            status.geminiApi = 'not configured';
        }

        res.json({
            success: true,
            data: status
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