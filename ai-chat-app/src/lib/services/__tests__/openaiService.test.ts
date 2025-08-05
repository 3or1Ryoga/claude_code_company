import { OpenAIService, OpenAIAPIError } from '../openaiService';
import { server } from '../../__mocks__/msw/server';
import { rest } from 'msw';

// Mock environment variables
const mockEnv = {
  OPENAI_API_KEY: 'sk-test1234567890abcdef1234567890abcdef1234567890abcdef',
  OPENAI_BASE_URL: 'https://api.openai.com/v1',
  OPENAI_MODEL: 'gpt-3.5-turbo',
  OPENAI_MAX_RETRIES: '3',
  OPENAI_TIMEOUT: '30000'
};

describe('OpenAIService', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let openaiService: OpenAIService;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...process.env, ...mockEnv };
    openaiService = new OpenAIService();
    server.resetHandlers();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(() => {
    server.close();
  });

  describe('Configuration Validation', () => {
    test('should validate valid configuration', () => {
      const config = openaiService.validateConfig();
      expect(config.isValid).toBe(true);
      expect(config.errors).toHaveLength(0);
    });

    test('should detect missing API key', () => {
      process.env.OPENAI_API_KEY = '';
      const service = new OpenAIService();
      const config = service.validateConfig();
      
      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_API_KEY is required');
    });

    test('should detect invalid API key format', () => {
      process.env.OPENAI_API_KEY = 'invalid-key-format';
      const service = new OpenAIService();
      const config = service.validateConfig();
      
      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_API_KEY must start with "sk-"');
    });

    test('should detect missing base URL', () => {
      process.env.OPENAI_BASE_URL = '';
      const service = new OpenAIService();
      const config = service.validateConfig();
      
      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_BASE_URL is required');
    });

    test('should detect missing model', () => {
      process.env.OPENAI_MODEL = '';
      const service = new OpenAIService();
      const config = service.validateConfig();
      
      expect(config.isValid).toBe(false);
      expect(config.errors).toContain('OPENAI_MODEL is required');
    });
  });

  describe('API Request Handling', () => {
    test('should make successful API request', async () => {
      // Mock successful response
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              id: 'chatcmpl-test123',
              object: 'chat.completion',
              created: 1234567890,
              model: 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Hello! This is a test response.'
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30
              }
            })
          );
        })
      );

      const response = await openaiService.generateResponse([
        { role: 'user', content: 'Hello, AI!' }
      ]);

      expect(response.choices[0].message.content).toBe('Hello! This is a test response.');
      expect(response.usage.total_tokens).toBe(30);
    });

    test('should handle authentication error', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                message: 'Invalid API key provided',
                type: 'invalid_request_error',
                code: 'invalid_api_key'
              }
            })
          );
        })
      );

      await expect(
        openaiService.generateResponse([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow(OpenAIAPIError);

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Hello' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIAPIError);
        expect((error as OpenAIAPIError).isAuthenticationError()).toBe(true);
        expect((error as OpenAIAPIError).status).toBe(401);
      }
    });

    test('should handle rate limit error with retry', async () => {
      let attemptCount = 0;
      
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;
          
          if (attemptCount <= 2) {
            return res(
              ctx.status(429),
              ctx.json({
                error: {
                  message: 'Rate limit reached',
                  type: 'rate_limit_exceeded'
                }
              })
            );
          }
          
          return res(
            ctx.status(200),
            ctx.json({
              id: 'chatcmpl-test123',
              object: 'chat.completion',
              created: 1234567890,
              model: 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Success after retry'
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 15,
                total_tokens: 25
              }
            })
          );
        })
      );

      const response = await openaiService.generateResponse([
        { role: 'user', content: 'Hello' }
      ]);

      expect(response.choices[0].message.content).toBe('Success after retry');
      expect(attemptCount).toBe(3); // Failed twice, succeeded on third attempt
    });

    test('should handle quota exceeded error', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.json({
              error: {
                message: 'You exceeded your current quota',
                type: 'insufficient_quota'
              }
            })
          );
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Hello' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIAPIError);
        expect((error as OpenAIAPIError).isQuotaExceededError()).toBe(true);
      }
    });

    test('should handle server error with retry', async () => {
      let attemptCount = 0;
      
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;
          
          if (attemptCount <= 1) {
            return res(ctx.status(500));
          }
          
          return res(
            ctx.status(200),
            ctx.json({
              id: 'chatcmpl-test123',
              object: 'chat.completion',
              created: 1234567890,
              model: 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Recovered from server error'
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30
              }
            })
          );
        })
      );

      const response = await openaiService.generateResponse([
        { role: 'user', content: 'Hello' }
      ]);

      expect(response.choices[0].message.content).toBe('Recovered from server error');
      expect(attemptCount).toBe(2);
    });

    test('should respect timeout', async () => {
      process.env.OPENAI_TIMEOUT = '100'; // 100ms timeout
      const service = new OpenAIService();

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          // Delay response beyond timeout
          return res(ctx.delay(200), ctx.status(200));
        })
      );

      await expect(
        service.generateResponse([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow();
    });

    test('should validate response structure', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              // Invalid response structure - missing required fields
              id: 'test',
              object: 'invalid'
            })
          );
        })
      );

      await expect(
        openaiService.generateResponse([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow('Invalid response structure from OpenAI API');
    });
  });

  describe('Options and Parameters', () => {
    test('should use custom temperature and max tokens', async () => {
      let requestBody: any;

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', async (req, res, ctx) => {
          requestBody = await req.json();
          
          return res(
            ctx.status(200),
            ctx.json({
              id: 'chatcmpl-test123',
              object: 'chat.completion',
              created: 1234567890,
              model: 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Test response'
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30
              }
            })
          );
        })
      );

      await openaiService.generateResponse(
        [{ role: 'user', content: 'Hello' }],
        {
          temperature: 0.9,
          maxTokens: 500
        }
      );

      expect(requestBody.temperature).toBe(0.9);
      expect(requestBody.max_tokens).toBe(500);
      expect(requestBody.model).toBe('gpt-3.5-turbo');
    });

    test('should use default parameters when options not provided', async () => {
      let requestBody: any;

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', async (req, res, ctx) => {
          requestBody = await req.json();
          
          return res(
            ctx.status(200),
            ctx.json({
              id: 'chatcmpl-test123',
              object: 'chat.completion',
              created: 1234567890,
              model: 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Test response'
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30
              }
            })
          );
        })
      );

      await openaiService.generateResponse([{ role: 'user', content: 'Hello' }]);

      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.max_tokens).toBe(1000);
      expect(requestBody.stream).toBe(false);
    });
  });

  describe('Test Connection', () => {
    test('should test connection successfully', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              id: 'chatcmpl-test123',
              object: 'chat.completion',
              created: 1234567890,
              model: 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Test'
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15
              }
            })
          );
        })
      );

      const result = await openaiService.testConnection();

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    test('should handle test connection failure', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                message: 'Invalid API key',
                type: 'invalid_request_error'
              }
            })
          );
        })
      );

      const result = await openaiService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.latency).toBeUndefined();
    });
  });

  describe('Usage Stats', () => {
    test('should return correct usage stats', () => {
      const stats = openaiService.getUsageStats();

      expect(stats.model).toBe('gpt-3.5-turbo');
      expect(stats.maxRetries).toBe(3);
      expect(stats.timeout).toBe(30000);
      expect(stats.hasValidKey).toBe(true);
    });

    test('should detect invalid API key in stats', () => {
      process.env.OPENAI_API_KEY = 'invalid-key';
      const service = new OpenAIService();
      const stats = service.getUsageStats();

      expect(stats.hasValidKey).toBe(false);
    });
  });

  describe('Error Classification', () => {
    test('should classify rate limit errors correctly', () => {
      const error = new OpenAIAPIError('Rate limit exceeded', 429, 'rate_limit_exceeded');

      expect(error.isRateLimitError()).toBe(true);
      expect(error.isAuthenticationError()).toBe(false);
      expect(error.isTemporaryError()).toBe(true);
    });

    test('should classify authentication errors correctly', () => {
      const error = new OpenAIAPIError('Invalid API key', 401, 'invalid_request_error');

      expect(error.isAuthenticationError()).toBe(true);
      expect(error.isRateLimitError()).toBe(false);
      expect(error.isTemporaryError()).toBe(false);
    });

    test('should classify quota exceeded errors correctly', () => {
      const error = new OpenAIAPIError('Quota exceeded', 429, 'insufficient_quota');

      expect(error.isQuotaExceededError()).toBe(true);
      expect(error.isRateLimitError()).toBe(true);
      expect(error.isTemporaryError()).toBe(true);
    });

    test('should classify server errors as temporary', () => {
      const error = new OpenAIAPIError('Internal server error', 500, 'server_error');

      expect(error.isTemporaryError()).toBe(true);
      expect(error.isAuthenticationError()).toBe(false);
      expect(error.isRateLimitError()).toBe(false);
    });
  });
});