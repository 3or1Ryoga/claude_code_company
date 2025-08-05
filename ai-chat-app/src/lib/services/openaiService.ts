import { ChatCompletionMessageParam } from 'openai/resources/chat';

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

export class OpenAIService {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private maxRetries: number;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxRetries = parseInt(process.env.OPENAI_MAX_RETRIES || '3');
    this.timeout = parseInt(process.env.OPENAI_TIMEOUT || '30000');
  }

  // ストリーミング用のchatCompletion（新規追加）
  async* createChatCompletionStream(params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): AsyncGenerator<string, void, unknown> {
    const { messages, model = 'gpt-4o-mini', maxTokens = 1000, temperature = 0.7 } = params;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              
              if (jsonStr === '[DONE]') {
                return;
              }

              try {
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  yield content;
                }
              } catch (parseError) {
                console.warn('JSON parse error in stream:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('OpenAI Streaming Error:', error);
      throw error;
    }
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.apiKey) {
      errors.push('OPENAI_API_KEY is required');
    } else if (!this.apiKey.startsWith('sk-')) {
      errors.push('OPENAI_API_KEY must start with "sk-"');
    }

    if (!this.baseURL) {
      errors.push('OPENAI_BASE_URL is required');
    }

    if (!this.model) {
      errors.push('OPENAI_MODEL is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async generateResponse(
    messages: ChatCompletionMessageParam[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<OpenAIResponse> {
    const config = this.validateConfig();
    if (!config.isValid) {
      throw new Error(`OpenAI configuration invalid: ${config.errors.join(', ')}`);
    }

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: options?.stream ?? false,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest('/chat/completions', requestBody);
        
        if (!response.ok) {
          const errorData: OpenAIError = await response.json();
          throw new OpenAIAPIError(
            errorData.error.message,
            response.status,
            errorData.error.type,
            errorData.error.code
          );
        }

        const data: OpenAIResponse = await response.json();
        
        // Validate response structure
        if (!this.isValidOpenAIResponse(data)) {
          throw new Error('Invalid response structure from OpenAI API');
        }

        return data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof OpenAIAPIError) {
          if (error.status === 401 || error.status === 400) {
            throw error; // Don't retry authentication or bad request errors
          }
          
          if (error.status === 429) {
            // Rate limit - wait before retry
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            await this.sleep(waitTime);
            continue;
          }
        }

        // Wait before retry for other errors
        if (attempt < this.maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await this.sleep(waitTime);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private async makeRequest(endpoint: string, body: any): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'ai-chat-app/1.0.0',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private isValidOpenAIResponse(data: any): data is OpenAIResponse {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.object === 'string' &&
      typeof data.created === 'number' &&
      typeof data.model === 'string' &&
      Array.isArray(data.choices) &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === 'string' &&
      data.usage &&
      typeof data.usage.total_tokens === 'number'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method for testing
  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await this.generateResponse([
        { role: 'user', content: 'Hello, this is a test message.' }
      ], {
        temperature: 0,
        maxTokens: 10
      });

      const latency = Date.now() - startTime;
      
      return {
        success: true,
        latency
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get current usage statistics
  getUsageStats(): {
    model: string;
    maxRetries: number;
    timeout: number;
    hasValidKey: boolean;
  } {
    return {
      model: this.model,
      maxRetries: this.maxRetries,
      timeout: this.timeout,
      hasValidKey: !!this.apiKey && this.apiKey.startsWith('sk-')
    };
  }
}

export class OpenAIAPIError extends Error {
  public status: number;
  public type: string;
  public code?: string;

  constructor(message: string, status: number, type: string, code?: string) {
    super(message);
    this.name = 'OpenAIAPIError';
    this.status = status;
    this.type = type;
    this.code = code;
  }

  public isRateLimitError(): boolean {
    return this.status === 429;
  }

  public isAuthenticationError(): boolean {
    return this.status === 401;
  }

  public isQuotaExceededError(): boolean {
    return this.type === 'insufficient_quota';
  }

  public isTemporaryError(): boolean {
    return this.status >= 500 || this.isRateLimitError();
  }
}

// Singleton instance
export const openaiService = new OpenAIService();