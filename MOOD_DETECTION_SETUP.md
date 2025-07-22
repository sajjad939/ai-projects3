# Mood Detection Service Setup Guide

## Overview

This guide provides step-by-step instructions for setting up and configuring the Mood Detection Service for the Mirror of Heart application.

## Prerequisites

- Node.js 16+ and npm
- MongoDB database
- JWT authentication system
- Express.js backend

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install natural axios express-rate-limit express-validator
```

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Optional: Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
RATE_LIMIT_PREMIUM_MAX=40

# Optional: Service Configuration
MOOD_SERVICE_VERSION=2.0.0
MOOD_CACHE_SIZE=200
MOOD_USER_CACHE_SIZE=100
```

### 3. Database Setup

The service uses the existing MongoDB connection. Ensure your database is running and accessible.

### 4. Service Integration

Add the mood detection routes to your main server file:

#### `backend/server.js`
```javascript
const moodRoutes = require('./routes/moodRoutes');

// Add this line with your other route definitions
app.use('/api/mood', moodRoutes);
```

## Configuration

### 1. Emotion Categories

The service comes with pre-configured emotion categories. You can customize them in `MoodDetectionService.js`:

```javascript
this.emotionCategories = {
    peaceful: {
        keywords: ['calm', 'serene', 'tranquil', 'peaceful'],
        spiritualContext: 'inner peace',
        guidance: 'Continue nurturing this beautiful state of peace',
        color: '#4ade80',
        intensity: 'positive',
        practices: ['meditation', 'dhikr', 'contemplation']
    },
    // Add or modify emotions as needed
};
```

### 2. Spiritual Traditions

Customize spiritual traditions and their associated guidance:

```javascript
this.spiritualTraditions = {
    Islam: {
        practices: ['salah', 'dhikr', 'dua', 'quran', 'tasbih'],
        keywords: ['allah', 'prophet', 'islam', 'muslim'],
        guidance: {
            anxious: "Remember Allah's promise: 'And whoever relies upon Allah - then He is sufficient for him.'"
        }
    },
    // Add more traditions as needed
};
```

### 3. Rate Limiting

Adjust rate limiting based on your needs:

```javascript
// In moodController.js
const moodAnalysisRateLimit = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 20,
    message: {
        success: false,
        error: 'Too many mood analyses. Please wait a moment.',
        retryAfter: 60
    }
});
```

## Frontend Integration

### 1. Include CSS

Add the mood detection styles to your main CSS file:

```css
/* In your main CSS file */
@import url('styles/mood.css');
```

### 2. Initialize Component

Add the mood detector to your main application:

```javascript
// In your main app.js
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
        window.moodDetector = new MoodDetector();
    }
});
```

### 3. HTML Structure

The MoodDetector component will automatically create its interface. Ensure you have the proper container structure:

```html
<div class="chatgpt-column">
    <!-- Mood detector will be inserted here -->
</div>
```

## Testing

### 1. Backend Testing

Test the API endpoints:

```javascript
// Test script
const axios = require('axios');

const testMoodAnalysis = async () => {
    const token = 'your_test_token';
    
    try {
        // Test text analysis
        const response = await axios.post('http://localhost:5000/api/mood/analyze', {
            input: {
                type: 'text',
                content: 'I am feeling very peaceful and grateful today'
            },
            options: {
                includeInsights: true,
                includeSuggestions: true
            }
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Analysis Result:', response.data);
        
        // Test history retrieval
        const history = await axios.get('http://localhost:5000/api/mood/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('History:', history.data);
        
    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
};

testMoodAnalysis();
```

### 2. Frontend Testing

Test the mood detector interface:

```javascript
// In browser console
// Test text analysis
window.moodDetector.analyzeText();

// Test history loading
window.moodDetector.loadHistory();

// Test analytics
window.moodDetector.loadAnalyticsData();
```

## Monitoring and Maintenance

### 1. Health Monitoring

Monitor the service health:

```bash
curl http://localhost:5000/api/mood/health
```

### 2. Performance Metrics

The service provides built-in metrics:

```javascript
// Access metrics
const healthMetrics = MoodDetectionService.getHealthMetrics();
console.log('Service Metrics:', healthMetrics);
```

### 3. Cache Management

The service automatically manages caches, but you can monitor them:

```javascript
// Check cache sizes
console.log('Analysis Cache Size:', MoodDetectionService.analysisCache.size);
console.log('User Context Cache Size:', MoodDetectionService.userContextCache.size);
```

### 4. Database Maintenance

Regular maintenance tasks:

```javascript
// Clean up old entries (optional)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await MoodEntry.deleteMany({
    createdAt: { $lt: thirtyDaysAgo },
    isActive: false
});
```

## Troubleshooting

### Common Issues

1. **Analysis Fails**
   - Check MongoDB connection
   - Verify JWT token is valid
   - Ensure input validation passes

2. **Rate Limiting Issues**
   - Adjust rate limits in configuration
   - Implement proper error handling
   - Consider user feedback for limits

3. **Memory Issues**
   - Monitor cache sizes
   - Adjust cleanup intervals
   - Consider Redis for production caching

4. **Performance Issues**
   - Add database indexes
   - Optimize query patterns
   - Consider connection pooling

### Debug Mode

Enable debug logging:

```javascript
// In MoodDetectionService
console.log('Debug: Processing analysis', { userId, input, options });
```

### Error Logging

Monitor error logs:

```bash
# View recent errors
tail -f logs/mood-service.log | grep ERROR
```

## Production Deployment

### 1. Environment Variables

Set production environment variables:

```env
NODE_ENV=production
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_secret
RATE_LIMIT_MAX_REQUESTS=20
MOOD_CACHE_SIZE=500
```

### 2. Security Checklist

- [ ] Rate limiting is configured
- [ ] Input validation is implemented
- [ ] Authentication is required for all endpoints
- [ ] CORS is properly configured
- [ ] HTTPS is enabled
- [ ] Database access is restricted

### 3. Performance Optimization

- Use MongoDB indexes for frequent queries
- Implement Redis for caching in production
- Use connection pooling
- Monitor memory usage
- Set up log rotation

### 4. Monitoring Setup

- Set up health check monitoring
- Monitor API response times
- Track error rates
- Monitor database performance
- Set up alerting for issues

## Scaling Considerations

### 1. Horizontal Scaling

- Service is stateless and can be scaled horizontally
- Use Redis for shared caching
- Implement proper load balancing

### 2. Database Scaling

- Add read replicas for analytics queries
- Consider sharding for large datasets
- Implement proper indexing strategy

### 3. Caching Strategy

- Implement Redis for production
- Use CDN for static assets
- Cache frequent queries

This setup guide provides everything needed to deploy and maintain the Mood Detection Service in production. Follow the steps in order and test each component before proceeding to the next.