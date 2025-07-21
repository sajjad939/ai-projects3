const User = require('../models/User');

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Update current user profile (including Gemini API key)
exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        if (updates.password) delete updates.password; // Prevent password change here
        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, select: '-password' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
