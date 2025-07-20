const express = require('express');
const router = express.Router();
const { analyzeEmotion } = require('../controllers/emotionController');

// POST /analyze - Analyze emotion from text, image, or audio
router.post('/analyze', analyzeEmotion);

module.exports = router;
