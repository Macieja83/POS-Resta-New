import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();
    let requestCount = 0;
    let cacheHits = 0;

    // Monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      requestCount++;
      const response = await originalFetch(...args);
      
      // Check if response came from cache
      if (response.headers.get('x-cache') === 'HIT') {
        cacheHits++;
      }
      
      return response;
    };

    // Monitor memory usage
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    // Monitor render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    // Update metrics periodically
    const interval = setInterval(() => {
      const renderTime = performance.now() - startTime;
      const cacheHitRate = requestCount > 0 ? (cacheHits / requestCount) * 100 : 0;
      
      const newMetrics = {
        renderTime,
        memoryUsage: metrics.memoryUsage,
        networkRequests: requestCount,
        cacheHitRate
      };

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
      updateMemoryUsage();
    }, 1000);

    return () => {
      clearInterval(interval);
      observer.disconnect();
      window.fetch = originalFetch;
    };
  }, [enabled, onMetricsUpdate]);

  if (!enabled) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Performance Monitor</div>
      <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
      <div>Memory: {metrics.memoryUsage.toFixed(2)}MB</div>
      <div>Requests: {metrics.networkRequests}</div>
      <div>Cache Hit: {metrics.cacheHitRate.toFixed(1)}%</div>
    </div>
  );
};

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0
  });

  const startTiming = (name: string) => {
    performance.mark(`${name}-start`);
  };

  const endTiming = (name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  };

  const measureAsync = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
    startTiming(name);
    try {
      const result = await fn();
      return result;
    } finally {
      endTiming(name);
    }
  };

  return {
    metrics,
    startTiming,
    endTiming,
    measureAsync
  };
};

