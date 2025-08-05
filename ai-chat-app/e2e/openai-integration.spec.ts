import { test, expect, Page } from '@playwright/test';

test.describe('OpenAI API Integration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mock API Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Mock OpenAI API responses for consistent testing
      await page.route('**/api/chat/completions', async route => {
        const request = route.request();
        const requestBody = JSON.parse(request.postData() || '{}');
        
        // Simulate different responses based on user input
        let mockResponse = 'This is a mock response from OpenAI API.';
        
        if (requestBody.messages && requestBody.messages.length > 0) {
          const lastMessage = requestBody.messages[requestBody.messages.length - 1];
          const userContent = lastMessage.content.toLowerCase();
          
          if (userContent.includes('hello')) {
            mockResponse = 'Hello! How can I assist you today?';
          } else if (userContent.includes('error')) {
            // Simulate an error response
            await route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({
                error: {
                  message: 'Internal server error',
                  type: 'server_error'
                }
              })
            });
            return;
          } else if (userContent.includes('rate limit')) {
            // Simulate rate limit error
            await route.fulfill({
              status: 429,
              contentType: 'application/json',
              body: JSON.stringify({
                error: {
                  message: 'Rate limit exceeded',
                  type: 'rate_limit_exceeded'
                }
              })
            });
            return;
          } else if (userContent.includes('long response')) {
            mockResponse = 'This is a very long response that simulates a detailed AI explanation. '.repeat(20);
          }
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'chatcmpl-test123',
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'gpt-3.5-turbo',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: mockResponse
                },
                finish_reason: 'stop'
              }
            ],
            usage: {
              prompt_tokens: 15,
              completion_tokens: mockResponse.length / 4,
              total_tokens: 15 + Math.floor(mockResponse.length / 4)
            }
          })
        });
      });
    });

    test('should send message and receive AI response', async ({ page }) => {
      // Find the message input and send button
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      // Type and send a message
      await messageInput.fill('Hello, AI assistant!');
      await sendButton.click();
      
      // Wait for user message to appear
      await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Hello, AI assistant!');
      
      // Wait for AI response to appear
      await expect(page.locator('[data-testid="ai-message"]').last()).toContainText('Hello! How can I assist you today?', { timeout: 10000 });
      
      // Verify loading state disappears
      await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
    });

    test('should handle multiple consecutive messages', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      // Send first message
      await messageInput.fill('First message');
      await sendButton.click();
      await expect(page.locator('[data-testid="ai-message"]').first()).toBeVisible({ timeout: 10000 });
      
      // Send second message
      await messageInput.fill('Second message');
      await sendButton.click();
      
      // Verify both messages and responses are present
      const userMessages = page.locator('[data-testid="user-message"]');
      const aiMessages = page.locator('[data-testid="ai-message"]');
      
      await expect(userMessages).toHaveCount(2);
      await expect(aiMessages).toHaveCount(2);
      
      // Verify order is maintained
      await expect(userMessages.first()).toContainText('First message');
      await expect(userMessages.last()).toContainText('Second message');
    });

    test('should display typing indicator during AI response', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      const typingIndicator = page.locator('[data-testid="typing-indicator"]');
      
      await messageInput.fill('Test typing indicator');
      await sendButton.click();
      
      // Typing indicator should appear
      await expect(typingIndicator).toBeVisible();
      
      // Wait for response and verify typing indicator disappears
      await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });
      await expect(typingIndicator).not.toBeVisible();
    });

    test('should handle long AI responses properly', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      await messageInput.fill('Give me a long response');
      await sendButton.click();
      
      // Wait for the long response
      const aiMessage = page.locator('[data-testid="ai-message"]').last();
      await expect(aiMessage).toBeVisible({ timeout: 15000 });
      
      // Verify the message contains the expected repeated text
      await expect(aiMessage).toContainText('This is a very long response');
      
      // Verify the message is fully displayed (check character count approximately)
      const messageText = await aiMessage.textContent();
      expect(messageText?.length).toBeGreaterThan(500); // Long response should be substantial
    });

    test('should persist chat history after page refresh', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      // Send a message
      await messageInput.fill('Remember this message');
      await sendButton.click();
      
      // Wait for response
      await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify message history is preserved
      await expect(page.locator('[data-testid="user-message"]')).toContainText('Remember this message');
      await expect(page.locator('[data-testid="ai-message"]')).toBeVisible();
    });

    test('should clear chat history when clear button is clicked', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      const clearButton = page.locator('[data-testid="clear-button"]');
      
      // Send a message
      await messageInput.fill('This will be cleared');
      await sendButton.click();
      await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });
      
      // Clear chat
      await clearButton.click();
      
      // Verify messages are cleared
      await expect(page.locator('[data-testid="user-message"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(0);
    });
  });

  test.describe('Error Handling Tests', () => {
    test('should handle API server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/chat/completions', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Internal server error',
              type: 'server_error'
            }
          })
        });
      });

      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      await messageInput.fill('This should cause an error');
      await sendButton.click();
      
      // Wait for user message to appear
      await expect(page.locator('[data-testid="user-message"]').last()).toContainText('This should cause an error');
      
      // Check for error message display
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await expect(errorMessage).toContainText(/error|failed|unable/i);
      
      // Verify loading state stops
      await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
    });

    test('should handle rate limit errors', async ({ page }) => {
      // Mock rate limit error
      await page.route('**/api/chat/completions', route => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Rate limit exceeded. Please try again later.',
              type: 'rate_limit_exceeded'
            }
          })
        });
      });

      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      await messageInput.fill('Rate limit test');
      await sendButton.click();
      
      // Check for rate limit specific error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await expect(errorMessage).toContainText(/rate limit|try again/i);
    });

    test('should handle network connectivity issues', async ({ page }) => {
      // Mock network error
      await page.route('**/api/chat/completions', route => {
        route.abort('failed');
      });

      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      await messageInput.fill('Network error test');
      await sendButton.click();
      
      // Check for network error handling
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should allow retry after error', async ({ page }) => {
      let requestCount = 0;
      
      // Mock: fail first request, succeed second
      await page.route('**/api/chat/completions', route => {
        requestCount++;
        
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                message: 'Server error',
                type: 'server_error'
              }
            })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'chatcmpl-retry123',
              object: 'chat.completion',
              created: Math.floor(Date.now() / 1000),
              model: 'gpt-3.5-turbo',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Success after retry!'
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 }
            })
          });
        }
      });

      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      await messageInput.fill('Retry test');
      await sendButton.click();
      
      // Wait for error to appear
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
      
      // Try sending again
      await messageInput.fill('Retry successful');
      await sendButton.click();
      
      // This time it should succeed
      await expect(page.locator('[data-testid="ai-message"]').last()).toContainText('Success after retry!', { timeout: 10000 });
    });
  });

  test.describe('Performance and Load Tests', () => {
    test('should handle rapid message sending', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      // Send multiple messages quickly
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      
      for (const message of messages) {
        await messageInput.fill(message);
        await sendButton.click();
        await page.waitForTimeout(100); // Brief pause between messages
      }
      
      // Wait for all responses
      await expect(page.locator('[data-testid="user-message"]')).toHaveCount(3, { timeout: 15000 });
      await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(3, { timeout: 15000 });
      
      // Verify no messages are lost or duplicated
      const userMessages = page.locator('[data-testid="user-message"]');
      await expect(userMessages.nth(0)).toContainText('Message 1');
      await expect(userMessages.nth(1)).toContainText('Message 2');
      await expect(userMessages.nth(2)).toContainText('Message 3');
    });

    test('should measure response time', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      const startTime = Date.now();
      
      await messageInput.fill('Response time test');
      await sendButton.click();
      
      // Wait for AI response
      await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Response should be reasonably fast (less than 5 seconds for mock)
      expect(responseTime).toBeLessThan(5000);
      
      console.log(`AI response time: ${responseTime}ms`);
    });

    test('should handle long conversations', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      // Send 10 messages to simulate a long conversation
      for (let i = 1; i <= 10; i++) {
        await messageInput.fill(`Message ${i} in long conversation`);
        await sendButton.click();
        
        // Wait for each response before sending next
        await expect(page.locator('[data-testid="ai-message"]').nth(i - 1)).toBeVisible({ timeout: 10000 });
      }
      
      // Verify all messages are present and conversation flows correctly
      await expect(page.locator('[data-testid="user-message"]')).toHaveCount(10);
      await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(10);
      
      // Check scroll behavior - should scroll to latest message
      const lastMessage = page.locator('[data-testid="ai-message"]').last();
      await expect(lastMessage).toBeInViewport();
    });
  });

  test.describe('Accessibility and UX Tests', () => {
    test('should be keyboard accessible', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      
      // Focus should start on message input
      await page.keyboard.press('Tab');
      await expect(messageInput).toBeFocused();
      
      // Should be able to type and send with Enter
      await page.keyboard.type('Keyboard test message');
      await page.keyboard.press('Enter');
      
      // Wait for response
      await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });
      
      // Should be able to navigate to clear button
      await page.keyboard.press('Tab'); // Focus send button
      await page.keyboard.press('Tab'); // Focus clear button
      await expect(page.locator('[data-testid="clear-button"]')).toBeFocused();
    });

    test('should provide appropriate ARIA labels and roles', async ({ page }) => {
      // Check for proper ARIA labeling
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      const chatContainer = page.locator('[data-testid="chat-container"]');
      
      await expect(messageInput).toHaveAttribute('aria-label', /message|input/i);
      await expect(sendButton).toHaveAttribute('aria-label', /send/i);
      await expect(chatContainer).toHaveAttribute('role', /main|region/);
    });

    test('should handle screen reader announcements', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      
      await messageInput.fill('Screen reader test');
      await sendButton.click();
      
      // Check for aria-live regions for dynamic content
      const liveRegion = page.locator('[aria-live]');
      await expect(liveRegion).toBeVisible();
      
      // Wait for AI response and check if it's announced
      await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });
    });
  });
});