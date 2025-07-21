const User = require('../models/User');
const Journal = require('../models/Journal');
const ApiLog = require('../models/ApiLog');

exports.getAllUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
};

exports.getAllJournals = async (req, res) => {
    const journals = await Journal.find();
    res.json(journals);
};

exports.getApiLogs = async (req, res) => {
    const logs = await ApiLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
};

// Promote a user to admin
exports.promoteToAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, { isAdmin: true }, { new: true, select: '-password' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User promoted to admin', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to promote user' });
    }
};

// Demote a user from admin
exports.demoteFromAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, { isAdmin: false }, { new: true, select: '-password' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User demoted from admin', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to demote user' });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Delete a journal entry (admin)
exports.deleteJournal = async (req, res) => {
    try {
        const { journalId } = req.params;
        const journal = await Journal.findByIdAndDelete(journalId);
        if (!journal) return res.status(404).json({ error: 'Journal not found' });
        res.json({ message: 'Journal deleted', journal });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete journal' });
    }
};

// Suspend a user
exports.suspendUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, { suspended: true }, { new: true, select: '-password' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User suspended', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to suspend user' });
    }
};

// Unsuspend a user
exports.unsuspendUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, { suspended: false }, { new: true, select: '-password' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User unsuspended', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unsuspend user' });
    }
};
