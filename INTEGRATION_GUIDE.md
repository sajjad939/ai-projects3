# Mirror of Heart - Chatbot Service Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Chatbot Service into the Mirror of Heart application. The service provides AI-powered conversational capabilities with emotional intelligence and spiritual guidance.

## Prerequisites

- Node.js 16+ and npm
- MongoDB database
- Google Gemini API key
- JWT authentication system
- Express.js backend

## Backend Integration

### 1. Install Dependencies

```bash
npm install axios uuid express-rate-limit
```

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

### 3. Database Models

Ensure the following models are properly set up:

#### Conversation Model (`backend/models/Conversation.js`)
```javascript
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: {
        emotion: { type: String },
        confidence: { type: Number },
        inputType: { type: String, enum: ['text', 'voice', 'image'], default: 'text' }
    }
});

const ConversationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, unique: true },
    title: { type: String, default: 'New Conversation' },
    messages: [MessageSchema],
    context: {
        spiritualPreferences: {
            religion: { type: String },
            practices: [{ type: String }],
            goals: [{ type: String }]
        },
        emotionalState: {
            currentMood: { type: String },
            moodHistory: [{
                mood: { type: String },
                confidence: { type: Number },
                timestamp: { type: Date, default: Date.now }
            }]
        },
        conversationTone: { type: String, enum: ['supportive', 'spiritual', 'reflective'], default: 'supportive' }
    },
    isActive: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

ConversationSchema.index({ userId: 1, lastActivity: -1 });
ConversationSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
```

### 4. Service Integration

Add the chatbot routes to your main server file:

#### `backend/server.js`
```javascript
const chatbotRoutes = require('./routes/chatbotRoutes');

// Add this line with your other route definitions
app.use('/api/chatbot', chatbotRoutes);
```

### 5. Middleware Setup

Ensure you have the required middleware:

#### Authentication Middleware (`backend/middleware/authMiddleware.js`)
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
```

### 6. Emotion Analysis Integration

Update your emotion analysis utility:

#### `backend/utils/emotionAnalysis.js`
```javascript
exports.analyzeTextEmotion = async (text) => {
    try {
        const emotions = {
            happy: ['joy', 'happiness', 'excited', 'wonderful', 'amazing', 'great', 'fantastic', 'blessed', 'grateful', 'thankful'],
            sad: ['sad', 'depressed', 'down', 'upset', 'hurt', 'pain', 'sorrow', 'grief', 'lonely', 'empty'],
            anxious: ['worried', 'anxious', 'nervous', 'stressed', 'overwhelmed', 'panic', 'fear', 'scared', 'uncertain'],
            angry: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed', 'rage', 'hate'],
            peaceful: ['calm', 'peaceful', 'serene', 'tranquil', 'relaxed', 'content', 'balanced', 'centered'],
            spiritual: ['pray', 'prayer', 'god', 'allah', 'divine', 'blessed', 'faith', 'spiritual', 'meditation', 'worship']
        };

        const textLower = text.toLowerCase();
        const scores = {};
        
        Object.keys(emotions).forEach(emotion => {
            scores[emotion] = emotions[emotion].reduce((score, word) => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = textLower.match(regex);
                return score + (matches ? matches.length : 0);
            }, 0);
        });

        const dominantEmotion = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        const maxScore = scores[dominantEmotion];
        const confidence = maxScore > 0 ? Math.min(0.6 + (maxScore * 0.1), 0.95) : 0.5;

        return { 
            emotion: maxScore > 0 ? dominantEmotion : 'neutral', 
            confidence: confidence,
            scores: scores
        };
    } catch (error) {
        console.error('Text emotion analysis error:', error);
        return { emotion: 'neutral', confidence: 0.5 };
    }
};
```

## Frontend Integration

### 1. HTML Structure

Add the chat interface to your main HTML file:

#### `frontend/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mirror of Heart</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="styles/chat.css">
</head>
<body>
    <main class="chatgpt-style-container">
        <header class="chatgpt-header">
            <h1>Mirror of Heart</h1>
        </header>
        <section class="chatgpt-main">
            <div class="chatgpt-column">
                <!-- Existing components -->
                <div class="chatgpt-block" id="journal-section">
                    <h2>Text Journal</h2>
                    <textarea id="journal-input" placeholder="Write your thoughts..."></textarea>
                    <button id="submit-journal">Submit Journal</button>
                </div>
                
                <!-- Chat interface will be inserted here -->
            </div>
            <div class="chatgpt-column">
                <!-- Other components -->
            </div>
        </section>
    </main>
    
    <!-- Scripts -->
    <script src="app.js"></script>
    <script src="components/ChatInterface.js"></script>
</body>
</html>
```

### 2. CSS Integration

Include the chat styles in your main CSS file:

#### `frontend/style.css`
```css
/* Import chat styles */
@import url('styles/chat.css');

/* Ensure compatibility with existing styles */
.chatgpt-block {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Dark mode compatibility */
body.dark-mode .chatgpt-block {
    background: #1f2937;
    color: #f9fafb;
}
```

### 3. JavaScript Integration

Initialize the chat interface in your main application:

#### `frontend/app.js`
```javascript
// Add to your existing app.js
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
        // Initialize chat interface
        if (typeof ChatInterface !== 'undefined') {
            window.chatInterface = new ChatInterface();
        }
    }
});

// Add authentication check function
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Add logout function
function logout() {
    localStorage.removeItem('token');
    if (window.chatInterface) {
        window.chatInterface.destroy();
    }
    window.location.href = '/login.html';
}
```

### 4. Authentication Integration

Create a login system if not already present:

#### `frontend/login.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Mirror of Heart</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="login-container">
        <h1>Mirror of Heart</h1>
        <form id="login-form">
            <input type="email" id="email" placeholder="Email" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <p><a href="register.html">Don't have an account? Register</a></p>
    </div>
    
    <script>
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.href = '/';
                } else {
                    alert('Login failed: ' + data.error);
                }
            } catch (error) {
                alert('Login error: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

## Configuration Options

### 1. Conversation Tones

Configure different conversation tones in the ChatbotService:

```javascript
// In ChatbotService constructor
this.systemPrompts = {
    supportive: `Your supportive prompt here...`,
    spiritual: `Your spiritual guidance prompt here...`,
    reflective: `Your reflective questioning prompt here...`,
    // Add custom tones as needed
    custom: `Your custom prompt here...`
};
```

### 2. Emotion Categories

Customize emotion detection categories:

```javascript
// In emotionAnalysis.js
const emotions = {
    // Add or modify emotion categories
    excited: ['excited', 'thrilled', 'energetic', 'enthusiastic'],
    contemplative: ['thinking', 'pondering', 'reflecting', 'considering'],
    // ... other emotions
};
```

### 3. Rate Limiting

Adjust rate limiting settings:

```javascript
// In chatbotController.js
const chatbotRateLimit = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 50, // 50 requests per window
    message: {
        error: 'Custom rate limit message',
        retryAfter: 120
    }
});
```

## Testing Integration

### 1. Backend Testing

Test the API endpoints:

```javascript
// Test script
const axios = require('axios');

const testChatbot = async () => {
    const token = 'your_test_token';
    
    try {
        // Test sending a message
        const response = await axios.post('http://localhost:5000/api/chatbot/message', {
            message: 'Hello, I need some guidance today',
            conversationTone: 'supportive'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Response:', response.data);
        
        // Test getting conversations
        const conversations = await axios.get('http://localhost:5000/api/chatbot/conversations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Conversations:', conversations.data);
        
    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
};

testChatbot();
```

### 2. Frontend Testing

Test the chat interface:

```javascript
// In browser console
// Test message sending
window.chatInterface.sendMessage();

// Test conversation loading
window.chatInterface.loadConversations();

// Test analytics
window.chatInterface.loadAnalytics();
```

## Troubleshooting

### Common Issues

1. **Gemini API Errors**
   - Verify API key is correct
   - Check API quotas and billing
   - Ensure proper request format

2. **Authentication Issues**
   - Verify JWT secret matches
   - Check token expiration
   - Ensure proper header format

3. **Database Connection**
   - Verify MongoDB connection string
   - Check database permissions
   - Ensure indexes are created

4. **Rate Limiting**
   - Adjust rate limits for your use case
   - Implement proper error handling
   - Consider user feedback for limits

### Debug Mode

Enable debug logging:

```javascript
// In ChatbotService
console.log('Debug: Processing message', { userId, message, options });
```

### Performance Optimization

1. **Caching**: Implement Redis for conversation caching
2. **Database**: Add proper indexes for queries
3. **API**: Use connection pooling for Gemini API
4. **Frontend**: Implement message virtualization for large conversations

## Deployment Considerations

### Environment Variables
```env
NODE_ENV=production
GEMINI_API_KEY=your_production_key
JWT_SECRET=your_production_secret
MONGO_URI=your_production_mongodb_uri
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

### Security Checklist
- [ ] API keys are properly secured
- [ ] Rate limiting is configured
- [ ] Input validation is implemented
- [ ] CORS is properly configured
- [ ] HTTPS is enabled in production
- [ ] Database access is restricted

### Monitoring
- Set up logging for API calls
- Monitor Gemini API usage
- Track conversation metrics
- Monitor error rates

This integration guide provides a complete setup for the Chatbot Service. Follow the steps in order and test each component before proceeding to the next.