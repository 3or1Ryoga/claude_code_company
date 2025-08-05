import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ChatCompletionParams {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  model?: string
  maxTokens?: number
  temperature?: number
}

export class OpenAIService {
  static async createChatCompletion(params: ChatCompletionParams): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: params.model || 'gpt-4',
        messages: params.messages,
        max_tokens: params.maxTokens || 2000,
        temperature: params.temperature || 0.7,
        timeout: 30000 // 30秒タイムアウト
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      return content
    } catch (error) {
      console.error('OpenAI API Error:', error)
      
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key.')
        }
        if (error.status === 403) {
          throw new Error('OpenAI API access forbidden.')
        }
        if (error.status === 500) {
          throw new Error('OpenAI service is temporarily unavailable.')
        }
        throw new Error(`OpenAI API error: ${error.message}`)
      }

      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Request timeout. Please try again.')
      }

      throw new Error('Failed to generate AI response. Please try again.')
    }
  }

  static async* createChatCompletionStream(params: ChatCompletionParams): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await openai.chat.completions.create({
        model: params.model || 'gpt-4',
        messages: params.messages,
        max_tokens: params.maxTokens || 2000,
        temperature: params.temperature || 0.7,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error) {
      throw new Error('Failed to create streaming response')
    }
  }
}