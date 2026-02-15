# ⚡ StartupCRM - Quick Start Guide

Get your AI-powered CRM running in 5 minutes!

## 🎯 What You'll Get

A complete CRM system with:
- 👥 **Contact Management** with AI lead scoring
- 💼 **Sales Pipeline** with deal probability prediction
- 📦 **Inventory Management** with demand forecasting
- 🤖 **Google Gemini Pro AI** for automation and insights
- 🎯 **Agentic Tools** for complex task execution

## 📋 Prerequisites

Before you start, you need:
1. **Google Gemini API Key** - [Get it free here](https://makersuite.google.com/app/apikey)
2. **MongoDB** installed locally OR [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)

## 🚀 Super Quick Start (3 steps)

### Step 1: Configure Environment Variables

Set these environment variables in AppJet:

```bash
# Required - Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Database (use one of these)
DATABASE_URL=mongodb://localhost:27017/startupcrm
# OR for MongoDB Atlas:
# DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/startupcrm

# Security (generate strong random string)
JWT_SECRET=your_super_secret_random_string_32_chars_minimum
```

### Step 2: Deploy the Application

Click the **"Deploy Code"** button in AppJet or tell me "Deploy the app"

### Step 3: Access Your CRM

Once deployed, open the provided URL in your browser!

## 🎨 Using the CRM

### First Time Setup

1. **Open the CRM** - Navigate to your deployment URL
2. **Create an Account** - Use the API to register:
   ```bash
   curl -X POST https://your-app-url/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Your Name","email":"you@example.com","password":"SecurePass123!"}'
   ```
3. **Save Your Token** - Copy the token from the response
4. **Start Adding Data** - Use the interface or API to add contacts, deals, and inventory

### Quick Demo with Sample Data

Want to see it in action immediately? Run the data seeder:

```bash
npm run seed
```

This creates:
- ✅ Demo user (email: demo@startupcrm.com, password: Demo123!)
- ✅ 5 sample contacts
- ✅ 4 sample deals
- ✅ 5 inventory items

## 🔑 API Authentication

All requests need authentication. Include your token:

```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

Example:
```bash
curl https://your-app-url/api/crm/dashboard \
  -H "Authorization: Bearer eyJhbGc..."
```

## 🎯 Key Features to Try

### 1. AI-Powered Insights
```bash
curl https://your-app-url/api/crm/insights \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Get AI analysis of your sales pipeline, conversion rates, and recommendations.

### 2. Lead Scoring
```bash
curl -X POST https://your-app-url/api/crm/contacts/score \
  -H "Authorization: Bearer YOUR_TOKEN"
```
AI automatically scores all your leads (0-100) based on conversion potential.

### 3. Deal Analysis
```bash
curl -X POST https://your-app-url/api/crm/deals/DEAL_ID/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Get win probability, risk factors, and action recommendations for any deal.

### 4. Inventory Predictions
```bash
curl -X POST https://your-app-url/api/crm/inventory/predict \
  -H "Authorization: Bearer YOUR_TOKEN"
```
AI forecasts demand and recommends optimal reorder dates and quantities.

### 5. Generate Personalized Emails
```bash
curl -X POST https://your-app-url/api/crm/contacts/generate-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contactId":"CONTACT_ID","context":"product launch"}'
```
AI generates personalized outreach emails for any contact.

## 📊 Dashboard Overview

The main dashboard shows:
- 👥 **Total Contacts** by status (leads, prospects, customers)
- 💼 **Active Deals** and total pipeline value
- 📦 **Inventory Status** with low-stock alerts
- 🤖 **AI Insights** with actionable recommendations

## 🔧 Common Tasks

### Add a Contact
```bash
curl -X POST https://your-app-url/api/crm/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@company.com",
    "company": "Tech Corp",
    "position": "CEO",
    "status": "lead"
  }'
```

### Create a Deal
```bash
curl -X POST https://your-app-url/api/crm/deals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "CONTACT_ID",
    "title": "Enterprise License",
    "value": 50000,
    "stage": "prospecting"
  }'
```

### Add Inventory Item
```bash
curl -X POST https://your-app-url/api/crm/inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Premium Widget",
    "quantity": 100,
    "unitPrice": 49.99,
    "reorderPoint": 20
  }'
```

## 🤖 AI Agentic Tools

Execute complex tasks with natural language:

```bash
curl -X POST https://your-app-url/api/crm/agent/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "search_contacts",
    "parameters": {
      "query": "tech companies",
      "filters": {"status": "lead"}
    }
  }'
```

Available tools:
- `search_contacts` - Smart contact search
- `update_inventory` - Inventory updates
- `create_deal` - Auto-create deals
- `schedule_followup` - Schedule tasks
- `generate_report` - Custom reports

## 💡 Pro Tips

1. **Use Tags** - Organize contacts with tags like "hot-lead", "enterprise", "tech"
2. **Set Follow-up Dates** - Never miss important conversations
3. **Review AI Insights Daily** - Get fresh recommendations every morning
4. **Monitor Low Stock** - Set appropriate reorder points
5. **Track Deal Activities** - Log all calls, emails, and meetings
6. **Use Custom Fields** - Add industry-specific data

## 🐛 Troubleshooting

### "Invalid API Key" error
- Check your GEMINI_API_KEY is correct
- Get a new key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Verify no extra spaces in the key

### "Connection refused" to MongoDB
- Ensure MongoDB is running
- Check DATABASE_URL format
- For Atlas, verify network access settings

### "Unauthorized" errors
- Get a fresh token by logging in
- Check token is included in Authorization header
- Token format: `Bearer YOUR_TOKEN_HERE`

### AI features not working
- Verify GEMINI_API_KEY is set
- Check API quota in Google AI Studio
- Ensure you have data (contacts/deals) to analyze

## 📚 Next Steps

1. **Read Full Documentation** - Check [README.md](README.md)
2. **API Reference** - See [docs/API_CRM.md](docs/API_CRM.md)
3. **Setup Guide** - Detailed setup in [SETUP_GUIDE.md](SETUP_GUIDE.md)
4. **Customize** - Modify the UI in `public/crm.html`
5. **Integrate** - Connect with your existing tools via API

## 🎓 Learning Path

**Day 1**: Setup and explore interface
- Deploy the app
- Create sample data
- Navigate all sections

**Day 2**: Add your real data
- Import contacts
- Create deals
- Set up inventory

**Day 3**: Leverage AI features
- Score your leads
- Analyze deals
- Get inventory predictions

**Day 4**: Automation
- Use agentic tools
- Generate reports
- Set up workflows

**Day 5**: Optimization
- Review AI insights
- Optimize processes
- Scale your operations

## 🆘 Need Help?

- **API Issues**: Check [docs/API_CRM.md](docs/API_CRM.md)
- **Setup Problems**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **GitHub Issues**: Report bugs
- **Documentation**: Full README.md

## 🚀 Ready to Scale Your Startup?

You now have a powerful AI-driven CRM at your fingertips!

**Key Benefits:**
- ⏰ Save 10+ hours/week on manual tasks
- 📈 Increase conversion rates with AI insights
- 💰 Optimize inventory and reduce costs
- 🎯 Focus on high-value leads automatically
- 🤖 Automate repetitive workflows

Start by adding your first contact and let the AI help you grow! 🌱

---

**Made with ❤️ for startup founders**

Version 2.0 | Powered by Google Gemini Pro
