const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const { analyzeTextEmotion } = require('../utils/emotionAnalysis');
const ApiLog = require('../models/ApiLog');
const MoodEntry = require('../models/MoodEntry');
const User = require('../models/User');

/**
 * Advanced Mood Detection Service for Mirror of Heart
 * Provides comprehensive emotion analysis from text, voice, and image inputs
 * with spiritual context awareness and personalized insights
 */
class MoodDetectionService {
    constructor() {
        this.emotionCategories = {
            // Primary emotions with spiritual context
            peaceful: {
                keywords: ['calm', 'serene', 'tranquil', 'peaceful', 'centered', 'balanced', 'still', 'quiet'],
                spiritualContext: 'inner peace',
                guidance: 'Continue nurturing this beautiful state of peace through meditation and prayer.',
                color: '#4ade80',
                intensity: 'positive'
            },
            grateful: {
                keywords: ['thankful', 'blessed', 'grateful', 'appreciative', 'fortunate', 'abundance'],
                spiritualContext: 'gratitude practice',
                guidance: 'Your gratitude opens your heart to divine blessings. Consider keeping a gratitude journal.',
                color: '#f59e0b',
                intensity: 'positive'
            },
            anxious: {
                keywords: ['worried', 'anxious', 'nervous', 'stressed', 'overwhelmed', 'panic', 'fear', 'uncertain'],
                spiritualContext: 'seeking comfort',
                guidance: 'In times of anxiety, remember that you are held by divine love. Try breathing prayers.',
                color: '#ef4444',
                intensity: 'negative'
            },
            sad: {
                keywords: ['sad', 'depressed', 'down', 'upset', 'hurt', 'pain', 'sorrow', 'grief', 'lonely'],
                spiritualContext: 'need for comfort',
                guidance: 'Your sadness is seen and held with compassion. Consider reaching out for spiritual support.',
                color: '#3b82f6',
                intensity: 'negative'
            },
            joyful: {
                keywords: ['happy', 'joy', 'excited', 'wonderful', 'amazing', 'great', 'fantastic', 'delighted'],
                spiritualContext: 'celebration',
                guidance: 'Your joy is a gift! Share this light with others and give thanks for this blessing.',
                color: '#10b981',
                intensity: 'positive'
            },
            spiritual: {
                keywords: ['pray', 'prayer', 'god', 'allah', 'divine', 'blessed', 'faith', 'meditation', 'worship', 'sacred'],
                spiritualContext: 'spiritual connection',
                guidance: 'Your spiritual awareness is growing. Continue deepening your connection through practice.',
                color: '#8b5cf6',
                intensity: 'positive'
            },
            angry: {
                keywords: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed', 'rage', 'hate'],
                spiritualContext: 'need for forgiveness',
                guidance: 'Anger can teach us about our values. Consider what this emotion is protecting in you.',
                color: '#dc2626',
                intensity: 'negative'
            },
            hopeful: {
                keywords: ['hope', 'optimistic', 'confident', 'positive', 'faith', 'trust', 'believe'],
                spiritualContext: 'faith and trust',
                guidance: 'Your hope is a beacon of light. Trust in the divine plan unfolding in your life.',
                color: '#06b6d4',
                intensity: 'positive'
            }
        };

        // Advanced emotion patterns for better detection
        this.emotionPatterns = {
            intensity_modifiers: {
                high: ['extremely', 'incredibly', 'overwhelmingly', 'deeply', 'profoundly'],
                medium: ['quite', 'fairly', 'somewhat', 'rather', 'pretty'],
                low: ['slightly', 'a bit', 'a little', 'mildly', 'barely']
            },
            negation_words: ['not', 'never', 'no', 'none', 'nothing', 'neither', 'nor'],
            temporal_indicators: {
                past: ['was', 'were', 'had', 'used to', 'yesterday', 'before'],
                present: ['am', 'is', 'are', 'feel', 'feeling', 'now', 'currently'],
                future: ['will', 'going to', 'hope', 'expect', 'tomorrow', 'soon']
            }
        };

        // Caching for performance
        this.analysisCache = new Map();
        this.userPatternCache = new Map();
        
        // Performance metrics
        this.metrics = {
            totalAnalyses: 0,
            averageProcessingTime: 0,
            accuracyScore: 0,
            cacheHitRate: 0
        };

        this.setupCleanupIntervals();
    }

    /**
     * Main method to analyze mood from various input types
     * @param {string} userId - User ID
     * @param {Object} input - Input data with type and content
     * @param {Object} options - Analysis options
     * @returns {Object} Comprehensive mood analysis results
     */
    async analyzeMood(userId, input, options = {}) {
        const startTime = Date.now();
        this.metrics.totalAnalyses++;

        try {
            const {
                type = 'text', // text, voice, image, combined
                content,
                audioData,
                imageData,
                context = {},
                includeInsights = true,
                includeSuggestions = true,
                saveToHistory = true
            } = input;

            // Validate input
            this.validateInput(type, content, audioData, imageData);

            // Check cache for similar analyses
            const cacheKey = this.generateCacheKey(userId, input);
            const cachedResult = this.analysisCache.get(cacheKey);
            if (cachedResult && !options.forceRefresh) {
                this.metrics.cacheHitRate++;
                return this.enhanceWithUserContext(cachedResult, userId);
            }

            let moodAnalysis = {};

            // Perform analysis based on input type
            switch (type) {
                case 'text':
                    moodAnalysis = await this.analyzeTextMood(content, context);
                    break;
                case 'voice':
                    moodAnalysis = await this.analyzeVoiceMood(audioData, content, context);
                    break;
                case 'image':
                    moodAnalysis = await this.analyzeImageMood(imageData, context);
                    break;
                case 'combined':
                    moodAnalysis = await this.analyzeCombinedMood(content, audioData, imageData, context);
                    break;
                default:
                    throw new Error(`Unsupported analysis type: ${type}`);
            }

            // Enhance with user-specific patterns
            const enhancedAnalysis = await this.enhanceWithUserContext(moodAnalysis, userId);

            // Generate insights and suggestions
            if (includeInsights) {
                enhancedAnalysis.insights = await this.generateInsights(enhancedAnalysis, userId);
            }

            if (includeSuggestions) {
                enhancedAnalysis.suggestions = await this.generateSuggestions(enhancedAnalysis, userId);
            }

            // Save to user's mood history
            if (saveToHistory) {
                await this.saveMoodEntry(userId, enhancedAnalysis, input);
            }

            // Cache the result
            this.analysisCache.set(cacheKey, enhancedAnalysis);
            this.limitCacheSize();

            // Update metrics
            this.updateMetrics(startTime);

            // Log the analysis
            await this.logAnalysis(userId, input, enhancedAnalysis);

            return {
                ...enhancedAnalysis,
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                cacheUsed: false
            };

        } catch (error) {
            console.error('Mood Detection Error:', error);
            await this.logError(userId, error, input);
            throw new Error(this.getErrorMessage(error));
        }
    }

    /**
     * Advanced text mood analysis with NLP techniques
     */
    async analyzeTextMood(text, context = {}) {
        try {
            // Preprocess text
            const processedText = this.preprocessText(text);
            
            // Basic emotion detection
            const basicEmotion = await analyzeTextEmotion(text);
            
            // Advanced pattern analysis
            const patterns = this.analyzeTextPatterns(processedText);
            
            // Sentiment analysis with context
            const sentiment = this.analyzeSentiment(processedText, context);
            
            // Spiritual context detection
            const spiritualContext = this.detectSpiritualContext(processedText);
            
            // Combine all analyses
            const combinedAnalysis = this.combineTextAnalyses(
                basicEmotion, 
                patterns, 
                sentiment, 
                spiritualContext
            );

            return {
                primaryEmotion: combinedAnalysis.emotion,
                confidence: combinedAnalysis.confidence,
                intensity: combinedAnalysis.intensity,
                emotions: combinedAnalysis.emotionScores,
                sentiment: sentiment,
                spiritualContext: spiritualContext,
                textMetrics: {
                    wordCount: processedText.split(' ').length,
                    sentenceCount: processedText.split(/[.!?]+/).length,
                    emotionalWords: patterns.emotionalWords,
                    spiritualWords: patterns.spiritualWords
                },
                analysisType: 'text'
            };

        } catch (error) {
            console.error('Text mood analysis error:', error);
            return this.getFallbackAnalysis('text');
        }
    }

    /**
     * Voice mood analysis (placeholder for future implementation)
     */
    async analyzeVoiceMood(audioData, transcript, context = {}) {
        try {
            // For now, analyze the transcript if available
            if (transcript) {
                const textAnalysis = await this.analyzeTextMood(transcript, context);
                return {
                    ...textAnalysis,
                    analysisType: 'voice',
                    audioMetrics: {
                        hasAudio: !!audioData,
                        transcriptAvailable: !!transcript,
                        note: 'Voice analysis currently uses transcript. Audio analysis coming soon.'
                    }
                };
            }

            // Placeholder for future audio analysis
            return {
                primaryEmotion: 'neutral',
                confidence: 0.5,
                intensity: 'medium',
                emotions: { neutral: 1.0 },
                analysisType: 'voice',
                audioMetrics: {
                    hasAudio: !!audioData,
                    transcriptAvailable: false,
                    note: 'Audio-only analysis not yet implemented'
                }
            };

        } catch (error) {
            console.error('Voice mood analysis error:', error);
            return this.getFallbackAnalysis('voice');
        }
    }

    /**
     * Image mood analysis (placeholder for future implementation)
     */
    async analyzeImageMood(imageData, context = {}) {
        try {
            // Placeholder for future image analysis
            // This would integrate with computer vision APIs or local models
            
            return {
                primaryEmotion: 'neutral',
                confidence: 0.5,
                intensity: 'medium',
                emotions: { neutral: 1.0 },
                analysisType: 'image',
                imageMetrics: {
                    hasImage: !!imageData,
                    note: 'Image mood analysis coming soon'
                }
            };

        } catch (error) {
            console.error('Image mood analysis error:', error);
            return this.getFallbackAnalysis('image');
        }
    }

    /**
     * Combined multi-modal analysis
     */
    async analyzeCombinedMood(text, audioData, imageData, context = {}) {
        try {
            const analyses = [];

            if (text) {
                const textAnalysis = await this.analyzeTextMood(text, context);
                analyses.push({ ...textAnalysis, weight: 0.6 });
            }

            if (audioData) {
                const voiceAnalysis = await this.analyzeVoiceMood(audioData, text, context);
                analyses.push({ ...voiceAnalysis, weight: 0.3 });
            }

            if (imageData) {
                const imageAnalysis = await this.analyzeImageMood(imageData, context);
                analyses.push({ ...imageAnalysis, weight: 0.1 });
            }

            if (analyses.length === 0) {
                throw new Error('No valid input provided for analysis');
            }

            // Combine analyses with weighted average
            return this.combineMultiModalAnalyses(analyses);

        } catch (error) {
            console.error('Combined mood analysis error:', error);
            return this.getFallbackAnalysis('combined');
        }
    }

    /**
     * Advanced text preprocessing
     */
    preprocessText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Analyze text patterns for emotional indicators
     */
    analyzeTextPatterns(text) {
        const words = text.split(' ');
        const emotionalWords = [];
        const spiritualWords = [];
        const intensityModifiers = [];
        const negations = [];

        words.forEach((word, index) => {
            // Check for emotional words
            Object.entries(this.emotionCategories).forEach(([emotion, data]) => {
                if (data.keywords.includes(word)) {
                    emotionalWords.push({ word, emotion, position: index });
                }
            });

            // Check for spiritual words
            if (this.emotionCategories.spiritual.keywords.includes(word)) {
                spiritualWords.push({ word, position: index });
            }

            // Check for intensity modifiers
            Object.entries(this.emotionPatterns.intensity_modifiers).forEach(([level, modifiers]) => {
                if (modifiers.includes(word)) {
                    intensityModifiers.push({ word, level, position: index });
                }
            });

            // Check for negations
            if (this.emotionPatterns.negation_words.includes(word)) {
                negations.push({ word, position: index });
            }
        });

        return {
            emotionalWords,
            spiritualWords,
            intensityModifiers,
            negations,
            wordCount: words.length
        };
    }

    /**
     * Sentiment analysis with contextual awareness
     */
    analyzeSentiment(text, context) {
        const analyzer = new natural.SentimentAnalyzer('English', 
            natural.PorterStemmer, ['negation']);
        const tokenizer = new natural.WordTokenizer();
        
        const tokens = tokenizer.tokenize(text);
        const score = analyzer.getSentiment(tokens);
        
        // Adjust sentiment based on context
        let adjustedScore = score;
        if (context.timeOfDay === 'night' && score < 0) {
            adjustedScore = score * 1.2; // Amplify negative sentiment at night
        }
        
        return {
            score: adjustedScore,
            comparative: adjustedScore / tokens.length,
            tokens: tokens.length,
            positive: adjustedScore > 0.1,
            negative: adjustedScore < -0.1,
            neutral: Math.abs(adjustedScore) <= 0.1
        };
    }

    /**
     * Detect spiritual context in text
     */
    detectSpiritualContext(text) {
        const spiritualKeywords = this.emotionCategories.spiritual.keywords;
        const religiousTerms = ['christian', 'muslim', 'jewish', 'hindu', 'buddhist', 'sikh'];
        const practiceTerms = ['meditation', 'prayer', 'worship', 'service', 'ritual', 'ceremony'];
        
        const foundSpiritual = spiritualKeywords.filter(keyword => text.includes(keyword));
        const foundReligious = religiousTerms.filter(term => text.includes(term));
        const foundPractices = practiceTerms.filter(practice => text.includes(practice));
        
        const spiritualScore = (foundSpiritual.length + foundReligious.length + foundPractices.length) / 
                              (spiritualKeywords.length + religiousTerms.length + practiceTerms.length);
        
        return {
            isSpiritual: spiritualScore > 0.1,
            score: spiritualScore,
            detectedTerms: {
                spiritual: foundSpiritual,
                religious: foundReligious,
                practices: foundPractices
            },
            suggestedTradition: foundReligious[0] || null
        };
    }

    /**
     * Combine multiple text analyses into final result
     */
    combineTextAnalyses(basicEmotion, patterns, sentiment, spiritualContext) {
        let finalEmotion = basicEmotion.emotion;
        let finalConfidence = basicEmotion.confidence;
        
        // Adjust based on patterns
        if (patterns.intensityModifiers.length > 0) {
            const avgIntensity = patterns.intensityModifiers.reduce((sum, mod) => {
                const intensityValues = { low: 0.3, medium: 0.6, high: 0.9 };
                return sum + intensityValues[mod.level];
            }, 0) / patterns.intensityModifiers.length;
            
            finalConfidence = Math.min(finalConfidence * (1 + avgIntensity), 0.95);
        }
        
        // Adjust for negations
        if (patterns.negations.length > 0) {
            finalConfidence *= 0.8; // Reduce confidence when negations are present
        }
        
        // Boost spiritual emotion if spiritual context is strong
        if (spiritualContext.isSpiritual && spiritualContext.score > 0.3) {
            if (finalEmotion !== 'spiritual') {
                // Create mixed emotion result
                return {
                    emotion: 'spiritual',
                    confidence: Math.max(finalConfidence, spiritualContext.score),
                    intensity: this.calculateIntensity(finalConfidence),
                    emotionScores: {
                        ...basicEmotion.scores,
                        spiritual: spiritualContext.score,
                        [finalEmotion]: finalConfidence
                    },
                    mixedEmotions: [finalEmotion, 'spiritual']
                };
            }
        }
        
        return {
            emotion: finalEmotion,
            confidence: finalConfidence,
            intensity: this.calculateIntensity(finalConfidence),
            emotionScores: basicEmotion.scores || {}
        };
    }

    /**
     * Calculate emotion intensity based on confidence
     */
    calculateIntensity(confidence) {
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    }

    /**
     * Combine multi-modal analyses
     */
    combineMultiModalAnalyses(analyses) {
        const weightedEmotions = {};
        let totalWeight = 0;
        let totalConfidence = 0;

        analyses.forEach(analysis => {
            const weight = analysis.weight || 1;
            totalWeight += weight;
            totalConfidence += analysis.confidence * weight;

            Object.entries(analysis.emotions || {}).forEach(([emotion, score]) => {
                if (!weightedEmotions[emotion]) {
                    weightedEmotions[emotion] = 0;
                }
                weightedEmotions[emotion] += score * weight;
            });
        });

        // Normalize weighted emotions
        Object.keys(weightedEmotions).forEach(emotion => {
            weightedEmotions[emotion] /= totalWeight;
        });

        // Find primary emotion
        const primaryEmotion = Object.keys(weightedEmotions).reduce((a, b) => 
            weightedEmotions[a] > weightedEmotions[b] ? a : b
        );

        return {
            primaryEmotion,
            confidence: totalConfidence / totalWeight,
            intensity: this.calculateIntensity(totalConfidence / totalWeight),
            emotions: weightedEmotions,
            analysisType: 'combined',
            modalityBreakdown: analyses.map(a => ({
                type: a.analysisType,
                emotion: a.primaryEmotion,
                confidence: a.confidence,
                weight: a.weight
            }))
        };
    }

    /**
     * Enhance analysis with user-specific context and patterns
     */
    async enhanceWithUserContext(analysis, userId) {
        try {
            const user = await User.findById(userId);
            const userPatterns = await this.getUserEmotionPatterns(userId);
            
            let enhancedAnalysis = { ...analysis };

            // Adjust based on user's historical patterns
            if (userPatterns.dominantEmotions.length > 0) {
                const userDominantEmotion = userPatterns.dominantEmotions[0];
                if (userDominantEmotion === analysis.primaryEmotion) {
                    enhancedAnalysis.confidence = Math.min(analysis.confidence * 1.1, 0.95);
                    enhancedAnalysis.userPattern = 'consistent';
                } else {
                    enhancedAnalysis.userPattern = 'shifting';
                }
            }

            // Add user context
            enhancedAnalysis.userContext = {
                spiritualBackground: user?.spiritualPreferences?.religion || null,
                emotionalPatterns: userPatterns,
                analysisHistory: userPatterns.totalAnalyses
            };

            // Add personalized spiritual guidance
            if (user?.spiritualPreferences) {
                enhancedAnalysis.personalizedGuidance = this.getPersonalizedGuidance(
                    analysis.primaryEmotion,
                    user.spiritualPreferences
                );
            }

            return enhancedAnalysis;

        } catch (error) {
            console.error('Error enhancing with user context:', error);
            return analysis; // Return original analysis if enhancement fails
        }
    }

    /**
     * Generate insights based on mood analysis
     */
    async generateInsights(analysis, userId) {
        const insights = [];
        const emotion = analysis.primaryEmotion;
        const confidence = analysis.confidence;
        const userPatterns = await this.getUserEmotionPatterns(userId);

        // Confidence-based insights
        if (confidence > 0.8) {
            insights.push({
                type: 'confidence',
                message: `Your ${emotion} emotion comes through very clearly in your expression.`,
                icon: '🎯'
            });
        } else if (confidence < 0.5) {
            insights.push({
                type: 'uncertainty',
                message: 'Your emotions seem mixed right now, which is completely normal.',
                icon: '🌊'
            });
        }

        // Pattern-based insights
        if (userPatterns.recentTrend) {
            if (userPatterns.recentTrend === 'improving') {
                insights.push({
                    type: 'trend',
                    message: 'Your emotional well-being has been trending positively recently.',
                    icon: '📈'
                });
            } else if (userPatterns.recentTrend === 'declining') {
                insights.push({
                    type: 'trend',
                    message: 'You might benefit from some extra self-care and spiritual support.',
                    icon: '💝'
                });
            }
        }

        // Spiritual insights
        if (analysis.spiritualContext?.isSpiritual) {
            insights.push({
                type: 'spiritual',
                message: 'Your spiritual awareness is shining through your words.',
                icon: '✨'
            });
        }

        // Time-based insights
        const hour = new Date().getHours();
        if (hour < 6 && (emotion === 'anxious' || emotion === 'sad')) {
            insights.push({
                type: 'temporal',
                message: 'Early morning emotions can feel more intense. Consider gentle morning prayers.',
                icon: '🌅'
            });
        }

        return insights.slice(0, 3); // Limit to 3 insights
    }

    /**
     * Generate personalized suggestions based on mood
     */
    async generateSuggestions(analysis, userId) {
        const emotion = analysis.primaryEmotion;
        const emotionData = this.emotionCategories[emotion];
        const suggestions = [];

        // Base suggestions from emotion category
        if (emotionData) {
            suggestions.push({
                type: 'spiritual',
                title: 'Spiritual Guidance',
                description: emotionData.guidance,
                action: 'spiritual_guidance',
                icon: '🙏'
            });
        }

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
                        description: 'Recite a prayer or mantra for peace and comfort',
                        action: 'prayer_session',
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
                        action: 'gratitude_journal',
                        icon: '📝'
                    },
                    {
                        type: 'connection',
                        title: 'Reach Out',
                        description: 'Connect with a friend, family member, or spiritual community',
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
                        description: 'Share this positive energy with others in your community',
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
                        title: 'Deepen Your Practice',
                        description: 'Spend extra time in meditation or contemplation',
                        action: 'meditation_session',
                        icon: '🧘'
                    },
                    {
                        type: 'study',
                        title: 'Spiritual Reading',
                        description: 'Read from your sacred texts or spiritual literature',
                        action: 'spiritual_reading',
                        icon: '📖'
                    }
                );
                break;
        }

        // Add tasbih suggestion for Muslim users or general spiritual users
        const user = await User.findById(userId);
        if (user?.spiritualPreferences?.religion === 'Islam' || analysis.spiritualContext?.isSpiritual) {
            suggestions.push({
                type: 'tasbih',
                title: 'Digital Tasbih',
                description: 'Use the digital tasbih for dhikr and remembrance',
                action: 'tasbih_counter',
                icon: '📿'
            });
        }

        return suggestions.slice(0, 4); // Limit to 4 suggestions
    }

    /**
     * Get personalized spiritual guidance
     */
    getPersonalizedGuidance(emotion, spiritualPreferences) {
        const religion = spiritualPreferences.religion?.toLowerCase();
        const emotionData = this.emotionCategories[emotion];
        
        if (!emotionData) return null;

        const baseGuidance = emotionData.guidance;
        
        // Customize based on religious background
        switch (religion) {
            case 'islam':
                return {
                    general: baseGuidance,
                    specific: this.getIslamicGuidance(emotion),
                    practices: ['dhikr', 'salah', 'dua', 'quran_recitation']
                };
            case 'christianity':
                return {
                    general: baseGuidance,
                    specific: this.getChristianGuidance(emotion),
                    practices: ['prayer', 'bible_reading', 'worship', 'fellowship']
                };
            case 'judaism':
                return {
                    general: baseGuidance,
                    specific: this.getJewishGuidance(emotion),
                    practices: ['prayer', 'torah_study', 'shabbat', 'mitzvot']
                };
            default:
                return {
                    general: baseGuidance,
                    specific: 'Trust in the divine wisdom that guides your path.',
                    practices: ['meditation', 'prayer', 'reflection', 'gratitude']
                };
        }
    }

    /**
     * Get Islamic spiritual guidance for specific emotions
     */
    getIslamicGuidance(emotion) {
        const guidance = {
            anxious: 'Remember Allah\'s promise: "And whoever relies upon Allah - then He is sufficient for him." (Quran 65:3)',
            sad: 'Know that after hardship comes ease. "So verily, with the hardship, there is relief." (Quran 94:5)',
            joyful: 'Alhamdulillahi rabbil alameen - All praise belongs to Allah, Lord of all worlds.',
            grateful: 'Say Alhamdulillah and remember that gratitude increases Allah\'s blessings.',
            spiritual: 'Continue your dhikr and remember Allah often, for in His remembrance hearts find peace.',
            peaceful: 'This peace is a gift from Allah. Use this tranquility for worship and reflection.',
            angry: 'Seek refuge in Allah from Shaytan and perform wudu to cool your anger.',
            hopeful: 'Place your trust in Allah, for He is the best of planners.'
        };
        
        return guidance[emotion] || 'Trust in Allah\'s wisdom and mercy in all circumstances.';
    }

    /**
     * Get Christian spiritual guidance for specific emotions
     */
    getChristianGuidance(emotion) {
        const guidance = {
            anxious: 'Cast all your anxiety on Him because He cares for you. (1 Peter 5:7)',
            sad: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit. (Psalm 34:18)',
            joyful: 'Rejoice in the Lord always. I will say it again: Rejoice! (Philippians 4:4)',
            grateful: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus. (1 Thessalonians 5:18)',
            spiritual: 'Draw near to God and He will draw near to you. (James 4:8)',
            peaceful: 'Peace I leave with you; my peace I give you. (John 14:27)',
            angry: 'In your anger do not sin. Do not let the sun go down while you are still angry. (Ephesians 4:26)',
            hopeful: 'For I know the plans I have for you, declares the Lord, plans to prosper you. (Jeremiah 29:11)'
        };
        
        return guidance[emotion] || 'Trust in the Lord with all your heart and lean not on your own understanding.';
    }

    /**
     * Get Jewish spiritual guidance for specific emotions
     */
    getJewishGuidance(emotion) {
        const guidance = {
            anxious: 'Cast your burden upon the Lord, and He will sustain you. (Psalm 55:22)',
            sad: 'Weeping may endure for a night, but joy comes in the morning. (Psalm 30:5)',
            joyful: 'Serve the Lord with gladness; come before His presence with singing. (Psalm 100:2)',
            grateful: 'It is good to give thanks to the Lord and to sing praises to Your name. (Psalm 92:1)',
            spiritual: 'In every generation, a person must see themselves as if they personally left Egypt.',
            peaceful: 'Great peace have those who love Your Torah, and nothing can make them stumble. (Psalm 119:165)',
            angry: 'Slow to anger and abundant in kindness - these are the ways of the righteous.',
            hopeful: 'Hope in the Lord; be strong and let your heart take courage. (Psalm 27:14)'
        };
        
        return guidance[emotion] || 'The Lord is my shepherd; I shall not want.';
    }

    /**
     * Get user's emotion patterns and history
     */
    async getUserEmotionPatterns(userId) {
        try {
            // Check cache first
            const cached = this.userPatternCache.get(userId);
            if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
                return cached.data;
            }

            const recentEntries = await MoodEntry.find({ userId })
                .sort({ createdAt: -1 })
                .limit(30);

            if (recentEntries.length === 0) {
                return {
                    dominantEmotions: [],
                    recentTrend: null,
                    totalAnalyses: 0,
                    averageConfidence: 0
                };
            }

            // Calculate dominant emotions
            const emotionCounts = {};
            let totalConfidence = 0;

            recentEntries.forEach(entry => {
                const emotion = entry.primaryEmotion;
                emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
                totalConfidence += entry.confidence;
            });

            const dominantEmotions = Object.entries(emotionCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([emotion]) => emotion);

            // Calculate recent trend (last 7 vs previous 7)
            const recent7 = recentEntries.slice(0, 7);
            const previous7 = recentEntries.slice(7, 14);
            
            let recentTrend = null;
            if (recent7.length >= 3 && previous7.length >= 3) {
                const recentPositive = recent7.filter(e => 
                    ['joyful', 'grateful', 'peaceful', 'hopeful', 'spiritual'].includes(e.primaryEmotion)
                ).length;
                const previousPositive = previous7.filter(e => 
                    ['joyful', 'grateful', 'peaceful', 'hopeful', 'spiritual'].includes(e.primaryEmotion)
                ).length;
                
                if (recentPositive > previousPositive) {
                    recentTrend = 'improving';
                } else if (recentPositive < previousPositive) {
                    recentTrend = 'declining';
                } else {
                    recentTrend = 'stable';
                }
            }

            const patterns = {
                dominantEmotions,
                recentTrend,
                totalAnalyses: recentEntries.length,
                averageConfidence: totalConfidence / recentEntries.length,
                emotionDistribution: emotionCounts
            };

            // Cache the result
            this.userPatternCache.set(userId, {
                data: patterns,
                timestamp: Date.now()
            });

            return patterns;

        } catch (error) {
            console.error('Error getting user emotion patterns:', error);
            return {
                dominantEmotions: [],
                recentTrend: null,
                totalAnalyses: 0,
                averageConfidence: 0
            };
        }
    }

    /**
     * Save mood entry to database
     */
    async saveMoodEntry(userId, analysis, input) {
        try {
            const moodEntry = new MoodEntry({
                userId,
                primaryEmotion: analysis.primaryEmotion,
                confidence: analysis.confidence,
                intensity: analysis.intensity,
                emotions: analysis.emotions,
                analysisType: analysis.analysisType,
                inputData: {
                    type: input.type,
                    hasText: !!input.content,
                    hasAudio: !!input.audioData,
                    hasImage: !!input.imageData,
                    textLength: input.content?.length || 0
                },
                spiritualContext: analysis.spiritualContext,
                insights: analysis.insights,
                suggestions: analysis.suggestions,
                userContext: analysis.userContext,
                metadata: {
                    processingTime: analysis.processingTime,
                    cacheUsed: analysis.cacheUsed,
                    timestamp: new Date()
                }
            });

            await moodEntry.save();
            return moodEntry;

        } catch (error) {
            console.error('Error saving mood entry:', error);
            // Don't throw error to avoid breaking the main flow
            return null;
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
                includeInsights = false
            } = options;

            // Calculate date range
            const now = new Date();
            const timeframes = {
                '1d': 1,
                '7d': 7,
                '30d': 30,
                '90d': 90
            };
            const days = timeframes[timeframe] || 30;
            const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

            // Build query
            let query = {
                userId,
                createdAt: { $gte: startDate }
            };

            if (emotions && emotions.length > 0) {
                query.primaryEmotion = { $in: emotions };
            }

            // Execute query
            const entries = await MoodEntry.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .select(includeInsights ? '' : '-insights -suggestions -userContext');

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
                filters: {
                    emotions,
                    includeInsights
                }
            };

        } catch (error) {
            console.error('Error getting mood history:', error);
            throw new Error('Failed to retrieve mood history');
        }
    }

    /**
     * Get mood analytics for a user
     */
    async getMoodAnalytics(userId, timeframe = '30d') {
        try {
            const patterns = await this.getUserEmotionPatterns(userId);
            const history = await this.getMoodHistory(userId, { 
                timeframe, 
                limit: 1000 
            });

            const entries = history.entries;
            
            if (entries.length === 0) {
                return {
                    totalEntries: 0,
                    timeframe,
                    message: 'No mood data available for this timeframe'
                };
            }

            // Calculate analytics
            const emotionCounts = {};
            const dailyMoods = {};
            const confidenceScores = [];
            const intensityDistribution = { low: 0, medium: 0, high: 0 };

            entries.forEach(entry => {
                // Emotion distribution
                const emotion = entry.primaryEmotion;
                emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;

                // Daily mood tracking
                const date = entry.createdAt.toISOString().split('T')[0];
                if (!dailyMoods[date]) {
                    dailyMoods[date] = [];
                }
                dailyMoods[date].push(emotion);

                // Confidence tracking
                confidenceScores.push(entry.confidence);

                // Intensity distribution
                intensityDistribution[entry.intensity]++;
            });

            // Calculate trends
            const sortedEmotions = Object.entries(emotionCounts)
                .sort(([,a], [,b]) => b - a);

            const averageConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

            // Mood stability (how often the dominant emotion appears)
            const dominantEmotion = sortedEmotions[0];
            const stability = dominantEmotion ? (dominantEmotion[1] / entries.length) : 0;

            return {
                totalEntries: entries.length,
                timeframe,
                emotionDistribution: emotionCounts,
                dominantEmotion: dominantEmotion?.[0] || 'neutral',
                averageConfidence: Math.round(averageConfidence * 100) / 100,
                moodStability: Math.round(stability * 100) / 100,
                intensityDistribution,
                recentTrend: patterns.recentTrend,
                dailyMoodMap: dailyMoods,
                insights: this.generateAnalyticsInsights(emotionCounts, patterns, averageConfidence)
            };

        } catch (error) {
            console.error('Error getting mood analytics:', error);
            throw new Error('Failed to generate mood analytics');
        }
    }

    /**
     * Generate insights from analytics data
     */
    generateAnalyticsInsights(emotionCounts, patterns, averageConfidence) {
        const insights = [];
        const totalEntries = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
        
        // Dominant emotion insight
        const sortedEmotions = Object.entries(emotionCounts)
            .sort(([,a], [,b]) => b - a);
        
        if (sortedEmotions.length > 0) {
            const [dominantEmotion, count] = sortedEmotions[0];
            const percentage = Math.round((count / totalEntries) * 100);
            
            insights.push({
                type: 'dominant_emotion',
                title: 'Most Common Emotion',
                message: `${dominantEmotion} appears in ${percentage}% of your entries`,
                emotion: dominantEmotion,
                percentage
            });
        }

        // Confidence insight
        if (averageConfidence > 0.7) {
            insights.push({
                type: 'confidence',
                title: 'Clear Emotional Expression',
                message: 'Your emotions come through clearly in your expressions',
                score: averageConfidence
            });
        } else if (averageConfidence < 0.5) {
            insights.push({
                type: 'confidence',
                title: 'Mixed Emotions',
                message: 'You often experience complex, mixed emotions',
                score: averageConfidence
            });
        }

        // Trend insight
        if (patterns.recentTrend === 'improving') {
            insights.push({
                type: 'trend',
                title: 'Positive Trend',
                message: 'Your emotional well-being has been improving recently',
                trend: 'improving'
            });
        } else if (patterns.recentTrend === 'declining') {
            insights.push({
                type: 'trend',
                title: 'Needs Attention',
                message: 'Consider focusing on self-care and spiritual practices',
                trend: 'declining'
            });
        }

        // Spiritual insight
        const spiritualCount = emotionCounts.spiritual || 0;
        if (spiritualCount > 0) {
            const spiritualPercentage = Math.round((spiritualCount / totalEntries) * 100);
            insights.push({
                type: 'spiritual',
                title: 'Spiritual Connection',
                message: `${spiritualPercentage}% of your entries show spiritual awareness`,
                percentage: spiritualPercentage
            });
        }

        return insights;
    }

    /**
     * Utility methods
     */

    validateInput(type, content, audioData, imageData) {
        if (!['text', 'voice', 'image', 'combined'].includes(type)) {
            throw new Error('Invalid input type');
        }

        if (type === 'text' && (!content || content.trim().length === 0)) {
            throw new Error('Text content is required for text analysis');
        }

        if (type === 'voice' && !audioData && !content) {
            throw new Error('Audio data or transcript is required for voice analysis');
        }

        if (type === 'image' && !imageData) {
            throw new Error('Image data is required for image analysis');
        }

        if (type === 'combined' && !content && !audioData && !imageData) {
            throw new Error('At least one input type is required for combined analysis');
        }

        if (content && content.length > 5000) {
            throw new Error('Text content too long. Maximum 5000 characters allowed.');
        }
    }

    generateCacheKey(userId, input) {
        const contentHash = input.content ? 
            require('crypto').createHash('md5').update(input.content).digest('hex').substring(0, 8) : 
            'no-content';
        return `${userId}-${input.type}-${contentHash}`;
    }

    limitCacheSize() {
        if (this.analysisCache.size > 500) {
            const firstKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(firstKey);
        }
    }

    updateMetrics(startTime) {
        const processingTime = Date.now() - startTime;
        this.metrics.averageProcessingTime = 
            (this.metrics.averageProcessingTime + processingTime) / 2;
    }

    getFallbackAnalysis(type) {
        return {
            primaryEmotion: 'neutral',
            confidence: 0.5,
            intensity: 'medium',
            emotions: { neutral: 1.0 },
            analysisType: type,
            fallback: true,
            message: 'Analysis completed with basic detection'
        };
    }

    getErrorMessage(error) {
        if (error.message.includes('too long')) {
            return error.message;
        } else if (error.message.includes('required')) {
            return error.message;
        } else if (error.message.includes('Invalid')) {
            return error.message;
        } else {
            return 'Mood analysis temporarily unavailable. Please try again.';
        }
    }

    async logAnalysis(userId, input, analysis) {
        try {
            await ApiLog.create({
                userId,
                endpoint: '/api/mood/analyze',
                method: 'POST',
                status: 200,
                details: {
                    inputType: input.type,
                    primaryEmotion: analysis.primaryEmotion,
                    confidence: analysis.confidence,
                    processingTime: analysis.processingTime
                }
            });
        } catch (error) {
            console.error('Error logging analysis:', error);
        }
    }

    async logError(userId, error, input) {
        try {
            await ApiLog.create({
                userId,
                endpoint: '/api/mood/analyze',
                method: 'POST',
                status: 500,
                details: {
                    error: error.message,
                    inputType: input?.type,
                    stack: error.stack
                }
            });
        } catch (logError) {
            console.error('Error logging error:', logError);
        }
    }

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

    cleanupCaches() {
        // Clean analysis cache
        if (this.analysisCache.size > 300) {
            const entries = Array.from(this.analysisCache.entries());
            const toDelete = entries.slice(0, entries.length - 300);
            toDelete.forEach(([key]) => this.analysisCache.delete(key));
        }

        // Clean user pattern cache
        const now = Date.now();
        for (const [userId, cached] of this.userPatternCache.entries()) {
            if (now - cached.timestamp > 600000) { // 10 minutes
                this.userPatternCache.delete(userId);
            }
        }
    }

    resetMetrics() {
        this.metrics = {
            totalAnalyses: 0,
            averageProcessingTime: 0,
            accuracyScore: 0,
            cacheHitRate: 0
        };
    }

    getHealthMetrics() {
        return {
            status: 'healthy',
            metrics: this.metrics,
            cacheStats: {
                analysisCacheSize: this.analysisCache.size,
                userPatternCacheSize: this.userPatternCache.size
            },
            emotionCategories: Object.keys(this.emotionCategories),
            timestamp: new Date().toISOString()
        };
    }

    cleanup() {
        this.analysisCache.clear();
        this.userPatternCache.clear();
    }
}

module.exports = new MoodDetectionService();