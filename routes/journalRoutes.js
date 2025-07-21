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

// Multer setup for file uploads (image/audio)
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

// POST / - Submit a journal entry (text, optional image/audio)
// Emotion processing will be handled in the controller
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]), createJournalEntry);

// GET / - Retrieve all journal entries (with pagination)
router.get('/', getAllJournalEntries);

// PUT /:id - Update a journal entry
router.put('/:id', updateJournalEntry);

// DELETE /:id - Delete a journal entry
router.delete('/:id', deleteJournalEntry);

// GET /tags - List all tags used in journal entries
router.get('/tags', getAllTags);

module.exports = router;
