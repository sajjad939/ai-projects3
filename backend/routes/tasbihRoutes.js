const express = require('express');
const router = express.Router();
const { incrementTasbihCount, getTasbihCount } = require('../controllers/tasbihController');

router.post('/count', incrementTasbihCount);
router.get('/count', getTasbihCount);

module.exports = router;
