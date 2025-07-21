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