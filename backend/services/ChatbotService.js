const axios = require('axios');
const { analyzeTextEmotion } = require('../utils/emotionAnalysis');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const ApiLog = require('../models/ApiLog');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced Chatbot Service for Mirror of Heart
 * Provides AI-powered conversational capabilities with emotional intelligence
 * and spiritual guidance integration
 */
class ChatbotService {
    constructor() {
        // Enhanced system prompts for different conversation contexts
        this.systemPrompts = {
            spiritual: `You are Noor, a compassionate AI spiritual companion for the "Mirror of Heart" app. 
            You provide gentle guidance, emotional support, and faith-based wisdom while respecting all religious traditions. 
            Your responses should be warm, understanding, and spiritually enriching.
            
            Core Principles:
            - Respect all faiths and spiritual practices equally
            - Offer comfort and hope during difficult times
            - Encourage reflection, gratitude, and personal growth
            - Suggest practical spiritual exercises when appropriate
            - Never impose specific religious beliefs
            - Focus on universal spiritual principles: compassion, gratitude, inner peace, forgiveness
            - Use inclusive language that welcomes all spiritual backgrounds
            
            Response Style:
            - Keep responses concise but meaningful (2-4 sentences typically)
            - Use gentle, nurturing tone
            - Include relevant spiritual wisdom when appropriate
            - Ask thoughtful follow-up questions to encourage deeper reflection`,
            
            supportive: `You are Noor, an empathetic emotional wellness companion for the "Mirror of Heart" app. 
            Your primary role is to provide emotional support, validation, and gentle guidance for mental wellness.
            
            Core Principles:
            - Validate emotions without judgment
            - Practice active listening and empathy
            - Help users process difficult emotions
            - Suggest healthy coping strategies
            - Encourage professional help when appropriate
            - Maintain hope and positivity while acknowledging struggles
            - Focus on emotional regulation and self-compassion
            
            Response Style:
            - Use warm, understanding language
            - Reflect back what you hear to show understanding
            - Ask open-ended questions to encourage expression
            - Offer practical emotional wellness techniques
            - Keep responses supportive and non-clinical`,
            
            reflective: `You are Noor, a mindful reflection guide for the "Mirror of Heart" app. 
            Your role is to help users explore their thoughts, feelings, and experiences through gentle questioning and insights.
            
            Core Principles:
            - Guide users to self-discovery through thoughtful questions
            - Help identify patterns in thoughts and behaviors
            - Encourage mindfulness and present-moment awareness
            - Foster deeper self-understanding and awareness
            - Support personal growth and insight development
            - Promote journaling and self-reflection practices
            
            Response Style:
            - Ask open-ended, thought-provoking questions
            - Help users connect current experiences to broader patterns
            - Encourage exploration of feelings and motivations
            - Suggest reflection exercises and mindfulness practices
            - Guide users to find their own answers and insights`,

            celebratory: `You are Noor, a joyful companion celebrating positive moments in the "Mirror of Heart" app.
            Your role is to amplify joy, gratitude, and positive experiences while helping users savor good moments.
            
            Core Principles:
            - Celebrate achievements and positive moments genuinely
            - Help users recognize and appreciate blessings
            - Encourage gratitude practices
            - Support positive emotion cultivation
            - Share in joy while maintaining authenticity
            - Help users build on positive experiences
            
            Response Style:
            - Use warm, celebratory language
            - Express genuine happiness for user's positive experiences
            - Ask about details to help users savor the moment
            - Suggest ways to build on positive experiences
            - Encourage sharing gratitude and joy with others`
        };

        // Enhanced caching system
        this.conversationCache = new Map();
        this.responseCache = new Map();
        this.emotionPatternCache = new Map();
        
        // Performance monitoring
        this.metrics = {
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 0,
            cacheHitRate: 0
        };

        // Cleanup intervals
        this.setupCleanupIntervals();
    }

    /**
     * Main method to process user messages and generate AI responses
     * @param {string} userId - User ID
     * @param {string} message - User message
     * @param {Object} options - Processing options
     * @returns {Object} Response with AI message, emotion data, and metadata
     */
    async processMessage(userId, message, options = {}) {
        const startTime = Date.now();
        this.metrics.totalRequests++;

        try {
            const {
                sessionId = uuidv4(),
                inputType = 'text',
                includeEmotion = true,
                conversationTone = 'supportive',
                context = {},
                priority = 'normal'
            } = options;

            // Enhanced input validation
            this.validateInput(message, options);

            // Get or create conversation with enhanced context
            let conversation = await this.getOrCreateConversation(userId, sessionId, context);
            
            // Analyze emotion with enhanced detection
            let emotionData = null;
            if (includeEmotion && message.trim()) {
                emotionData = await this.analyzeMessageEmotion(message, inputType, conversation);
                await this.updateEmotionalContext(conversation, emotionData);
            }

            // Add user message with rich metadata
            const userMessage = {
                role: 'user',
                content: message.trim(),
                timestamp: new Date(),
                metadata: {
                    emotion: emotionData?.emotion,
                    confidence: emotionData?.confidence,
                    inputType,
                    context,
                    priority,
                    messageLength: message.length,
                    wordCount: message.split(' ').length
                }
            };
            conversation.messages.push(userMessage);

            // Generate AI response with enhanced context awareness
            const aiResponse = await this.generateContextualResponse(
                conversation, 
                conversationTone, 
                emotionData,
                priority
            );
            
            // Add AI response with metadata
            const assistantMessage = {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
                metadata: { 
                    inputType: 'text',
                    generatedBy: 'gemini-pro',
                    conversationTone,
                    responseLength: aiResponse.length,
                    processingTime: Date.now() - startTime
                }
            };
            conversation.messages.push(assistantMessage);

            // Update conversation metadata
            await this.updateConversationMetadata(conversation, conversationTone, emotionData);
            
            // Save conversation with optimistic updates
            await this.saveConversationOptimized(conversation);

            // Update performance metrics
            this.updateMetrics(startTime);

            // Log interaction for analytics
            await this.logInteraction(userId, message, aiResponse, emotionData, {
                sessionId,
                conversationTone,
                inputType,
                responseTime: Date.now() - startTime,
                priority
            });

            return {
                response: aiResponse,
                emotion: emotionData,
                sessionId: conversation.sessionId,
                conversationId: conversation._id,
                messageCount: conversation.messages.length,
                conversationTitle: conversation.title,
                suggestedActions: this.generateSuggestedActions(emotionData, conversationTone),
                responseMetadata: {
                    processingTime: Date.now() - startTime,
                    cacheUsed: this.responseCache.has(this.generateCacheKey(conversation, conversationTone)),
                    emotionConfidence: emotionData?.confidence || 0
                }
            };

        } catch (error) {
            this.metrics.errorRate++;
            console.error('ChatbotService Error:', error);
            await this.logError(userId, error, { message, options });
            throw new Error(this.getErrorMessage(error));
        }
    }

    /**
     * Enhanced input validation with detailed error messages
     */
    validateInput(message, options) {
        if (!message || typeof message !== 'string' || !message.trim()) {
            throw new Error('Message cannot be empty');
        }

        if (message.length > 2000) {
            throw new Error('Message too long. Please keep messages under 2000 characters.');
        }

        // Validate conversation tone
        const validTones = ['supportive', 'spiritual', 'reflective', 'celebratory'];
        if (options.conversationTone && !validTones.includes(options.conversationTone)) {
            throw new Error(`Invalid conversation tone. Must be one of: ${validTones.join(', ')}`);
        }

        // Validate input type
        const validInputTypes = ['text', 'voice', 'image'];
        if (options.inputType && !validInputTypes.includes(options.inputType)) {
            throw new Error(`Invalid input type. Must be one of: ${validInputTypes.join(', ')}`);
        }
    }

    /**
     * Enhanced emotion analysis with pattern recognition
     */
    async analyzeMessageEmotion(message, inputType, conversation) {
        try {
            let emotionData;
            
            if (inputType === 'text') {
                emotionData = await analyzeTextEmotion(message);
                
                // Enhance with conversation context
                if (conversation && conversation.context?.emotionalState?.moodHistory?.length > 0) {
                    emotionData = this.enhanceEmotionWithContext(emotionData, conversation);
                }
            } else {
                // Future: Add voice and image emotion analysis
                emotionData = { emotion: 'neutral', confidence: 0.5 };
            }

            // Cache emotion patterns for learning
            this.cacheEmotionPattern(conversation.userId, emotionData);

            return emotionData;
        } catch (error) {
            console.error('Emotion analysis error:', error);
            return { emotion: 'neutral', confidence: 0.5, error: error.message };
        }
    }

    /**
     * Enhanced emotion analysis using conversation history
     */
    enhanceEmotionWithContext(emotionData, conversation) {
        const recentEmotions = conversation.context.emotionalState.moodHistory.slice(-3);
        
        if (recentEmotions.length > 0) {
            // Adjust confidence based on emotional consistency
            const consistentEmotions = recentEmotions.filter(e => e.mood === emotionData.emotion);
            if (consistentEmotions.length >= 2) {
                emotionData.confidence = Math.min(emotionData.confidence + 0.1, 0.95);
                emotionData.pattern = 'consistent';
            } else {
                emotionData.pattern = 'shifting';
            }
        }

        return emotionData;
    }

    /**
     * Generate contextually aware AI responses
     */
    async generateContextualResponse(conversation, tone, emotionData, priority) {
        try {
            // Check cache first for non-priority messages
            if (priority !== 'high') {
                const cacheKey = this.generateCacheKey(conversation, tone, emotionData);
                const cachedResponse = this.responseCache.get(cacheKey);
                if (cachedResponse) {
                    this.metrics.cacheHitRate++;
                    return cachedResponse;
                }
            }

            const user = await User.findById(conversation.userId);
            let apiKey = process.env.GEMINI_API_KEY;
            
            if (user?.geminiApiKey) {
                apiKey = user.geminiApiKey;
            }

            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            // Build enhanced context-aware prompt
            const systemPrompt = this.buildEnhancedSystemPrompt(conversation, tone, emotionData);
            const conversationHistory = this.buildConversationHistory(conversation);
            const contextualInfo = this.buildContextualInfo(conversation, emotionData);

            const prompt = `${systemPrompt}

${contextualInfo}

Recent Conversation:
${conversationHistory}

Please respond as Noor, the AI companion, with empathy, wisdom, and practical guidance. 
Keep your response concise but meaningful (2-4 sentences typically).
${emotionData ? `The user seems to be feeling ${emotionData.emotion}. Please respond with appropriate sensitivity.` : ''}`;

            const response = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: this.getTemperatureForTone(tone),
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: this.getMaxTokensForTone(tone),
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
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
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

            const processedResponse = this.postProcessResponse(aiResponse.trim(), tone, emotionData);

            // Cache the response
            if (priority !== 'high') {
                const cacheKey = this.generateCacheKey(conversation, tone, emotionData);
                this.responseCache.set(cacheKey, processedResponse);
                
                // Limit cache size
                if (this.responseCache.size > 200) {
                    const firstKey = this.responseCache.keys().next().value;
                    this.responseCache.delete(firstKey);
                }
            }

            return processedResponse;

        } catch (error) {
            console.error('Gemini API Error:', error);
            return this.getFallbackResponse(conversation, tone, emotionData);
        }
    }

    /**
     * Build enhanced system prompt with rich context
     */
    buildEnhancedSystemPrompt(conversation, tone, emotionData) {
        let basePrompt = this.systemPrompts[tone] || this.systemPrompts.supportive;
        
        // Add emotional context
        if (emotionData?.emotion && emotionData.emotion !== 'neutral') {
            basePrompt += `\n\nEMOTIONAL CONTEXT: The user's current emotional state appears to be: ${emotionData.emotion} (confidence: ${Math.round(emotionData.confidence * 100)}%). 
            Please respond with appropriate sensitivity and support for someone feeling ${emotionData.emotion}.`;
            
            if (emotionData.pattern) {
                basePrompt += ` This emotion appears to be ${emotionData.pattern} based on recent conversation history.`;
            }
        }

        // Add spiritual context
        const spiritualPrefs = conversation.context?.spiritualPreferences;
        if (spiritualPrefs?.religion) {
            basePrompt += `\n\nSPIRITUAL CONTEXT: The user has indicated their spiritual background as: ${spiritualPrefs.religion}. 
            Please respect and incorporate relevant spiritual wisdom when appropriate, while remaining inclusive of all faiths.`;
        }

        // Add conversation context
        const messageCount = conversation.messages.length;
        if (messageCount > 10) {
            basePrompt += `\n\nCONVERSATION CONTEXT: This is an ongoing conversation with ${Math.floor(messageCount/2)} exchanges. 
            Build upon previous exchanges and show continuity in your responses. Reference earlier topics when relevant.`;
        }

        // Add time context
        const hour = new Date().getHours();
        if (hour < 6) {
            basePrompt += `\n\nTIME CONTEXT: It's very early morning. The user may be having trouble sleeping or starting their day early. Be mindful of this timing.`;
        } else if (hour >= 22) {
            basePrompt += `\n\nTIME CONTEXT: It's late evening. The user may be winding down or reflecting on their day. Consider this in your response.`;
        }

        return basePrompt;
    }

    /**
     * Generate suggested actions based on context
     */
    generateSuggestedActions(emotionData, conversationTone) {
        const actions = [];

        if (emotionData?.emotion) {
            switch (emotionData.emotion) {
                case 'anxious':
                    actions.push(
                        { type: 'breathing', text: 'Try a breathing exercise', icon: '🫁' },
                        { type: 'meditation', text: 'Start a short meditation', icon: '🧘' },
                        { type: 'journal', text: 'Write about your worries', icon: '📝' }
                    );
                    break;
                case 'sad':
                    actions.push(
                        { type: 'gratitude', text: 'Practice gratitude', icon: '🙏' },
                        { type: 'support', text: 'Reach out to someone', icon: '💬' },
                        { type: 'selfcare', text: 'Do something kind for yourself', icon: '💝' }
                    );
                    break;
                case 'happy':
                    actions.push(
                        { type: 'share', text: 'Share your joy', icon: '✨' },
                        { type: 'gratitude', text: 'Express gratitude', icon: '🙏' },
                        { type: 'celebrate', text: 'Celebrate this moment', icon: '🎉' }
                    );
                    break;
                case 'spiritual':
                    actions.push(
                        { type: 'prayer', text: 'Take time for prayer', icon: '🤲' },
                        { type: 'reflection', text: 'Spiritual reflection', icon: '🌟' },
                        { type: 'reading', text: 'Read spiritual texts', icon: '📖' }
                    );
                    break;
            }
        }

        // Add tone-specific actions
        if (conversationTone === 'spiritual') {
            actions.push({ type: 'tasbih', text: 'Digital Tasbih', icon: '📿' });
        }

        return actions.slice(0, 3); // Limit to 3 suggestions
    }

    /**
     * Enhanced conversation history with better context
     */
    buildConversationHistory(conversation) {
        return conversation.messages
            .slice(-8) // Last 8 messages for better context
            .map(msg => {
                const role = msg.role === 'user' ? 'User' : 'Noor';
                const emotion = msg.metadata?.emotion ? ` [feeling ${msg.metadata.emotion}]` : '';
                const timestamp = msg.timestamp ? ` (${new Date(msg.timestamp).toLocaleTimeString()})` : '';
                return `${role}${emotion}${timestamp}: ${msg.content}`;
            })
            .join('\n');
    }

    /**
     * Enhanced contextual information building
     */
    buildContextualInfo(conversation, emotionData) {
        let info = '';

        // Recent mood patterns with analysis
        if (conversation?.context?.emotionalState?.moodHistory?.length > 0) {
            const recentMoods = conversation.context.emotionalState.moodHistory
                .slice(-5)
                .map(m => m.mood);
            
            const moodCounts = recentMoods.reduce((acc, mood) => {
                acc[mood] = (acc[mood] || 0) + 1;
                return acc;
            }, {});
            
            const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
                moodCounts[a] > moodCounts[b] ? a : b
            );
            
            info += `EMOTIONAL PATTERNS: Recent moods: ${recentMoods.join(' → ')}. `;
            info += `Dominant recent emotion: ${dominantMood}. `;
            
            if (emotionData?.pattern) {
                info += `Current pattern: ${emotionData.pattern}. `;
            }
        }

        // Time and context awareness
        const hour = new Date().getHours();
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        
        info += `TEMPORAL CONTEXT: It's ${hour}:00 on ${dayOfWeek}. `;
        
        if (hour < 6) {
            info += 'Very early morning - user may be having sleep issues or starting early. ';
        } else if (hour < 12) {
            info += 'Morning - good time for setting intentions and positive energy. ';
        } else if (hour < 18) {
            info += 'Afternoon - user may be dealing with daily stresses or midday challenges. ';
        } else if (hour < 22) {
            info += 'Evening - good time for reflection and winding down. ';
        } else {
            info += 'Late evening - user may be processing the day or having trouble sleeping. ';
        }

        // Conversation length context
        const messageCount = conversation.messages.length;
        if (messageCount > 20) {
            info += `RELATIONSHIP CONTEXT: This is a deep, ongoing conversation (${Math.floor(messageCount/2)} exchanges). Show familiarity and continuity. `;
        } else if (messageCount > 10) {
            info += `RELATIONSHIP CONTEXT: This is a developing conversation. Build on previous exchanges. `;
        } else {
            info += `RELATIONSHIP CONTEXT: This is a newer conversation. Focus on building trust and understanding. `;
        }

        return info;
    }

    /**
     * Get temperature setting based on conversation tone
     */
    getTemperatureForTone(tone) {
        const temperatures = {
            spiritual: 0.6,    // More focused and reverent
            supportive: 0.7,   // Balanced empathy and consistency
            reflective: 0.8,   // More creative for thought-provoking questions
            celebratory: 0.9   // More expressive and enthusiastic
        };
        return temperatures[tone] || 0.7;
    }

    /**
     * Get max tokens based on conversation tone
     */
    getMaxTokensForTone(tone) {
        const maxTokens = {
            spiritual: 180,    // Concise wisdom
            supportive: 200,   // Detailed emotional support
            reflective: 220,   // Room for thoughtful questions
            celebratory: 160   // Enthusiastic but focused
        };
        return maxTokens[tone] || 200;
    }

    /**
     * Enhanced post-processing with tone-specific adjustments
     */
    postProcessResponse(response, tone, emotionData) {
        // Remove markdown formatting
        let cleanResponse = response
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .trim();

        // Ensure appropriate length
        if (cleanResponse.length > 600) {
            const sentences = cleanResponse.split('. ');
            cleanResponse = sentences.slice(0, 4).join('. ') + (sentences.length > 4 ? '.' : '');
        }

        // Add tone-specific enhancements
        if (tone === 'spiritual' && !cleanResponse.includes('peace') && !cleanResponse.includes('blessing')) {
            // Ensure spiritual responses have appropriate language
            if (Math.random() < 0.3) {
                cleanResponse += ' May you find peace in this moment.';
            }
        }

        // Ensure minimum response quality
        if (cleanResponse.length < 20) {
            return this.getFallbackResponse(null, tone, emotionData);
        }

        return cleanResponse;
    }

    /**
     * Enhanced fallback responses with context awareness
     */
    getFallbackResponse(conversation, tone = 'supportive', emotionData = null) {
        const currentEmotion = emotionData?.emotion || conversation?.context?.emotionalState?.currentMood;
        
        const emotionResponses = {
            sad: [
                "I can sense you're going through a difficult time. Your feelings are completely valid, and I'm here to listen and support you.",
                "It's okay to feel sad sometimes. These emotions are part of being human. What would help you feel a little lighter right now?",
                "I hear the pain in your words. You don't have to carry this alone. What's weighing most heavily on your heart?"
            ],
            anxious: [
                "I can feel the worry in your message. Take a deep breath with me. You're safe in this moment, and we can work through this together.",
                "Anxiety can feel overwhelming, but you're stronger than you know. What's one small thing that might bring you a moment of calm?",
                "It sounds like your mind is racing right now. Let's slow down together. What's the most important thing you need right now?"
            ],
            angry: [
                "I hear the frustration in your words. It's okay to feel angry - these emotions are part of being human. What's behind these feelings?",
                "Your anger is valid. Sometimes we get angry when something important to us is threatened. What matters most to you in this situation?",
                "I can sense your frustration. Anger often carries important information. What is it trying to tell you?"
            ],
            happy: [
                "I'm so glad to hear the joy in your message! It's wonderful when we can find moments of happiness. What's bringing you this joy?",
                "Your happiness is contagious! I love hearing about the good things in your life. Tell me more about what's making you smile.",
                "What a beautiful moment of joy! These are the moments worth savoring. How can you carry this feeling forward?"
            ],
            spiritual: [
                "Thank you for sharing your spiritual thoughts with me. Faith and spirituality can be such sources of strength and comfort.",
                "I'm honored that you're sharing your spiritual journey with me. How is your faith supporting you right now?",
                "Your spiritual awareness is beautiful. How can we nurture this connection you're feeling?"
            ]
        };

        const toneResponses = {
            spiritual: [
                "I'm here to walk alongside you on your spiritual journey. How can I support your faith today?",
                "May you find peace and guidance in this moment. What spiritual wisdom are you seeking?",
                "Your spiritual growth is a beautiful journey. How can we explore your faith together?"
            ],
            supportive: [
                "I'm here to listen and support you. Could you tell me more about what's on your mind?",
                "Thank you for sharing with me. How are you feeling right now?",
                "I appreciate you opening up. What would be most helpful for you in this moment?"
            ],
            reflective: [
                "That's a thoughtful question. What insights are you discovering about yourself?",
                "I'm curious about your perspective. What patterns are you noticing in your life?",
                "Your self-awareness is growing. What would you like to explore more deeply?"
            ],
            celebratory: [
                "That's wonderful news! I'm so happy for you. How does this success feel?",
                "What an amazing achievement! You should be proud of yourself. What made this possible?",
                "I love celebrating good news with you! What's the best part about this experience?"
            ]
        };

        // Choose response based on emotion first, then tone
        let responses = [];
        if (currentEmotion && emotionResponses[currentEmotion]) {
            responses = emotionResponses[currentEmotion];
        } else if (toneResponses[tone]) {
            responses = toneResponses[tone];
        } else {
            responses = [
                "I'm here to listen and support you through whatever you're experiencing. What's on your heart today?",
                "Thank you for trusting me with your thoughts. How can I best support you right now?",
                "Your feelings are valid and important. Would you like to explore this further together?",
                "I'm here to support you on your journey. What would be most helpful for you in this moment?"
            ];
        }

        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
    }

    /**
     * Enhanced conversation metadata updates
     */
    async updateConversationMetadata(conversation, conversationTone, emotionData) {
        conversation.lastActivity = new Date();
        conversation.context.conversationTone = conversationTone;
        
        // Auto-generate conversation title if it's still default
        if (conversation.title === 'New Conversation' && conversation.messages.length >= 4) {
            conversation.title = await this.generateConversationTitle(conversation);
        }
        
        // Update conversation statistics
        if (!conversation.stats) {
            conversation.stats = {
                totalMessages: 0,
                emotionCounts: {},
                averageResponseTime: 0,
                lastEmotions: []
            };
        }
        
        conversation.stats.totalMessages = conversation.messages.length;
        
        if (emotionData?.emotion) {
            conversation.stats.emotionCounts[emotionData.emotion] = 
                (conversation.stats.emotionCounts[emotionData.emotion] || 0) + 1;
            
            conversation.stats.lastEmotions.push({
                emotion: emotionData.emotion,
                confidence: emotionData.confidence,
                timestamp: new Date()
            });
            
            // Keep only last 10 emotions
            if (conversation.stats.lastEmotions.length > 10) {
                conversation.stats.lastEmotions = conversation.stats.lastEmotions.slice(-10);
            }
        }
        
        // Keep only last 30 messages for performance
        if (conversation.messages.length > 30) {
            conversation.messages = conversation.messages.slice(-30);
        }
    }

    /**
     * Optimized conversation saving with error handling
     */
    async saveConversationOptimized(conversation) {
        try {
            await conversation.save();
            
            // Update cache
            this.conversationCache.set(conversation.sessionId, conversation);
            
            // Limit cache size
            if (this.conversationCache.size > 150) {
                const firstKey = this.conversationCache.keys().next().value;
                this.conversationCache.delete(firstKey);
            }
        } catch (error) {
            console.error('Failed to save conversation:', error);
            // Don't throw error to avoid breaking the user experience
            // Log for monitoring but continue
        }
    }

    /**
     * Enhanced cache key generation
     */
    generateCacheKey(conversation, tone, emotionData) {
        const lastMessage = conversation.messages[conversation.messages.length - 1]?.content || '';
        const emotion = emotionData?.emotion || conversation.context?.emotionalState?.currentMood || 'neutral';
        const messageCount = Math.floor(conversation.messages.length / 5) * 5; // Group by 5s
        return `${tone}-${emotion}-${messageCount}-${lastMessage.substring(0, 30)}`;
    }

    /**
     * Cache emotion patterns for learning
     */
    cacheEmotionPattern(userId, emotionData) {
        if (!this.emotionPatternCache.has(userId)) {
            this.emotionPatternCache.set(userId, []);
        }
        
        const patterns = this.emotionPatternCache.get(userId);
        patterns.push({
            emotion: emotionData.emotion,
            confidence: emotionData.confidence,
            timestamp: new Date()
        });
        
        // Keep only last 50 patterns per user
        if (patterns.length > 50) {
            patterns.splice(0, patterns.length - 50);
        }
    }

    /**
     * Update performance metrics
     */
    updateMetrics(startTime) {
        const responseTime = Date.now() - startTime;
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime + responseTime) / 2;
    }

    /**
     * Setup cleanup intervals for memory management
     */
    setupCleanupIntervals() {
        // Clean up caches every 30 minutes
        setInterval(() => {
            this.cleanupCaches();
        }, 30 * 60 * 1000);

        // Reset metrics every hour
        setInterval(() => {
            this.resetMetrics();
        }, 60 * 60 * 1000);
    }

    /**
     * Clean up caches to prevent memory leaks
     */
    cleanupCaches() {
        // Clean conversation cache
        if (this.conversationCache.size > 100) {
            const entries = Array.from(this.conversationCache.entries());
            const toDelete = entries.slice(0, entries.length - 100);
            toDelete.forEach(([key]) => this.conversationCache.delete(key));
        }

        // Clean response cache
        if (this.responseCache.size > 150) {
            const entries = Array.from(this.responseCache.entries());
            const toDelete = entries.slice(0, entries.length - 150);
            toDelete.forEach(([key]) => this.responseCache.delete(key));
        }

        // Clean emotion pattern cache
        for (const [userId, patterns] of this.emotionPatternCache.entries()) {
            if (patterns.length > 30) {
                this.emotionPatternCache.set(userId, patterns.slice(-30));
            }
        }
    }

    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 0,
            cacheHitRate: 0
        };
    }

    /**
     * Get user-friendly error messages
     */
    getErrorMessage(error) {
        if (error.message.includes('Message too long')) {
            return error.message;
        } else if (error.message.includes('API key')) {
            return 'AI service configuration error. Please contact support.';
        } else if (error.message.includes('timeout')) {
            return 'Response timeout. Please try again.';
        } else if (error.message.includes('rate limit')) {
            return 'Too many requests. Please wait a moment before trying again.';
        } else {
            return 'I encountered an error processing your message. Please try again.';
        }
    }

    // ... (keeping existing methods like getOrCreateConversation, updateEmotionalContext, etc.)
    // ... (keeping existing methods like getConversationHistory, getConversationById, etc.)
    // ... (keeping existing methods like updateConversationTitle, deleteConversation, etc.)
    // ... (keeping existing methods like getAnalytics, logInteraction, logError, etc.)

    /**
     * Get service health and performance metrics
     */
    getHealthMetrics() {
        return {
            status: 'healthy',
            metrics: this.metrics,
            cacheStats: {
                conversationCacheSize: this.conversationCache.size,
                responseCacheSize: this.responseCache.size,
                emotionPatternCacheSize: this.emotionPatternCache.size
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Cleanup method to prevent memory leaks
     */
    cleanup() {
        this.conversationCache.clear();
        this.responseCache.clear();
        this.emotionPatternCache.clear();
    }
}

module.exports = new ChatbotService();