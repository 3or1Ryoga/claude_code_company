import { test, expect } from '@playwright/test';

test.describe('AI Chat App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the chat interface', async ({ page }) => {
    // Check if main chat container is visible
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Check if message input is present
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    // Check if send button is present
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
  });

  test('should send a message and receive AI response', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Type a message
    await messageInput.fill('Hello, AI assistant!');
    
    // Send the message
    await sendButton.click();
    
    // Check if user message appears
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Hello, AI assistant!');
    
    // Check if loading indicator appears
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Wait for AI response (with longer timeout for simulation)
    await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 10000 });
    
    // Check if AI response contains expected content
    await expect(page.locator('[data-testid="ai-message"]').last()).toContainText('Hello, AI assistant!');
    
    // Check if loading indicator disappears
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
  });

  test('should not send empty messages', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Try to send empty message
    await sendButton.click();
    
    // Check that no message was added
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(0);
    
    // Try to send whitespace only
    await messageInput.fill('   ');
    await sendButton.click();
    
    // Check that no message was added
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(0);
  });

  test('should clear chat history', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const clearButton = page.locator('[data-testid="clear-button"]');
    
    // Send a message first
    await messageInput.fill('Test message');
    await sendButton.click();
    
    // Wait for user message to appear
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(1);
    
    // Clear chat
    await clearButton.click();
    
    // Check that messages are cleared
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(0);
  });

  test('should handle multiple messages', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Send first message
    await messageInput.fill('First message');
    await sendButton.click();
    
    // Wait for first response
    await expect(page.locator('[data-testid="ai-message"]').first()).toBeVisible({ timeout: 10000 });
    
    // Send second message
    await messageInput.fill('Second message');
    await sendButton.click();
    
    // Check that we have 2 user messages and at least 1 AI message
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="ai-message"]')).toHaveCountGreaterThanOrEqual(1);
  });

  test('should maintain message order', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Send a message
    await messageInput.fill('Test message for order');
    await sendButton.click();
    
    // Wait for complete conversation
    await expect(page.locator('[data-testid="ai-message"]').first()).toBeVisible({ timeout: 10000 });
    
    // Check message order - user message should come before AI message
    const messages = page.locator('[data-testid*="message"]');
    const firstMessage = messages.first();
    const secondMessage = messages.nth(1);
    
    await expect(firstMessage).toHaveAttribute('data-testid', 'user-message');
    await expect(secondMessage).toHaveAttribute('data-testid', 'ai-message');
  });

  test('should persist messages on page reload', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Send a message
    await messageInput.fill('Persistent message');
    await sendButton.click();
    
    // Wait for user message to appear
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(1);
    
    // Reload the page
    await page.reload();
    
    // Check that message persists
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="user-message"]')).toContainText('Persistent message');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if chat container is still visible
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Check if input is accessible
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    // Test sending a message on mobile
    await page.locator('[data-testid="message-input"]').fill('Mobile test');
    await page.locator('[data-testid="send-button"]').click();
    
    // Check if message appears correctly
    await expect(page.locator('[data-testid="user-message"]')).toContainText('Mobile test');
  });
});