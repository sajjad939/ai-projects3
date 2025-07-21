const express = require('express');
const router = express.Router();
const { analyzeEmotion } = require('../controllers/emotionController');

router.post('/analyze', analyzeEmotion);

module.exports = router;
