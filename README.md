# StartupCRM - AI-Powered CRM for Startup Founders 🚀

An intelligent CRM application designed specifically for startup founders, featuring Google Gemini Pro integration for AI-powered inventory automation, data analysis, and agentic tool calling capabilities.

## ✨ Key Features

### 🤖 AI-Powered Intelligence (Google Gemini Pro)
- **Automated Data Analysis**: Real-time insights on sales pipeline health and performance
- **Lead Scoring**: AI-driven lead qualification and prioritization
- **Deal Probability Prediction**: Win probability analysis with risk factors
- **Inventory Forecasting**: Automated demand prediction and reorder recommendations
- **Personalized Email Generation**: AI-generated personalized outreach emails
- **Agentic Tool Calling**: Execute complex tasks via natural language commands

### 👥 Contact Management
- Complete contact lifecycle management (leads → prospects → customers)
- Custom fields and tags for flexible organization
- Social profile integration (LinkedIn, Twitter, etc.)
- AI-powered contact scoring and insights
- Follow-up scheduling and reminders

### 💼 Sales Pipeline
- Visual pipeline stages (prospecting → closed won/lost)
- Deal tracking with probability analysis
- Activity logging (calls, emails, meetings, notes)
- Revenue forecasting with AI predictions
- Custom deal stages and workflows

### 📦 Inventory Management
- Real-time stock tracking with SKU management
- Automated reorder point alerts
- AI-powered demand forecasting
- Supplier management integration
- Stock history and audit trails
- Cost and pricing analysis

### 🎯 Agentic Tools & Skills
- Search and query contacts with natural language
- Automated inventory updates
- Deal creation and management
- Follow-up scheduling automation
- Custom report generation
- Multi-step workflow automation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 5+
- Google Gemini API Key

### Installation

1. **Clone and setup**
   ```bash
   git clone https://github.com/sixscripts-ai/alphaxai.git
   cd alphaxai
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file with:
   ```bash
   # Server
   PORT=3000
   NODE_ENV=development
   
   # Database
   DATABASE_URL=mongodb://localhost:27017/startupcrm
   
   # Google Gemini Pro API
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Authentication
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Access the CRM**
   Open your browser to `http://localhost:3000`

## 📊 API Documentation

### CRM Endpoints

#### Dashboard
```http
GET /api/crm/dashboard
Authorization: Bearer <token>
```
Returns comprehensive dashboard statistics including contacts, deals, and inventory metrics.

#### AI Insights
```http
GET /api/crm/insights
Authorization: Bearer <token>
```
Get AI-powered insights and recommendations for your business.

### Contact Management

#### Create Contact
```http
POST /api/crm/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "company": "TechStartup Inc",
  "position": "CEO",
  "status": "lead",
  "phone": "+1234567890"
}
```

#### Get Contacts
```http
GET /api/crm/contacts?status=lead&page=1&limit=20
Authorization: Bearer <token>
```

#### Score Leads with AI
```http
POST /api/crm/contacts/score
Authorization: Bearer <token>
```
Uses Google Gemini Pro to analyze and score all leads (0-100).

#### Generate Personalized Email
```http
POST /api/crm/contacts/generate-email
Authorization: Bearer <token>
Content-Type: application/json

{
  "contactId": "contact_id_here",
  "context": "Product launch announcement"
}
```

### Deal Management

#### Create Deal
```http
POST /api/crm/deals
Authorization: Bearer <token>
Content-Type: application/json

{
  "contactId": "contact_id",
  "title": "Enterprise License",
  "value": 50000,
  "stage": "prospecting",
  "expectedCloseDate": "2024-12-31"
}
```

#### Get Deals
```http
GET /api/crm/deals?stage=prospecting
Authorization: Bearer <token>
```

#### Analyze Deal with AI
```http
POST /api/crm/deals/:id/analyze
Authorization: Bearer <token>
```
Returns AI-powered win probability, risk factors, and recommendations.

### Inventory Management

#### Get Inventory
```http
GET /api/crm/inventory?status=low_stock
Authorization: Bearer <token>
```

#### Create Inventory Item
```http
POST /api/crm/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "PROD-001",
  "name": "Premium Widget",
  "quantity": 100,
  "unitPrice": 29.99,
  "reorderPoint": 20,
  "reorderQuantity": 50
}
```

#### AI Inventory Predictions
```http
POST /api/crm/inventory/predict
Authorization: Bearer <token>
```
Generates AI-powered demand forecasts and reorder recommendations.

### Agentic Tools

#### Execute Tool
```http
POST /api/crm/agent/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "toolName": "search_contacts",
  "parameters": {
    "query": "tech companies in San Francisco",
    "filters": {"status": "lead"}
  }
}
```

Available tools:
- `search_contacts` - Search for contacts with filters
- `update_inventory` - Update inventory quantities
- `create_deal` - Create new deals
- `schedule_followup` - Schedule follow-up tasks
- `generate_report` - Generate analytics reports

## 🧠 AI Features Powered by Google Gemini Pro

### 1. CRM Data Analysis
Analyzes your entire CRM database to provide:
- Sales pipeline health metrics
- Conversion rate optimization recommendations
- Priority contact identification
- Revenue forecasting
- Risk and opportunity detection

### 2. Lead Scoring
Intelligent lead qualification based on:
- Engagement level
- Company size and industry
- Deal value potential
- Historical conversion patterns

### 3. Inventory Automation
AI-driven inventory management:
- 30-day demand forecasting
- Optimal reorder timing
- Quantity optimization
- Stockout risk prediction
- Cost optimization suggestions

### 4. Deal Intelligence
Win probability analysis considering:
- Deal stage and timeline
- Contact engagement history
- Historical win rates
- Risk factor identification

### 5. Agentic Tool Calling
Natural language task execution:
- Complex multi-step workflows
- Automated data operations
- Smart query processing
- Context-aware recommendations

## 🏗️ Architecture

```
startupcrm/
├── src/
│   ├── models/           # Database models
│   │   ├── Contact.js    # Contact model with AI insights
│   │   ├── Deal.js       # Deal model with predictions
│   │   ├── Inventory.js  # Inventory with forecasting
│   │   └── User.js       # User authentication
│   ├── controllers/      # Route controllers
│   │   └── crmController.js  # CRM business logic
│   ├── services/         # Business services
│   │   └── geminiService.js  # Google Gemini Pro integration
│   ├── routes/          # API routes
│   │   └── crm.js       # CRM endpoints
│   └── middleware/      # Express middleware
├── public/              # Frontend assets
│   └── crm.html        # Beautiful CRM interface
└── index.js            # Application entry point
```

## 🎨 User Interface

The CRM features a modern, responsive interface with:
- **Dashboard**: Real-time metrics and AI insights
- **Contact List**: Searchable, filterable contact management
- **Pipeline View**: Visual drag-and-drop sales pipeline
- **Inventory Grid**: Stock management with status indicators
- **AI Tools Panel**: Execute agentic tools with natural language

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure environment variable management
- Helmet.js security headers

## 📈 Use Cases for Startup Founders

### Early Stage Startups
- Track initial customer conversations
- Manage pilot program participants
- Forecast first inventory orders
- Prioritize high-value leads

### Growth Stage
- Scale sales operations with AI insights
- Optimize inventory based on demand patterns
- Automate repetitive tasks with agentic tools
- Data-driven decision making

### Series A+
- Advanced pipeline analytics
- Multi-channel customer engagement
- Predictive inventory management
- Custom workflow automation

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini Pro (1.5 Pro Latest)
- **Authentication**: JWT with bcrypt
- **Frontend**: Vanilla JavaScript with modern CSS
- **Security**: Helmet, rate limiting, input validation

## 📝 Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Database
DATABASE_URL=mongodb://localhost:27017/startupcrm
REDIS_URL=redis://localhost:6379

# Google Gemini Pro API
GEMINI_API_KEY=your_gemini_api_key_here

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# File Upload (Optional)
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILENAME=logs/startupcrm.log
```

## 🤝 Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key or use an existing one
5. Copy the key and add it to your `.env` file

## 🚀 Deployment

### Docker Deployment
```bash
docker build -t startupcrm .
docker run -p 3000:3000 --env-file .env startupcrm
```

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure production DATABASE_URL
- [ ] Add GEMINI_API_KEY
- [ ] Set NODE_ENV=production
- [ ] Enable SSL/TLS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 📚 Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 🐛 Troubleshooting

### Gemini API Errors
- Verify your API key is valid and active
- Check API quota and rate limits
- Ensure proper request formatting

### Database Connection Issues
- Verify MongoDB is running
- Check DATABASE_URL format
- Ensure network connectivity

### Authentication Problems
- Verify JWT_SECRET is set
- Check token expiration settings
- Validate user credentials

## 📄 License

MIT License - feel free to use this for your startup!

## 💡 Future Enhancements

- [ ] Multi-user collaboration
- [ ] Email integration (Gmail, Outlook)
- [ ] Calendar synchronization
- [ ] Mobile app (React Native)
- [ ] Advanced reporting dashboard
- [ ] Webhook integrations
- [ ] Custom AI model training
- [ ] Voice command support

## 🤖 About Google Gemini Pro Integration

This CRM leverages Google's most advanced AI model (Gemini 1.5 Pro) for:
- **Natural Language Understanding**: Process complex queries
- **Multi-turn Conversations**: Context-aware interactions
- **Function Calling**: Execute tools based on intent
- **Large Context Window**: Analyze extensive datasets
- **Fast Response Times**: Real-time insights

---

Built with ❤️ for startup founders who want to work smarter, not harder.

**Ready to supercharge your startup's growth with AI?** Get started now!
