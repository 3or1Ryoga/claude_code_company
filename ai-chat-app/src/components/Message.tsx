import { useState, useEffect } from 'react';
import { Message as MessageType } from '@/types/chat';

interface MessageProps {
  message: MessageType;
  isStreaming?: boolean;
}

export function Message({ message, isStreaming = false }: MessageProps) {
  const isUser = message.role === 'user';
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    // クライアントサイドでのみタイムスタンプを設定してHydrationエラーを回避
    setTimestamp(new Date(message.timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }));
  }, [message.timestamp]);

  return (
    <div
      className={`flex w-full mb-4 animate-in slide-in-from-bottom-2 duration-200 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white ml-4'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-4'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-5 bg-current animate-pulse ml-1" />
          )}
        </div>
        <div
          className={`text-xs mt-2 ${
            isUser 
              ? 'text-blue-100' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {timestamp}
        </div>
      </div>
    </div>
  );
}