const { analyzeTextEmotion } = require('../utils/emotionAnalysis');
const axios = require('axios');
const User = require('../models/User');

// Chatbot Service: integrates Gemini API and Mood Detection
exports.chatbotService = async (req, res) => {
    try {
        const { message, userId } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        // Mood Detection
        const mood = await analyzeTextEmotion(message);
        // Gemini API (per-user key support)
        let apiKey = process.env.GEMINI_API_KEY;
        if (userId) {
            const user = await User.findById(userId);
            if (user && user.geminiApiKey) apiKey = user.geminiApiKey;
        }
        const geminiRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            contents: [{ parts: [{ text: message }] }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            }
        });
        res.json({
            reply: geminiRes.data,
            mood
        });
    } catch (err) {
        res.status(500).json({ error: 'Chatbot service failed', details: err.message });
    }
};
