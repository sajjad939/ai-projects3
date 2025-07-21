require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const axios = require('axios');

const journalRoutes = require('./routes/journalRoutes');
const emotionRoutes = require('./routes/emotionRoutes');
const tasbihRoutes = require('./routes/tasbihRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const authController = require('./controllers/authController');
const errorHandler = require('./middleware/errorHandler');
<<<<<<< HEAD
=======
const User = require('./models/User');
const userRoutes = require('./routes/userRoutes');
const ApiLog = require('./models/ApiLog');
const adminRoutes = require('./routes/adminRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
>>>>>>> source/main

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const geminiApiKey = process.env.GEMINI_API_KEY;

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });
app.use(upload.any());

app.post('/register', authController.register);
app.post('/login', authController.login);
app.use('/journal', authMiddleware, journalRoutes);
app.use('/emotion', authMiddleware, emotionRoutes);
app.use('/tasbih', authMiddleware, tasbihRoutes);
<<<<<<< HEAD

// Gemini API route
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
=======
app.use('/user', authMiddleware, userRoutes);
app.use('/admin', authMiddleware, adminRoutes);
app.use('/chatbot', chatbotRoutes);

// Gemini API route (per-user key support + logging)
app.post('/api/gemini', async (req, res) => {
    const { prompt, userId } = req.body;
    let status = 200;
    let logDetails = {};
    try {
        if (!prompt) {
            status = 400;
            throw new Error('Prompt is required');
        }
        let apiKey = process.env.GEMINI_API_KEY;
        if (userId) {
            const user = await User.findById(userId);
            if (user && user.geminiApiKey) apiKey = user.geminiApiKey;
        }
>>>>>>> source/main
        const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            contents: [{ parts: [{ text: prompt }] }]
        }, {
            headers: {
                'Content-Type': 'application/json',
<<<<<<< HEAD
                'x-goog-api-key': geminiApiKey
            }
        });
        res.json({ result: response.data });
    } catch (err) {
        res.status(500).json({ error: 'Gemini API request failed', details: err.message });
=======
                'x-goog-api-key': apiKey
            }
        });
        logDetails = { result: response.data };
        res.json({ result: response.data });
    } catch (err) {
        status = status === 200 ? 500 : status;
        logDetails = { error: err.message };
        res.status(status).json({ error: 'Gemini API request failed', details: err.message });
    } finally {
        // Log the API usage
        await ApiLog.create({
            userId: userId || null,
            endpoint: '/api/gemini',
            method: 'POST',
            status,
            details: logDetails
        });
>>>>>>> source/main
    }
});

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch((err) => {
    console.error('MongoDB connection error:', err.message);
});

app.use(errorHandler);
