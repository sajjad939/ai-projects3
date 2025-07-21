// In-memory store for demonstration. Replace with MongoDB for persistence.
const tasbihCounts = {};

exports.incrementTasbihCount = (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    tasbihCounts[userId] = (tasbihCounts[userId] || 0) + 1;
    res.json({ userId, count: tasbihCounts[userId] });
};

exports.getTasbihCount = (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const count = tasbihCounts[userId] || 0;
    res.json({ userId, count });
};
