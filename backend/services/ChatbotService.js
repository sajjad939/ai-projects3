const axios = require('axios');
const { analyzeTextEmotion } = require('../utils/emotionAnalysis');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const ApiLog = require('../models/ApiLog');
const { v4: uuidv4 } = require('uuid');

class ChatbotService {
    constructor() {
        this.systemPrompts = {
            spiritual: `You are a compassionate AI spiritual companion for the "Mirror of Heart" app. 
            You provide gentle guidance, emotional support, and faith-based wisdom while respecting all religious traditions. 
            Always respond with empathy, understanding, and practical spiritual advice. 
            Keep responses concise but meaningful, typically 2-3 sentences unless more detail is needed.
            
            Guidelines:
            - Be respectful of all faiths and spiritual practices
            - Offer comfort during difficult times
            - Encourage reflection and personal growth
            - Suggest practical spiritual exercises when appropriate
            - Never impose specific religious beliefs
            - Focus on universal spiritual principles like compassion, gratitude, and inner peace`,
            
            supportive: `You are an empathetic emotional wellness companion for the "Mirror of Heart" app. 
            Focus on active listening, validation, and gentle encouragement. 
            Help users process their emotions and find healthy coping strategies.
            
            Guidelines:
            - Validate the user's feelings without judgment
            - Ask thoughtful follow-up questions
            - Suggest healthy coping mechanisms
            - Encourage professional help when appropriate
            - Maintain a warm, understanding tone
            - Help users identify patterns in their emotions`,
            
            reflective: `You are a mindful reflection guide for the "Mirror of Heart" app. 
            Help users explore their thoughts and feelings through gentle questioning and insights. 
            Encourage self-discovery and personal growth.
            
            Guidelines:
            - Ask open-ended questions that promote self-reflection
            - Help users connect current experiences to past patterns
            - Encourage mindfulness and present-moment awareness
            - Guide users to find their own answers
            - Suggest journaling or meditation practices
            - Foster deeper self-understanding`
        };

        this.conversationCache = new Map();
        this.responseCache = new Map();
    }

    async processMessage(userId, message, options = {}) {
        try {
            const {
                sessionId = uuidv4(),
                inputType = 'text',
                includeEmotion = true,
                conversationTone = 'supportive',
                context = {}
            } = options;

            // Input validation
            if (!message || typeof message !== 'string' || !message.trim()) {
                throw new Error('Message cannot be empty');
            }

            if (message.length > 2000) {
                throw new Error('Message too long. Please keep messages under 2000 characters.');
            }

            // Get or create conversation
            let conversation = await this.getOrCreateConversation(userId, sessionId);
            
            // Analyze emotion if enabled
            let emotionData = null;
            if (includeEmotion && message.trim()) {
                emotionData = await this.analyzeMessageEmotion(message, inputType);
                await this.updateEmotionalContext(conversation, emotionData);
            }

            // Add user message to conversation
            const userMessage = {
                role: 'user',
                content: message.trim(),
                metadata: {
                    emotion: emotionData?.emotion,
                    confidence: emotionData?.confidence,
                    inputType,
                    timestamp: new Date(),
                    context
                }
            };
            conversation.messages.push(userMessage);

            // Generate AI response with caching
            const cacheKey = this.generateCacheKey(conversation, conversationTone);
            let aiResponse = this.responseCache.get(cacheKey);
            
            if (!aiResponse) {
                aiResponse = await this.generateResponse(conversation, conversationTone);
                this.responseCache.set(cacheKey, aiResponse);
                
                // Limit cache size
                if (this.responseCache.size > 100) {
                    const firstKey = this.responseCache.keys().next().value;
                    this.responseCache.delete(firstKey);
                }
            }
            
            // Add AI response to conversation
            const assistantMessage = {
                role: 'assistant',
                content: aiResponse,
                metadata: { 
                    inputType: 'text',
                    timestamp: new Date(),
                    generatedBy: 'gemini-pro'
                }
            };
            conversation.messages.push(assistantMessage);

            // Update conversation metadata
            conversation.lastActivity = new Date();
            conversation.context.conversationTone = conversationTone;
            
            // Auto-generate conversation title if it's still default
            if (conversation.title === 'New Conversation' && conversation.messages.length >= 4) {
                conversation.title = await this.generateConversationTitle(conversation);
            }
            
            // Keep only last 20 messages for performance
            if (conversation.messages.length > 20) {
                conversation.messages = conversation.messages.slice(-20);
            }

            await conversation.save();

            // Update cache
            this.conversationCache.set(conversation.sessionId, conversation);

            // Log the interaction
            await this.logInteraction(userId, message, aiResponse, emotionData, {
                sessionId,
                conversationTone,
                inputType,
                responseTime: Date.now() - userMessage.metadata.timestamp
            });

            return {
                response: aiResponse,
                emotion: emotionData,
                sessionId: conversation.sessionId,
                conversationId: conversation._id,
                messageCount: conversation.messages.length,
                conversationTitle: conversation.title
            };

        } catch (error) {
            console.error('ChatbotService Error:', error);
            await this.logError(userId, error, { message, options });
            throw new Error(error.message || 'Failed to process message');
        }
    }

    async analyzeMessageEmotion(message, inputType) {
        try {
            if (inputType === 'text') {
                return await analyzeTextEmotion(message);
            }
            // Future: Add voice and image emotion analysis
            return { emotion: 'neutral', confidence: 0.5 };
        } catch (error) {
            console.error('Emotion analysis error:', error);
            return { emotion: 'neutral', confidence: 0.5 };
        }
    }

    async getOrCreateConversation(userId, sessionId) {
        // Check cache first
        if (this.conversationCache.has(sessionId)) {
            return this.conversationCache.get(sessionId);
        }

        let conversation = await Conversation.findOne({ 
            userId, 
            sessionId,
            isActive: true 
        });

        if (!conversation) {
            conversation = new Conversation({
                userId,
                sessionId,
                title: 'New Conversation',
                messages: [],
                context: {
                    spiritualPreferences: {},
                    emotionalState: { moodHistory: [] },
                    conversationTone: 'supportive'
                }
            });
        }

        // Cache the conversation
        this.conversationCache.set(sessionId, conversation);
        return conversation;
    }

    async generateResponse(conversation, tone = 'supportive') {
        try {
            const user = await User.findById(conversation.userId);
            let apiKey = process.env.GEMINI_API_KEY;
            
            if (user?.geminiApiKey) {
                apiKey = user.geminiApiKey;
            }

            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            // Build context-aware prompt
            const systemPrompt = this.buildSystemPrompt(conversation, tone);
            const conversationHistory = this.buildConversationHistory(conversation);
            const contextualInfo = this.buildContextualInfo(conversation);

            const prompt = `${systemPrompt}

${contextualInfo}

Conversation History:
${conversationHistory}

Please respond as the AI companion with empathy, wisdom, and practical guidance. Keep your response concise but meaningful (2-4 sentences typically).`;

            const response = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 200,
                        stopSequences: []
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    timeout: 30000
                }
            );

            const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!aiResponse) {
                throw new Error('Invalid response from Gemini API');
            }

            return this.postProcessResponse(aiResponse.trim());

        } catch (error) {
            console.error('Gemini API Error:', error);
            
            if (error.response?.status === 429) {
                return "I'm experiencing high demand right now. Please try again in a moment.";
            } else if (error.response?.status === 403) {
                return "I'm having trouble accessing my knowledge base. Please check your API configuration.";
            }
            
            return this.getFallbackResponse(conversation);
        }
    }

    buildSystemPrompt(conversation, tone) {
        let basePrompt = this.systemPrompts[tone] || this.systemPrompts.supportive;
        
        // Add emotional context
        const currentEmotion = conversation.context?.emotionalState?.currentMood;
        if (currentEmotion && currentEmotion !== 'neutral') {
            basePrompt += `\n\nThe user's current emotional state appears to be: ${currentEmotion}. 
            Please respond with appropriate sensitivity and support for someone feeling ${currentEmotion}.`;
        }

        // Add spiritual context
        const spiritualPrefs = conversation.context?.spiritualPreferences;
        if (spiritualPrefs?.religion) {
            basePrompt += `\n\nThe user has indicated their spiritual background as: ${spiritualPrefs.religion}. 
            Please respect and incorporate relevant spiritual wisdom when appropriate, while remaining inclusive of all faiths.`;
        }

        // Add conversation context
        const messageCount = conversation.messages.length;
        if (messageCount > 10) {
            basePrompt += `\n\nThis is an ongoing conversation. Build upon previous exchanges and show continuity in your responses.`;
        }

        return basePrompt;
    }

    buildConversationHistory(conversation) {
        return conversation.messages
            .slice(-6) // Last 6 messages for context
            .map(msg => {
                const role = msg.role === 'user' ? 'User' : 'Assistant';
                const emotion = msg.metadata?.emotion ? ` [${msg.metadata.emotion}]` : '';
                return `${role}${emotion}: ${msg.content}`;
            })
            .join('\n');
    }

    buildContextualInfo(conversation) {
        const context = conversation.context;
        let info = '';

        // Recent mood patterns
        if (context?.emotionalState?.moodHistory?.length > 0) {
            const recentMoods = context.emotionalState.moodHistory
                .slice(-3)
                .map(m => m.mood)
                .join(', ');
            info += `Recent emotional patterns: ${recentMoods}\n`;
        }

        // Time of day context
        const hour = new Date().getHours();
        if (hour < 6) {
            info += 'Time context: Very early morning - user may be having trouble sleeping or starting early\n';
        } else if (hour < 12) {
            info += 'Time context: Morning - good time for setting intentions and positive energy\n';
        } else if (hour < 18) {
            info += 'Time context: Afternoon - user may be dealing with daily stresses\n';
        } else {
            info += 'Time context: Evening - good time for reflection and winding down\n';
        }

        return info;
    }

    postProcessResponse(response) {
        // Remove any potential harmful content
        const cleanResponse = response
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
            .trim();

        // Ensure response isn't too long
        if (cleanResponse.length > 500) {
            const sentences = cleanResponse.split('. ');
            return sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');
        }

        return cleanResponse;
    }

    async updateEmotionalContext(conversation, emotionData) {
        if (!emotionData?.emotion) return;

        conversation.context.emotionalState.currentMood = emotionData.emotion;
        conversation.context.emotionalState.moodHistory.push({
            mood: emotionData.emotion,
            confidence: emotionData.confidence,
            timestamp: new Date()
        });

        // Keep only last 10 mood entries
        if (conversation.context.emotionalState.moodHistory.length > 10) {
            conversation.context.emotionalState.moodHistory = 
                conversation.context.emotionalState.moodHistory.slice(-10);
        }
    }

    async generateConversationTitle(conversation) {
        try {
            const firstUserMessage = conversation.messages.find(m => m.role === 'user')?.content;
            if (!firstUserMessage) return 'New Conversation';

            // Simple title generation based on first message
            const words = firstUserMessage.split(' ').slice(0, 4);
            return words.join(' ') + (firstUserMessage.split(' ').length > 4 ? '...' : '');
        } catch (error) {
            return 'New Conversation';
        }
    }

    generateCacheKey(conversation, tone) {
        const lastMessage = conversation.messages[conversation.messages.length - 1]?.content || '';
        const emotion = conversation.context?.emotionalState?.currentMood || 'neutral';
        return `${tone}-${emotion}-${lastMessage.substring(0, 50)}`;
    }

    getFallbackResponse(conversation) {
        const currentEmotion = conversation.context?.emotionalState?.currentMood;
        
        const emotionResponses = {
            sad: "I can sense you're going through a difficult time. Your feelings are completely valid, and I'm here to listen and support you.",
            anxious: "It sounds like you're feeling overwhelmed right now. Take a deep breath with me. What's weighing most heavily on your mind?",
            angry: "I hear the frustration in your words. It's okay to feel angry - these emotions are part of being human. What's behind these feelings?",
            happy: "I'm so glad to hear the positivity in your message! It's wonderful when we can find moments of joy. What's bringing you happiness today?",
            spiritual: "Thank you for sharing your spiritual thoughts with me. Faith and spirituality can be such sources of strength and comfort."
        };

        if (currentEmotion && emotionResponses[currentEmotion]) {
            return emotionResponses[currentEmotion];
        }

        const fallbackResponses = [
            "I'm here to listen and support you. Could you tell me more about what's on your mind?",
            "Thank you for sharing with me. How are you feeling right now?",
            "I appreciate you opening up. What would be most helpful for you in this moment?",
            "Your feelings are valid and important. Would you like to explore this further together?",
            "I'm here to support you through whatever you're experiencing. What's weighing on your heart?"
        ];

        const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
        return fallbackResponses[randomIndex];
    }

    async logInteraction(userId, userMessage, aiResponse, emotionData, metadata = {}) {
        try {
            await ApiLog.create({
                userId,
                endpoint: '/api/chatbot/message',
                method: 'POST',
                status: 200,
                details: {
                    messageLength: userMessage.length,
                    responseLength: aiResponse.length,
                    emotion: emotionData?.emotion,
                    confidence: emotionData?.confidence,
                    sessionId: metadata.sessionId,
                    conversationTone: metadata.conversationTone,
                    inputType: metadata.inputType,
                    responseTime: metadata.responseTime,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            console.error('Failed to log interaction:', error);
        }
    }

    async logError(userId, error, context = {}) {
        try {
            await ApiLog.create({
                userId,
                endpoint: '/api/chatbot/message',
                method: 'POST',
                status: 500,
                details: {
                    error: error.message,
                    stack: error.stack,
                    context,
                    timestamp: new Date()
                }
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }
    }

    async getConversationHistory(userId, limit = 10) {
        try {
            const conversations = await Conversation.find({ 
                userId, 
                isActive: true 
            })
            .sort({ lastActivity: -1 })
            .limit(limit)
            .select('sessionId title lastActivity messages context');

            return conversations.map(conv => ({
                sessionId: conv.sessionId,
                title: conv.title,
                lastActivity: conv.lastActivity,
                messageCount: conv.messages.length,
                lastMessage: conv.messages[conv.messages.length - 1]?.content?.substring(0, 100) + '...',
                currentMood: conv.context?.emotionalState?.currentMood,
                preview: this.generateConversationPreview(conv)
            }));
        } catch (error) {
            console.error('Failed to get conversation history:', error);
            return [];
        }
    }

    generateConversationPreview(conversation) {
        const lastUserMessage = conversation.messages
            .slice()
            .reverse()
            .find(m => m.role === 'user');
        
        if (lastUserMessage) {
            return lastUserMessage.content.substring(0, 80) + 
                   (lastUserMessage.content.length > 80 ? '...' : '');
        }
        
        return 'No messages yet';
    }

    async getConversationById(userId, sessionId) {
        try {
            const conversation = await Conversation.findOne({
                userId,
                sessionId,
                isActive: true
            });

            if (!conversation) {
                return null;
            }

            return {
                sessionId: conversation.sessionId,
                title: conversation.title,
                messages: conversation.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp,
                    emotion: msg.metadata?.emotion,
                    confidence: msg.metadata?.confidence
                })),
                context: conversation.context,
                lastActivity: conversation.lastActivity
            };
        } catch (error) {
            console.error('Failed to get conversation:', error);
            return null;
        }
    }

    async updateConversationTitle(sessionId, title) {
        try {
            if (!title || title.trim().length === 0) {
                throw new Error('Title cannot be empty');
            }

            if (title.length > 100) {
                throw new Error('Title too long');
            }

            const conversation = await Conversation.findOneAndUpdate(
                { sessionId },
                { title: title.trim() },
                { new: true }
            );

            if (conversation) {
                // Update cache
                this.conversationCache.set(sessionId, conversation);
            }

            return !!conversation;
        } catch (error) {
            console.error('Failed to update conversation title:', error);
            return false;
        }
    }

    async deleteConversation(userId, sessionId) {
        try {
            const conversation = await Conversation.findOneAndUpdate(
                { userId, sessionId },
                { isActive: false },
                { new: true }
            );

            if (conversation) {
                // Remove from cache
                this.conversationCache.delete(sessionId);
            }

            return !!conversation;
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            return false;
        }
    }

    async getAnalytics(userId, timeframe = '7d') {
        try {
            const days = parseInt(timeframe.replace('d', ''));
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const conversations = await Conversation.find({
                userId,
                isActive: true,
                lastActivity: { $gte: startDate }
            });

            const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
            const totalConversations = conversations.length;
            
            // Emotion analysis
            const emotions = {};
            conversations.forEach(conv => {
                conv.messages.forEach(msg => {
                    if (msg.metadata?.emotion) {
                        emotions[msg.metadata.emotion] = (emotions[msg.metadata.emotion] || 0) + 1;
                    }
                });
            });

            const mostCommonEmotion = Object.keys(emotions).reduce((a, b) => 
                emotions[a] > emotions[b] ? a : b, 'neutral'
            );

            return {
                totalConversations,
                totalMessages,
                averageMessagesPerConversation: totalMessages / Math.max(totalConversations, 1),
                mostCommonEmotion,
                emotionDistribution: emotions,
                timeframe: `${days} days`
            };
        } catch (error) {
            console.error('Failed to get analytics:', error);
            return null;
        }
    }

    // Cleanup method to prevent memory leaks
    cleanup() {
        this.conversationCache.clear();
        this.responseCache.clear();
    }
}

module.exports = new ChatbotService();