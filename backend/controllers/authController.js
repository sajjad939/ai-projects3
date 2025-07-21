const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
<<<<<<< HEAD
        const { username, email, password } = req.body;
        const user = new User({ username, email, password });
=======
        const { username, email, password, geminiApiKey } = req.body;
        const user = new User({ username, email, password, geminiApiKey });
>>>>>>> source/main
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: 'Registration failed', details: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
<<<<<<< HEAD
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
=======
        if (user.suspended) return res.status(403).json({ error: 'User is suspended' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, geminiApiKey: user.geminiApiKey });
>>>>>>> source/main
    } catch (err) {
        res.status(400).json({ error: 'Login failed', details: err.message });
    }
};
