const User = require('../models/User');

// Simple admin check: add isAdmin field to User model for real use
module.exports = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Admin check failed' });
    }
};
