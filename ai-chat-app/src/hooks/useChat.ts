import { useState, useCallback, useRef } from 'react';
import { Message } from '@/types/chat';
import { useLocalStorage } from './useLocalStorage';
import { sendChatMessageStream } from '@/utils/api';

const CHAT_STORAGE_KEY = 'ai-chat-messages';

// 決定的なID生成のためのカウンター
let messageIdCounter = 0;

export function useChat() {
  const [messages, setMessages, clearStoredMessages] = useLocalStorage<Message[]>(CHAT_STORAGE_KEY, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const initTimeRef = useRef<number>(Date.now());

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const now = Date.now();
    const userMessage: Message = {
      id: `msg-${initTimeRef.current}-${++messageIdCounter}`,
      content: content.trim(),
      role: 'user',
      timestamp: new Date(now),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // AI応答メッセージを空の状態で作成
      const aiMessageId = `msg-${initTimeRef.current}-${++messageIdCounter}`;
      const aiMessage: Message = {
        id: aiMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      // AIメッセージを追加してストリーミング状態を開始
      setMessages(prev => [...prev, aiMessage]);
      setStreamingMessageId(aiMessageId);

      // APIからストリーミング応答を取得
      const stream = sendChatMessageStream(content.trim());
      let fullContent = '';

      for await (const chunk of stream) {
        fullContent += chunk;
        
        // メッセージを更新
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: fullContent, timestamp: new Date() }
            : msg
        ));
      }

      // ストリーミング完了
      setStreamingMessageId(null);
    } catch (err) {
      setStreamingMessageId(null);
      const errorMessage = err instanceof Error ? err.message : 'メッセージの送信中にエラーが発生しました。もう一度お試しください。';
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setMessages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    clearStoredMessages();
    setError(null);
    setStreamingMessageId(null);
  }, [setMessages, clearStoredMessages]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    streamingMessageId,
    sendMessage,
    clearChat,
    clearError,
  };
}