const express = require('express');
const router = express.Router();
const { chatbotService } = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, chatbotService);

module.exports = router;
