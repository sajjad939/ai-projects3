const express = require('express');
const router = express.Router();
const {
    analyzeMood,
    getMoodHistory,
    getMoodAnalytics,
    getMoodEntry,
    submitFeedback,
    deleteMoodEntry,
    getMoodSuggestions,
    exportMoodData,
    healthCheck
} = require('../controllers/moodController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Enhanced Mood Detection Routes
 * Comprehensive API endpoints for mood analysis and management
 */

// Health check endpoint (no auth required for monitoring)
router.get('/health', healthCheck);

// Apply authentication middleware to all other routes
router.use(authMiddleware);

/**
 * @route   POST /api/mood/analyze
 * @desc    Analyze mood from text, voice, or image input
 * @access  Private
 * @body    {
 *   input: {
 *     type: 'text'|'voice'|'image'|'combined',
 *     content?: string,
 *     audioData?: string,
 *     imageData?: string,
 *     context?: object
 *   },
 *   options?: {
 *     includeInsights?: boolean,
 *     includeSuggestions?: boolean,
 *     saveToHistory?: boolean,
 *     priority?: 'normal'|'high'
 *   }
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     primaryEmotion: string,
 *     confidence: number,
 *     intensity: 'low'|'medium'|'high',
 *     emotions: object,
 *     spiritualContext?: object,
 *     insights?: array,
 *     suggestions?: array,
 *     userContext?: object,
 *     personalizedGuidance?: object,
 *     processingTime: number,
 *     timestamp: string
 *   }
 * }
 */
router.post('/analyze', analyzeMood);

/**
 * @route   GET /api/mood/history
 * @desc    Get user's mood analysis history with filtering and pagination
 * @access  Private
 * @query   {
 *   limit?: number (1-100, default 20),
 *   offset?: number (default 0),
 *   timeframe?: '1d'|'7d'|'30d'|'90d' (default '30d'),
 *   emotions?: string (comma-separated),
 *   includeInsights?: boolean,
 *   sortBy?: 'createdAt'|'confidence'|'primaryEmotion',
 *   sortOrder?: 'asc'|'desc'
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     entries: array,
 *     pagination: object,
 *     timeframe: string,
 *     filters: object
 *   }
 * }
 */
router.get('/history', getMoodHistory);

/**
 * @route   GET /api/mood/analytics
 * @desc    Get comprehensive mood analytics and insights
 * @access  Private
 * @query   {
 *   timeframe?: '1d'|'7d'|'30d'|'90d' (default '30d')
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     totalEntries: number,
 *     emotionDistribution: object,
 *     dominantEmotion: string,
 *     averageConfidence: number,
 *     moodStability: number,
 *     intensityDistribution: object,
 *     recentTrend: 'improving'|'declining'|'stable',
 *     dailyMoodMap: object,
 *     insights: array,
 *     generatedAt: string
 *   }
 * }
 */
router.get('/analytics', getMoodAnalytics);

/**
 * @route   GET /api/mood/entries/:entryId
 * @desc    Get specific mood entry by ID
 * @access  Private
 * @params  entryId: string (MongoDB ObjectId)
 * @returns {
 *   success: boolean,
 *   data: MoodEntry
 * }
 */
router.get('/entries/:entryId', getMoodEntry);

/**
 * @route   POST /api/mood/entries/:entryId/feedback
 * @desc    Submit feedback on mood analysis accuracy
 * @access  Private
 * @params  entryId: string (MongoDB ObjectId)
 * @body    {
 *   accuracyRating: number (1-5),
 *   helpfulnessRating: number (1-5),
 *   comments?: string
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     entryId: string,
 *     feedback: object
 *   }
 * }
 */
router.post('/entries/:entryId/feedback', submitFeedback);

/**
 * @route   DELETE /api/mood/entries/:entryId
 * @desc    Delete mood entry (soft delete)
 * @access  Private
 * @params  entryId: string (MongoDB ObjectId)
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     entryId: string,
 *     deletedAt: string
 *   }
 * }
 */
router.delete('/entries/:entryId', deleteMoodEntry);

/**
 * @route   GET /api/mood/suggestions
 * @desc    Get mood-based suggestions and recommendations
 * @access  Private
 * @query   {
 *   emotion?: string,
 *   intensity?: 'low'|'medium'|'high',
 *   context?: string (JSON)
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     emotion: string,
 *     intensity: string,
 *     suggestions: array,
 *     generatedAt: string
 *   }
 * }
 */
router.get('/suggestions', getMoodSuggestions);

/**
 * @route   GET /api/mood/export
 * @desc    Export mood data in various formats
 * @access  Private
 * @query   {
 *   format?: 'json'|'csv' (default 'json'),
 *   timeframe?: '1d'|'7d'|'30d'|'90d'|'all' (default '30d')
 * }
 * @returns File download (JSON or CSV)
 */
router.get('/export', exportMoodData);

/**
 * @route   GET /api/mood/emotions
 * @desc    Get list of supported emotions and their metadata
 * @access  Private
 * @returns {
 *   success: boolean,
 *   data: {
 *     emotions: array,
 *     categories: object,
 *     spiritualContext: object
 *   }
 * }
 */
router.get('/emotions', (req, res) => {
    const MoodDetectionService = require('../services/MoodDetectionService');
    
    res.json({
        success: true,
        data: {
            emotions: Object.keys(MoodDetectionService.emotionCategories),
            categories: MoodDetectionService.emotionCategories,
            supportedInputTypes: ['text', 'voice', 'image', 'combined'],
            intensityLevels: ['low', 'medium', 'high']
        }
    });
});

/**
 * @route   POST /api/mood/batch-analyze
 * @desc    Analyze multiple inputs in batch (future feature)
 * @access  Private
 * @body    {
 *   inputs: array,
 *   options?: object
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     results: array,
 *     summary: object
 *   }
 * }
 */
// router.post('/batch-analyze', batchAnalyzeMood);

/**
 * @route   GET /api/mood/trends
 * @desc    Get mood trends over time (future feature)
 * @access  Private
 * @query   {
 *   period?: 'daily'|'weekly'|'monthly',
 *   timeframe?: string
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     trends: array,
 *     patterns: object,
 *     predictions?: object
 *   }
 * }
 */
// router.get('/trends', getMoodTrends);

/**
 * @route   POST /api/mood/compare
 * @desc    Compare mood patterns between time periods (future feature)
 * @access  Private
 * @body    {
 *   period1: object,
 *   period2: object
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     comparison: object,
 *     insights: array
 *   }
 * }
 */
// router.post('/compare', compareMoodPeriods);

/**
 * Error handling middleware specific to mood routes
 */
router.use((error, req, res, next) => {
    console.error('Mood Route Error:', {
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
        errorCode: error.code || 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;