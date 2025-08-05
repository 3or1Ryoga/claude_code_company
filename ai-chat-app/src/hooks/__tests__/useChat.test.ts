import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';

// Mock useLocalStorage
jest.mock('../useLocalStorage', () => ({
  useLocalStorage: jest.fn(() => [
    [], // initial messages
    jest.fn(), // setMessages
    jest.fn(), // clearStoredMessages
  ]),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid'),
  },
});

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty messages and loading false', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should send a message and receive AI response', async () => {
    const mockSetMessages = jest.fn();
    const { useLocalStorage } = require('../useLocalStorage');
    useLocalStorage.mockReturnValue([[], mockSetMessages, jest.fn()]);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('Hello AI');
    });

    // Check that loading is set to true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    // Check that user message is added
    expect(mockSetMessages).toHaveBeenCalledWith(expect.any(Function));

    // Fast-forward time to complete the async operation
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve(); // Allow promise to resolve
    });

    // Check that loading is set to false after response
    expect(result.current.isLoading).toBe(false);
  });

  it('should not send empty messages', async () => {
    const mockSetMessages = jest.fn();
    const { useLocalStorage } = require('../useLocalStorage');
    useLocalStorage.mockReturnValue([[], mockSetMessages, jest.fn()]);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('   '); // Empty/whitespace message
    });

    expect(mockSetMessages).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear chat messages', () => {
    const mockSetMessages = jest.fn();
    const mockClearStoredMessages = jest.fn();
    const { useLocalStorage } = require('../useLocalStorage');
    useLocalStorage.mockReturnValue([[], mockSetMessages, mockClearStoredMessages]);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.clearChat();
    });

    expect(mockSetMessages).toHaveBeenCalledWith([]);
    expect(mockClearStoredMessages).toHaveBeenCalled();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useChat());

    // Set error first
    act(() => {
      (result.current as any).setError('Test error');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should handle error during message sending', async () => {
    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockSetMessages = jest.fn();
    const { useLocalStorage } = require('../useLocalStorage');
    useLocalStorage.mockReturnValue([[], mockSetMessages, jest.fn()]);

    // Mock a failure in the setTimeout Promise
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((cb, delay) => {
      if (delay > 0) {
        throw new Error('Simulated network error');
      }
      return originalSetTimeout(cb, delay);
    }) as any;

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('Hello');
    });

    expect(result.current.error).toBe('メッセージの送信中にエラーが発生しました。もう一度お試しください。');
    expect(result.current.isLoading).toBe(false);

    // Restore mocks
    global.setTimeout = originalSetTimeout;
    consoleSpy.mockRestore();
  });
});