import { test, expect, Page } from '@playwright/test';

test.describe('SSR/CSR Mismatch Detection', () => {
  let hydrationErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    hydrationErrors = [];

    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' || type === 'warning') {
        if (text.includes('Hydration') || 
            text.includes('server') || 
            text.includes('mismatch') ||
            text.includes('Warning: Text content did not match') ||
            text.includes('Warning: Expected server HTML to contain')) {
          hydrationErrors.push(`[${type.toUpperCase()}] ${text}`);
        }
      }
    });

    // Capture unhandled errors
    page.on('pageerror', error => {
      if (error.message.includes('Hydration') || error.message.includes('mismatch')) {
        hydrationErrors.push(`[UNCAUGHT] ${error.message}`);
      }
    });
  });

  test('should compare initial server HTML with hydrated HTML', async ({ page }) => {
    // Navigate to page and capture server-rendered HTML before hydration
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Get HTML immediately after DOM content loaded (before React hydration)
    const serverHTML = await page.evaluate(() => {
      return document.documentElement.innerHTML;
    });

    // Wait for full hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get HTML after hydration
    const clientHTML = await page.evaluate(() => {
      return document.documentElement.innerHTML;
    });

    // Compare lengths as a basic check
    const serverLength = serverHTML.length;
    const clientLength = clientHTML.length;
    
    console.log(`Server HTML length: ${serverLength}`);
    console.log(`Client HTML length: ${clientLength}`);
    
    // Allow for minor differences due to hydration (React attributes, etc.)
    const lengthDifference = Math.abs(serverLength - clientLength);
    const maxAllowedDifference = Math.max(serverLength * 0.1, 1000); // 10% or 1KB
    
    expect(lengthDifference).toBeLessThan(maxAllowedDifference);
    expect(hydrationErrors).toHaveLength(0);
  });

  test('should detect timestamp/date mismatch between SSR and CSR', async ({ page }) => {
    // Create a test component with timestamp issues
    await page.goto('/');
    
    // Inject a component that might cause timestamp mismatches
    await page.evaluate(() => {
      // This simulates a common hydration error pattern
      const div = document.createElement('div');
      div.id = 'timestamp-test';
      div.innerHTML = `Server time: ${new Date().toISOString()}`;
      document.body.appendChild(div);
    });

    await page.waitForTimeout(1000);
    
    // Check for timestamp-related hydration errors
    const timestampErrors = hydrationErrors.filter(error => 
      error.includes('timestamp') || 
      error.includes('Date') || 
      error.includes('time') ||
      error.includes('ISO')
    );

    // For this specific test, we're checking our error detection works
    console.log('Timestamp-related hydration errors:', timestampErrors);
    
    // The main page should not have timestamp hydration errors
    const pageHydrationErrors = hydrationErrors.filter(error => 
      !error.includes('timestamp-test')
    );
    
    expect(pageHydrationErrors).toHaveLength(0);
  });

  test('should validate localStorage/sessionStorage dependent content', async ({ page }) => {
    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/');
    
    // Get initial state without storage
    await page.waitForLoadState('domcontentloaded');
    const initialHTML = await page.content();

    // Add some storage data that might affect rendering
    await page.evaluate(() => {
      localStorage.setItem('ai-chat-messages', JSON.stringify([
        { id: '1', content: 'Test message', role: 'user', timestamp: new Date() }
      ]));
      localStorage.setItem('user-preferences', JSON.stringify({ theme: 'dark' }));
    });

    // Refresh and check for hydration issues
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for storage-related hydration errors
    const storageErrors = hydrationErrors.filter(error => 
      error.includes('localStorage') || 
      error.includes('storage') ||
      error.includes('preferences') ||
      error.includes('messages')
    );

    expect(storageErrors).toHaveLength(0);
    
    if (storageErrors.length > 0) {
      console.log('Storage-related hydration errors:', storageErrors);
    }
  });

  test('should detect conditional rendering mismatches', async ({ page }) => {
    await page.goto('/');
    
    // Wait for hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for conditional rendering that might cause mismatches
    // This includes user-agent detection, feature detection, etc.
    const conditionalErrors = hydrationErrors.filter(error => 
      error.includes('condition') ||
      error.includes('undefined') ||
      error.includes('null') ||
      error.includes('boolean')
    );

    expect(conditionalErrors).toHaveLength(0);
  });

  test('should validate dynamic imports and code splitting', async ({ page }) => {
    await page.goto('/');
    
    // Wait for all chunks to load
    await page.waitForLoadState('networkidle');
    
    // Interact with elements that might trigger dynamic imports
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Click buttons that might load dynamic components
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        await buttons.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    // Check for dynamic import related hydration errors
    const dynamicImportErrors = hydrationErrors.filter(error => 
      error.includes('chunk') ||
      error.includes('dynamic') ||
      error.includes('lazy') ||
      error.includes('Suspense')
    );

    expect(dynamicImportErrors).toHaveLength(0);
  });

  test('should check for CSS-in-JS hydration mismatches', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for CSS-in-JS related hydration issues
    const cssInJsErrors = hydrationErrors.filter(error => 
      error.includes('styled') ||
      error.includes('emotion') ||
      error.includes('css') ||
      error.includes('style') ||
      error.includes('class')
    );

    expect(cssInJsErrors).toHaveLength(0);
  });

  test('should validate environment variable dependent rendering', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for environment-dependent rendering issues
    const envErrors = hydrationErrors.filter(error => 
      error.includes('NODE_ENV') ||
      error.includes('process.env') ||
      error.includes('development') ||
      error.includes('production')
    );

    expect(envErrors).toHaveLength(0);
  });

  test('should detect random number/UUID generation mismatches', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for random generation related hydration issues
    const randomErrors = hydrationErrors.filter(error => 
      error.includes('random') ||
      error.includes('uuid') ||
      error.includes('Math.random') ||
      error.includes('crypto.randomUUID')
    );

    expect(randomErrors).toHaveLength(0);
  });

  test('should validate server vs client rendering of user agents', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for user-agent dependent rendering issues
    const userAgentErrors = hydrationErrors.filter(error => 
      error.includes('userAgent') ||
      error.includes('navigator') ||
      error.includes('mobile') ||
      error.includes('desktop')
    );

    expect(userAgentErrors).toHaveLength(0);
  });

  test('should perform comprehensive HTML diff analysis', async ({ page }) => {
    // Navigate and capture HTML at different stages
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Capture HTML just after DOM ready (server-rendered)
    const serverHTML = await page.evaluate(() => {
      // Remove script tags and other dynamic content for comparison
      const clone = document.cloneNode(true) as Document;
      const scripts = clone.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      // Remove React dev attributes that change between server and client
      const elements = clone.querySelectorAll('*');
      elements.forEach(el => {
        el.removeAttribute('data-reactroot');
        el.removeAttribute('data-react-helmet');
      });
      
      return clone.documentElement.innerHTML;
    });

    // Wait for full hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Capture HTML after hydration
    const clientHTML = await page.evaluate(() => {
      const clone = document.cloneNode(true) as Document;
      const scripts = clone.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      const elements = clone.querySelectorAll('*');
      elements.forEach(el => {
        el.removeAttribute('data-reactroot');
        el.removeAttribute('data-react-helmet');
      });
      
      return clone.documentElement.innerHTML;
    });

    // Calculate similarity
    const similarity = calculateStringSimilarity(serverHTML, clientHTML);
    
    console.log(`HTML similarity: ${(similarity * 100).toFixed(2)}%`);
    console.log(`Server HTML length: ${serverHTML.length}`);
    console.log(`Client HTML length: ${clientHTML.length}`);
    
    // Expect high similarity (> 95%)
    expect(similarity).toBeGreaterThan(0.95);
    
    // Should have no hydration errors
    expect(hydrationErrors).toHaveLength(0);
    
    if (similarity < 0.95) {
      console.log('Low similarity detected. First 500 chars of each:');
      console.log('Server HTML:', serverHTML.substring(0, 500));
      console.log('Client HTML:', clientHTML.substring(0, 500));
    }
  });

  // Helper function to calculate string similarity
  function calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  function levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
});