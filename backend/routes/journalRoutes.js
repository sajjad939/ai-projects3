const express = require('express');
const router = express.Router();
const { 
    createJournalEntry, 
    getAllJournalEntries, 
    updateJournalEntry, 
    deleteJournalEntry, 
    getAllTags 
} = require('../controllers/journalController');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]), createJournalEntry);
router.get('/', getAllJournalEntries);
router.put('/:id', updateJournalEntry);
router.delete('/:id', deleteJournalEntry);
router.get('/tags', getAllTags);

module.exports = router;
