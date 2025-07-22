const axios = require('axios');
const MoodEntry = require('../models/MoodEntry');
const User = require('../models/User');
const { analyzeTextEmotion } = require('../utils/emotionAnalysis');
const natural = require('natural');

/**
 * Comprehensive Mood Detection Service for Mirror of Heart
 * Provides advanced emotion analysis with spiritual context awareness
 */
class MoodDetectionService {
    constructor() {
        // Enhanced emotion categories with spiritual context
        this.emotionCategories = {
            peaceful: {
                keywords: ['calm', 'serene', 'tranquil', 'peaceful', 'relaxed', 'centered', 'balanced', 'still'],
                spiritualContext: 'inner peace',
                guidance: 'Continue nurturing this beautiful state of peace through mindfulness and gratitude',
                color: '#4ade80',
                intensity: 'positive',
                practices: ['meditation', 'dhikr', 'contemplation']
            },
            grateful: {
                keywords: ['thankful', 'blessed', 'grateful', 'appreciative', 'fortunate', 'abundance'],
                spiritualContext: 'gratitude and blessings',
                guidance: 'Your gratitude opens doors to more blessings. Share this joy with others',
                color: '#f59e0b',
                intensity: 'positive',
                practices: ['gratitude prayer', 'thanksgiving', 'charity']
            },
            anxious: {
                keywords: ['worried', 'anxious', 'nervous', 'stressed', 'overwhelmed', 'panic', 'fear', 'uncertain'],
                spiritualContext: 'seeking divine comfort',
                guidance: 'In times of anxiety, remember that you are held by divine love and protection',
                color: '#ef4444',
                intensity: 'negative',
                practices: ['breathing exercises', 'prayer', 'seeking refuge']
            },
            sad: {
                keywords: ['sad', 'depressed', 'down', 'upset', 'hurt', 'pain', 'sorrow', 'grief', 'lonely'],
                spiritualContext: 'healing and comfort',
                guidance: 'Your pain is seen and acknowledged. Healing comes through patience and faith',
                color: '#3b82f6',
                intensity: 'negative',
                practices: ['prayer for healing', 'community support', 'remembrance']
            },
            joyful: {
                keywords: ['happy', 'joy', 'excited', 'wonderful', 'amazing', 'great', 'fantastic', 'delighted'],
                spiritualContext: 'divine joy',
                guidance: 'Your joy is a gift from the divine. Let it illuminate your path and inspire others',
                color: '#10b981',
                intensity: 'positive',
                practices: ['celebration', 'sharing joy', 'praise']
            },
            spiritual: {
                keywords: ['pray', 'prayer', 'god', 'allah', 'divine', 'blessed', 'faith', 'spiritual', 'meditation', 'worship'],
                spiritualContext: 'divine connection',
                guidance: 'Your spiritual awareness is growing. Continue to nurture this sacred connection',
                color: '#8b5cf6',
                intensity: 'transcendent',
                practices: ['prayer', 'meditation', 'study', 'worship']
            },
            angry: {
                keywords: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed', 'rage', 'hate'],
                spiritualContext: 'seeking patience',
                guidance: 'Channel this energy toward positive change. Seek patience and understanding',
                color: '#dc2626',
                intensity: 'negative',
                practices: ['patience prayer', 'forgiveness', 'cooling down']
            },
            hopeful: {
                keywords: ['hopeful', 'optimistic', 'confident', 'positive', 'encouraged', 'inspired'],
                spiritualContext: 'divine hope',
                guidance: 'Hope is a light in darkness. Trust in the divine plan unfolding',
                color: '#06b6d4',
                intensity: 'positive',
                practices: ['hope prayers', 'positive affirmations', 'trust building']
            },
            neutral: {
                keywords: ['okay', 'fine', 'normal', 'regular', 'usual', 'average'],
                spiritualContext: 'balanced state',
                guidance: 'In stillness, there is wisdom. Use this balanced time for reflection',
                color: '#6b7280',
                intensity: 'neutral',
                practices: ['reflection', 'mindfulness', 'preparation']
            }
        };

        // Spiritual traditions and their contexts
        this.spiritualTraditions = {
            Islam: {
                practices: ['salah', 'dhikr', 'dua', 'quran', 'tasbih'],
                keywords: ['allah', 'prophet', 'islam', 'muslim', 'quran', 'prayer', 'mosque', 'ramadan'],
                guidance: {
                    anxious: "Remember Allah's promise: 'And whoever relies upon Allah - then He is sufficient for him.'",
                    grateful: "Say 'Alhamdulillahi rabbil alameen' - All praise is due to Allah, Lord of the worlds.",
                    sad: "Allah is with those who are patient. Your trials are a test and purification."
                }
            },
            Christianity: {
                practices: ['prayer', 'bible study', 'worship', 'communion', 'fellowship'],
                keywords: ['jesus', 'christ', 'god', 'lord', 'bible', 'church', 'prayer', 'faith'],
                guidance: {
                    anxious: "Cast all your anxiety on Him because He cares for you. (1 Peter 5:7)",
                    grateful: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
                    sad: "The Lord is close to the brokenhearted and saves those who are crushed in spirit."
                }
            },
            Judaism: {
                practices: ['prayer', 'torah study', 'shabbat', 'mitzvot', 'meditation'],
                keywords: ['hashem', 'torah', 'shabbat', 'synagogue', 'rabbi', 'jewish', 'hebrew'],
                guidance: {
                    anxious: "Cast your burden upon the Lord, and He will sustain you.",
                    grateful: "Blessed are You, Lord our God, King of the universe.",
                    sad: "The Lord is near to all who call upon Him in truth."
                }
            },
            Universal: {
                practices: ['meditation', 'mindfulness', 'gratitude', 'compassion', 'service'],
                keywords: ['universe', 'energy', 'consciousness', 'mindfulness', 'compassion'],
                guidance: {
                    anxious: "You are connected to the infinite source of peace and strength.",
                    grateful: "Gratitude opens the door to abundance and joy.",
                    sad: "This too shall pass. You are held by love greater than you know."
                }
            }
        };

        // Performance monitoring
        this.metrics = {
            totalAnalyses: 0,
            averageProcessingTime: 0,
            accuracyFeedback: [],
            cacheHitRate: 0
        };

        // Simple cache for repeated analyses
        this.analysisCache = new Map();
        this.userContextCache = new Map();

        // Setup cleanup intervals
        this.setupCleanupIntervals();
    }

    /**
     * Main mood analysis method
     * @param {string} userId - User ID
     * @param {Object} input - Input data (text, audio, image)
     * @param {Object} options - Analysis options
     * @returns {Object} Comprehensive mood analysis results
     */
    async analyzeMood(userId, input, options = {}) {
        const startTime = Date.now();
        this.metrics.totalAnalyses++;

        try {
            const {
                includeInsights = true,
                includeSuggestions = true,
                saveToHistory = true,
                priority = 'normal'
            } = options;

            // Validate input
            this.validateInput(input);

            // Get user context for personalization
            const userContext = await this.getUserContext(userId);

            // Perform emotion analysis based on input type
            let analysisResult;
            switch (input.type) {
                case 'text':
                    analysisResult = await this.analyzeTextMood(input.content, userContext);
                    break;
                case 'voice':
                    analysisResult = await this.analyzeVoiceMood(input.audioData, input.content, userContext);
                    break;
                case 'image':
                    analysisResult = await this.analyzeImageMood(input.imageData, userContext);
                    break;
                case 'combined':
                    analysisResult = await this.analyzeCombinedMood(input, userContext);
                    break;
                default:
                    throw new Error('Invalid input type');
            }

            // Enhance with spiritual context
            const spiritualContext = await this.analyzeSpiritualContext(
                input.content || '', 
                userContext
            );

            // Generate insights if requested
            let insights = [];
            if (includeInsights) {
                insights = await this.generateInsights(analysisResult, spiritualContext, userContext);
            }

            // Generate suggestions if requested
            let suggestions = [];
            if (includeSuggestions) {
                suggestions = await this.generateSuggestions(analysisResult, spiritualContext, userContext);
            }

            // Get personalized guidance
            const personalizedGuidance = await this.getPersonalizedGuidance(
                analysisResult, 
                spiritualContext, 
                userContext
            );

            const processingTime = Date.now() - startTime;
            this.updateMetrics(processingTime);

            // Prepare comprehensive result
            const result = {
                primaryEmotion: analysisResult.emotion,
                confidence: analysisResult.confidence,
                intensity: this.calculateIntensity(analysisResult),
                emotions: analysisResult.scores || { [analysisResult.emotion]: analysisResult.confidence },
                analysisType: input.type,
                spiritualContext,
                insights,
                suggestions,
                userContext: {
                    spiritualBackground: userContext.spiritualBackground,
                    emotionalPatterns: userContext.emotionalPatterns,
                    analysisHistory: userContext.analysisHistory
                },
                personalizedGuidance,
                processingTime,
                timestamp: new Date().toISOString(),
                cacheUsed: this.analysisCache.has(this.generateCacheKey(input, userId))
            };

            // Save to history if requested
            if (saveToHistory) {
                await this.saveMoodEntry(userId, result, input);
            }

            return result;

        } catch (error) {
            console.error('Mood Analysis Error:', error);
            throw new Error(`Mood analysis failed: ${error.message}`);
        }
    }

    /**
     * Analyze text-based mood with enhanced NLP
     */
    async analyzeTextMood(text, userContext) {
        try {
            // Check cache first
            const cacheKey = this.generateTextCacheKey(text);
            if (this.analysisCache.has(cacheKey)) {
                this.metrics.cacheHitRate++;
                return this.analysisCache.get(cacheKey);
            }

            // Enhanced text analysis using multiple approaches
            const basicAnalysis = await analyzeTextEmotion(text);
            const nlpAnalysis = await this.performNLPAnalysis(text);
            const contextualAnalysis = await this.performContextualAnalysis(text, userContext);

            // Combine analyses with weighted scoring
            const combinedResult = this.combineAnalyses([
                { result: basicAnalysis, weight: 0.4 },
                { result: nlpAnalysis, weight: 0.3 },
                { result: contextualAnalysis, weight: 0.3 }
            ]);

            // Cache the result
            this.analysisCache.set(cacheKey, combinedResult);
            
            return combinedResult;

        } catch (error) {
            console.error('Text mood analysis error:', error);
            return { emotion: 'neutral', confidence: 0.5, scores: { neutral: 0.5 } };
        }
    }

    /**
     * Analyze voice-based mood (currently uses transcript analysis)
     */
    async analyzeVoiceMood(audioData, transcript, userContext) {
        try {
            // For now, analyze the transcript if available
            if (transcript) {
                const textAnalysis = await this.analyzeTextMood(transcript, userContext);
                
                // Future: Add actual audio analysis here
                // const audioFeatures = await this.extractAudioFeatures(audioData);
                // const voiceAnalysis = await this.analyzeVoiceFeatures(audioFeatures);
                
                return {
                    ...textAnalysis,
                    analysisMethod: 'transcript', // Will be 'voice' when audio analysis is implemented
                    hasAudioData: !!audioData
                };
            }

            return { emotion: 'neutral', confidence: 0.5, scores: { neutral: 0.5 } };

        } catch (error) {
            console.error('Voice mood analysis error:', error);
            return { emotion: 'neutral', confidence: 0.5, scores: { neutral: 0.5 } };
        }
    }

    /**
     * Analyze image-based mood (placeholder for future implementation)
     */
    async analyzeImageMood(imageData, userContext) {
        try {
            // Future: Implement actual image emotion analysis
            // This would involve:
            // 1. Face detection
            // 2. Facial expression analysis
            // 3. Color psychology analysis
            // 4. Contextual scene analysis

            return { 
                emotion: 'neutral', 
                confidence: 0.5, 
                scores: { neutral: 0.5 },
                analysisMethod: 'placeholder',
                hasImageData: !!imageData
            };

        } catch (error) {
            console.error('Image mood analysis error:', error);
            return { emotion: 'neutral', confidence: 0.5, scores: { neutral: 0.5 } };
        }
    }

    /**
     * Analyze combined inputs (text + voice + image)
     */
    async analyzeCombinedMood(input, userContext) {
        try {
            const analyses = [];

            if (input.content) {
                const textAnalysis = await this.analyzeTextMood(input.content, userContext);
                analyses.push({ result: textAnalysis, weight: 0.5 });
            }

            if (input.audioData) {
                const voiceAnalysis = await this.analyzeVoiceMood(input.audioData, input.content, userContext);
                analyses.push({ result: voiceAnalysis, weight: 0.3 });
            }

            if (input.imageData) {
                const imageAnalysis = await this.analyzeImageMood(input.imageData, userContext);
                analyses.push({ result: imageAnalysis, weight: 0.2 });
            }

            if (analyses.length === 0) {
                throw new Error('No valid input provided for combined analysis');
            }

            return this.combineAnalyses(analyses);

        } catch (error) {
            console.error('Combined mood analysis error:', error);
            return { emotion: 'neutral', confidence: 0.5, scores: { neutral: 0.5 } };
        }
    }

    /**
     * Perform advanced NLP analysis using natural library
     */
    async performNLPAnalysis(text) {
        try {
            const tokenizer = new natural.WordTokenizer();
            const stemmer = natural.PorterStemmer;
            const sentiment = new natural.SentimentAnalyzer('English', 
                natural.PorterStemmer, 'afinn');

            // Tokenize and stem
            const tokens = tokenizer.tokenize(text.toLowerCase());
            const stemmedTokens = tokens.map(token => stemmer.stem(token));

            // Sentiment analysis
            const sentimentScore = sentiment.getSentiment(stemmedTokens);

            // Map sentiment to emotions
            let emotion = 'neutral';
            let confidence = 0.5;

            if (sentimentScore > 0.3) {
                emotion = 'joyful';
                confidence = Math.min(0.6 + (sentimentScore * 0.3), 0.95);
            } else if (sentimentScore < -0.3) {
                emotion = 'sad';
                confidence = Math.min(0.6 + (Math.abs(sentimentScore) * 0.3), 0.95);
            } else if (sentimentScore > 0.1) {
                emotion = 'peaceful';
                confidence = 0.6;
            } else if (sentimentScore < -0.1) {
                emotion = 'anxious';
                confidence = 0.6;
            }

            return {
                emotion,
                confidence,
                scores: { [emotion]: confidence },
                sentimentScore,
                method: 'nlp'
            };

        } catch (error) {
            console.error('NLP analysis error:', error);
            return { emotion: 'neutral', confidence: 0.5, scores: { neutral: 0.5 } };
        }
    }

    /**
     * Perform contextual analysis based on user history
     */
    async performContextualAnalysis(text, userContext) {
        try {
            // Analyze based on user's emotional patterns
            const recentEmotions = userContext.emotionalPatterns?.dominantEmotions || [];
            const timeOfDay = new Date().getHours();
            
            let contextualEmotion = 'neutral';
            let confidence = 0.5;

            // Time-based context
            if (timeOfDay < 6 || timeOfDay > 22) {
                // Late night/early morning - might indicate anxiety or reflection
                if (text.includes('can\'t sleep') || text.includes('worried')) {
                    contextualEmotion = 'anxious';
                    confidence = 0.7;
                }
            } else if (timeOfDay >= 6 && timeOfDay < 12) {
                // Morning - often more positive
                if (text.includes('new day') || text.includes('morning')) {
                    contextualEmotion = 'hopeful';
                    confidence = 0.6;
                }
            }

            // Pattern-based context
            if (recentEmotions.length > 0) {
                const dominantEmotion = recentEmotions[0];
                // If user has been consistently sad, neutral text might still indicate sadness
                if (dominantEmotion === 'sad' && contextualEmotion === 'neutral') {
                    contextualEmotion = 'sad';
                    confidence = 0.6;
                }
            }

            return {
                emotion: contextualEmotion,
                confidence,
                scores: { [contextualEmotion]: confidence },
                method: 'contextual'
            };

        } catch (error) {
            console.error('Contextual analysis error:', error);
            return { emotion: 'neutral', confidence: 0.5, scores: { neutral: 0.5 } };
        }
    }

    /**
     * Combine multiple analysis results with weighted scoring
     */
    combineAnalyses(analyses) {
        try {
            const emotionScores = {};
            let totalWeight = 0;

            // Combine weighted scores
            analyses.forEach(({ result, weight }) => {
                totalWeight += weight;
                
                if (result.scores) {
                    Object.entries(result.scores).forEach(([emotion, score]) => {
                        if (!emotionScores[emotion]) {
                            emotionScores[emotion] = 0;
                        }
                        emotionScores[emotion] += score * weight;
                    });
                } else {
                    // Single emotion result
                    if (!emotionScores[result.emotion]) {
                        emotionScores[result.emotion] = 0;
                    }
                    emotionScores[result.emotion] += result.confidence * weight;
                }
            });

            // Normalize scores
            Object.keys(emotionScores).forEach(emotion => {
                emotionScores[emotion] /= totalWeight;
            });

            // Find dominant emotion
            const dominantEmotion = Object.keys(emotionScores).reduce((a, b) => 
                emotionScores[a] > emotionScores[b] ? a : b
            );

            return {
                emotion: dominantEmotion,
                confidence: emotionScores[dominantEmotion],
                scores: emotionScores,
                method: 'combined'
            };

        } catch (error) {
            console.error('Analysis combination error:', error);
            return { emotion: 'neutral', confidence: 0.5, scores: { neutral: 0.5 } };
        }
    }

    /**
     * Analyze spiritual context in the text
     */
    async analyzeSpiritualContext(text, userContext) {
        try {
            const textLower = text.toLowerCase();
            let spiritualScore = 0;
            let detectedTerms = {
                spiritual: [],
                religious: [],
                practices: []
            };
            let suggestedTradition = null;

            // Check for spiritual/religious terms
            Object.entries(this.spiritualTraditions).forEach(([tradition, data]) => {
                let traditionScore = 0;
                
                data.keywords.forEach(keyword => {
                    if (textLower.includes(keyword)) {
                        traditionScore += 1;
                        spiritualScore += 0.1;
                        detectedTerms.religious.push(keyword);
                    }
                });

                data.practices.forEach(practice => {
                    if (textLower.includes(practice)) {
                        traditionScore += 1;
                        spiritualScore += 0.15;
                        detectedTerms.practices.push(practice);
                    }
                });

                if (traditionScore > 0 && (!suggestedTradition || traditionScore > suggestedTradition.score)) {
                    suggestedTradition = { tradition, score: traditionScore };
                }
            });

            // Check for general spiritual terms
            const generalSpiritualTerms = [
                'soul', 'spirit', 'divine', 'sacred', 'holy', 'blessed', 'prayer', 
                'meditation', 'faith', 'belief', 'worship', 'gratitude', 'peace',
                'love', 'compassion', 'forgiveness', 'wisdom', 'truth', 'light'
            ];

            generalSpiritualTerms.forEach(term => {
                if (textLower.includes(term)) {
                    spiritualScore += 0.05;
                    detectedTerms.spiritual.push(term);
                }
            });

            // Consider user's spiritual background
            if (userContext.spiritualBackground) {
                spiritualScore += 0.1; // Boost if user has spiritual background
            }

            const isSpiritual = spiritualScore > 0.2;

            return {
                isSpiritual,
                score: Math.min(spiritualScore, 1.0),
                detectedTerms,
                suggestedTradition: suggestedTradition?.tradition || userContext.spiritualBackground
            };

        } catch (error) {
            console.error('Spiritual context analysis error:', error);
            return {
                isSpiritual: false,
                score: 0,
                detectedTerms: { spiritual: [], religious: [], practices: [] }
            };
        }
    }

    /**
     * Generate insights based on analysis results
     */
    async generateInsights(analysisResult, spiritualContext, userContext) {
        const insights = [];

        try {
            // Confidence-based insights
            if (analysisResult.confidence > 0.8) {
                insights.push({
                    type: 'confidence',
                    message: `Your ${analysisResult.emotion} emotion comes through very clearly in your expression.`,
                    icon: '🎯'
                });
            } else if (analysisResult.confidence < 0.6) {
                insights.push({
                    type: 'uncertainty',
                    message: 'Your emotions seem mixed right now, which is completely normal.',
                    icon: '🤔'
                });
            }

            // Spiritual insights
            if (spiritualContext.isSpiritual) {
                insights.push({
                    type: 'spiritual',
                    message: 'I notice spiritual themes in your thoughts. Your faith journey is important.',
                    icon: '✨'
                });
            }

            // Pattern-based insights
            if (userContext.emotionalPatterns?.recentTrend) {
                const trend = userContext.emotionalPatterns.recentTrend;
                if (trend === 'improving') {
                    insights.push({
                        type: 'trend',
                        message: 'Your emotional well-being has been trending positively recently.',
                        icon: '📈'
                    });
                } else if (trend === 'declining') {
                    insights.push({
                        type: 'trend',
                        message: 'I notice you\'ve been going through some challenges lately. You\'re not alone.',
                        icon: '🤗'
                    });
                }
            }

            // Time-based insights
            const hour = new Date().getHours();
            if (hour < 6 && analysisResult.emotion === 'anxious') {
                insights.push({
                    type: 'temporal',
                    message: 'Late-night anxiety is common. Consider some calming practices before sleep.',
                    icon: '🌙'
                });
            }

        } catch (error) {
            console.error('Insight generation error:', error);
        }

        return insights;
    }

    /**
     * Generate personalized suggestions based on analysis
     */
    async generateSuggestions(analysisResult, spiritualContext, userContext) {
        const suggestions = [];

        try {
            const emotion = analysisResult.emotion;
            const intensity = this.calculateIntensity(analysisResult);
            const tradition = spiritualContext.suggestedTradition || 'Universal';

            // Emotion-specific suggestions
            switch (emotion) {
                case 'anxious':
                    suggestions.push(
                        {
                            type: 'breathing',
                            title: 'Breathing Exercise',
                            description: 'Try a 4-7-8 breathing pattern to calm your nervous system',
                            action: 'breathing_exercise',
                            icon: '🫁'
                        },
                        {
                            type: 'prayer',
                            title: 'Calming Prayer',
                            description: 'Take a moment for prayer or meditation to find peace',
                            action: 'prayer_time',
                            icon: '🤲'
                        }
                    );
                    break;

                case 'sad':
                    suggestions.push(
                        {
                            type: 'gratitude',
                            title: 'Gratitude Practice',
                            description: 'List three things you\'re grateful for today',
                            action: 'gratitude_practice',
                            icon: '🙏'
                        },
                        {
                            type: 'connection',
                            title: 'Reach Out',
                            description: 'Connect with someone who cares about you',
                            action: 'social_connection',
                            icon: '💬'
                        }
                    );
                    break;

                case 'joyful':
                    suggestions.push(
                        {
                            type: 'sharing',
                            title: 'Share Your Joy',
                            description: 'Share this positive energy with others around you',
                            action: 'share_joy',
                            icon: '✨'
                        },
                        {
                            type: 'gratitude',
                            title: 'Express Gratitude',
                            description: 'Take a moment to thank the divine for this blessing',
                            action: 'gratitude_prayer',
                            icon: '🙏'
                        }
                    );
                    break;

                case 'spiritual':
                    suggestions.push(
                        {
                            type: 'meditation',
                            title: 'Spiritual Reflection',
                            description: 'Spend time in quiet contemplation and prayer',
                            action: 'spiritual_reflection',
                            icon: '🧘'
                        },
                        {
                            type: 'study',
                            title: 'Sacred Reading',
                            description: 'Read from your sacred texts for guidance and wisdom',
                            action: 'sacred_reading',
                            icon: '📖'
                        }
                    );
                    break;

                case 'peaceful':
                    suggestions.push(
                        {
                            type: 'meditation',
                            title: 'Mindful Moment',
                            description: 'Savor this peaceful state with mindful awareness',
                            action: 'mindfulness',
                            icon: '🧘'
                        }
                    );
                    break;
            }

            // Add tradition-specific suggestions
            if (tradition === 'Islam') {
                suggestions.push({
                    type: 'tasbih',
                    title: 'Digital Tasbih',
                    description: 'Use the digital tasbih for dhikr and remembrance',
                    action: 'tasbih_counter',
                    icon: '📿'
                });
            }

            // Intensity-based suggestions
            if (intensity === 'high' && ['anxious', 'sad', 'angry'].includes(emotion)) {
                suggestions.unshift({
                    type: 'emergency',
                    title: 'Immediate Support',
                    description: 'Consider reaching out to a counselor or trusted friend',
                    action: 'seek_support',
                    icon: '🆘'
                });
            }

        } catch (error) {
            console.error('Suggestion generation error:', error);
        }

        return suggestions.slice(0, 4); // Limit to 4 suggestions
    }

    /**
     * Get personalized guidance based on user's spiritual background
     */
    async getPersonalizedGuidance(analysisResult, spiritualContext, userContext) {
        try {
            const emotion = analysisResult.emotion;
            const tradition = spiritualContext.suggestedTradition || userContext.spiritualBackground || 'Universal';
            
            const traditionData = this.spiritualTraditions[tradition] || this.spiritualTraditions.Universal;
            const emotionData = this.emotionCategories[emotion] || this.emotionCategories.neutral;

            return {
                general: emotionData.guidance,
                specific: traditionData.guidance[emotion] || traditionData.guidance.anxious || "You are held by love greater than you know.",
                practices: emotionData.practices || ['reflection', 'mindfulness'],
                tradition
            };

        } catch (error) {
            console.error('Personalized guidance error:', error);
            return {
                general: "Your feelings are valid and important. Take time to care for yourself.",
                specific: "Remember that you are not alone in this journey.",
                practices: ['reflection', 'self-care'],
                tradition: 'Universal'
            };
        }
    }

    /**
     * Get user context for personalized analysis
     */
    async getUserContext(userId) {
        try {
            // Check cache first
            if (this.userContextCache.has(userId)) {
                return this.userContextCache.get(userId);
            }

            const user = await User.findById(userId);
            const recentEntries = await MoodEntry.find({
                userId,
                isActive: true,
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            }).sort({ createdAt: -1 }).limit(20);

            // Analyze emotional patterns
            const emotionCounts = {};
            recentEntries.forEach(entry => {
                emotionCounts[entry.primaryEmotion] = (emotionCounts[entry.primaryEmotion] || 0) + 1;
            });

            const dominantEmotions = Object.entries(emotionCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([emotion]) => emotion);

            // Determine trend
            let recentTrend = 'stable';
            if (recentEntries.length >= 5) {
                const recent = recentEntries.slice(0, 5);
                const older = recentEntries.slice(5, 10);
                
                const recentPositive = recent.filter(e => ['joyful', 'peaceful', 'grateful', 'hopeful'].includes(e.primaryEmotion)).length;
                const olderPositive = older.filter(e => ['joyful', 'peaceful', 'grateful', 'hopeful'].includes(e.primaryEmotion)).length;
                
                if (recentPositive > olderPositive) {
                    recentTrend = 'improving';
                } else if (recentPositive < olderPositive) {
                    recentTrend = 'declining';
                }
            }

            const context = {
                spiritualBackground: user?.spiritualBackground || null,
                emotionalPatterns: {
                    dominantEmotions,
                    recentTrend,
                    totalAnalyses: recentEntries.length
                },
                analysisHistory: recentEntries.length
            };

            // Cache the context
            this.userContextCache.set(userId, context);
            
            return context;

        } catch (error) {
            console.error('Get user context error:', error);
            return {
                spiritualBackground: null,
                emotionalPatterns: { dominantEmotions: [], recentTrend: 'stable' },
                analysisHistory: 0
            };
        }
    }

    /**
     * Save mood entry to database
     */
    async saveMoodEntry(userId, analysisResult, input) {
        try {
            const moodEntry = new MoodEntry({
                userId,
                primaryEmotion: analysisResult.primaryEmotion,
                confidence: analysisResult.confidence,
                intensity: analysisResult.intensity,
                emotions: new Map(Object.entries(analysisResult.emotions)),
                analysisType: analysisResult.analysisType,
                inputData: {
                    type: input.type,
                    hasText: !!input.content,
                    hasAudio: !!input.audioData,
                    hasImage: !!input.imageData,
                    textLength: input.content?.length || 0
                },
                spiritualContext: analysisResult.spiritualContext,
                insights: analysisResult.insights,
                suggestions: analysisResult.suggestions,
                userContext: analysisResult.userContext,
                personalizedGuidance: analysisResult.personalizedGuidance,
                metadata: {
                    processingTime: analysisResult.processingTime,
                    cacheUsed: analysisResult.cacheUsed,
                    modelVersion: '2.0',
                    apiVersion: '2.0'
                }
            });

            await moodEntry.save();
            
            // Clear user context cache to refresh patterns
            this.userContextCache.delete(userId);
            
            return moodEntry;

        } catch (error) {
            console.error('Save mood entry error:', error);
            throw error;
        }
    }

    /**
     * Get mood history for a user
     */
    async getMoodHistory(userId, options = {}) {
        try {
            const {
                limit = 20,
                offset = 0,
                timeframe = '30d',
                emotions = null,
                includeInsights = false,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            // Calculate date range
            const timeframeDays = {
                '1d': 1,
                '7d': 7,
                '30d': 30,
                '90d': 90
            };

            const days = timeframeDays[timeframe] || 30;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            // Build query
            const query = {
                userId,
                isActive: true,
                createdAt: { $gte: startDate }
            };

            if (emotions && emotions.length > 0) {
                query.primaryEmotion = { $in: emotions };
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const entries = await MoodEntry.find(query)
                .sort(sort)
                .skip(offset)
                .limit(limit)
                .select(includeInsights ? '' : '-insights -suggestions');

            const total = await MoodEntry.countDocuments(query);

            return {
                entries,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: (offset + limit) < total
                },
                timeframe,
                filters: { emotions, includeInsights }
            };

        } catch (error) {
            console.error('Get mood history error:', error);
            throw error;
        }
    }

    /**
     * Get mood analytics for a user
     */
    async getMoodAnalytics(userId, timeframe = '30d') {
        try {
            const days = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 }[timeframe] || 30;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const entries = await MoodEntry.find({
                userId,
                isActive: true,
                createdAt: { $gte: startDate }
            }).sort({ createdAt: -1 });

            if (entries.length === 0) {
                return {
                    totalEntries: 0,
                    emotionDistribution: {},
                    dominantEmotion: null,
                    averageConfidence: 0,
                    moodStability: 0,
                    intensityDistribution: {},
                    recentTrend: 'stable',
                    dailyMoodMap: {},
                    insights: []
                };
            }

            // Calculate emotion distribution
            const emotionDistribution = {};
            entries.forEach(entry => {
                emotionDistribution[entry.primaryEmotion] = 
                    (emotionDistribution[entry.primaryEmotion] || 0) + 1;
            });

            // Find dominant emotion
            const dominantEmotion = Object.keys(emotionDistribution).reduce((a, b) => 
                emotionDistribution[a] > emotionDistribution[b] ? a : b
            );

            // Calculate average confidence
            const averageConfidence = entries.reduce((sum, entry) => 
                sum + entry.confidence, 0) / entries.length;

            // Calculate mood stability (variance in emotions)
            const uniqueEmotions = Object.keys(emotionDistribution).length;
            const moodStability = Math.max(0, 1 - (uniqueEmotions / 9)); // 9 total emotions

            // Calculate intensity distribution
            const intensityDistribution = { low: 0, medium: 0, high: 0 };
            entries.forEach(entry => {
                intensityDistribution[entry.intensity]++;
            });

            // Calculate recent trend
            let recentTrend = 'stable';
            if (entries.length >= 10) {
                const recent = entries.slice(0, 5);
                const older = entries.slice(5, 10);
                
                const recentPositive = recent.filter(e => 
                    ['joyful', 'peaceful', 'grateful', 'hopeful'].includes(e.primaryEmotion)
                ).length;
                const olderPositive = older.filter(e => 
                    ['joyful', 'peaceful', 'grateful', 'hopeful'].includes(e.primaryEmotion)
                ).length;
                
                if (recentPositive > olderPositive) {
                    recentTrend = 'improving';
                } else if (recentPositive < olderPositive) {
                    recentTrend = 'declining';
                }
            }

            // Create daily mood map
            const dailyMoodMap = {};
            entries.forEach(entry => {
                const date = entry.createdAt.toISOString().split('T')[0];
                if (!dailyMoodMap[date]) {
                    dailyMoodMap[date] = [];
                }
                dailyMoodMap[date].push(entry.primaryEmotion);
            });

            // Generate insights
            const insights = [];
            
            if (dominantEmotion) {
                const percentage = Math.round((emotionDistribution[dominantEmotion] / entries.length) * 100);
                insights.push({
                    type: 'dominant_emotion',
                    title: 'Most Common Emotion',
                    message: `${dominantEmotion} appears in ${percentage}% of your entries`,
                    emotion: dominantEmotion,
                    percentage
                });
            }

            if (moodStability > 0.7) {
                insights.push({
                    type: 'stability',
                    title: 'Emotional Stability',
                    message: 'Your emotions have been quite consistent lately'
                });
            }

            if (recentTrend === 'improving') {
                insights.push({
                    type: 'trend',
                    title: 'Positive Trend',
                    message: 'Your emotional well-being has been improving recently'
                });
            }

            return {
                totalEntries: entries.length,
                timeframe,
                emotionDistribution,
                dominantEmotion,
                averageConfidence: Math.round(averageConfidence * 100) / 100,
                moodStability: Math.round(moodStability * 100) / 100,
                intensityDistribution,
                recentTrend,
                dailyMoodMap,
                insights
            };

        } catch (error) {
            console.error('Get mood analytics error:', error);
            throw error;
        }
    }

    /**
     * Helper methods
     */

    validateInput(input) {
        if (!input || !input.type) {
            throw new Error('Input type is required');
        }

        const validTypes = ['text', 'voice', 'image', 'combined'];
        if (!validTypes.includes(input.type)) {
            throw new Error('Invalid input type');
        }

        if (input.type === 'text' && (!input.content || input.content.trim().length === 0)) {
            throw new Error('Text content is required for text analysis');
        }

        if (input.content && input.content.length > 5000) {
            throw new Error('Text content too long. Maximum 5000 characters allowed.');
        }
    }

    calculateIntensity(analysisResult) {
        const confidence = analysisResult.confidence;
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    }

    generateCacheKey(input, userId) {
        const content = input.content || '';
        const type = input.type;
        return `${userId}-${type}-${content.substring(0, 50)}`;
    }

    generateTextCacheKey(text) {
        return `text-${text.substring(0, 100)}`;
    }

    updateMetrics(processingTime) {
        this.metrics.averageProcessingTime = 
            (this.metrics.averageProcessingTime + processingTime) / 2;
    }

    setupCleanupIntervals() {
        // Clean up caches every 30 minutes
        setInterval(() => {
            if (this.analysisCache.size > 200) {
                const entries = Array.from(this.analysisCache.entries());
                const toDelete = entries.slice(0, entries.length - 150);
                toDelete.forEach(([key]) => this.analysisCache.delete(key));
            }

            if (this.userContextCache.size > 100) {
                const entries = Array.from(this.userContextCache.entries());
                const toDelete = entries.slice(0, entries.length - 80);
                toDelete.forEach(([key]) => this.userContextCache.delete(key));
            }
        }, 30 * 60 * 1000);
    }

    getHealthMetrics() {
        return {
            status: 'healthy',
            metrics: this.metrics,
            cacheStats: {
                analysisCacheSize: this.analysisCache.size,
                userContextCacheSize: this.userContextCache.size
            },
            timestamp: new Date().toISOString()
        };
    }

    cleanup() {
        this.analysisCache.clear();
        this.userContextCache.clear();
    }
}

module.exports = new MoodDetectionService();