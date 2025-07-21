const axios = require('axios');

exports.analyzeTextEmotion = async (text) => {
    try {
        // Enhanced emotion analysis with more sophisticated logic
        const emotions = {
            happy: ['joy', 'happiness', 'excited', 'wonderful', 'amazing', 'great', 'fantastic', 'blessed', 'grateful', 'thankful'],
            sad: ['sad', 'depressed', 'down', 'upset', 'hurt', 'pain', 'sorrow', 'grief', 'lonely', 'empty'],
            anxious: ['worried', 'anxious', 'nervous', 'stressed', 'overwhelmed', 'panic', 'fear', 'scared', 'uncertain'],
            angry: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed', 'rage', 'hate'],
            peaceful: ['calm', 'peaceful', 'serene', 'tranquil', 'relaxed', 'content', 'balanced', 'centered'],
            spiritual: ['pray', 'prayer', 'god', 'allah', 'divine', 'blessed', 'faith', 'spiritual', 'meditation', 'worship']
        };

        const textLower = text.toLowerCase();
        const scores = {};
        
        // Calculate emotion scores
        Object.keys(emotions).forEach(emotion => {
            scores[emotion] = emotions[emotion].reduce((score, word) => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = textLower.match(regex);
                return score + (matches ? matches.length : 0);
            }, 0);
        });

        // Find dominant emotion
        const dominantEmotion = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        const maxScore = scores[dominantEmotion];
        const confidence = maxScore > 0 ? Math.min(0.6 + (maxScore * 0.1), 0.95) : 0.5;

        return { 
            emotion: maxScore > 0 ? dominantEmotion : 'neutral', 
            confidence: confidence,
            scores: scores
        };
    } catch (error) {
        console.error('Text emotion analysis error:', error);
        return { emotion: 'neutral', confidence: 0.5 };
    }
};

exports.analyzeImageEmotion = async (imageBase64) => {
    return { emotion: 'neutral', confidence: 0.80 };
};

exports.analyzeAudioEmotion = async (audioBase64) => {
    return { emotion: 'calm', confidence: 0.85 };
};
