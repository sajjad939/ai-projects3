const express = require('express');
const router = express.Router();
const { incrementTasbihCount, getTasbihCount } = require('../controllers/tasbihController');

// POST /count - Increment tasbih count for a user
router.post('/count', incrementTasbihCount);

// GET /count - Get current tasbih count for a user
router.get('/count', getTasbihCount);

module.exports = router;
