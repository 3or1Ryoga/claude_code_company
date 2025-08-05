import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(), 
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return stored value from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('"stored-value"');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('should store value in localStorage when setValue is called', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
  });

  it('should handle function updates correctly', () => {
    localStorageMock.getItem.mockReturnValue('5');

    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev: number) => prev + 1);
    });

    expect(result.current[0]).toBe(6); // 5 + 1
    expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', '6');
  });

  it('should clear value and remove from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('"some-value"');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[2](); // clearValue
    });

    expect(result.current[0]).toBe('initial');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('should handle localStorage getItem errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error reading localStorage key "test-key":',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle localStorage setItem errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage quota exceeded');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value'); // State should still update
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error setting localStorage key "test-key":',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle localStorage removeItem errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('"value"');
    localStorageMock.removeItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[2](); // clearValue
    });

    expect(result.current[0]).toBe('initial'); // State should still update
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error clearing localStorage key "test-key":',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should work with complex objects', () => {
    const complexObject = { id: 1, name: 'test', items: [1, 2, 3] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject));

    const { result } = renderHook(() => useLocalStorage('complex', {}));

    expect(result.current[0]).toEqual(complexObject);

    const updatedObject = { ...complexObject, name: 'updated' };
    act(() => {
      result.current[1](updatedObject);
    });

    expect(result.current[0]).toEqual(updatedObject);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'complex',
      JSON.stringify(updatedObject)
    );
  });

  it('should handle invalid JSON gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json{');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});