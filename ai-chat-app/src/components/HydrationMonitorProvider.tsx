'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { hydrationMonitor, HydrationError, HydrationMetrics } from '@/lib/utils/hydration-monitor';

interface HydrationMonitorContextType {
  errors: HydrationError[];
  metrics: HydrationMetrics;
  healthStatus: 'healthy' | 'warning' | 'critical';
  clearErrors: () => void;
  isMonitoring: boolean;
}

const HydrationMonitorContext = createContext<HydrationMonitorContextType | null>(null);

interface HydrationMonitorProviderProps {
  children: ReactNode;
  enabled?: boolean;
  reportingEndpoint?: string;
}

export function HydrationMonitorProvider({ 
  children, 
  enabled = process.env.NODE_ENV === 'development',
  reportingEndpoint 
}: HydrationMonitorProviderProps) {
  const [errors, setErrors] = useState<HydrationError[]>([]);
  const [metrics, setMetrics] = useState<HydrationMetrics>({
    totalErrors: 0,
    errorsByType: {},
    errorsByPage: {}
  });
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Start monitoring
    hydrationMonitor.start();
    setIsMonitoring(true);

    // Update state when errors occur
    const handleHydrationError = (event: CustomEvent<HydrationError>) => {
      setErrors(hydrationMonitor.getErrors());
      setMetrics(hydrationMonitor.getMetrics());
      setHealthStatus(hydrationMonitor.getHealthStatus());
    };

    window.addEventListener('hydration-error', handleHydrationError as EventListener);

    // Periodic health check
    const healthCheckInterval = setInterval(() => {
      setHealthStatus(hydrationMonitor.getHealthStatus());
      setMetrics(hydrationMonitor.getMetrics());
    }, 10000); // Every 10 seconds

    return () => {
      window.removeEventListener('hydration-error', handleHydrationError as EventListener);
      clearInterval(healthCheckInterval);
      hydrationMonitor.stop();
      setIsMonitoring(false);
    };
  }, [enabled, reportingEndpoint]);

  const clearErrors = () => {
    hydrationMonitor.clearErrors();
    setErrors([]);
    setMetrics({
      totalErrors: 0,
      errorsByType: {},
      errorsByPage: {}
    });
    setHealthStatus('healthy');
  };

  const contextValue: HydrationMonitorContextType = {
    errors,
    metrics,
    healthStatus,
    clearErrors,
    isMonitoring
  };

  return (
    <HydrationMonitorContext.Provider value={contextValue}>
      {children}
      {enabled && process.env.NODE_ENV === 'development' && (
        <HydrationDebugPanel />
      )}
    </HydrationMonitorContext.Provider>
  );
}

// Debug panel component for development
function HydrationDebugPanel() {
  const context = useContext(HydrationMonitorContext);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!context || !context.isMonitoring) return null;

  const { errors, metrics, healthStatus, clearErrors } = context;

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy': return '#10b981'; // green
      case 'warning': return '#f59e0b'; // yellow  
      case 'critical': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: isExpanded ? '400px' : '200px',
        maxHeight: isExpanded ? '300px' : 'auto',
        overflow: 'auto',
        border: `2px solid ${getStatusColor()}`,
        transition: 'all 0.3s ease'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isExpanded ? '8px' : '0',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor()
            }}
          />
          <span>Hydration Monitor</span>
        </div>
        <span>{isExpanded ? '▾' : '▸'}</span>
      </div>

      {isExpanded && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <div>Status: <span style={{ color: getStatusColor() }}>{healthStatus.toUpperCase()}</span></div>
            <div>Total Errors: {metrics.totalErrors}</div>
            <div>Recent Errors: {errors.filter(e => Date.now() - e.timestamp < 60000).length}</div>
          </div>

          {errors.length > 0 && (
            <>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Recent Errors:</div>
              <div style={{ maxHeight: '120px', overflow: 'auto', marginBottom: '12px' }}>
                {errors.slice(-3).map((error, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '8px',
                      padding: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#fecaca' }}>
                      {error.type.toUpperCase()}
                    </div>
                    <div style={{ marginTop: '2px' }}>
                      {error.message.substring(0, 100)}
                      {error.message.length > 100 && '...'}
                    </div>
                    <div style={{ marginTop: '2px', opacity: 0.7 }}>
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={clearErrors}
              style={{
                padding: '4px 8px',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
            <button
              onClick={() => {
                const report = hydrationMonitor.exportReport();
                console.log('Hydration Report:', report);
                
                // Copy to clipboard if available
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(report);
                  alert('Report copied to clipboard!');
                }
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Export
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Hook to use hydration monitoring context
export function useHydrationMonitor() {
  const context = useContext(HydrationMonitorContext);
  if (!context) {
    throw new Error('useHydrationMonitor must be used within HydrationMonitorProvider');
  }
  return context;
}