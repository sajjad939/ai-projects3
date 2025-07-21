# Mirror of Heart - Chatbot Service API Documentation

## Overview

The Chatbot Service provides AI-powered conversational capabilities for the Mirror of Heart application. It integrates with Google's Gemini API to deliver contextually aware, emotionally intelligent responses while maintaining conversation history and user context.

## Base URL
```
/api/chatbot
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- **Limit**: 30 requests per minute per user
- **Window**: 1 minute
- **Response**: 429 Too Many Requests with retry-after header

## Endpoints

### 1. Send Message

Send a message to the AI chatbot and receive a response.

**Endpoint**: `POST /api/chatbot/message`

**Request Body**:
```json
{
  "message": "I'm feeling overwhelmed today and need some guidance",
  "sessionId": "optional-session-uuid",
  "conversationTone": "supportive",
  "inputType": "text",
  "context": {
    "location": "optional",
    "timeOfDay": "optional"
  }
}
```

**Parameters**:
- `message` (string, required): The user's message (max 2000 characters)
- `sessionId` (string, optional): Conversation session ID. If not provided, a new session is created
- `conversationTone` (string, optional): One of "supportive", "spiritual", "reflective" (default: "supportive")
- `inputType` (string, optional): One of "text", "voice", "image" (default: "text")
- `context` (object, optional): Additional context information

**Response**:
```json
{
  "success": true,
  "data": {
    "response": "I hear that you're feeling overwhelmed, and I want you to know that these feelings are completely valid...",
    "emotion": {
      "emotion": "anxious",
      "confidence": 0.85,
      "scores": {
        "anxious": 2,
        "sad": 1,
        "neutral": 0
      }
    },
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "conversationId": "60f7b3b4c9e77c001f5e4a2b",
    "messageCount": 4,
    "conversationTitle": "Feeling overwhelmed today...",
    "responseTime": 1250
  }
}
```

**Error Responses**:
```json
{
  "success": false,
  "error": "Message too long. Please keep messages under 2000 characters."
}
```

### 2. Get Conversations

Retrieve user's conversation history.

**Endpoint**: `GET /api/chatbot/conversations`

**Query Parameters**:
- `limit` (integer, optional): Number of conversations to return (max 50, default 10)
- `offset` (integer, optional): Number of conversations to skip (default 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "sessionId": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Feeling overwhelmed today...",
        "lastActivity": "2024-01-15T10:30:00Z",
        "messageCount": 8,
        "preview": "I'm feeling overwhelmed today and need some guidance",
        "currentMood": "anxious"
      }
    ],
    "total": 15,
    "limit": 10,
    "offset": 0
  }
}
```

### 3. Get Specific Conversation

Retrieve a specific conversation with full message history.

**Endpoint**: `GET /api/chatbot/conversations/:sessionId`

**Parameters**:
- `sessionId` (string, required): The conversation session ID

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Feeling overwhelmed today...",
    "messages": [
      {
        "role": "user",
        "content": "I'm feeling overwhelmed today",
        "timestamp": "2024-01-15T10:30:00Z",
        "emotion": "anxious",
        "confidence": 0.85
      },
      {
        "role": "assistant",
        "content": "I hear that you're feeling overwhelmed...",
        "timestamp": "2024-01-15T10:30:15Z"
      }
    ],
    "context": {
      "spiritualPreferences": {},
      "emotionalState": {
        "currentMood": "anxious",
        "moodHistory": [
          {
            "mood": "anxious",
            "confidence": 0.85,
            "timestamp": "2024-01-15T10:30:00Z"
          }
        ]
      },
      "conversationTone": "supportive"
    },
    "lastActivity": "2024-01-15T10:30:15Z"
  }
}
```

### 4. Update Conversation Title

Update the title of a conversation.

**Endpoint**: `PUT /api/chatbot/conversations/:sessionId/title`

**Parameters**:
- `sessionId` (string, required): The conversation session ID

**Request Body**:
```json
{
  "title": "New conversation title"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Conversation title updated successfully"
}
```

### 5. Delete Conversation

Soft delete a conversation (marks as inactive).

**Endpoint**: `DELETE /api/chatbot/conversations/:sessionId`

**Parameters**:
- `sessionId` (string, required): The conversation session ID

**Response**:
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

### 6. Get Analytics

Retrieve conversation analytics for the user.

**Endpoint**: `GET /api/chatbot/analytics`

**Query Parameters**:
- `timeframe` (string, optional): One of "1d", "7d", "30d", "90d" (default: "7d")

**Response**:
```json
{
  "success": true,
  "data": {
    "totalConversations": 15,
    "totalMessages": 120,
    "averageMessagesPerConversation": 8,
    "mostCommonEmotion": "peaceful",
    "emotionDistribution": {
      "peaceful": 25,
      "grateful": 20,
      "anxious": 15,
      "happy": 12,
      "sad": 8
    },
    "timeframe": "7 days"
  }
}
```

### 7. Health Check

Check the health status of the chatbot service.

**Endpoint**: `GET /api/chatbot/health`

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "service": "chatbot",
    "version": "1.0.0",
    "geminiApi": "configured"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Invalid or missing authentication token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Conversation not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |
| 503 | Service Unavailable - AI service temporarily unavailable |

## Conversation Tones

### Supportive
- Focus on emotional validation and encouragement
- Active listening and empathy
- Gentle guidance and coping strategies

### Spiritual
- Faith-based wisdom and guidance
- Respectful of all religious traditions
- Practical spiritual exercises and reflection

### Reflective
- Mindful questioning and self-discovery
- Pattern recognition and insight
- Encourages deeper self-understanding

## Emotion Detection

The service automatically analyzes user messages for emotional content and returns:

- **emotion**: Primary detected emotion (happy, sad, anxious, angry, peaceful, grateful, spiritual, neutral)
- **confidence**: Confidence score (0.0 to 1.0)
- **scores**: Breakdown of all emotion scores

## Data Models

### Message Object
```json
{
  "role": "user|assistant|system",
  "content": "Message content",
  "timestamp": "ISO 8601 timestamp",
  "metadata": {
    "emotion": "detected emotion",
    "confidence": 0.85,
    "inputType": "text|voice|image",
    "context": {}
  }
}
```

### Conversation Context
```json
{
  "spiritualPreferences": {
    "religion": "optional",
    "practices": ["meditation", "prayer"],
    "goals": ["inner peace", "spiritual growth"]
  },
  "emotionalState": {
    "currentMood": "peaceful",
    "moodHistory": [
      {
        "mood": "peaceful",
        "confidence": 0.9,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "conversationTone": "supportive"
}
```

## Integration Examples

### JavaScript/Frontend
```javascript
// Send a message
const response = await fetch('/api/chatbot/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: "I need guidance with my spiritual practice",
    conversationTone: "spiritual"
  })
});

const data = await response.json();
console.log(data.data.response);
```

### Node.js/Backend
```javascript
const axios = require('axios');

const sendMessage = async (message, token) => {
  try {
    const response = await axios.post('/api/chatbot/message', {
      message,
      conversationTone: 'supportive'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Chatbot error:', error.response.data);
    throw error;
  }
};
```

## Best Practices

1. **Message Length**: Keep messages under 2000 characters for optimal processing
2. **Session Management**: Reuse session IDs to maintain conversation context
3. **Error Handling**: Always handle rate limiting and service unavailability
4. **Tone Selection**: Choose appropriate conversation tone based on user needs
5. **Context Preservation**: Include relevant context for better responses
6. **Emotion Awareness**: Use emotion data to adapt UI and user experience

## Security Considerations

- All API calls require valid JWT authentication
- Rate limiting prevents abuse
- Input validation prevents injection attacks
- Conversation data is user-scoped and private
- Gemini API keys are securely managed

## Monitoring and Logging

The service logs:
- All API interactions with response times
- Error occurrences with context
- Emotion analysis results
- Conversation analytics
- Rate limiting events

Logs are stored in the `ApiLog` collection for monitoring and debugging purposes.

---

# Mood Detection Service API Documentation

## Overview

The Mood Detection Service provides comprehensive emotion analysis capabilities for the Mirror of Heart application. It analyzes emotions from text, voice, and image inputs, providing spiritual context awareness and personalized insights for emotional wellness tracking.

## Base URL
```
/api/mood
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- **Limit**: 20 analyses per minute per user
- **Premium Limit**: 40 analyses per minute for premium users
- **Window**: 1 minute
- **Response**: 429 Too Many Requests with retry-after header

## Endpoints

### 1. Analyze Mood

Analyze mood from text, voice, image, or combined inputs.

**Endpoint**: `POST /api/mood/analyze`

**Request Body**:
```json
{
  "input": {
    "type": "text",
    "content": "I'm feeling overwhelmed and anxious about everything today",
    "audioData": "base64-encoded-audio-data",
    "imageData": "base64-encoded-image-data",
    "context": {
      "timeOfDay": "evening",
      "spiritualPreferences": {
        "religion": "Islam"
      }
    }
  },
  "options": {
    "includeInsights": true,
    "includeSuggestions": true,
    "saveToHistory": true,
    "priority": "normal"
  }
}
```

**Parameters**:
- `input.type` (string, required): One of "text", "voice", "image", "combined"
- `input.content` (string, optional): Text content to analyze (max 5000 characters)
- `input.audioData` (string, optional): Base64-encoded audio data
- `input.imageData` (string, optional): Base64-encoded image data
- `input.context` (object, optional): Additional context information
- `options.includeInsights` (boolean, optional): Include generated insights (default: true)
- `options.includeSuggestions` (boolean, optional): Include personalized suggestions (default: true)
- `options.saveToHistory` (boolean, optional): Save to user's mood history (default: true)
- `options.priority` (string, optional): "normal" or "high" (default: "normal")

**Response**:
```json
{
  "success": true,
  "data": {
    "primaryEmotion": "anxious",
    "confidence": 0.87,
    "intensity": "high",
    "emotions": {
      "anxious": 0.87,
      "sad": 0.23,
      "overwhelmed": 0.45,
      "neutral": 0.12
    },
    "analysisType": "text",
    "spiritualContext": {
      "isSpiritual": false,
      "score": 0.1,
      "detectedTerms": {
        "spiritual": [],
        "religious": [],
        "practices": []
      }
    },
    "insights": [
      {
        "type": "confidence",
        "message": "Your anxious emotion comes through very clearly in your expression.",
        "icon": "🎯"
      }
    ],
    "suggestions": [
      {
        "type": "breathing",
        "title": "Breathing Exercise",
        "description": "Try a 4-7-8 breathing pattern to calm your nervous system",
        "action": "breathing_exercise",
        "icon": "🫁"
      }
    ],
    "userContext": {
      "spiritualBackground": "Islam",
      "emotionalPatterns": {
        "dominantEmotions": ["anxious", "peaceful"],
        "recentTrend": "stable"
      }
    },
    "personalizedGuidance": {
      "general": "In times of anxiety, remember that you are held by divine love.",
      "specific": "Remember Allah's promise: \"And whoever relies upon Allah - then He is sufficient for him.\"",
      "practices": ["dhikr", "salah", "dua"]
    },
    "processingTime": 1250,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get Mood History

Retrieve user's mood analysis history with filtering and pagination.

**Endpoint**: `GET /api/mood/history`

**Query Parameters**:
- `limit` (integer, optional): Number of entries to return (max 100, default 20)
- `offset` (integer, optional): Number of entries to skip (default 0)
- `timeframe` (string, optional): One of "1d", "7d", "30d", "90d" (default "30d")
- `emotions` (string, optional): Comma-separated list of emotions to filter by
- `includeInsights` (boolean, optional): Include insights in response (default false)
- `sortBy` (string, optional): Sort field - "createdAt", "confidence", "primaryEmotion" (default "createdAt")
- `sortOrder` (string, optional): "asc" or "desc" (default "desc")

**Response**:
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "60f7b3b4c9e77c001f5e4a2b",
        "primaryEmotion": "anxious",
        "confidence": 0.87,
        "intensity": "high",
        "analysisType": "text",
        "createdAt": "2024-01-15T10:30:00Z",
        "spiritualContext": {
          "isSpiritual": false,
          "score": 0.1
        }
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "timeframe": "30d",
    "filters": {
      "emotions": null,
      "includeInsights": false
    }
  }
}
```

### 3. Get Mood Analytics

Get comprehensive mood analytics and insights for a user.

**Endpoint**: `GET /api/mood/analytics`

**Query Parameters**:
- `timeframe` (string, optional): One of "1d", "7d", "30d", "90d" (default "30d")

**Response**:
```json
{
  "success": true,
  "data": {
    "totalEntries": 45,
    "timeframe": "30d",
    "emotionDistribution": {
      "anxious": 15,
      "peaceful": 12,
      "grateful": 8,
      "joyful": 6,
      "sad": 4
    },
    "dominantEmotion": "anxious",
    "averageConfidence": 0.78,
    "moodStability": 0.65,
    "intensityDistribution": {
      "low": 12,
      "medium": 20,
      "high": 13
    },
    "recentTrend": "improving",
    "dailyMoodMap": {
      "2024-01-15": ["anxious", "peaceful"],
      "2024-01-14": ["grateful", "joyful"]
    },
    "insights": [
      {
        "type": "dominant_emotion",
        "title": "Most Common Emotion",
        "message": "anxious appears in 33% of your entries",
        "emotion": "anxious",
        "percentage": 33
      }
    ],
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 4. Get Mood Entry

Get a specific mood entry by ID.

**Endpoint**: `GET /api/mood/entries/:entryId`

**Parameters**:
- `entryId` (string, required): MongoDB ObjectId of the mood entry

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "60f7b3b4c9e77c001f5e4a2b",
    "primaryEmotion": "anxious",
    "confidence": 0.87,
    "intensity": "high",
    "emotions": {
      "anxious": 0.87,
      "sad": 0.23
    },
    "analysisType": "text",
    "spiritualContext": {
      "isSpiritual": false,
      "score": 0.1
    },
    "insights": [...],
    "suggestions": [...],
    "userFeedback": {
      "accuracyRating": 4,
      "helpfulnessRating": 5,
      "comments": "Very accurate analysis",
      "submittedAt": "2024-01-15T11:00:00Z"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 5. Submit Feedback

Submit feedback on mood analysis accuracy.

**Endpoint**: `POST /api/mood/entries/:entryId/feedback`

**Parameters**:
- `entryId` (string, required): MongoDB ObjectId of the mood entry

**Request Body**:
```json
{
  "accuracyRating": 4,
  "helpfulnessRating": 5,
  "comments": "Very accurate analysis of my emotional state"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "entryId": "60f7b3b4c9e77c001f5e4a2b",
    "feedback": {
      "accuracyRating": 4,
      "helpfulnessRating": 5,
      "comments": "Very accurate analysis of my emotional state",
      "submittedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

### 6. Delete Mood Entry

Delete a mood entry (soft delete).

**Endpoint**: `DELETE /api/mood/entries/:entryId`

**Parameters**:
- `entryId` (string, required): MongoDB ObjectId of the mood entry

**Response**:
```json
{
  "success": true,
  "message": "Mood entry deleted successfully",
  "data": {
    "entryId": "60f7b3b4c9e77c001f5e4a2b",
    "deletedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 7. Get Mood Suggestions

Get mood-based suggestions and recommendations.

**Endpoint**: `GET /api/mood/suggestions`

**Query Parameters**:
- `emotion` (string, optional): Target emotion for suggestions
- `intensity` (string, optional): "low", "medium", or "high"
- `context` (string, optional): JSON string with additional context

**Response**:
```json
{
  "success": true,
  "data": {
    "emotion": "anxious",
    "intensity": "high",
    "suggestions": [
      {
        "type": "breathing",
        "title": "Breathing Exercise",
        "description": "Try a 4-7-8 breathing pattern to calm your nervous system",
        "action": "breathing_exercise",
        "icon": "🫁"
      }
    ],
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 8. Export Mood Data

Export mood data in various formats.

**Endpoint**: `GET /api/mood/export`

**Query Parameters**:
- `format` (string, optional): "json" or "csv" (default "json")
- `timeframe` (string, optional): "1d", "7d", "30d", "90d", or "all" (default "30d")

**Response**: File download (JSON or CSV format)

### 9. Get Supported Emotions

Get list of supported emotions and their metadata.

**Endpoint**: `GET /api/mood/emotions`

**Response**:
```json
{
  "success": true,
  "data": {
    "emotions": ["peaceful", "grateful", "anxious", "sad", "joyful", "spiritual", "angry", "hopeful", "neutral"],
    "categories": {
      "peaceful": {
        "keywords": ["calm", "serene", "tranquil"],
        "spiritualContext": "inner peace",
        "guidance": "Continue nurturing this beautiful state of peace",
        "color": "#4ade80",
        "intensity": "positive"
      }
    },
    "supportedInputTypes": ["text", "voice", "image", "combined"],
    "intensityLevels": ["low", "medium", "high"]
  }
}
```

### 10. Health Check

Check the health status of the mood detection service.

**Endpoint**: `GET /api/mood/health`

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "service": "mood-detection",
    "version": "2.0.0",
    "metrics": {
      "totalAnalyses": 1250,
      "averageProcessingTime": 850,
      "cacheHitRate": 0.35
    },
    "database": {
      "status": "connected",
      "readyState": 1
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input parameters or content too long |
| 401 | Unauthorized - Invalid or missing authentication token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Mood entry not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |
| 503 | Service Unavailable - Analysis service temporarily unavailable |

## Supported Emotions

The service supports analysis of the following emotions:

### Positive Emotions
- **Peaceful**: Calm, serene, tranquil states
- **Grateful**: Thankfulness and appreciation
- **Joyful**: Happiness and excitement
- **Spiritual**: Connection to the divine
- **Hopeful**: Optimism and faith

### Negative Emotions
- **Anxious**: Worry, stress, and nervousness
- **Sad**: Sadness, grief, and loneliness
- **Angry**: Frustration and irritation

### Neutral
- **Neutral**: Balanced or unclear emotional state

## Input Types

### Text Analysis
- Analyzes written content for emotional indicators
- Supports up to 5000 characters
- Uses advanced NLP techniques and pattern recognition
- Detects spiritual context and religious references

### Voice Analysis
- Analyzes audio recordings for emotional content
- Currently uses transcript analysis (audio analysis coming soon)
- Supports common audio formats via base64 encoding

### Image Analysis
- Analyzes images for emotional content (coming soon)
- Supports JPG, PNG, GIF formats
- Maximum file size: 10MB

### Combined Analysis
- Analyzes multiple input types simultaneously
- Provides weighted analysis based on input types
- More comprehensive emotional assessment

## Spiritual Context Integration

The service provides spiritual context awareness:

### Supported Traditions
- **Islam**: Quranic verses, Islamic practices
- **Christianity**: Biblical references, Christian practices
- **Judaism**: Torah references, Jewish practices
- **Universal**: General spiritual principles

### Spiritual Features
- Detects spiritual language and references
- Provides tradition-specific guidance
- Suggests appropriate spiritual practices
- Respects all faith backgrounds

## Data Models

### MoodEntry Object
```json
{
  "userId": "ObjectId",
  "primaryEmotion": "string",
  "confidence": "number (0-1)",
  "intensity": "low|medium|high",
  "emotions": "Map<string, number>",
  "analysisType": "text|voice|image|combined",
  "spiritualContext": {
    "isSpiritual": "boolean",
    "score": "number (0-1)",
    "detectedTerms": {
      "spiritual": ["string"],
      "religious": ["string"],
      "practices": ["string"]
    }
  },
  "insights": [
    {
      "type": "string",
      "message": "string",
      "icon": "string"
    }
  ],
  "suggestions": [
    {
      "type": "string",
      "title": "string",
      "description": "string",
      "action": "string",
      "icon": "string"
    }
  ],
  "createdAt": "Date",
  "isActive": "boolean"
}
```

## Integration Examples

### JavaScript/Frontend
```javascript
// Analyze text mood
const analyzeMood = async (text) => {
  const response = await fetch('/api/mood/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      input: {
        type: 'text',
        content: text,
        context: {
          timeOfDay: 'evening',
          spiritualPreferences: { religion: 'Islam' }
        }
      },
      options: {
        includeInsights: true,
        includeSuggestions: true
      }
    })
  });
  
  const data = await response.json();
  return data.data;
};

// Get mood history
const getMoodHistory = async (timeframe = '30d') => {
  const response = await fetch(`/api/mood/history?timeframe=${timeframe}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### Node.js/Backend
```javascript
const axios = require('axios');

const analyzeMoodServer = async (userId, input, options) => {
  try {
    const response = await axios.post('/api/mood/analyze', {
      input,
      options
    }, {
      headers: {
        'Authorization': `Bearer ${getTokenForUser(userId)}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Mood analysis error:', error.response.data);
    throw error;
  }
};
```

## Best Practices

1. **Input Validation**: Always validate input length and format before sending
2. **Error Handling**: Handle rate limiting and service unavailability gracefully
3. **Context Inclusion**: Provide spiritual and temporal context for better analysis
4. **Feedback Loop**: Encourage users to provide feedback on analysis accuracy
5. **Privacy**: Never store sensitive personal content, only analysis results
6. **Caching**: Implement client-side caching for repeated similar analyses
7. **Progressive Enhancement**: Provide fallbacks for when advanced features aren't available

## Security Considerations

- All API calls require valid JWT authentication
- Rate limiting prevents abuse and ensures fair usage
- Input validation prevents injection attacks
- Mood data is user-scoped and private
- Sensitive content is not stored, only analysis results
- GDPR compliance for data export and deletion

## Monitoring and Logging

The service logs:
- All analysis requests with processing times
- Error occurrences with context
- User feedback and accuracy ratings
- Performance metrics and cache hit rates
- Rate limiting events

Logs are stored in the `ApiLog` collection for monitoring and debugging purposes.