# API Documentation

AlphaX AI provides a comprehensive REST API for accessing AI capabilities, managing data, and handling user authentication.

## Base URL

```
Production: https://api.alphaxai.com
Development: http://localhost:3000
```

## Authentication

All API endpoints except authentication routes require a valid JWT token.

### Headers

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## Authentication Endpoints

### Register User

Create a new user account.

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login

Authenticate an existing user.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Get Current User

Get information about the authenticated user.

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "preferences": {
      "theme": "light",
      "language": "en"
    },
    "apiUsage": {
      "totalRequests": 150,
      "monthlyRequests": 45
    }
  }
}
```

## AI Endpoints

### Generate Text

Generate text using AI models.

```http
POST /api/ai/generate/text
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "prompt": "Write a short story about artificial intelligence",
  "options": {
    "model": "gpt-3.5-turbo",
    "maxTokens": 500,
    "temperature": 0.7,
    "topP": 1.0,
    "frequencyPenalty": 0,
    "presencePenalty": 0
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": "Generated text content...",
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 156,
    "total_tokens": 168
  }
}
```

### Generate Embedding

Create text embeddings for semantic search.

```http
POST /api/ai/generate/embedding
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "text": "Text to embed for semantic search"
}
```

**Response:**
```json
{
  "success": true,
  "data": [0.123, -0.456, 0.789, ...],
  "usage": {
    "prompt_tokens": 6,
    "total_tokens": 6
  }
}
```

### Analyze Image

Analyze images with computer vision.

```http
POST /api/ai/analyze/image
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Describe what you see in this image"
}
```

**Response:**
```json
{
  "success": true,
  "data": "This image shows a beautiful sunset over mountains...",
  "usage": {
    "prompt_tokens": 85,
    "completion_tokens": 45,
    "total_tokens": 130
  }
}
```

### Classify Text

Classify text into custom categories.

```http
POST /api/ai/classify/text
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "text": "This movie was absolutely amazing!",
  "labels": ["positive", "negative", "neutral"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sequence": "This movie was absolutely amazing!",
    "labels": ["positive", "negative", "neutral"],
    "scores": [0.9145, 0.0632, 0.0223]
  }
}
```

### Summarize Text

Summarize long text content.

```http
POST /api/ai/summarize/text
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "text": "Long text content to summarize...",
  "maxLength": 150
}
```

**Response:**
```json
{
  "success": true,
  "data": "Summarized content..."
}
```

## Conversation Management

### List Conversations

Get user's conversations with pagination.

```http
GET /api/ai/conversations?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_id",
      "title": "AI Discussion",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T01:00:00Z",
      "totalTokens": 1250,
      "totalCost": 0.025
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

### Create Conversation

Start a new conversation.

```http
POST /api/ai/conversations
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New AI Discussion",
  "settings": {
    "model": "gpt-4",
    "temperature": 0.8,
    "maxTokens": 1000,
    "systemPrompt": "You are a helpful AI assistant."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conv_id",
    "title": "New AI Discussion",
    "settings": {
      "model": "gpt-4",
      "temperature": 0.8,
      "maxTokens": 1000,
      "systemPrompt": "You are a helpful AI assistant."
    },
    "messages": [],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Chat in Conversation

Send a message in a conversation.

```http
POST /api/ai/conversations/{id}/chat
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "message": "Hello, how can you help me today?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv_id",
      "messages": [
        {
          "role": "user",
          "content": "Hello, how can you help me today?",
          "timestamp": "2024-01-01T00:00:00Z"
        },
        {
          "role": "assistant",
          "content": "Hello! I'm here to help you with a variety of tasks...",
          "timestamp": "2024-01-01T00:00:01Z",
          "metadata": {
            "tokens": 45,
            "cost": 0.0009
          }
        }
      ]
    },
    "aiResponse": "Hello! I'm here to help you with a variety of tasks..."
  }
}
```

## Data Management

### Upload Dataset

Upload a dataset for processing.

```http
POST /api/data/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `dataset`: File
- `name`: Dataset name
- `description`: Dataset description
- `tags`: Comma-separated tags

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dataset_id",
    "name": "My Dataset",
    "type": "csv",
    "size": 1024000,
    "recordCount": 1000,
    "status": "ready",
    "metadata": {
      "columns": ["name", "age", "city"],
      "hasHeader": true
    }
  }
}
```

### List Datasets

Get user's datasets.

```http
GET /api/data?page=1&limit=10&type=csv&status=ready
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dataset_id",
      "name": "My Dataset",
      "type": "csv",
      "size": 1024000,
      "recordCount": 1000,
      "status": "ready",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

### Download Dataset

Download a dataset file.

```http
GET /api/data/{id}/download
Authorization: Bearer <token>
```

**Response:** File download

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Free tier**: 100 requests per 15 minutes
- **Pro tier**: 1000 requests per 15 minutes
- **Enterprise**: Custom limits

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## SDKs and Libraries

### JavaScript/Node.js

```bash
npm install alphaxai-js
```

```javascript
import AlphaXAI from 'alphaxai-js';

const client = new AlphaXAI({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.alphaxai.com'
});

const response = await client.generateText({
  prompt: 'Write a haiku about AI',
  maxTokens: 100
});
```

### Python

```bash
pip install alphaxai-python
```

```python
from alphaxai import AlphaXAI

client = AlphaXAI(api_key='your-api-key')

response = client.generate_text(
    prompt='Write a haiku about AI',
    max_tokens=100
)
```

## Webhooks

Configure webhooks to receive real-time notifications:

```http
POST /api/webhooks
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["conversation.completed", "dataset.processed"],
  "secret": "webhook-secret"
}
```

## Support

For API support:
- Documentation: https://docs.alphaxai.com
- Support: support@alphaxai.com
- Status: https://status.alphaxai.com