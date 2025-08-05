export function TypingIndicator() {
  return (
    <div className="flex w-full mb-4 justify-start animate-in slide-in-from-bottom-2 duration-200" data-testid="typing-indicator">
      <div className="max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm bg-gray-100 dark:bg-gray-800 mr-4">
        <div className="flex items-center space-x-1">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            AIが入力中
          </div>
          <div className="flex space-x-1 ml-2">
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
            />
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
            />
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}