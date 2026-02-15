const axios = require('axios');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-1.5-pro-latest';
  }

  /**
   * Generate content using Gemini Pro
   */
  async generateContent(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            topK: options.topK || 40,
            topP: options.topP || 0.95,
            maxOutputTokens: options.maxTokens || 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }
      );

      if (response.data.candidates && response.data.candidates[0]) {
        return {
          text: response.data.candidates[0].content.parts[0].text,
          usage: response.data.usageMetadata
        };
      }

      throw new Error('No response from Gemini API');
    } catch (error) {
      logger.error('Gemini API error:', error.response?.data || error.message);
      throw new Error('Failed to generate content: ' + error.message);
    }
  }

  /**
   * Analyze CRM data and provide insights
   */
  async analyzeCRMData(contacts, deals) {
    const prompt = `You are an expert CRM analyst for startup founders. Analyze the following data and provide actionable insights:

Contacts Summary:
- Total Contacts: ${contacts.length}
- By Status: ${this.groupByField(contacts, 'status')}
- By Source: ${this.groupByField(contacts, 'source')}

Deals Summary:
- Total Deals: ${deals.length}
- Total Value: $${deals.reduce((sum, d) => sum + d.value, 0)}
- By Stage: ${this.groupByField(deals, 'stage')}

Please provide:
1. Key insights about sales pipeline health
2. Top 3 recommendations for improving conversion rates
3. Which contacts should be prioritized for follow-up
4. Revenue forecast for next quarter
5. Potential risks and opportunities

Format your response as JSON with the structure:
{
  "insights": [],
  "recommendations": [],
  "priorityContacts": [],
  "forecast": {},
  "risks": [],
  "opportunities": []
}`;

    const result = await this.generateContent(prompt);
    try {
      return JSON.parse(result.text);
    } catch (e) {
      return { rawAnalysis: result.text };
    }
  }

  /**
   * Predict inventory needs using AI
   */
  async predictInventoryNeeds(inventoryItems, historicalData = []) {
    const prompt = `You are an AI inventory management expert. Analyze the following inventory data and predict future needs:

Current Inventory:
${inventoryItems.map(item => `- ${item.name} (SKU: ${item.sku}): ${item.quantity} units, Reorder point: ${item.reorderPoint}`).join('\n')}

Historical patterns:
${historicalData.length > 0 ? JSON.stringify(historicalData) : 'No historical data available'}

For each item, predict:
1. Forecasted demand for the next 30 days
2. Recommended reorder date
3. Optimal reorder quantity
4. Risk of stockout
5. Cost optimization suggestions

Respond with JSON format:
{
  "predictions": [
    {
      "sku": "...",
      "forecastedDemand": number,
      "recommendedReorderDate": "YYYY-MM-DD",
      "optimalQuantity": number,
      "stockoutRisk": "low|medium|high",
      "costOptimization": "suggestion"
    }
  ],
  "summary": "overall analysis"
}`;

    const result = await this.generateContent(prompt, { temperature: 0.3 });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      return { rawPrediction: result.text };
    }
  }

  /**
   * Score and qualify leads using AI
   */
  async scoreLeads(contacts) {
    const prompt = `You are a lead scoring AI expert. Analyze these contacts and assign a score (0-100) to each based on:
- Engagement level
- Company size/industry
- Deal value potential
- Conversion likelihood

Contacts:
${JSON.stringify(contacts.map(c => ({
  name: `${c.firstName} ${c.lastName}`,
  company: c.company,
  position: c.position,
  industry: c.industry,
  status: c.status,
  dealValue: c.dealValue,
  lastContact: c.lastContactDate
})))}

Respond with JSON:
{
  "scores": [
    {
      "email": "...",
      "score": number,
      "reasoning": "...",
      "recommendedActions": []
    }
  ]
}`;

    const result = await this.generateContent(prompt, { temperature: 0.4 });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      return { rawScores: result.text };
    }
  }

  /**
   * Generate personalized email content
   */
  async generateEmail(contact, context) {
    const prompt = `Generate a personalized outreach email for:
Name: ${contact.firstName} ${contact.lastName}
Company: ${contact.company}
Position: ${contact.position}
Context: ${context}

Write a professional, engaging email that:
1. Addresses them personally
2. Shows understanding of their business
3. Provides clear value proposition
4. Has a specific call to action

Keep it concise (under 200 words).`;

    const result = await this.generateContent(prompt, { temperature: 0.8 });
    return result.text;
  }

  /**
   * Analyze deal win probability
   */
  async analyzeDealProbability(deal, contact, activities = []) {
    const prompt = `Analyze this sales deal and predict win probability:

Deal Details:
- Title: ${deal.title}
- Value: $${deal.value}
- Stage: ${deal.stage}
- Expected Close: ${deal.expectedCloseDate}

Contact:
- Company: ${contact.company}
- Position: ${contact.position}
- Status: ${contact.status}

Recent Activities:
${activities.map(a => `- ${a.type}: ${a.description}`).join('\n')}

Provide:
1. Win probability (0-100)
2. Key factors affecting the deal
3. Recommended next actions
4. Risk factors
5. Timeline suggestions

Respond with JSON:
{
  "winProbability": number,
  "keyFactors": [],
  "recommendedActions": [],
  "riskFactors": [],
  "timelineSuggestions": "..."
}`;

    const result = await this.generateContent(prompt, { temperature: 0.5 });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      return { rawAnalysis: result.text };
    }
  }

  /**
   * Function calling for agentic tools
   */
  async executeAgenticTool(toolName, parameters) {
    const tools = {
      'search_contacts': {
        description: 'Search for contacts in CRM database',
        parameters: ['query', 'filters']
      },
      'update_inventory': {
        description: 'Update inventory quantities',
        parameters: ['sku', 'quantity', 'action']
      },
      'create_deal': {
        description: 'Create a new deal in pipeline',
        parameters: ['contactId', 'title', 'value', 'stage']
      },
      'schedule_followup': {
        description: 'Schedule follow-up task',
        parameters: ['contactId', 'date', 'type', 'notes']
      },
      'generate_report': {
        description: 'Generate analytics report',
        parameters: ['reportType', 'dateRange', 'metrics']
      }
    };

    const prompt = `Execute the following tool call:
Tool: ${toolName}
Parameters: ${JSON.stringify(parameters)}
Available tools: ${JSON.stringify(tools)}

Based on this tool call, generate:
1. The execution plan
2. Expected outcome
3. Potential issues
4. Success criteria

Respond with JSON:
{
  "executionPlan": "...",
  "expectedOutcome": "...",
  "potentialIssues": [],
  "successCriteria": []
}`;

    const result = await this.generateContent(prompt, { temperature: 0.3 });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      return { rawResponse: result.text };
    }
  }

  /**
   * Helper method to group data by field
   */
  groupByField(items, field) {
    const grouped = items.reduce((acc, item) => {
      const key = item[field] || 'undefined';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return JSON.stringify(grouped);
  }
}

module.exports = new GeminiService();
