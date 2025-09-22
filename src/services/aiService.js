const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.openaiClient = this.initOpenAI();
    this.huggingfaceClient = this.initHuggingFace();
  }

  initOpenAI() {
    if (!config.ai.openai.apiKey) {
      logger.warn('OpenAI API key not configured');
      return null;
    }

    return axios.create({
      baseURL: config.ai.openai.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.ai.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  initHuggingFace() {
    if (!config.ai.huggingface.apiKey) {
      logger.warn('Hugging Face API key not configured');
      return null;
    }

    return axios.create({
      baseURL: config.ai.huggingface.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.ai.huggingface.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async generateText(prompt, options = {}) {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openaiClient.post('/chat/completions', {
        model: options.model || config.ai.openai.models.gpt35turbo,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0
      });

      return {
        success: true,
        data: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      logger.error('Text generation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async generateEmbedding(text) {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openaiClient.post('/embeddings', {
        model: config.ai.openai.models.embedding,
        input: text
      });

      return {
        success: true,
        data: response.data.data[0].embedding,
        usage: response.data.usage
      };
    } catch (error) {
      logger.error('Embedding generation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async analyzeImage(imageUrl, prompt = 'Describe this image') {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000
      });

      return {
        success: true,
        data: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      logger.error('Image analysis error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async classifyText(text, labels) {
    if (!this.huggingfaceClient) {
      throw new Error('Hugging Face client not initialized');
    }

    try {
      const response = await this.huggingfaceClient.post('/facebook/bart-large-mnli', {
        inputs: text,
        parameters: {
          candidate_labels: labels
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Text classification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async summarizeText(text, maxLength = 150) {
    if (!this.huggingfaceClient) {
      throw new Error('Hugging Face client not initialized');
    }

    try {
      const response = await this.huggingfaceClient.post('/facebook/bart-large-cnn', {
        inputs: text,
        parameters: {
          max_length: maxLength,
          min_length: 30,
          do_sample: false
        }
      });

      return {
        success: true,
        data: response.data[0].summary_text
      };
    } catch (error) {
      logger.error('Text summarization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new AIService();