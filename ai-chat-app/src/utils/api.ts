export interface ChatAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface StreamingChatAPIResponse {
  content: string;
  done: boolean;
}

export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch('/api/chat/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data: ChatAPIResponse = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'AI応答の生成に失敗しました');
  }

  return data.message || '';
}

export async function* sendChatMessageStream(message: string): AsyncGenerator<string, void, unknown> {
  const response = await fetch('/api/chat/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message,
      stream: true 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('レスポンスボディが存在しません');
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
            const data: StreamingChatAPIResponse = JSON.parse(jsonStr);
            if (data.content) {
              yield data.content;
            }
            if (data.done) {
              return;
            }
          } catch (parseError) {
            console.warn('JSON parse error:', parseError);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}