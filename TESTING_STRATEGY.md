# Mirror of Heart - Chatbot Service Testing Strategy

## Overview

This document outlines comprehensive testing strategies for the Chatbot Service, including unit tests, integration tests, end-to-end tests, and performance testing approaches.

## Testing Architecture

```
Testing Pyramid:
├── Unit Tests (70%)
│   ├── Service Logic
│   ├── Controllers
│   ├── Utilities
│   └── Models
├── Integration Tests (20%)
│   ├── API Endpoints
│   ├── Database Operations
│   └── External Services
└── End-to-End Tests (10%)
    ├── User Workflows
    ├── Frontend Integration
    └── Performance Tests
```

## Unit Tests

### 1. ChatbotService Tests

#### `tests/unit/services/ChatbotService.test.js`

```javascript
const ChatbotService = require('../../../backend/services/ChatbotService');
const Conversation = require('../../../backend/models/Conversation');
const { analyzeTextEmotion } = require('../../../backend/utils/emotionAnalysis');

// Mock dependencies
jest.mock('../../../backend/models/Conversation');
jest.mock('../../../backend/utils/emotionAnalysis');
jest.mock('axios');

describe('ChatbotService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ChatbotService.conversationCache.clear();
        ChatbotService.responseCache.clear();
    });

    describe('processMessage', () => {
        it('should process a simple text message successfully', async () => {
            // Arrange
            const userId = '507f1f77bcf86cd799439011';
            const message = 'I need some guidance today';
            const mockConversation = {
                _id: 'conv123',
                userId,
                sessionId: 'session123',
                messages: [],
                context: { emotionalState: { moodHistory: [] } },
                save: jest.fn().mockResolvedValue(true)
            };

            Conversation.findOne.mockResolvedValue(null);
            Conversation.prototype.constructor = jest.fn(() => mockConversation);
            analyzeTextEmotion.mockResolvedValue({
                emotion: 'anxious',
                confidence: 0.8,
                scores: { anxious: 2, neutral: 0 }
            });

            // Mock Gemini API response
            const axios = require('axios');
            axios.post.mockResolvedValue({
                data: {
                    candidates: [{
                        content: {
                            parts: [{ text: 'I understand you need guidance. How can I help?' }]
                        }
                    }]
                }
            });

            // Act
            const result = await ChatbotService.processMessage(userId, message);

            // Assert
            expect(result).toHaveProperty('response');
            expect(result).toHaveProperty('emotion');
            expect(result).toHaveProperty('sessionId');
            expect(result.emotion.emotion).toBe('anxious');
            expect(result.emotion.confidence).toBe(0.8);
        });

        it('should handle empty messages', async () => {
            // Arrange
            const userId = '507f1f77bcf86cd799439011';
            const message = '';

            // Act & Assert
            await expect(ChatbotService.processMessage(userId, message))
                .rejects.toThrow('Message cannot be empty');
        });

        it('should handle messages that are too long', async () => {
            // Arrange
            const userId = '507f1f77bcf86cd799439011';
            const message = 'a'.repeat(2001);

            // Act & Assert
            await expect(ChatbotService.processMessage(userId, message))
                .rejects.toThrow('Message too long');
        });

        it('should use cached conversations', async () => {
            // Arrange
            const userId = '507f1f77bcf86cd799439011';
            const sessionId = 'session123';
            const message = 'Hello';
            
            const mockConversation = {
                userId,
                sessionId,
                messages: [],
                context: { emotionalState: { moodHistory: [] } },
                save: jest.fn().mockResolvedValue(true)
            };

            ChatbotService.conversationCache.set(sessionId, mockConversation);
            analyzeTextEmotion.mockResolvedValue({ emotion: 'neutral', confidence: 0.5 });

            const axios = require('axios');
            axios.post.mockResolvedValue({
                data: {
                    candidates: [{
                        content: { parts: [{ text: 'Hello there!' }] }
                    }]
                }
            });

            // Act
            const result = await ChatbotService.processMessage(userId, message, { sessionId });

            // Assert
            expect(Conversation.findOne).not.toHaveBeenCalled();
            expect(result.sessionId).toBe(sessionId);
        });
    });

    describe('generateResponse', () => {
        it('should generate appropriate response for different tones', async () => {
            // Arrange
            const mockConversation = {
                userId: '507f1f77bcf86cd799439011',
                messages: [
                    { role: 'user', content: 'I need spiritual guidance' }
                ],
                context: {
                    emotionalState: { currentMood: 'seeking' },
                    spiritualPreferences: { religion: 'Christianity' }
                }
            };

            const axios = require('axios');
            axios.post.mockResolvedValue({
                data: {
                    candidates: [{
                        content: {
                            parts: [{ text: 'May peace be with you. How can I guide you spiritually?' }]
                        }
                    }]
                }
            });

            // Act
            const response = await ChatbotService.generateResponse(mockConversation, 'spiritual');

            // Assert
            expect(response).toContain('peace');
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('gemini'),
                expect.objectContaining({
                    contents: expect.any(Array)
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'x-goog-api-key': expect.any(String)
                    })
                })
            );
        });

        it('should handle Gemini API errors gracefully', async () => {
            // Arrange
            const mockConversation = {
                userId: '507f1f77bcf86cd799439011',
                messages: [],
                context: { emotionalState: {} }
            };

            const axios = require('axios');
            axios.post.mockRejectedValue(new Error('API Error'));

            // Act
            const response = await ChatbotService.generateResponse(mockConversation);

            // Assert
            expect(response).toMatch(/I'm here to listen|Thank you for sharing|I appreciate you opening up/);
        });
    });

    describe('updateEmotionalContext', () => {
        it('should update conversation emotional context', async () => {
            // Arrange
            const conversation = {
                context: {
                    emotionalState: {
                        moodHistory: []
                    }
                }
            };
            const emotionData = { emotion: 'happy', confidence: 0.9 };

            // Act
            await ChatbotService.updateEmotionalContext(conversation, emotionData);

            // Assert
            expect(conversation.context.emotionalState.currentMood).toBe('happy');
            expect(conversation.context.emotionalState.moodHistory).toHaveLength(1);
            expect(conversation.context.emotionalState.moodHistory[0].mood).toBe('happy');
        });

        it('should limit mood history to 10 entries', async () => {
            // Arrange
            const conversation = {
                context: {
                    emotionalState: {
                        moodHistory: Array(10).fill({ mood: 'neutral', timestamp: new Date() })
                    }
                }
            };
            const emotionData = { emotion: 'happy', confidence: 0.9 };

            // Act
            await ChatbotService.updateEmotionalContext(conversation, emotionData);

            // Assert
            expect(conversation.context.emotionalState.moodHistory).toHaveLength(10);
            expect(conversation.context.emotionalState.moodHistory[9].mood).toBe('happy');
        });
    });
});
```

### 2. Controller Tests

#### `tests/unit/controllers/chatbotController.test.js`

```javascript
const request = require('supertest');
const express = require('express');
const chatbotController = require('../../../backend/controllers/chatbotController');
const ChatbotService = require('../../../backend/services/ChatbotService');

// Mock dependencies
jest.mock('../../../backend/services/ChatbotService');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.userId = '507f1f77bcf86cd799439011';
    next();
});

describe('ChatbotController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /message', () => {
        it('should send message successfully', async () => {
            // Arrange
            const mockResponse = {
                response: 'Hello, how can I help?',
                emotion: { emotion: 'neutral', confidence: 0.5 },
                sessionId: 'session123'
            };
            ChatbotService.processMessage.mockResolvedValue(mockResponse);

            // Act
            const response = await request(app)
                .post('/message')
                .send({
                    message: 'Hello',
                    conversationTone: 'supportive'
                });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.response).toBe('Hello, how can I help?');
        });

        it('should validate message length', async () => {
            // Act
            const response = await request(app)
                .post('/message')
                .send({
                    message: 'a'.repeat(2001)
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('too long');
        });

        it('should handle empty messages', async () => {
            // Act
            const response = await request(app)
                .post('/message')
                .send({
                    message: ''
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('required');
        });
    });

    describe('GET /conversations', () => {
        it('should return conversation history', async () => {
            // Arrange
            const mockConversations = [
                {
                    sessionId: 'session1',
                    title: 'Test Conversation',
                    lastActivity: new Date(),
                    messageCount: 5
                }
            ];
            ChatbotService.getConversationHistory.mockResolvedValue(mockConversations);

            // Act
            const response = await request(app).get('/conversations');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.conversations).toHaveLength(1);
        });
    });
});

// Add routes to test app
app.post('/message', chatbotController.sendMessage);
app.get('/conversations', chatbotController.getConversations);
```

### 3. Utility Tests

#### `tests/unit/utils/emotionAnalysis.test.js`

```javascript
const { analyzeTextEmotion } = require('../../../backend/utils/emotionAnalysis');

describe('EmotionAnalysis', () => {
    describe('analyzeTextEmotion', () => {
        it('should detect happy emotions', async () => {
            // Arrange
            const text = 'I am so happy and grateful for this wonderful day!';

            // Act
            const result = await analyzeTextEmotion(text);

            // Assert
            expect(result.emotion).toBe('happy');
            expect(result.confidence).toBeGreaterThan(0.5);
            expect(result.scores).toHaveProperty('happy');
        });

        it('should detect sad emotions', async () => {
            // Arrange
            const text = 'I feel so sad and lonely today. Everything hurts.';

            // Act
            const result = await analyzeTextEmotion(text);

            // Assert
            expect(result.emotion).toBe('sad');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('should detect spiritual content', async () => {
            // Arrange
            const text = 'I want to pray and connect with God through meditation.';

            // Act
            const result = await analyzeTextEmotion(text);

            // Assert
            expect(result.emotion).toBe('spiritual');
            expect(result.scores.spiritual).toBeGreaterThan(0);
        });

        it('should return neutral for unclear text', async () => {
            // Arrange
            const text = 'The weather is okay today.';

            // Act
            const result = await analyzeTextEmotion(text);

            // Assert
            expect(result.emotion).toBe('neutral');
            expect(result.confidence).toBe(0.5);
        });

        it('should handle empty text', async () => {
            // Arrange
            const text = '';

            // Act
            const result = await analyzeTextEmotion(text);

            // Assert
            expect(result.emotion).toBe('neutral');
            expect(result.confidence).toBe(0.5);
        });
    });
});
```

## Integration Tests

### 1. API Integration Tests

#### `tests/integration/chatbot.api.test.js`

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/server');
const User = require('../../backend/models/User');
const Conversation = require('../../backend/models/Conversation');
const jwt = require('jsonwebtoken');

describe('Chatbot API Integration', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.TEST_MONGO_URI);
        
        // Create test user
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });
        await user.save();
        userId = user._id;

        // Generate auth token
        authToken = jwt.sign({ userId }, process.env.JWT_SECRET);
    });

    afterAll(async () => {
        // Clean up
        await User.deleteMany({});
        await Conversation.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean conversations before each test
        await Conversation.deleteMany({});
    });

    describe('POST /api/chatbot/message', () => {
        it('should create new conversation and respond', async () => {
            const response = await request(app)
                .post('/api/chatbot/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'I need some guidance today',
                    conversationTone: 'supportive'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('response');
            expect(response.body.data).toHaveProperty('sessionId');
            expect(response.body.data).toHaveProperty('emotion');

            // Verify conversation was saved
            const conversation = await Conversation.findOne({ 
                sessionId: response.body.data.sessionId 
            });
            expect(conversation).toBeTruthy();
            expect(conversation.messages).toHaveLength(2); // User + Assistant
        });

        it('should continue existing conversation', async () => {
            // Create initial conversation
            const firstResponse = await request(app)
                .post('/api/chatbot/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'Hello',
                    conversationTone: 'supportive'
                });

            const sessionId = firstResponse.body.data.sessionId;

            // Continue conversation
            const secondResponse = await request(app)
                .post('/api/chatbot/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'How are you?',
                    sessionId,
                    conversationTone: 'supportive'
                });

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body.data.sessionId).toBe(sessionId);

            // Verify conversation has 4 messages
            const conversation = await Conversation.findOne({ sessionId });
            expect(conversation.messages).toHaveLength(4);
        });

        it('should handle rate limiting', async () => {
            // Send multiple requests quickly
            const promises = Array(35).fill().map(() =>
                request(app)
                    .post('/api/chatbot/message')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ message: 'Test message' })
            );

            const responses = await Promise.all(promises);
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/chatbot/conversations', () => {
        it('should return user conversations', async () => {
            // Create test conversations
            await request(app)
                .post('/api/chatbot/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'First conversation' });

            await request(app)
                .post('/api/chatbot/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Second conversation' });

            const response = await request(app)
                .get('/api/chatbot/conversations')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.conversations).toHaveLength(2);
        });

        it('should support pagination', async () => {
            // Create multiple conversations
            for (let i = 0; i < 15; i++) {
                await request(app)
                    .post('/api/chatbot/message')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ message: `Conversation ${i}` });
            }

            const response = await request(app)
                .get('/api/chatbot/conversations?limit=5&offset=5')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.conversations).toHaveLength(5);
            expect(response.body.data.limit).toBe(5);
            expect(response.body.data.offset).toBe(5);
        });
    });

    describe('PUT /api/chatbot/conversations/:sessionId/title', () => {
        it('should update conversation title', async () => {
            // Create conversation
            const createResponse = await request(app)
                .post('/api/chatbot/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Test message' });

            const sessionId = createResponse.body.data.sessionId;

            // Update title
            const updateResponse = await request(app)
                .put(`/api/chatbot/conversations/${sessionId}/title`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Updated Title' });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.success).toBe(true);

            // Verify title was updated
            const conversation = await Conversation.findOne({ sessionId });
            expect(conversation.title).toBe('Updated Title');
        });
    });

    describe('DELETE /api/chatbot/conversations/:sessionId', () => {
        it('should soft delete conversation', async () => {
            // Create conversation
            const createResponse = await request(app)
                .post('/api/chatbot/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Test message' });

            const sessionId = createResponse.body.data.sessionId;

            // Delete conversation
            const deleteResponse = await request(app)
                .delete(`/api/chatbot/conversations/${sessionId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.success).toBe(true);

            // Verify conversation is marked inactive
            const conversation = await Conversation.findOne({ sessionId });
            expect(conversation.isActive).toBe(false);
        });
    });
});
```

### 2. Database Integration Tests

#### `tests/integration/database.test.js`

```javascript
const mongoose = require('mongoose');
const Conversation = require('../../backend/models/Conversation');
const User = require('../../backend/models/User');

describe('Database Integration', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_MONGO_URI);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Conversation.deleteMany({});
        await User.deleteMany({});
    });

    describe('Conversation Model', () => {
        it('should create conversation with proper indexes', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            await user.save();

            const conversation = new Conversation({
                userId: user._id,
                sessionId: 'test-session-123',
                title: 'Test Conversation',
                messages: [
                    {
                        role: 'user',
                        content: 'Hello',
                        metadata: { emotion: 'neutral', confidence: 0.5 }
                    }
                ]
            });

            await conversation.save();

            // Test index usage
            const found = await Conversation.findOne({ 
                userId: user._id, 
                sessionId: 'test-session-123' 
            }).explain('executionStats');

            expect(found.executionStats.executionSuccess).toBe(true);
        });

        it('should enforce unique sessionId constraint', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            await user.save();

            const conversation1 = new Conversation({
                userId: user._id,
                sessionId: 'duplicate-session',
                title: 'First Conversation'
            });
            await conversation1.save();

            const conversation2 = new Conversation({
                userId: user._id,
                sessionId: 'duplicate-session',
                title: 'Second Conversation'
            });

            await expect(conversation2.save()).rejects.toThrow();
        });
    });
});
```

## End-to-End Tests

### 1. Frontend E2E Tests

#### `tests/e2e/chat.e2e.test.js`

```javascript
const puppeteer = require('puppeteer');

describe('Chat Interface E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: process.env.CI === 'true',
            slowMo: 50
        });
        page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1200, height: 800 });
        
        // Mock authentication
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('token', 'mock-jwt-token');
        });
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('#chat-interface');
    });

    it('should send and receive messages', async () => {
        // Type message
        await page.type('#chat-message-input', 'Hello, I need some guidance');
        
        // Send message
        await page.click('#send-message-btn');
        
        // Wait for user message to appear
        await page.waitForSelector('.user-message');
        
        // Wait for assistant response
        await page.waitForSelector('.assistant-message', { timeout: 10000 });
        
        // Verify messages
        const userMessage = await page.$eval('.user-message .message-text', el => el.textContent);
        const assistantMessage = await page.$eval('.assistant-message .message-text', el => el.textContent);
        
        expect(userMessage).toContain('Hello, I need some guidance');
        expect(assistantMessage).toBeTruthy();
        expect(assistantMessage.length).toBeGreaterThan(0);
    });

    it('should show conversation starters', async () => {
        const starters = await page.$$('.starter-btn');
        expect(starters.length).toBeGreaterThan(0);
        
        // Click first starter
        await starters[0].click();
        
        // Verify message was sent
        await page.waitForSelector('.user-message');
        await page.waitForSelector('.assistant-message');
    });

    it('should open and close conversation history', async () => {
        // Open sidebar
        await page.click('#conversation-history-btn');
        await page.waitForSelector('.chat-sidebar.visible');
        
        // Close sidebar
        await page.click('#close-sidebar-btn');
        await page.waitForFunction(() => 
            !document.querySelector('.chat-sidebar').classList.contains('visible')
        );
    });

    it('should handle conversation tone changes', async () => {
        // Change tone
        await page.select('#conversation-tone', 'spiritual');
        
        // Send message
        await page.type('#chat-message-input', 'I need spiritual guidance');
        await page.click('#send-message-btn');
        
        // Wait for response
        await page.waitForSelector('.assistant-message');
        
        const response = await page.$eval('.assistant-message .message-text', el => el.textContent);
        expect(response).toBeTruthy();
    });

    it('should show emotion indicators', async () => {
        // Send emotional message
        await page.type('#chat-message-input', 'I am feeling very anxious and worried');
        await page.click('#send-message-btn');
        
        // Wait for emotion to be detected
        await page.waitForFunction(() => 
            document.querySelector('#current-emotion').textContent !== 'Neutral'
        );
        
        const emotion = await page.$eval('#current-emotion', el => el.textContent);
        expect(emotion).toBe('anxious');
    });

    it('should handle quick actions', async () => {
        const quickActions = await page.$$('.quick-action-btn');
        expect(quickActions.length).toBeGreaterThan(0);
        
        // Click gratitude action
        await page.click('[data-action="gratitude"]');
        
        // Verify message was sent
        await page.waitForSelector('.user-message');
        const message = await page.$eval('.user-message .message-text', el => el.textContent);
        expect(message).toContain('gratitude');
    });
});
```

## Performance Tests

### 1. Load Testing

#### `tests/performance/load.test.js`

```javascript
const autocannon = require('autocannon');
const jwt = require('jsonwebtoken');

describe('Chatbot Performance', () => {
    const authToken = jwt.sign({ userId: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET);

    it('should handle concurrent message requests', async () => {
        const result = await autocannon({
            url: 'http://localhost:5000/api/chatbot/message',
            connections: 10,
            duration: 30,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Performance test message',
                conversationTone: 'supportive'
            }),
            method: 'POST'
        });

        expect(result.errors).toBe(0);
        expect(result.timeouts).toBe(0);
        expect(result.non2xx).toBeLessThan(result.requests.total * 0.01); // Less than 1% errors
        expect(result.latency.average).toBeLessThan(2000); // Average response time under 2s
    });

    it('should handle conversation history requests', async () => {
        const result = await autocannon({
            url: 'http://localhost:5000/api/chatbot/conversations',
            connections: 20,
            duration: 15,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        expect(result.errors).toBe(0);
        expect(result.latency.average).toBeLessThan(500); // Average response time under 500ms
    });
});
```

### 2. Memory and Resource Tests

#### `tests/performance/memory.test.js`

```javascript
const ChatbotService = require('../../backend/services/ChatbotService');

describe('Memory Usage', () => {
    it('should not leak memory with many conversations', async () => {
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Create many conversations
        const promises = [];
        for (let i = 0; i < 100; i++) {
            promises.push(
                ChatbotService.processMessage(
                    `user${i}`, 
                    `Test message ${i}`,
                    { sessionId: `session${i}` }
                )
            );
        }
        
        await Promise.all(promises);
        
        // Force garbage collection
        if (global.gc) {
            global.gc();
        }
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should clean up caches properly', () => {
        // Fill caches
        for (let i = 0; i < 150; i++) {
            ChatbotService.conversationCache.set(`session${i}`, { test: true });
            ChatbotService.responseCache.set(`key${i}`, 'response');
        }
        
        // Verify cache limits are enforced
        expect(ChatbotService.conversationCache.size).toBeLessThanOrEqual(100);
        expect(ChatbotService.responseCache.size).toBeLessThanOrEqual(100);
    });
});
```

## Test Configuration

### 1. Jest Configuration

#### `jest.config.js`

```javascript
module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: [
        '<rootDir>/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/node_modules/**',
        '!backend/coverage/**'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    testTimeout: 30000,
    maxWorkers: 4
};
```

### 2. Test Setup

#### `tests/setup.js`

```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.TEST_MONGO_URI = mongoUri;
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});
```

## Running Tests

### 1. Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:performance": "jest tests/performance",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### 2. Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm run test:watch

# Run performance tests
npm run test:performance
```

## Continuous Integration

### 1. GitHub Actions

#### `.github/workflows/test.yml`

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          MONGO_URI: mongodb://localhost:27017/test
          JWT_SECRET: test-secret
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

This comprehensive testing strategy ensures the Chatbot Service is reliable, performant, and maintainable. The tests cover all aspects from individual functions to complete user workflows, providing confidence in the system's quality and behavior.

---

# Mood Detection Service Testing Strategy

## Overview

This document outlines comprehensive testing strategies for the Mood Detection Service, including unit tests, integration tests, end-to-end tests, and performance testing approaches.

## Testing Architecture

```
Testing Pyramid:
├── Unit Tests (70%)
│   ├── Service Logic
│   ├── Controllers
│   ├── Emotion Analysis
│   └── Models
├── Integration Tests (20%)
│   ├── API Endpoints
│   ├── Database Operations
│   └── External Services
└── End-to-End Tests (10%)
    ├── User Workflows
    ├── Frontend Integration
    └── Performance Tests
```

## Unit Tests

### 1. MoodDetectionService Tests

#### `tests/unit/services/MoodDetectionService.test.js`

```javascript
const MoodDetectionService = require('../../../backend/services/MoodDetectionService');
const MoodEntry = require('../../../backend/models/MoodEntry');
const { analyzeTextEmotion } = require('../../../backend/utils/emotionAnalysis');

// Mock dependencies
jest.mock('../../../backend/models/MoodEntry');
jest.mock('../../../backend/utils/emotionAnalysis');

describe('MoodDetectionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        MoodDetectionService.analysisCache.clear();
        MoodDetectionService.userPatternCache.clear();
    });

    describe('analyzeMood', () => {
        it('should analyze text mood successfully', async () => {
            // Arrange
            const userId = '507f1f77bcf86cd799439011';
            const input = {
                type: 'text',
                content: 'I am feeling very anxious and overwhelmed today',
                context: { timeOfDay: 'evening' }
            };
            const options = { includeInsights: true, includeSuggestions: true };

            analyzeTextEmotion.mockResolvedValue({
                emotion: 'anxious',
                confidence: 0.85,
                scores: { anxious: 0.85, sad: 0.2, neutral: 0.1 }
            });

            MoodEntry.prototype.save = jest.fn().mockResolvedValue(true);

            // Act
            const result = await MoodDetectionService.analyzeMood(userId, input, options);

            // Assert
            expect(result).toHaveProperty('primaryEmotion', 'anxious');
            expect(result).toHaveProperty('confidence', 0.85);
            expect(result).toHaveProperty('intensity');
            expect(result).toHaveProperty('insights');
            expect(result).toHaveProperty('suggestions');
            expect(result.analysisType).toBe('text');
        });

        it('should handle empty text input', async () => {
            // Arrange
            const userId = '507f1f77bcf86cd799439011';
            const input = { type: 'text', content: '' };

            // Act & Assert
            await expect(MoodDetectionService.analyzeMood(userId, input))
                .rejects.toThrow('Text content is required for text analysis');
        });

        it('should handle text that is too long', async () => {
            // Arrange
            const userId = '507f1f77bcf86cd799439011';
            const input = { type: 'text', content: 'a'.repeat(5001) };

            // Act & Assert
            await expect(MoodDetectionService.analyzeMood(userId, input))
                .rejects.toThrow('Text content too long');
        });

        it('should use cached results for similar analyses', async () => {
            // Arrange
            const userId = '507f1f77bcf86cd799439011';
            const input = { type: 'text', content: 'I am happy today' };
            
            const cachedResult = {
                primaryEmotion: 'joyful',
                confidence: 0.9,
                cacheUsed: true
            };

            const cacheKey = MoodDetectionService.generateCacheKey(userId, input);
            MoodDetectionService.analysisCache.set(cacheKey, cachedResult);

            // Act
            const result = await MoodDetectionService.analyzeMood(userId, input);

            // Assert
            expect(result.primaryEmotion).toBe('joyful');
            expect(analyzeTextEmotion).not.toHaveBeenCalled();
        });
    });

    describe('analyzeTextMood', () => {
        it('should detect spiritual context', async () => {
            // Arrange
            const text = 'I am praying to Allah for guidance and peace';
            const context = {};

            analyzeTextEmotion.mockResolvedValue({
                emotion: 'spiritual',
                confidence: 0.8,
                scores: { spiritual: 0.8, peaceful: 0.6 }
            });

            // Act
            const result = await MoodDetectionService.analyzeTextMood(text, context);

            // Assert
            expect(result.spiritualContext.isSpiritual).toBe(true);
            expect(result.spiritualContext.detectedTerms.spiritual).toContain('pray');
            expect(result.spiritualContext.detectedTerms.religious).toContain('allah');
        });

        it('should handle mixed emotions', async () => {
            // Arrange
            const text = 'I am happy but also a bit worried about tomorrow';

            analyzeTextEmotion.mockResolvedValue({
                emotion: 'joyful',
                confidence: 0.6,
                scores: { joyful: 0.6, anxious: 0.4, neutral: 0.2 }
            });

            // Act
            const result = await MoodDetectionService.analyzeTextMood(text);

            // Assert
            expect(result.primaryEmotion).toBe('joyful');
            expect(result.emotions.anxious).toBe(0.4);
            expect(result.intensity).toBe('medium');
        });
    });

    describe('generateInsights', () => {
        it('should generate confidence-based insights', async () => {
            // Arrange
            const analysis = {
                primaryEmotion: 'joyful',
                confidence: 0.9,
                intensity: 'high'
            };
            const userId = '507f1f77bcf86cd799439011';

            // Mock user patterns
            jest.spyOn(MoodDetectionService, 'getUserEmotionPatterns')
                .mockResolvedValue({
                    dominantEmotions: ['joyful', 'peaceful'],
                    recentTrend: 'improving'
                });

            // Act
            const insights = await MoodDetectionService.generateInsights(analysis, userId);

            // Assert
            expect(insights).toHaveLength(2);
            expect(insights[0].type).toBe('confidence');
            expect(insights[1].type).toBe('trend');
        });

        it('should generate temporal insights for early morning', async () => {
            // Arrange
            const analysis = { primaryEmotion: 'anxious', confidence: 0.7 };
            const userId = '507f1f77bcf86cd799439011';
            
            // Mock early morning time
            jest.spyOn(Date.prototype, 'getHours').mockReturnValue(4);

            // Act
            const insights = await MoodDetectionService.generateInsights(analysis, userId);

            // Assert
            const temporalInsight = insights.find(i => i.type === 'temporal');
            expect(temporalInsight).toBeDefined();
            expect(temporalInsight.message).toContain('Early morning');
        });
    });

    describe('generateSuggestions', () => {
        it('should generate emotion-specific suggestions', async () => {
            // Arrange
            const analysis = { primaryEmotion: 'anxious', intensity: 'high' };
            const userId = '507f1f77bcf86cd799439011';

            // Act
            const suggestions = await MoodDetectionService.generateSuggestions(analysis, userId);

            // Assert
            expect(suggestions.length).toBeGreaterThan(0);
            const breathingSuggestion = suggestions.find(s => s.type === 'breathing');
            expect(breathingSuggestion).toBeDefined();
            expect(breathingSuggestion.title).toBe('Breathing Exercise');
        });

        it('should include spiritual suggestions for Muslim users', async () => {
            // Arrange
            const analysis = { primaryEmotion: 'spiritual', spiritualContext: { isSpiritual: true } };
            const userId = '507f1f77bcf86cd799439011';

            // Mock Muslim user
            const User = require('../../../backend/models/User');
            User.findById = jest.fn().mockResolvedValue({
                spiritualPreferences: { religion: 'Islam' }
            });

            // Act
            const suggestions = await MoodDetectionService.generateSuggestions(analysis, userId);

            // Assert
            const tasbihSuggestion = suggestions.find(s => s.type === 'tasbih');
            expect(tasbihSuggestion).toBeDefined();
        });
    });
});
```

### 2. Controller Tests

#### `tests/unit/controllers/moodController.test.js`

```javascript
const request = require('supertest');
const express = require('express');
const moodController = require('../../../backend/controllers/moodController');
const MoodDetectionService = require('../../../backend/services/MoodDetectionService');

// Mock dependencies
jest.mock('../../../backend/services/MoodDetectionService');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.userId = '507f1f77bcf86cd799439011';
    next();
});

describe('MoodController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /analyze', () => {
        it('should analyze mood successfully', async () => {
            // Arrange
            const mockAnalysis = {
                primaryEmotion: 'joyful',
                confidence: 0.85,
                intensity: 'high',
                insights: [],
                suggestions: []
            };
            MoodDetectionService.analyzeMood.mockResolvedValue(mockAnalysis);

            // Act
            const response = await request(app)
                .post('/analyze')
                .send({
                    input: {
                        type: 'text',
                        content: 'I am so happy today!'
                    },
                    options: {
                        includeInsights: true
                    }
                });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.primaryEmotion).toBe('joyful');
        });

        it('should validate input type', async () => {
            // Act
            const response = await request(app)
                .post('/analyze')
                .send({
                    input: {
                        type: 'invalid',
                        content: 'test'
                    }
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid input type');
        });

        it('should validate content length', async () => {
            // Act
            const response = await request(app)
                .post('/analyze')
                .send({
                    input: {
                        type: 'text',
                        content: 'a'.repeat(5001)
                    }
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('too long');
        });
    });

    describe('GET /history', () => {
        it('should return mood history', async () => {
            // Arrange
            const mockHistory = {
                entries: [
                    {
                        primaryEmotion: 'joyful',
                        confidence: 0.8,
                        createdAt: new Date()
                    }
                ],
                pagination: { total: 1, limit: 20, offset: 0 }
            };
            MoodDetectionService.getMoodHistory.mockResolvedValue(mockHistory);

            // Act
            const response = await request(app).get('/history');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.entries).toHaveLength(1);
        });

        it('should validate query parameters', async () => {
            // Act
            const response = await request(app)
                .get('/history?limit=101');

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Limit must be between 1 and 100');
        });
    });
});

// Add routes to test app
app.post('/analyze', moodController.analyzeMood);
app.get('/history', moodController.getMoodHistory);
```

### 3. Model Tests

#### `tests/unit/models/MoodEntry.test.js`

```javascript
const mongoose = require('mongoose');
const MoodEntry = require('../../../backend/models/MoodEntry');

describe('MoodEntry Model', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_MONGO_URI);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await MoodEntry.deleteMany({});
    });

    describe('Schema Validation', () => {
        it('should create a valid mood entry', async () => {
            // Arrange
            const moodData = {
                userId: new mongoose.Types.ObjectId(),
                primaryEmotion: 'joyful',
                confidence: 0.85,
                intensity: 'high',
                emotions: new Map([['joyful', 0.85], ['peaceful', 0.3]]),
                analysisType: 'text'
            };

            // Act
            const moodEntry = new MoodEntry(moodData);
            const savedEntry = await moodEntry.save();

            // Assert
            expect(savedEntry._id).toBeDefined();
            expect(savedEntry.primaryEmotion).toBe('joyful');
            expect(savedEntry.confidence).toBe(0.85);
        });

        it('should require primary emotion', async () => {
            // Arrange
            const moodData = {
                userId: new mongoose.Types.ObjectId(),
                confidence: 0.85,
                intensity: 'high',
                analysisType: 'text'
            };

            // Act & Assert
            const moodEntry = new MoodEntry(moodData);
            await expect(moodEntry.save()).rejects.toThrow();
        });

        it('should validate emotion enum values', async () => {
            // Arrange
            const moodData = {
                userId: new mongoose.Types.ObjectId(),
                primaryEmotion: 'invalid_emotion',
                confidence: 0.85,
                intensity: 'high',
                analysisType: 'text'
            };

            // Act & Assert
            const moodEntry = new MoodEntry(moodData);
            await expect(moodEntry.save()).rejects.toThrow();
        });
    });

    describe('Virtual Properties', () => {
        it('should calculate emotion category correctly', async () => {
            // Arrange & Act
            const positiveEntry = new MoodEntry({
                userId: new mongoose.Types.ObjectId(),
                primaryEmotion: 'joyful',
                confidence: 0.8,
                intensity: 'high',
                analysisType: 'text'
            });

            const negativeEntry = new MoodEntry({
                userId: new mongoose.Types.ObjectId(),
                primaryEmotion: 'sad',
                confidence: 0.7,
                intensity: 'medium',
                analysisType: 'text'
            });

            // Assert
            expect(positiveEntry.emotionCategory).toBe('positive');
            expect(negativeEntry.emotionCategory).toBe('negative');
        });
    });

    describe('Static Methods', () => {
        it('should get emotion distribution', async () => {
            // Arrange
            const userId = new mongoose.Types.ObjectId();
            
            await MoodEntry.create([
                { userId, primaryEmotion: 'joyful', confidence: 0.8, intensity: 'high', analysisType: 'text' },
                { userId, primaryEmotion: 'joyful', confidence: 0.7, intensity: 'medium', analysisType: 'text' },
                { userId, primaryEmotion: 'peaceful', confidence: 0.9, intensity: 'high', analysisType: 'text' }
            ]);

            // Act
            const distribution = await MoodEntry.getEmotionDistribution(userId, 30);

            // Assert
            expect(distribution).toHaveLength(2);
            expect(distribution[0]._id).toBe('joyful');
            expect(distribution[0].count).toBe(2);
        });
    });
});
```

## Integration Tests

### 1. API Integration Tests

#### `tests/integration/mood.api.test.js`

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/server');
const User = require('../../backend/models/User');
const MoodEntry = require('../../backend/models/MoodEntry');
const jwt = require('jsonwebtoken');

describe('Mood API Integration', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_MONGO_URI);
        
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            spiritualPreferences: { religion: 'Islam' }
        });
        await user.save();
        userId = user._id;

        authToken = jwt.sign({ userId }, process.env.JWT_SECRET);
    });

    afterAll(async () => {
        await User.deleteMany({});
        await MoodEntry.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await MoodEntry.deleteMany({});
    });

    describe('POST /api/mood/analyze', () => {
        it('should analyze text mood and save to database', async () => {
            const response = await request(app)
                .post('/api/mood/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    input: {
                        type: 'text',
                        content: 'I am feeling very grateful and blessed today, Alhamdulillah',
                        context: { timeOfDay: 'morning' }
                    },
                    options: {
                        includeInsights: true,
                        includeSuggestions: true,
                        saveToHistory: true
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.primaryEmotion).toBeDefined();
            expect(response.body.data.spiritualContext.isSpiritual).toBe(true);

            // Verify saved to database
            const savedEntry = await MoodEntry.findOne({ userId });
            expect(savedEntry).toBeTruthy();
            expect(savedEntry.primaryEmotion).toBe(response.body.data.primaryEmotion);
        });

        it('should handle rate limiting', async () => {
            // Send multiple requests quickly
            const promises = Array(25).fill().map(() =>
                request(app)
                    .post('/api/mood/analyze')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        input: { type: 'text', content: 'Test message' }
                    })
            );

            const responses = await Promise.all(promises);
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/mood/history', () => {
        it('should return user mood history', async () => {
            // Create test entries
            await MoodEntry.create([
                {
                    userId,
                    primaryEmotion: 'joyful',
                    confidence: 0.8,
                    intensity: 'high',
                    analysisType: 'text'
                },
                {
                    userId,
                    primaryEmotion: 'peaceful',
                    confidence: 0.9,
                    intensity: 'medium',
                    analysisType: 'text'
                }
            ]);

            const response = await request(app)
                .get('/api/mood/history')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.entries).toHaveLength(2);
        });
    });

    describe('GET /api/mood/analytics', () => {
        it('should generate mood analytics', async () => {
            // Create test data
            await MoodEntry.create([
                { userId, primaryEmotion: 'joyful', confidence: 0.8, intensity: 'high', analysisType: 'text' },
                { userId, primaryEmotion: 'joyful', confidence: 0.7, intensity: 'medium', analysisType: 'text' },
                { userId, primaryEmotion: 'peaceful', confidence: 0.9, intensity: 'high', analysisType: 'text' }
            ]);

            const response = await request(app)
                .get('/api/mood/analytics?timeframe=30d')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalEntries).toBe(3);
            expect(response.body.data.dominantEmotion).toBe('joyful');
        });
    });
});
```

## End-to-End Tests

### 1. Frontend E2E Tests

#### `tests/e2e/mood.e2e.test.js`

```javascript
const puppeteer = require('puppeteer');

describe('Mood Detection E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: process.env.CI === 'true',
            slowMo: 50
        });
        page = await browser.newPage();
        
        await page.setViewport({ width: 1200, height: 800 });
        
        // Mock authentication
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('token', 'mock-jwt-token');
        });
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('#mood-detector');
    });

    it('should analyze text mood', async () => {
        // Type in text input
        await page.type('#mood-text-input', 'I am feeling very happy and grateful today!');
        
        // Click analyze button
        await page.click('#analyze-text-btn');
        
        // Wait for results
        await page.waitForSelector('#mood-results', { visible: true });
        
        // Verify results are displayed
        const emotionName = await page.$eval('#emotion-name', el => el.textContent);
        expect(emotionName).toBeTruthy();
        
        const confidence = await page.$eval('#emotion-confidence', el => el.textContent);
        expect(confidence).toContain('%');
    });

    it('should switch between input tabs', async () => {
        // Click voice tab
        await page.click('[data-tab="voice"]');
        await page.waitForSelector('#voice-tab.active');
        
        // Verify voice tab is active
        const voiceTabActive = await page.$eval('#voice-tab', el => 
            el.classList.contains('active')
        );
        expect(voiceTabActive).toBe(true);
        
        // Click image tab
        await page.click('[data-tab="image"]');
        await page.waitForSelector('#image-tab.active');
        
        // Verify image tab is active
        const imageTabActive = await page.$eval('#image-tab', el => 
            el.classList.contains('active')
        );
        expect(imageTabActive).toBe(true);
    });

    it('should display mood history', async () => {
        // Click history button
        await page.click('#mood-history-btn');
        await page.waitForSelector('.mood-history-panel.visible');
        
        // Verify history panel is visible
        const historyVisible = await page.$eval('.mood-history-panel', el => 
            el.classList.contains('visible')
        );
        expect(historyVisible).toBe(true);
        
        // Close history panel
        await page.click('#close-history-btn');
        await page.waitForFunction(() => 
            !document.querySelector('.mood-history-panel').classList.contains('visible')
        );
    });

    it('should handle suggestion actions', async () => {
        // Analyze mood first
        await page.type('#mood-text-input', 'I am feeling anxious and worried');
        await page.click('#analyze-text-btn');
        await page.waitForSelector('#mood-results', { visible: true });
        
        // Click on a suggestion
        const suggestionBtn = await page.$('.suggestion-action');
        if (suggestionBtn) {
            await suggestionBtn.click();
            // Verify action was handled (implementation specific)
        }
    });
});
```

## Performance Tests

### 1. Load Testing

#### `tests/performance/mood.load.test.js`

```javascript
const autocannon = require('autocannon');
const jwt = require('jsonwebtoken');

describe('Mood Detection Performance', () => {
    const authToken = jwt.sign({ userId: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET);

    it('should handle concurrent mood analysis requests', async () => {
        const result = await autocannon({
            url: 'http://localhost:5000/api/mood/analyze',
            connections: 10,
            duration: 30,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: {
                    type: 'text',
                    content: 'Performance test message for mood analysis'
                },
                options: {
                    includeInsights: true,
                    includeSuggestions: true
                }
            }),
            method: 'POST'
        });

        expect(result.errors).toBe(0);
        expect(result.timeouts).toBe(0);
        expect(result.non2xx).toBeLessThan(result.requests.total * 0.01);
        expect(result.latency.average).toBeLessThan(3000); // Under 3s average
    });

    it('should handle mood history requests efficiently', async () => {
        const result = await autocannon({
            url: 'http://localhost:5000/api/mood/history',
            connections: 20,
            duration: 15,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        expect(result.errors).toBe(0);
        expect(result.latency.average).toBeLessThan(1000); // Under 1s average
    });
});
```

## Test Configuration

### 1. Jest Configuration Update

#### `jest.config.js`

```javascript
module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: [
        '<rootDir>/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/node_modules/**',
        '!backend/coverage/**'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        },
        './backend/services/MoodDetectionService.js': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        }
    },
    testTimeout: 30000,
    maxWorkers: 4
};
```

### 2. Package.json Scripts Update

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:performance": "jest tests/performance",
    "test:mood": "jest tests/**/*mood*.test.js",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

This comprehensive testing strategy ensures the Mood Detection Service is reliable, accurate, and performant. The tests cover emotion analysis accuracy, API functionality, user interface interactions, and system performance under load.