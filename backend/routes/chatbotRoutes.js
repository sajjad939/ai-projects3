const express = require('express');
const router = express.Router();
const { 
    sendMessage, 
    getConversations, 
    getConversation,
    updateConversationTitle, 
    deleteConversation,
    getAnalytics,
    healthCheck
} = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware');

// Health check endpoint (no auth required)
router.get('/health', healthCheck);

// All other endpoints require authentication
router.use(authMiddleware);

// Send message to chatbot
router.post('/message', sendMessage);

// Get conversation history
router.get('/conversations', getConversations);

// Get specific conversation
router.get('/conversations/:sessionId', getConversation);

// Update conversation title
router.put('/conversations/:sessionId/title', updateConversationTitle);

// Delete conversation
router.delete('/conversations/:sessionId', deleteConversation);

// Get conversation analytics
router.get('/analytics', getAnalytics);

module.exports = router;