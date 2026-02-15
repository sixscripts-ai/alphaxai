# StartupCRM Setup Guide 🚀

Complete step-by-step guide to get your AI-powered CRM up and running.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [First Run](#first-run)
5. [Using the CRM](#using-the-crm)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js 16+**: [Download here](https://nodejs.org/)
- **MongoDB 5+**: [Download here](https://www.mongodb.com/try/download/community)
- **Google Gemini API Key**: [Get it here](https://makersuite.google.com/app/apikey)

### Optional (for production)
- **Redis**: For caching (improves performance)
- **Docker**: For containerized deployment

## Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/sixscripts-ai/alphaxai.git
cd alphaxai
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages including:
- Express.js (web framework)
- Mongoose (MongoDB ODM)
- Axios (for Gemini API calls)
- JWT (authentication)
- And more...

## Configuration

### Step 3: Create Environment File

Create a `.env` file in the root directory:

```bash
touch .env
```

### Step 4: Add Required Environment Variables

Open `.env` and add the following:

```bash
# ==========================================
# SERVER CONFIGURATION
# ==========================================
PORT=3000
NODE_ENV=development
HOST=0.0.0.0

# ==========================================
# DATABASE
# ==========================================
# Local MongoDB
DATABASE_URL=mongodb://localhost:27017/startupcrm

# Or MongoDB Atlas (cloud)
# DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/startupcrm

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379

# ==========================================
# GOOGLE GEMINI PRO API
# ==========================================
# Get your key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# ==========================================
# AUTHENTICATION
# ==========================================
# Generate a strong random string (at least 32 characters)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# ==========================================
# FILE UPLOAD (Optional)
# ==========================================
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

# ==========================================
# LOGGING
# ==========================================
LOG_LEVEL=info
LOG_FILENAME=logs/startupcrm.log

# ==========================================
# FRONTEND (Optional)
# ==========================================
FRONTEND_URL=http://localhost:3000
```

### Step 5: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Select "Create API key in new project" (or use existing)
5. Copy the generated API key
6. Paste it in your `.env` file as `GEMINI_API_KEY`

**Example:**
```bash
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 6: Generate JWT Secret

Generate a strong random string for JWT_SECRET:

**On Linux/Mac:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use an online generator:**
https://randomkeygen.com/ (select "CodeIgniter Encryption Keys")

## First Run

### Step 7: Start MongoDB

**On Linux/Mac:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

**On Windows:**
- MongoDB should start automatically as a service
- Or run: `net start MongoDB`

### Step 8: Create Required Directories
```bash
mkdir -p logs uploads
```

### Step 9: Start the Application

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

You should see:
```
StartupCRM server running on port 3000 in development mode
```

### Step 10: Access the CRM

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the beautiful StartupCRM interface! 🎉

## Using the CRM

### Create Your First User

The CRM requires authentication. Create a user account:

**Using API:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

Save the token - you'll need it for API requests!

### Login

**Using API:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### Making Authenticated Requests

Use the token in the Authorization header:

```bash
curl -X GET http://localhost:3000/api/crm/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Add Your First Contact

```bash
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@techstartup.com",
    "company": "TechStartup Inc",
    "position": "CEO",
    "status": "lead",
    "phone": "+1234567890"
  }'
```

### Get AI Insights

```bash
curl -X GET http://localhost:3000/api/crm/insights \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

The AI will analyze your CRM data and provide:
- Sales pipeline health
- Conversion recommendations
- Priority contacts
- Revenue forecasts
- Risk and opportunity analysis

## Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Verify MongoDB is running:
   ```bash
   # Check if MongoDB is running
   ps aux | grep mongod
   
   # Or check status
   sudo systemctl status mongod
   ```

2. Check your DATABASE_URL in `.env`
3. Ensure MongoDB is accessible on the specified port (default: 27017)

### Issue: "Gemini API error: Invalid API key"

**Solution:**
1. Verify your GEMINI_API_KEY in `.env`
2. Check if the key is active in [Google AI Studio](https://makersuite.google.com/)
3. Ensure no extra spaces in the key
4. Try generating a new API key

### Issue: "JWT malformed" or authentication errors

**Solution:**
1. Ensure JWT_SECRET is set in `.env`
2. Make sure it's at least 32 characters long
3. Restart the server after changing `.env`
4. Generate a new token by logging in again

### Issue: Port 3000 already in use

**Solution:**
1. Change PORT in `.env` to another number (e.g., 3001)
2. Or stop the process using port 3000:
   ```bash
   # On Linux/Mac
   lsof -ti:3000 | xargs kill -9
   
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Slow AI responses

**Reasons and Solutions:**
1. **First request after startup**: Normal - the model needs to warm up
2. **Large dataset**: Consider limiting the number of records analyzed
3. **API rate limits**: Check your Gemini API quota
4. **Network latency**: Ensure stable internet connection

### Issue: No data showing in dashboard

**Solution:**
1. Create some sample data first (contacts, deals, inventory)
2. Check browser console for errors (F12)
3. Verify API endpoints are responding:
   ```bash
   curl http://localhost:3000/api/health
   ```
4. Check server logs for errors

## Advanced Configuration

### Using Docker

Build and run with Docker:

```bash
# Build image
docker build -t startupcrm .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mongodb://host.docker.internal:27017/startupcrm \
  -e GEMINI_API_KEY=your_key_here \
  -e JWT_SECRET=your_secret_here \
  startupcrm
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mongodb://mongo:27017/startupcrm
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

Run with:
```bash
docker-compose up -d
```

### Production Deployment

For production, ensure:

1. **Set NODE_ENV=production** in `.env`
2. **Use strong JWT_SECRET** (64+ characters)
3. **Use MongoDB Atlas** for managed database
4. **Enable SSL/TLS** for HTTPS
5. **Set up monitoring** (e.g., PM2)
6. **Configure backups** for your database
7. **Use environment variables** (never commit `.env`)
8. **Set up logging** to files or external service

### PM2 Process Manager (Production)

Install PM2:
```bash
npm install -g pm2
```

Start with PM2:
```bash
pm2 start index.js --name startupcrm
pm2 save
pm2 startup
```

Monitor:
```bash
pm2 status
pm2 logs startupcrm
pm2 monit
```

## Next Steps

1. **Explore the UI**: Navigate through all sections (Dashboard, Contacts, Deals, Inventory, AI Tools)
2. **Add Sample Data**: Create contacts, deals, and inventory items
3. **Try AI Features**: Use lead scoring, deal analysis, inventory predictions
4. **Test Agentic Tools**: Execute tools via the AI Tools panel
5. **Customize**: Modify the interface and add custom fields
6. **Integrate**: Connect with your existing tools via API

## Getting Help

- **Documentation**: See README.md for full API reference
- **Issues**: Report bugs on GitHub
- **API Documentation**: Check docs/API.md
- **Gemini API Docs**: https://ai.google.dev/docs

## Quick Reference

### Common Commands
```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Check logs
tail -f logs/startupcrm.log

# Check MongoDB
mongo startupcrm --eval "db.contacts.count()"
```

### Useful API Endpoints
```
GET  /api/health              - Health check
POST /api/auth/register       - Register user
POST /api/auth/login          - Login
GET  /api/crm/dashboard       - Dashboard stats
GET  /api/crm/insights        - AI insights
GET  /api/crm/contacts        - List contacts
POST /api/crm/contacts/score  - Score leads with AI
POST /api/crm/inventory/predict - Inventory predictions
POST /api/crm/agent/execute   - Execute agentic tool
```

---

**Congratulations! Your AI-powered CRM is ready to help grow your startup! 🚀**

For detailed API documentation, see [README.md](README.md)
