# AlphaX AI - Advanced AI Platform

AlphaX AI is a comprehensive artificial intelligence platform that provides powerful AI capabilities including text generation, image analysis, data processing, and conversation management. Built with Node.js, Express, and MongoDB.

## Features

### 🤖 AI Capabilities
- **Text Generation**: Advanced text generation using OpenAI GPT models
- **Image Analysis**: Intelligent image analysis and description
- **Text Classification**: Automated text classification with customizable labels
- **Text Summarization**: Intelligent text summarization
- **Embedding Generation**: Text embedding generation for semantic search

### 💬 Conversation Management
- **Multi-turn Conversations**: Persistent conversation history
- **Customizable AI Settings**: Temperature, max tokens, system prompts
- **Conversation Analytics**: Token usage and cost tracking
- **Export/Import**: Conversation backup and restore

### 📊 Data Processing
- **Multi-format Support**: CSV, JSON, TXT, PDF, images
- **Data Analysis**: Automated data profiling and statistics
- **Data Preprocessing**: Cleaning, validation, and transformation
- **Visualization**: Data insights and charts

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: User, moderator, and admin roles
- **Rate Limiting**: API request rate limiting
- **Input Validation**: Comprehensive input validation and sanitization

### 🚀 Performance & Scalability
- **Docker Support**: Containerized deployment
- **Database Optimization**: MongoDB with optimized queries
- **Caching**: Redis-based caching for improved performance
- **Load Balancing**: Nginx reverse proxy configuration

## Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 5+
- Redis 6+ (optional)
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sixscripts-ai/alphaxai.git
   cd alphaxai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t alphaxai .
docker run -p 3000:3000 alphaxai
```

## API Documentation

### Authentication

#### Register a new user
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### AI Endpoints

#### Generate Text
```http
POST /api/ai/generate/text
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Write a short story about AI",
  "options": {
    "model": "gpt-3.5-turbo",
    "maxTokens": 500,
    "temperature": 0.7
  }
}
```

#### Analyze Image
```http
POST /api/ai/analyze/image
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Describe what you see in this image"
}
```

#### Classify Text
```http
POST /api/ai/classify/text
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "This movie was amazing!",
  "labels": ["positive", "negative", "neutral"]
}
```

### Data Management

#### Upload Dataset
```http
POST /api/data/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form data:
- dataset: [file]
- name: "My Dataset"
- description: "Sample dataset for analysis"
- tags: "ml,training,data"
```

#### Get Datasets
```http
GET /api/data?page=1&limit=10&type=csv
Authorization: Bearer <token>
```

### Conversations

#### Create Conversation
```http
POST /api/ai/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "AI Discussion",
  "settings": {
    "model": "gpt-4",
    "temperature": 0.8,
    "systemPrompt": "You are a helpful AI assistant."
  }
}
```

#### Chat in Conversation
```http
POST /api/ai/conversations/{id}/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Hello, how can you help me today?"
}
```

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
HOST=localhost

# Database
DATABASE_URL=mongodb://localhost:27017/alphaxai
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# File Upload
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILENAME=logs/alphaxai.log

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
EMAIL_FROM=noreply@alphaxai.com
```

## Development

### Available Scripts

```bash
# Development with auto-reload
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Build and test
npm run build

# Docker operations
npm run docker:build
npm run docker:run
```

### Project Structure

```
alphaxai/
├── src/
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── config/                # Configuration files
├── tests/                 # Test files
├── public/                # Static files
├── uploads/               # File uploads
├── logs/                  # Application logs
├── docs/                  # Documentation
├── frontend/              # Frontend components
└── scripts/               # Utility scripts
```

## Testing

The application includes comprehensive tests covering:

- API endpoints
- Database models
- Business logic
- Utility functions
- Integration tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Security

- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Authentication**: JWT-based authentication with secure token handling
- **Authorization**: Role-based access control
- **Data Protection**: Sensitive data is encrypted and securely stored
- **Security Headers**: Helmet.js for security headers

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Documentation: Available in the `/docs` directory