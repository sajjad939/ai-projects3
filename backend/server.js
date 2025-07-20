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

// Gemini API route
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
        const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            contents: [{ parts: [{ text: prompt }] }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiApiKey
            }
        });
        res.json({ result: response.data });
    } catch (err) {
        res.status(500).json({ error: 'Gemini API request failed', details: err.message });
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
