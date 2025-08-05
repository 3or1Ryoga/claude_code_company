import { OpenAIService } from '../services/openaiService';

describe('Environment Configuration Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('OpenAI API Key Environment Variables', () => {
    test('should detect missing OPENAI_API_KEY', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: undefined
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_API_KEY is required');
    });

    test('should detect empty OPENAI_API_KEY', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: ''
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_API_KEY is required');
    });

    test('should validate API key format', () => {
      const invalidKeys = [
        'invalid-key',
        'pk-1234567890',  // Wrong prefix
        'sk-',            // Too short
        '1234567890',     // No prefix
        'SK-1234567890'   // Wrong case
      ];

      invalidKeys.forEach(invalidKey => {
        process.env = {
          ...originalEnv,
          OPENAI_API_KEY: invalidKey
        };

        const service = new OpenAIService();
        const config = service.validateConfig();

        expect(config.isValid).toBe(false);
        expect(config.errors).toContain('OPENAI_API_KEY must start with "sk-"');
      });
    });

    test('should accept valid API key format', () => {
      const validKeys = [
        'sk-1234567890abcdef',
        'sk-proj-abcdef1234567890',
        'sk-1234567890abcdef1234567890abcdef1234567890abcdef'
      ];

      validKeys.forEach(validKey => {
        process.env = {
          ...originalEnv,
          OPENAI_API_KEY: validKey,
          OPENAI_BASE_URL: 'https://api.openai.com/v1',
          OPENAI_MODEL: 'gpt-3.5-turbo'
        };

        const service = new OpenAIService();
        const config = service.validateConfig();

        expect(config.isValid).toBe(true);
        expect(config.errors).toHaveLength(0);
      });
    });

    test('should handle API key from different sources', () => {
      // Test .env file simulation
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-env-file-key-1234567890',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: 'gpt-3.5-turbo'
      };

      const service = new OpenAIService();
      const stats = service.getUsageStats();

      expect(stats.hasValidKey).toBe(true);
    });
  });

  describe('Base URL Configuration', () => {
    test('should use default OpenAI base URL', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: undefined
      };

      const service = new OpenAIService();
      const stats = service.getUsageStats();

      // Base URL should default to OpenAI's endpoint
      expect(service['baseURL']).toBe('https://api.openai.com/v1');
    });

    test('should accept custom base URL', () => {
      const customURL = 'https://custom-openai-proxy.example.com/v1';
      
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: customURL,
        OPENAI_MODEL: 'gpt-3.5-turbo'
      };

      const service = new OpenAIService();
      expect(service['baseURL']).toBe(customURL);
    });

    test('should validate base URL is not empty', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: '',
        OPENAI_MODEL: 'gpt-3.5-turbo'
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_BASE_URL is required');
    });
  });

  describe('Model Configuration', () => {
    test('should use default model when not specified', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: undefined
      };

      const service = new OpenAIService();
      expect(service['model']).toBe('gpt-3.5-turbo');
    });

    test('should accept different model configurations', () => {
      const models = [
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
        'gpt-4',
        'gpt-4-turbo-preview',
        'gpt-4-vision-preview'
      ];

      models.forEach(model => {
        process.env = {
          ...originalEnv,
          OPENAI_API_KEY: 'sk-test1234567890',
          OPENAI_BASE_URL: 'https://api.openai.com/v1',
          OPENAI_MODEL: model
        };

        const service = new OpenAIService();
        const stats = service.getUsageStats();

        expect(stats.model).toBe(model);
      });
    });

    test('should validate model is not empty', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: ''
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_MODEL is required');
    });
  });

  describe('Retry and Timeout Configuration', () => {
    test('should use default retry configuration', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: 'gpt-3.5-turbo',
        OPENAI_MAX_RETRIES: undefined,
        OPENAI_TIMEOUT: undefined
      };

      const service = new OpenAIService();
      const stats = service.getUsageStats();

      expect(stats.maxRetries).toBe(3);
      expect(stats.timeout).toBe(30000);
    });

    test('should accept custom retry configuration', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: 'gpt-3.5-turbo',
        OPENAI_MAX_RETRIES: '5',
        OPENAI_TIMEOUT: '60000'
      };

      const service = new OpenAIService();
      const stats = service.getUsageStats();

      expect(stats.maxRetries).toBe(5);
      expect(stats.timeout).toBe(60000);
    });

    test('should handle invalid numeric configurations', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: 'gpt-3.5-turbo',
        OPENAI_MAX_RETRIES: 'invalid',
        OPENAI_TIMEOUT: 'not-a-number'
      };

      const service = new OpenAIService();
      const stats = service.getUsageStats();

      // Should fall back to defaults when parsing fails
      expect(stats.maxRetries).toBe(3);
      expect(stats.timeout).toBe(30000);
    });
  });

  describe('Development vs Production Configuration', () => {
    test('should work in development environment', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: 'gpt-3.5-turbo'
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.isValid).toBe(true);
      expect(process.env.NODE_ENV).toBe('development');
    });

    test('should work in production environment', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        OPENAI_API_KEY: 'sk-prod1234567890abcdef',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: 'gpt-4'
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.isValid).toBe(true);
      expect(process.env.NODE_ENV).toBe('production');
    });

    test('should work in test environment', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        OPENAI_API_KEY: 'sk-test1234567890',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: 'gpt-3.5-turbo'
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.isValid).toBe(true);
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Configuration Validation Edge Cases', () => {
    test('should handle multiple configuration errors', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'invalid-key',
        OPENAI_BASE_URL: '',
        OPENAI_MODEL: ''
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_API_KEY must start with "sk-"');
      expect(config.errors).toContain('OPENAI_BASE_URL is required');
      expect(config.errors).toContain('OPENAI_MODEL is required');
      expect(config.errors).toHaveLength(3);
    });

    test('should handle whitespace in configuration values', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: '  sk-test1234567890  ',
        OPENAI_BASE_URL: '  https://api.openai.com/v1  ',
        OPENAI_MODEL: '  gpt-3.5-turbo  '
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      // Service should handle trimming internally or validation should account for it
      expect(config.isValid).toBe(true);
    });

    test('should provide detailed error messages', () => {
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: undefined
      };

      const service = new OpenAIService();
      const config = service.validateConfig();

      expect(config.errors[0]).toMatch(/OPENAI_API_KEY/);
      expect(config.errors[0]).toMatch(/required/);
    });
  });

  describe('Environment Variable Precedence', () => {
    test('should prioritize environment variables over defaults', () => {
      const customValues = {
        OPENAI_API_KEY: 'sk-custom1234567890',
        OPENAI_BASE_URL: 'https://custom.openai.com/v1',
        OPENAI_MODEL: 'gpt-4-custom',
        OPENAI_MAX_RETRIES: '7',
        OPENAI_TIMEOUT: '45000'
      };

      process.env = {
        ...originalEnv,
        ...customValues
      };

      const service = new OpenAIService();
      const stats = service.getUsageStats();

      expect(service['apiKey']).toBe(customValues.OPENAI_API_KEY);
      expect(service['baseURL']).toBe(customValues.OPENAI_BASE_URL);
      expect(stats.model).toBe(customValues.OPENAI_MODEL);
      expect(stats.maxRetries).toBe(7);
      expect(stats.timeout).toBe(45000);
    });
  });
});