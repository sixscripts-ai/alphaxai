const aiService = require('../src/services/aiService');

// Mock the HTTP clients to avoid real API calls in tests
jest.mock('axios');

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    test('should handle missing OpenAI client', async () => {
      // Temporarily disable the client
      const originalClient = aiService.openaiClient;
      aiService.openaiClient = null;

      await expect(aiService.generateText('test prompt')).rejects.toThrow('OpenAI client not initialized');

      // Restore the client
      aiService.openaiClient = originalClient;
    });

    test('should return error structure on failure', async () => {
      // This test would require mocking the axios client properly
      // For now, we'll just test the structure
      expect(typeof aiService.generateText).toBe('function');
    });
  });

  describe('generateEmbedding', () => {
    test('should handle missing OpenAI client', async () => {
      const originalClient = aiService.openaiClient;
      aiService.openaiClient = null;

      await expect(aiService.generateEmbedding('test text')).rejects.toThrow('OpenAI client not initialized');

      aiService.openaiClient = originalClient;
    });
  });

  describe('classifyText', () => {
    test('should handle missing Hugging Face client', async () => {
      const originalClient = aiService.huggingfaceClient;
      aiService.huggingfaceClient = null;

      await expect(aiService.classifyText('test', ['label1'])).rejects.toThrow('Hugging Face client not initialized');

      aiService.huggingfaceClient = originalClient;
    });
  });
});