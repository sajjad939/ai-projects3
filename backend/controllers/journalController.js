const Journal = require('../models/Journal');

exports.createJournalEntry = async (req, res) => {
    try {
        const { userId, text, image, audio, tags } = req.body;
        if (!userId || !text) {
            return res.status(400).json({ error: 'userId and text are required' });
        }
        const entry = new Journal({
            userId,
            text,
            image,
            audio,
            tags,
            createdAt: Date.now()
        });
        await entry.save();
        res.status(201).json({ success: true, entry });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create journal entry' });
    }
};

exports.getAllJournalEntries = async (req, res) => {
    try {
        const { userId, page = 1, limit = 10 } = req.query;
        let query = {};
        if (userId) query.userId = userId;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const entries = await Journal.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        const total = await Journal.countDocuments(query);
        res.json({ entries, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
};

exports.updateJournalEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body;
        const entry = await Journal.findByIdAndUpdate(id, update, { new: true });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.json({ success: true, entry });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update journal entry' });
    }
};

exports.deleteJournalEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await Journal.findByIdAndDelete(id);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.json({ success: true, message: 'Entry deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete journal entry' });
    }
};

exports.getAllTags = async (req, res) => {
    try {
        const tags = await Journal.distinct('tags');
        res.json({ tags });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
};
