const express = require('express');
const router = express.Router();
const { updateProfile, getProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Get user profile
router.get('/me', authMiddleware, getProfile);
// Update user profile (including Gemini API key)
router.put('/me', authMiddleware, updateProfile);

module.exports = router;
