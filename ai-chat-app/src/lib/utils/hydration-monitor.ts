// Hydration Error Monitoring System
// ハイドレーションエラー監視システム

interface HydrationError {
  type: 'hydration' | 'ssr-csr-mismatch' | 'console-error';
  message: string;
  timestamp: number;
  url: string;
  userAgent: string;
  stackTrace?: string;
  elementInfo?: {
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
  };
}

interface HydrationMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByPage: Record<string, number>;
  lastError?: HydrationError;
}

class HydrationMonitor {
  private errors: HydrationError[] = [];
  private metrics: HydrationMetrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsByPage: {}
  };
  private isMonitoring = false;
  private maxErrors = 100; // Maximum errors to store
  private reportingEndpoint?: string;

  constructor(options?: {
    maxErrors?: number;
    reportingEndpoint?: string;
    autoStart?: boolean;
  }) {
    if (options?.maxErrors) this.maxErrors = options.maxErrors;
    if (options?.reportingEndpoint) this.reportingEndpoint = options.reportingEndpoint;
    
    if (options?.autoStart !== false) {
      this.start();
    }
  }

  start() {
    if (typeof window === 'undefined' || this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupConsoleErrorListener();
    this.setupReactErrorBoundary();
    this.setupDOMObserver();
    this.setupPerformanceObserver();
    
    console.log('[HydrationMonitor] Started monitoring hydration errors');
  }

  stop() {
    this.isMonitoring = false;
    console.log('[HydrationMonitor] Stopped monitoring');
  }

  private setupConsoleErrorListener() {
    // Override console.error to catch React hydration errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      if (this.isHydrationError(message)) {
        this.recordError({
          type: 'console-error',
          message,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          stackTrace: new Error().stack
        });
      }
      
      // Call original console.error
      originalError.apply(console, args);
    };

    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      const message = event.message || event.error?.message || 'Unknown error';
      
      if (this.isHydrationError(message)) {
        this.recordError({
          type: 'hydration',
          message,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          stackTrace: event.error?.stack
        });
      }
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason?.message || String(event.reason);
      
      if (this.isHydrationError(message)) {
        this.recordError({
          type: 'hydration',
          message,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          stackTrace: event.reason?.stack
        });
      }
    });
  }

  private setupReactErrorBoundary() {
    // Monitor React Error Boundary errors
    const originalComponentDidCatch = React.Component.prototype.componentDidCatch;
    
    if (originalComponentDidCatch) {
      React.Component.prototype.componentDidCatch = function(error: Error, errorInfo: any) {
        if (this.isHydrationError && this.isHydrationError(error.message)) {
          this.recordError({
            type: 'hydration',
            message: error.message,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            stackTrace: error.stack
          });
        }
        
        return originalComponentDidCatch.call(this, error, errorInfo);
      };
    }
  }

  private setupDOMObserver() {
    // Observe DOM mutations that might indicate hydration mismatches
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // Look for suspicious DOM changes during hydration
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Check for elements that might indicate hydration issues
                if (this.isSuspiciousElement(element)) {
                  this.recordError({
                    type: 'ssr-csr-mismatch',
                    message: `Suspicious DOM mutation detected: ${element.tagName}`,
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    elementInfo: {
                      tagName: element.tagName,
                      id: element.id || undefined,
                      className: element.className || undefined,
                      textContent: element.textContent?.substring(0, 100) || undefined
                    }
                  });
                }
              }
            });
          }
        });
      });

      // Start observing after a short delay to allow initial hydration
      setTimeout(() => {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeOldValue: true
        });
      }, 1000);
    }
  }

  private setupPerformanceObserver() {
    // Monitor performance entries for hydration-related metrics
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            // Look for long tasks that might indicate hydration issues
            if (entry.entryType === 'longtask' && entry.duration > 100) {
              console.warn('[HydrationMonitor] Long task detected during hydration:', entry);
            }
          });
        });

        observer.observe({ entryTypes: ['longtask', 'measure'] });
      } catch (error) {
        console.warn('[HydrationMonitor] Performance observer not supported');
      }
    }
  }

  private isHydrationError(message: string): boolean {
    const hydrationKeywords = [
      'Hydration',
      'hydration',
      'server rendered result does not match',
      'Warning: Text content did not match',
      'Warning: Expected server HTML to contain',
      'hydration failed',
      'server-side rendering',
      'ssr',
      'client-side rendering',
      'csr'
    ];

    return hydrationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private isSuspiciousElement(element: Element): boolean {
    // Check for elements that commonly cause hydration issues
    const suspiciousPatterns = [
      /timestamp/i,
      /date/i,
      /random/i,
      /uuid/i,
      /client-only/i
    ];

    const text = element.textContent || '';
    const className = element.className || '';
    const id = element.id || '';

    return suspiciousPatterns.some(pattern => 
      pattern.test(text) || pattern.test(className) || pattern.test(id)
    );
  }

  private recordError(error: HydrationError) {
    // Add to errors array
    this.errors.push(error);
    
    // Trim errors array if it exceeds max size
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Update metrics
    this.metrics.totalErrors++;
    this.metrics.errorsByType[error.type] = (this.metrics.errorsByType[error.type] || 0) + 1;
    this.metrics.errorsByPage[error.url] = (this.metrics.errorsByPage[error.url] || 0) + 1;
    this.metrics.lastError = error;

    // Log error locally
    console.error('[HydrationMonitor] Hydration error detected:', error);

    // Report to external service if configured
    if (this.reportingEndpoint) {
      this.reportError(error);
    }

    // Trigger custom event for application-level handling
    window.dispatchEvent(new CustomEvent('hydration-error', { detail: error }));
  }

  private async reportError(error: HydrationError) {
    try {
      await fetch(this.reportingEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...error,
          projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
          environment: process.env.NODE_ENV
        })
      });
    } catch (reportingError) {
      console.error('[HydrationMonitor] Failed to report error:', reportingError);
    }
  }

  // Public API methods
  getErrors(): HydrationError[] {
    return [...this.errors];
  }

  getMetrics(): HydrationMetrics {
    return { ...this.metrics };
  }

  clearErrors() {
    this.errors = [];
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      errorsByPage: {}
    };
  }

  exportReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      recentErrors: this.errors.slice(-10) // Last 10 errors
    };

    return JSON.stringify(report, null, 2);
  }

  // Check current hydration health
  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const recentErrors = this.errors.filter(
      error => Date.now() - error.timestamp < 60000 // Last minute
    );

    if (recentErrors.length === 0) return 'healthy';
    if (recentErrors.length < 3) return 'warning';
    return 'critical';
  }
}

// Utility function to detect hydration mismatches in development
export function detectHydrationMismatch(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    let hasHydrationError = false;
    
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('Hydration') || message.includes('hydration')) {
        hasHydrationError = true;
      }
      originalError.apply(console, args);
    };

    // Check after React has had time to hydrate
    setTimeout(() => {
      console.error = originalError;
      resolve(hasHydrationError);
    }, 3000);
  });
}

// Create singleton instance
export const hydrationMonitor = new HydrationMonitor();

// Export types for TypeScript usage
export type { HydrationError, HydrationMetrics };
export default HydrationMonitor;