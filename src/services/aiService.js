const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.geminiClient = this.initGemini();
    this.huggingfaceClient = this.initHuggingFace();
  }

  initGemini() {
    if (!config.ai.gemini.apiKey) {
      logger.warn('Gemini API key not configured');
      return null;
    }

    return axios.create({
      baseURL: config.ai.gemini.baseUrl,
      headers: {
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
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    try {
      const model = options.model || config.ai.gemini.models.text;
      const response = await this.geminiClient.post(
        `/models/${model}:generateContent?key=${config.ai.gemini.apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            topP: options.topP || 1
          }
        }
      );

      return {
        success: true,
        data: response.data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        usage: response.data.usageMetadata
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
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    try {
      const response = await this.geminiClient.post(
        `/models/${config.ai.gemini.models.embedding}:embedContent?key=${config.ai.gemini.apiKey}`,
        {
          content: {
            parts: [{ text }]
          }
        }
      );

      return {
        success: true,
        data: response.data.embedding?.values || [],
        usage: response.data.usageMetadata
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
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    try {
      const response = await this.geminiClient.post(
        `/models/${config.ai.gemini.models.vision}:generateContent?key=${config.ai.gemini.apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${prompt}\nImage URL: ${imageUrl}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1000
          }
        }
      );

      return {
        success: true,
        data: response.data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        usage: response.data.usageMetadata
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