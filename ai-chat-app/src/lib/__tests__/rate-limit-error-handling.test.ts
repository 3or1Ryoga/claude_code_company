import { OpenAIService, OpenAIAPIError } from '../services/openaiService';
import { server } from '../__mocks__/msw/server';
import { rest } from 'msw';

describe('Rate Limit and Error Response Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let openaiService: OpenAIService;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...process.env,
      OPENAI_API_KEY: 'sk-test1234567890abcdef',
      OPENAI_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_MODEL: 'gpt-3.5-turbo',
      OPENAI_MAX_RETRIES: '3',
      OPENAI_TIMEOUT: '30000'
    };
    openaiService = new OpenAIService();
    server.resetHandlers();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(() => {
    server.close();
  });

  describe('Rate Limiting Tests', () => {
    test('should handle 429 rate limit error with exponential backoff', async () => {
      let attemptCount = 0;
      const requestTimes: number[] = [];

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;
          requestTimes.push(Date.now());

          if (attemptCount <= 2) {
            return res(
              ctx.status(429),
              ctx.json({
                error: {
                  message: 'Rate limit reached for requests',
                  type: 'rate_limit_exceeded',
                  param: null,
                  code: 'rate_limit_exceeded'
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
                    content: 'Success after rate limit retry'
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
        { role: 'user', content: 'Test message' }
      ]);

      expect(response.choices[0].message.content).toBe('Success after rate limit retry');
      expect(attemptCount).toBe(3);

      // Verify exponential backoff timing
      if (requestTimes.length >= 3) {
        const firstRetryDelay = requestTimes[1] - requestTimes[0];
        const secondRetryDelay = requestTimes[2] - requestTimes[1];
        
        expect(firstRetryDelay).toBeGreaterThanOrEqual(1000); // At least 1 second
        expect(secondRetryDelay).toBeGreaterThanOrEqual(2000); // At least 2 seconds
      }
    }, 10000); // Increase timeout for retry delays

    test('should fail after max retries on persistent rate limiting', async () => {
      let attemptCount = 0;

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;
          return res(
            ctx.status(429),
            ctx.json({
              error: {
                message: 'Rate limit reached for requests',
                type: 'rate_limit_exceeded',
                param: null,
                code: 'rate_limit_exceeded'
              }
            })
          );
        })
      );

      await expect(
        openaiService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow(OpenAIAPIError);

      expect(attemptCount).toBe(3); // Should retry 3 times as configured
    }, 15000);

    test('should handle different rate limit error messages', async () => {
      const rateLimitMessages = [
        'Rate limit reached for requests',
        'Too many requests in 1 hour. Limit: 200 per hour',
        'Rate limit reached for tokens per minute',
        'Request too large for gpt-3.5-turbo in organization'
      ];

      for (const message of rateLimitMessages) {
        server.resetHandlers();
        server.use(
          rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
            return res(
              ctx.status(429),
              ctx.json({
                error: {
                  message,
                  type: 'rate_limit_exceeded',
                  code: 'rate_limit_exceeded'
                }
              })
            );
          })
        );

        try {
          await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(OpenAIAPIError);
          expect((error as OpenAIAPIError).isRateLimitError()).toBe(true);
          expect((error as OpenAIAPIError).message).toBe(message);
        }
      }
    });

    test('should handle quota exceeded error', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.json({
              error: {
                message: 'You exceeded your current quota, please check your plan and billing details.',
                type: 'insufficient_quota',
                param: null,
                code: 'insufficient_quota'
              }
            })
          );
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIAPIError);
        expect((error as OpenAIAPIError).isQuotaExceededError()).toBe(true);
        expect((error as OpenAIAPIError).isRateLimitError()).toBe(true);
        expect((error as OpenAIAPIError).type).toBe('insufficient_quota');
      }
    });
  });

  describe('Authentication and Authorization Errors', () => {
    test('should handle invalid API key error', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                message: 'Invalid API key provided: sk-test1234567890abcdef.',
                type: 'invalid_request_error',
                param: null,
                code: 'invalid_api_key'
              }
            })
          );
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIAPIError);
        expect((error as OpenAIAPIError).isAuthenticationError()).toBe(true);
        expect((error as OpenAIAPIError).status).toBe(401);
        expect((error as OpenAIAPIError).code).toBe('invalid_api_key');
      }
    });

    test('should handle missing API key error', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                message: 'You didn\'t provide an API key. You need to provide your API key in an Authorization header using Bearer auth.',
                type: 'invalid_request_error',
                param: null,
                code: 'invalid_api_key'
              }
            })
          );
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIAPIError);
        expect((error as OpenAIAPIError).isAuthenticationError()).toBe(true);
      }
    });

    test('should not retry authentication errors', async () => {
      let attemptCount = 0;

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                message: 'Invalid API key',
                type: 'invalid_request_error',
                code: 'invalid_api_key'
              }
            })
          );
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIAPIError);
        expect(attemptCount).toBe(1); // Should not retry auth errors
      }
    });
  });

  describe('Server Errors and Retries', () => {
    test('should retry on 500 internal server error', async () => {
      let attemptCount = 0;

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;

          if (attemptCount <= 2) {
            return res(
              ctx.status(500),
              ctx.json({
                error: {
                  message: 'The server had an error while processing your request. Sorry about that!',
                  type: 'server_error',
                  param: null,
                  code: null
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
        { role: 'user', content: 'Test' }
      ]);

      expect(response.choices[0].message.content).toBe('Recovered from server error');
      expect(attemptCount).toBe(3);
    }, 10000);

    test('should retry on 502 bad gateway', async () => {
      let attemptCount = 0;

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;

          if (attemptCount === 1) {
            return res(ctx.status(502));
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
                    content: 'Recovered from bad gateway'
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
        { role: 'user', content: 'Test' }
      ]);

      expect(response.choices[0].message.content).toBe('Recovered from bad gateway');
      expect(attemptCount).toBe(2);
    });

    test('should fail after max retries on persistent server errors', async () => {
      let attemptCount = 0;

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;
          return res(ctx.status(500));
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(attemptCount).toBe(3);
      }
    }, 10000);
  });

  describe('Request Validation Errors', () => {
    test('should handle 400 bad request error', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              error: {
                message: 'Invalid request: messages is required',
                type: 'invalid_request_error',
                param: 'messages',
                code: null
              }
            })
          );
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIAPIError);
        expect((error as OpenAIAPIError).status).toBe(400);
        expect((error as OpenAIAPIError).type).toBe('invalid_request_error');
      }
    });

    test('should not retry 400 bad request errors', async () => {
      let attemptCount = 0;

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          attemptCount++;
          return res(
            ctx.status(400),
            ctx.json({
              error: {
                message: 'Invalid request',
                type: 'invalid_request_error'
              }
            })
          );
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(attemptCount).toBe(1); // Should not retry bad requests
      }
    });

    test('should handle model not found error', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({
              error: {
                message: 'The model `invalid-model` does not exist',
                type: 'invalid_request_error',
                param: null,
                code: 'model_not_found'
              }
            })
          );
        })
      );

      try {
        await openaiService.generateResponse([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIAPIError);
        expect((error as OpenAIAPIError).status).toBe(404);
        expect((error as OpenAIAPIError).code).toBe('model_not_found');
      }
    });
  });

  describe('Network and Timeout Errors', () => {
    test('should handle request timeout', async () => {
      process.env.OPENAI_TIMEOUT = '100'; // 100ms timeout
      const service = new OpenAIService();

      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.delay(200), // Delay longer than timeout
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
                    content: 'This should timeout'
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
            })
          );
        })
      );

      await expect(
        service.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow();
    });

    test('should handle network connection errors', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      await expect(
        openaiService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow();
    });
  });

  describe('Error Response Structure Validation', () => {
    test('should handle malformed error response', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              // Missing error object structure
              message: 'Something went wrong'
            })
          );
        })
      );

      await expect(
        openaiService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow();
    });

    test('should handle empty error response', async () => {
      server.use(
        rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
          return res(ctx.status(500), ctx.text(''));
        })
      );

      await expect(
        openaiService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow();
    });
  });

  describe('Error Classification and Handling', () => {
    test('should correctly classify temporary vs permanent errors', () => {
      const temporaryErrors = [
        new OpenAIAPIError('Rate limit exceeded', 429, 'rate_limit_exceeded'),
        new OpenAIAPIError('Server error', 500, 'server_error'),
        new OpenAIAPIError('Bad gateway', 502, 'bad_gateway'),
        new OpenAIAPIError('Service unavailable', 503, 'service_unavailable'),
      ];

      const permanentErrors = [
        new OpenAIAPIError('Invalid API key', 401, 'invalid_request_error'),
        new OpenAIAPIError('Bad request', 400, 'invalid_request_error'),
        new OpenAIAPIError('Not found', 404, 'not_found_error'),
      ];

      temporaryErrors.forEach(error => {
        expect(error.isTemporaryError()).toBe(true);
      });

      permanentErrors.forEach(error => {
        expect(error.isTemporaryError()).toBe(false);
      });
    });

    test('should provide appropriate error messages for different scenarios', () => {
      const errorScenarios = [
        {
          error: new OpenAIAPIError('Rate limit exceeded', 429, 'rate_limit_exceeded'),
          expectedMessage: 'Rate limit exceeded'
        },
        {
          error: new OpenAIAPIError('Invalid API key', 401, 'invalid_request_error', 'invalid_api_key'),
          expectedMessage: 'Invalid API key'
        },
        {
          error: new OpenAIAPIError('Quota exceeded', 429, 'insufficient_quota'),
          expectedMessage: 'Quota exceeded'
        }
      ];

      errorScenarios.forEach(({ error, expectedMessage }) => {
        expect(error.message).toBe(expectedMessage);
      });
    });
  });
});