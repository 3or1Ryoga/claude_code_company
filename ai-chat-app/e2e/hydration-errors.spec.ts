import { test, expect, Page } from '@playwright/test';

test.describe('Hydration Error Detection', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error arrays
    consoleErrors = [];
    consoleWarnings = [];

    // Listen for console errors and warnings
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Listen for uncaught exceptions
    page.on('pageerror', error => {
      consoleErrors.push(`Uncaught exception: ${error.message}`);
    });
  });

  test('should not have hydration errors on initial page load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load and hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for hydration
    
    // Check for hydration-specific errors
    const hydrationErrors = consoleErrors.filter(error => 
      error.includes('Hydration') || 
      error.includes('hydration') ||
      error.includes('server') ||
      error.includes('mismatch') ||
      error.includes('Warning: Text content did not match') ||
      error.includes('Warning: Expected server HTML to contain')
    );

    expect(hydrationErrors).toHaveLength(0);
    
    if (hydrationErrors.length > 0) {
      console.log('Hydration errors detected:', hydrationErrors);
    }
  });

  test('should detect SSR/CSR timestamp mismatches', async ({ page }) => {
    // Navigate to a page that might have dynamic timestamps
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Check for timestamp-related hydration issues
    const timestampErrors = consoleErrors.filter(error => 
      error.includes('timestamp') ||
      error.includes('Date') ||
      error.includes('time') ||
      error.toLowerCase().includes('hydration')
    );

    // If we have timestamp-related components, they should not cause hydration errors
    if (timestampErrors.length > 0) {
      console.log('Potential timestamp hydration issues:', timestampErrors);
    }
    
    // This test passes if there are no timestamp-related hydration errors
    expect(timestampErrors.filter(error => error.includes('Hydration'))).toHaveLength(0);
  });

  test('should handle client-only content properly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Look for suppressHydrationWarning-related content
    const clientOnlyContent = page.locator('[data-testid*="client-only"]');
    
    // If client-only content exists, it should not cause hydration errors
    if (await clientOnlyContent.count() > 0) {
      const clientOnlyErrors = consoleErrors.filter(error => 
        error.includes('suppressHydrationWarning') || 
        error.includes('client-only')
      );
      
      expect(clientOnlyErrors).toHaveLength(0);
    }
  });

  test('should validate localStorage dependent components', async ({ page }) => {
    // Clear localStorage first
    await page.evaluate(() => localStorage.clear());
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for components that depend on localStorage to hydrate
    await page.waitForTimeout(2000);
    
    // Check for localStorage-related hydration issues
    const localStorageErrors = consoleErrors.filter(error => 
      error.includes('localStorage') ||
      error.includes('storage') ||
      (error.includes('Hydration') && error.includes('[]'))
    );

    expect(localStorageErrors).toHaveLength(0);
    
    if (localStorageErrors.length > 0) {
      console.log('localStorage hydration issues:', localStorageErrors);
    }
  });

  test('should handle dynamic imports without hydration errors', async ({ page }) => {
    await page.goto('/');
    
    // Wait for all dynamic imports to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for dynamic import related hydration errors
    const dynamicImportErrors = consoleErrors.filter(error => 
      error.includes('chunk') ||
      error.includes('dynamic') ||
      (error.includes('Hydration') && error.includes('Suspense'))
    );

    expect(dynamicImportErrors).toHaveLength(0);
  });

  test('should validate theme switching without hydration errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if theme toggle exists
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    if (await themeToggle.count() > 0) {
      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check for theme-related hydration errors
      const themeErrors = consoleErrors.filter(error => 
        error.includes('theme') ||
        error.includes('dark') ||
        error.includes('light') ||
        (error.includes('Hydration') && error.includes('class'))
      );

      expect(themeErrors).toHaveLength(0);
    }
  });

  test('should check for React DevTools hydration warnings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for React DevTools specific hydration warnings
    const reactDevToolsWarnings = consoleWarnings.filter(warning => 
      warning.includes('React DevTools') ||
      warning.includes('hydration') ||
      warning.includes('server-rendered HTML')
    );

    // React DevTools warnings about hydration should be investigated
    if (reactDevToolsWarnings.length > 0) {
      console.log('React DevTools hydration warnings:', reactDevToolsWarnings);
    }

    // For production, we expect no hydration warnings
    expect(reactDevToolsWarnings).toHaveLength(0);
  });

  test('should detect mismatched HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Get initial HTML before hydration
    const initialHTML = await page.evaluate(() => document.documentElement.outerHTML);
    
    // Wait for hydration to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for structure mismatch errors
    const structureMismatchErrors = consoleErrors.filter(error => 
      error.includes('Warning: Expected server HTML to contain') ||
      error.includes('Warning: Text content did not match') ||
      error.includes('Hydration failed') ||
      error.includes('server rendered result does not match')
    );

    expect(structureMismatchErrors).toHaveLength(0);
    
    if (structureMismatchErrors.length > 0) {
      console.log('HTML structure mismatch errors:', structureMismatchErrors);
      console.log('Initial HTML length:', initialHTML.length);
    }
  });

  test('should validate form state hydration', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for form elements
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      // Wait for form hydration
      await page.waitForTimeout(1000);
      
      // Check for form-related hydration errors
      const formErrors = consoleErrors.filter(error => 
        error.includes('form') ||
        error.includes('input') ||
        error.includes('controlled') ||
        error.includes('uncontrolled') ||
        (error.includes('Hydration') && error.includes('value'))
      );

      expect(formErrors).toHaveLength(0);
      
      if (formErrors.length > 0) {
        console.log('Form hydration errors:', formErrors);
      }
    }
  });

  test('should handle window object access during SSR', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for window/document access errors during SSR
    const ssrErrors = consoleErrors.filter(error => 
      error.includes('window is not defined') ||
      error.includes('document is not defined') ||
      error.includes('ReferenceError: window') ||
      error.includes('ReferenceError: document')
    );

    expect(ssrErrors).toHaveLength(0);
    
    if (ssrErrors.length > 0) {
      console.log('SSR window/document access errors:', ssrErrors);
    }
  });

  // Helper test to capture all console output for debugging
  test('debug: capture all console output', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('\n=== All Console Errors ===');
    consoleErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    
    console.log('\n=== All Console Warnings ===');
    consoleWarnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
    
    // This test always passes - it's just for debugging
    expect(true).toBe(true);
  });
});