# StartupCRM API Documentation

Complete API reference for the AI-powered CRM platform.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All CRM endpoints require authentication using JWT tokens.

### Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** Same as registration

### Using the Token

Include the token in all subsequent requests:
```http
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

## Dashboard

### Get Dashboard Overview
```http
GET /api/crm/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": {
      "total": 150,
      "byStatus": {
        "lead": 45,
        "prospect": 60,
        "customer": 40,
        "inactive": 5
      },
      "recentlyAdded": 12
    },
    "deals": {
      "total": 35,
      "totalValue": 1250000,
      "byStage": {
        "prospecting": 8,
        "qualification": 10,
        "proposal": 7,
        "negotiation": 5,
        "closed_won": 3,
        "closed_lost": 2
      },
      "avgDealSize": 35714.29
    },
    "inventory": {
      "total": 250,
      "totalValue": 125000,
      "lowStock": 15,
      "outOfStock": 3
    }
  }
}
```

### Get AI-Powered Insights
```http
GET /api/crm/insights
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      "Your sales pipeline is healthy with 35 active deals",
      "Conversion rate from prospect to customer is 66%",
      "15 inventory items need reordering within 7 days"
    ],
    "recommendations": [
      "Focus on 8 high-value prospects in qualification stage",
      "Follow up with 5 deals in negotiation - average age 45 days",
      "Consider bulk ordering for Economy Tool to reduce costs"
    ],
    "priorityContacts": [
      {
        "name": "Jessica Williams",
        "company": "MegaCorp International",
        "reason": "High deal value ($200K) and strong engagement"
      }
    ],
    "forecast": {
      "nextQuarter": 450000,
      "confidence": 85,
      "expectedDeals": 12
    },
    "risks": [
      "3 high-value deals have been in negotiation for over 60 days",
      "Stockout risk for 5 popular items in next 14 days"
    ],
    "opportunities": [
      "10 leads haven't been contacted in 30+ days",
      "3 customers are due for upsell conversations"
    ]
  }
}
```

## Contacts

### Create Contact
```http
POST /api/crm/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@techstartup.com",
  "phone": "+1234567890",
  "company": "TechStartup Inc",
  "position": "CEO",
  "industry": "Technology",
  "status": "lead",
  "source": "website",
  "tags": ["saas", "enterprise"],
  "dealValue": 50000,
  "notes": "Met at tech conference, interested in enterprise plan"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "contact_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@techstartup.com",
    "company": "TechStartup Inc",
    "status": "lead",
    "score": 50,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Contacts
```http
GET /api/crm/contacts?status=lead&page=1&limit=20&search=tech
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (lead, prospect, customer, inactive)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `search` (optional): Search in name, email, company

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "_id": "contact_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@techstartup.com",
        "company": "TechStartup Inc",
        "status": "lead",
        "score": 75,
        "dealValue": 50000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Update Contact
```http
PUT /api/crm/contacts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "prospect",
  "score": 85,
  "notes": "Had great demo call, moving to next stage"
}
```

### Score Leads with AI
```http
POST /api/crm/contacts/score
Authorization: Bearer <token>
```

Uses Google Gemini Pro to analyze all leads and assign scores (0-100).

**Response:**
```json
{
  "success": true,
  "data": {
    "scores": [
      {
        "email": "jane@techstartup.com",
        "score": 88,
        "reasoning": "High engagement, decision-maker role, good fit for product",
        "recommendedActions": [
          "Schedule demo immediately",
          "Send case study for similar company",
          "Follow up within 48 hours"
        ]
      }
    ]
  }
}
```

### Generate Personalized Email
```http
POST /api/crm/contacts/generate-email
Authorization: Bearer <token>
Content-Type: application/json

{
  "contactId": "contact_id",
  "context": "Product launch announcement for new enterprise features"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "Hi Jane,\n\nI hope this email finds you well at TechStartup Inc. I wanted to reach out personally to share some exciting news...\n\n[AI-generated personalized content]\n\nBest regards,\nYour Name"
  }
}
```

## Deals

### Create Deal
```http
POST /api/crm/deals
Authorization: Bearer <token>
Content-Type: application/json

{
  "contactId": "contact_id",
  "title": "Enterprise License",
  "description": "Annual enterprise license with premium support",
  "value": 75000,
  "currency": "USD",
  "stage": "prospecting",
  "probability": 50,
  "expectedCloseDate": "2024-12-31",
  "products": [
    {
      "name": "Premium Widget Pro",
      "quantity": 100,
      "price": 49.99,
      "total": 4999
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "deal_id",
    "title": "Enterprise License",
    "value": 75000,
    "stage": "prospecting",
    "probability": 50,
    "contactId": "contact_id",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Deals
```http
GET /api/crm/deals?stage=prospecting&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `stage` (optional): Filter by stage
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "deals": [
      {
        "_id": "deal_id",
        "title": "Enterprise License",
        "value": 75000,
        "stage": "prospecting",
        "probability": 50,
        "contactId": {
          "firstName": "Jane",
          "lastName": "Smith",
          "company": "TechStartup Inc"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "pages": 1
    }
  }
}
```

### Update Deal
```http
PUT /api/crm/deals/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "stage": "qualification",
  "probability": 65,
  "notes": "Completed needs assessment, strong interest"
}
```

### Analyze Deal with AI
```http
POST /api/crm/deals/:id/analyze
Authorization: Bearer <token>
```

Uses Google Gemini Pro to predict win probability and provide recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "winProbability": 75,
    "keyFactors": [
      "Strong engagement from decision maker",
      "Budget confirmed and approved",
      "Timeline aligns with fiscal year end"
    ],
    "recommendedActions": [
      "Send detailed proposal with ROI analysis",
      "Schedule executive demo with technical team",
      "Prepare references from similar customers"
    ],
    "riskFactors": [
      "Competitor evaluation in progress",
      "Long procurement process (60-90 days)"
    ],
    "timelineSuggestions": "Accelerate to proposal stage within 2 weeks to maintain momentum"
  }
}
```

## Inventory

### Get Inventory
```http
GET /api/crm/inventory?status=low_stock&category=Widgets
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (in_stock, low_stock, out_of_stock, discontinued)
- `category` (optional): Filter by category
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "item_id",
        "sku": "WIDGET-PRO-001",
        "name": "Premium Widget Pro",
        "category": "Widgets",
        "quantity": 8,
        "reorderPoint": 15,
        "unitPrice": 49.99,
        "status": "low_stock",
        "aiPredictions": {
          "forecastedDemand": 45,
          "recommendedReorderDate": "2024-01-20",
          "optimalQuantity": 100,
          "lastAnalyzed": "2024-01-15T10:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Create Inventory Item
```http
POST /api/crm/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "GADGET-001",
  "name": "Super Gadget",
  "description": "Amazing gadget for everyday use",
  "category": "Gadgets",
  "quantity": 150,
  "reorderPoint": 30,
  "reorderQuantity": 100,
  "unitPrice": 29.99,
  "costPrice": 15.00,
  "supplier": {
    "name": "Global Supplies Inc",
    "contactPerson": "John Smith",
    "email": "john@supplies.com",
    "phone": "+1234567890"
  },
  "location": {
    "warehouse": "Main",
    "aisle": "A",
    "shelf": "5"
  },
  "tags": ["popular", "fast-moving"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "item_id",
    "sku": "GADGET-001",
    "name": "Super Gadget",
    "quantity": 150,
    "status": "in_stock",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Inventory Item
```http
PUT /api/crm/inventory/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 175,
  "notes": "Received new shipment"
}
```

The system automatically updates status based on quantity:
- `quantity === 0` → `out_of_stock`
- `quantity <= reorderPoint` → `low_stock`
- `quantity > reorderPoint` → `in_stock`

### AI Inventory Predictions
```http
POST /api/crm/inventory/predict
Authorization: Bearer <token>
```

Uses Google Gemini Pro to forecast demand and optimize inventory.

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "sku": "WIDGET-PRO-001",
        "forecastedDemand": 45,
        "recommendedReorderDate": "2024-01-20",
        "optimalQuantity": 100,
        "stockoutRisk": "high",
        "costOptimization": "Consider bulk ordering for 15% discount on 200+ units"
      }
    ],
    "summary": "3 items require immediate reordering. Total estimated cost: $4,250. Potential savings with bulk ordering: $637."
  }
}
```

## Agentic Tools

### Execute Agentic Tool
```http
POST /api/crm/agent/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "toolName": "search_contacts",
  "parameters": {
    "query": "tech companies in San Francisco",
    "filters": {
      "status": "lead",
      "dealValue": { "$gte": 50000 }
    }
  }
}
```

**Available Tools:**

#### 1. search_contacts
Search for contacts with advanced filters.
```json
{
  "toolName": "search_contacts",
  "parameters": {
    "query": "decision makers",
    "filters": { "status": "prospect" }
  }
}
```

#### 2. update_inventory
Update inventory quantities and status.
```json
{
  "toolName": "update_inventory",
  "parameters": {
    "sku": "WIDGET-PRO-001",
    "quantity": 50,
    "action": "stock_in"
  }
}
```

#### 3. create_deal
Create a new deal in the pipeline.
```json
{
  "toolName": "create_deal",
  "parameters": {
    "contactId": "contact_id",
    "title": "New Deal",
    "value": 50000,
    "stage": "prospecting"
  }
}
```

#### 4. schedule_followup
Schedule follow-up tasks.
```json
{
  "toolName": "schedule_followup",
  "parameters": {
    "contactId": "contact_id",
    "date": "2024-01-20",
    "type": "call",
    "notes": "Discuss pricing options"
  }
}
```

#### 5. generate_report
Generate custom analytics reports.
```json
{
  "toolName": "generate_report",
  "parameters": {
    "reportType": "sales_pipeline",
    "dateRange": "last_30_days",
    "metrics": ["conversion_rate", "avg_deal_size", "win_rate"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionPlan": "Search contacts database for tech companies in San Francisco with lead status and minimum deal value of $50,000",
    "expectedOutcome": "Return filtered list of 5-10 high-value leads",
    "potentialIssues": [
      "Query might be too specific - consider broadening search"
    ],
    "successCriteria": [
      "At least 3 matching contacts found",
      "All contacts meet minimum deal value threshold",
      "Results sorted by score descending"
    ]
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authenticated: 500 requests per 15 minutes per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

## Webhooks (Coming Soon)

Subscribe to real-time events:
- `contact.created`
- `contact.updated`
- `deal.stage_changed`
- `inventory.low_stock`
- `inventory.out_of_stock`

## Best Practices

1. **Always use pagination** for list endpoints
2. **Cache dashboard data** - refresh every 5-10 minutes
3. **Batch operations** when possible
4. **Use AI features judiciously** - they have API costs
5. **Store tokens securely** - never expose in client-side code
6. **Handle rate limits** - implement exponential backoff

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get dashboard
const dashboard = await api.get('/crm/dashboard');

// Create contact
const contact = await api.post('/crm/contacts', {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com'
});

// Score leads
const scores = await api.post('/crm/contacts/score');
```

### Python
```python
import requests

headers = {'Authorization': f'Bearer {token}'}
base_url = 'http://localhost:3000/api'

# Get dashboard
response = requests.get(f'{base_url}/crm/dashboard', headers=headers)
dashboard = response.json()

# Create contact
contact_data = {
    'firstName': 'Jane',
    'lastName': 'Doe',
    'email': 'jane@example.com'
}
response = requests.post(f'{base_url}/crm/contacts', 
                        json=contact_data, 
                        headers=headers)
```

### cURL
```bash
# Get dashboard
curl -X GET http://localhost:3000/api/crm/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create contact
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com"}'
```

## Support

For API support and questions:
- GitHub Issues: Report bugs and request features
- Documentation: See README.md for more details
- API Status: Check `/api/health` endpoint

---

**StartupCRM API v2.0** - Built with ❤️ for startup founders
