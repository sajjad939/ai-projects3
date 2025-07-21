const express = require('express');
const router = express.Router();
const { getAllUsers, getAllJournals, getApiLogs, promoteToAdmin, demoteFromAdmin, deleteUser, deleteJournal, suspendUser, unsuspendUser } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Admin endpoints (now require admin)
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.get('/journals', authMiddleware, adminMiddleware, getAllJournals);
router.get('/logs', authMiddleware, adminMiddleware, getApiLogs);
// Promote user to admin
router.post('/promote/:userId', authMiddleware, adminMiddleware, promoteToAdmin);
// Demote user from admin
router.post('/demote/:userId', authMiddleware, adminMiddleware, demoteFromAdmin);
// Delete user
router.delete('/user/:userId', authMiddleware, adminMiddleware, deleteUser);
// Delete journal
router.delete('/journal/:journalId', authMiddleware, adminMiddleware, deleteJournal);
// Suspend user
router.post('/suspend/:userId', authMiddleware, adminMiddleware, suspendUser);
// Unsuspend user
router.post('/unsuspend/:userId', authMiddleware, adminMiddleware, unsuspendUser);

module.exports = router;
