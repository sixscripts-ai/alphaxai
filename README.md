# AlphaX AI - Advanced AI Platform

AlphaX AI is a comprehensive artificial intelligence platform that provides powerful AI capabilities including text generation, image analysis, data processing, and conversation management. Built with Node.js, Express, and Turso (libSQL).

## Features

### 🤖 AI Capabilities
- **Text Generation**: Advanced text generation using Google Gemini models
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
- **Organization Workspaces**: Multi-tenant workspaces with owner/admin/member roles
- **Subscription Plans**: Starter, Growth, and Enterprise plans with usage and seat limits
- **Rate Limiting**: API request rate limiting
- **Input Validation**: Comprehensive input validation and sanitization

### 🚀 Performance & Scalability
- **Docker Support**: Containerized deployment
- **Database Optimization**: Turso (libSQL) with tenant-scoped SQL queries
- **Caching**: Redis-based caching for improved performance
- **Load Balancing**: Nginx reverse proxy configuration

## Quick Start

### Prerequisites
- Node.js 16+ 
- Turso (libSQL) database
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

   Production startup now validates required env vars and will fail fast unless `TURSO_DATABASE_URL`, `JWT_SECRET`, and `GEMINI_API_KEY` (or `OPENAI_API_KEY`) are set.

4. **Start the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### Fully Automated Local Bootstrap

```bash
# 1) Start infra
docker-compose up -d redis

# 2) Install and prepare app
npm install
cp .env.example .env

# 3) Set required provisioning values
export PROVISION_OWNER_EMAIL=owner@yourcompany.com
export PROVISION_OWNER_PASSWORD='ChangeMe123!'
export PROVISION_OWNER_NAME='Platform Owner'
export PROVISION_ORG_NAME='Your Company'
export PROVISION_PLAN=enterprise

# 4) Provision enterprise workspace + owner
npm run provision:enterprise

# 5) Run app
npm run dev
```

> Database schema migrations are tracked in the `schema_migrations` table and applied automatically at startup.

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t alphaxai .
docker run -p 3000:3000 alphaxai
```

### Platform Website

- Open `http://localhost:3000/platform.html` to use the enterprise web form backed by Turso.

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
    "model": "gemini-pro-3",
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

### Organization Management

#### Get Current Organization
```http
GET /api/organizations/me
Authorization: Bearer <token>
```

#### Update Organization Plan
```http
PUT /api/organizations/me/plan
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "enterprise"
}
```

#### Add Organization Member
```http
POST /api/organizations/me/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "<existing-user-id>",
  "role": "admin"
}
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
    "model": "gemini-pro-3",
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
TURSO_DATABASE_URL=libsql://ash-brady-sixscripts-ai.aws-us-west-2.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
REDIS_URL=redis://localhost:6379

# AI Services
GEMINI_API_KEY=your_gemini_api_key
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
