import { rest } from 'msw';

export const handlers = [
  // OpenAI API mock handlers
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    // Default successful response
    return res(
      ctx.status(200),
      ctx.json({
        id: 'chatcmpl-mock123',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a mock response from the OpenAI API test handler.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 25,  
          total_tokens: 40
        }
      })
    );
  }),

  // Health check endpoint
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'ok',
        timestamp: new Date().toISOString()
      })
    );
  }),

  // Chat API endpoints
  rest.post('/api/chat/completions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        response: 'This is a mock chat response.',
        usage: {
          total_tokens: 40
        }
      })
    );
  }),
];