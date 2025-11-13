# Performance Optimization Guide

This guide provides comprehensive strategies and techniques for optimizing the performance of the Hydraulic Network Web Application, covering frontend, backend, and infrastructure optimizations.

## Table of Contents

- [Performance Overview](#performance-overview)
- [Performance Metrics](#performance-metrics)
- [Frontend Optimization](#frontend-optimization)
- [Backend Optimization](#backend-optimization)
- [Bundle Optimization](#bundle-optimization)
- [Caching Strategies](#caching-strategies)
- [CDN Configuration](#cdn-configuration)
- [Database Optimization](#database-optimization)
- [Monitoring and Analysis](#monitoring-and-analysis)
- [Performance Budgets](#performance-budgets)
- [Best Practices](#best-practices)

## Performance Overview

Performance optimization is critical for providing an excellent user experience, especially for a data-intensive application like the Hydraulic Network Web Application. This guide covers optimizations across all layers of the application stack.

### Performance Goals

- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100 milliseconds
- **Time to Interactive (TTI)**: < 3.5 seconds

### Performance Impact Areas

1. **User Experience**: Faster load times improve user satisfaction
2. **SEO**: Search engines favor faster websites
3. **Conversion Rates**: Performance directly impacts user engagement
4. **Resource Usage**: Efficient code reduces server costs
5. **Accessibility**: Performance affects users with slower devices/connections

## Performance Metrics

### Core Web Vitals

```javascript
// Core Web Vitals measurement
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  
  // Use sendBeacon if available, fallback to fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', { body, method: 'POST', keepalive: true });
  }
}

// Measure Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Custom Performance Metrics

```javascript
// Application-specific performance metrics
class PerformanceMetrics {
  constructor() {
    this.metrics = {};
    this.observers = [];
  }
  
  // Measure calculation performance
  measureCalculation(calculationId) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.calculation = {
          id: calculationId,
          duration,
          timestamp: Date.now()
        };
        
        this.reportMetric('calculation_duration', duration);
        return duration;
      }
    };
  }
  
  // Measure API response time
  measureAPI(endpoint) {
    const startTime = performance.now();
    
    return {
      end: (status) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.api = {
          endpoint,
          duration,
          status,
          timestamp: Date.now()
        };
        
        this.reportMetric('api_response_time', duration, { endpoint, status });
        return duration;
      }
    };
  }
  
  // Report metrics to analytics
  reportMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      metadata,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Send to performance monitoring service
    this.sendToAnalytics(metric);
  }
  
  // Send to analytics service
  sendToAnalytics(metric) {
    // Implementation depends on analytics provider
    console.log('Performance metric:', metric);
  }
}

// Global performance instance
window.performanceMetrics = new PerformanceMetrics();
```

### Performance Monitoring

```javascript
// Performance monitoring setup
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      fcp: 1500,  // First Contentful Paint
      lcp: 2500,  // Largest Contentful Paint
      cls: 0.1,   // Cumulative Layout Shift
      fid: 100,   // First Input Delay
      tti: 3500   // Time to Interactive
    };
  }
  
  // Initialize performance monitoring
  init() {
    this.measureNavigation();
    this.measureResourceTiming();
    this.measureUserInteractions();
    this.setupPerformanceObserver();
  }
  
  // Measure navigation timing
  measureNavigation() {
    if (performance.navigation) {
      const timing = performance.navigation;
      this.metrics.set('navigation', {
        type: timing.type === 0 ? 'navigate' : 'reload',
        redirectCount: timing.redirectCount
      });
    }
  }
  
  // Measure resource timing
  measureResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    
    resources.forEach(resource => {
      this.metrics.set(`resource_${resource.name}`, {
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType
      });
    });
  }
  
  // Measure user interactions
  measureUserInteractions() {
    let interactionStartTime = 0;
    
    ['click', 'keydown', 'pointerdown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionStartTime = performance.now();
      }, { passive: true });
    });
    
    ['click', 'keyup', 'pointerup'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (interactionStartTime > 0) {
          const duration = performance.now() - interactionStartTime;
          this.metrics.set(`interaction_${eventType}`, { duration });
          interactionStartTime = 0;
        }
      }, { passive: true });
    });
  }
  
  // Setup Performance Observer
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Observe layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            this.metrics.set('cls', {
              value: entry.value,
              timestamp: entry.startTime
            });
          }
        });
      });
      
      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('Layout shift observation not supported');
      }
      
      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.set('lcp', {
          value: lastEntry.startTime,
          element: lastEntry.element?.tagName
        });
      });
      
      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('LCP observation not supported');
      }
    }
  }
  
  // Get performance report
  getReport() {
    const report = {
      timestamp: Date.now(),
      metrics: Object.fromEntries(this.metrics),
      scores: this.calculateScores()
    };
    
    return report;
  }
  
  // Calculate performance scores
  calculateScores() {
    const scores = {};
    
    this.metrics.forEach((value, key) => {
      if (key in this.thresholds) {
        const threshold = this.thresholds[key];
        const metricValue = typeof value === 'object' ? value.value || value.duration : value;
        
        scores[key] = metricValue <= threshold ? 'good' : 'needs-improvement';
      }
    });
    
    return scores;
  }
}
```

## Frontend Optimization

### Code Splitting and Lazy Loading

```typescript
// Lazy loading with React.lazy
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));
const NetworkDiagram = lazy(() => import('./NetworkDiagram'));
const CalculationResults = lazy(() => import('./CalculationResults'));

// Component with lazy loading
const LazyComponent = ({ component, ...props }) => {
  const ComponentMap = {
    HeavyChart,
    NetworkDiagram,
    CalculationResults
  };
  
  const Component = ComponentMap[component];
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </Suspense>
  );
};

// Route-based code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const LazyRoutes = () => {
  const ConfigurationPage = lazy(() => import('../pages/ConfigurationPage'));
  const ResultsPage = lazy(() => import('../pages/ResultsPage'));
  const HistoryPage = lazy(() => import('../pages/HistoryPage'));
  
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <Routes>
        <Route path="/configure" element={<ConfigurationPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Suspense>
  );
};
```

### Component Optimization

```typescript
// Optimized component with memo and useMemo
import React, { memo, useMemo, useCallback } from 'react';

interface NetworkSectionProps {
  section: PipeSection;
  onUpdate: (id: string, updates: Partial<PipeSection>) => void;
  isSelected: boolean;
}

// Memoized component
export const NetworkSection = memo<NetworkSectionProps>(({ 
  section, 
  onUpdate, 
  isSelected 
}) => {
  // Memoize expensive calculations
  const sectionData = useMemo(() => {
    return {
      ...section,
      pressureDrop: calculatePressureDrop(section),
      velocity: calculateVelocity(section),
      reynoldsNumber: calculateReynoldsNumber(section)
    };
  }, [section]);
  
  // Memoize event handlers
  const handleUpdate = useCallback((updates: Partial<PipeSection>) => {
    onUpdate(section.id, updates);
  }, [section.id, onUpdate]);
  
  // Memoize computed styles
  const sectionStyle = useMemo(() => ({
    backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
    border: isSelected ? '2px solid #2196f3' : '1px solid #ddd',
    padding: '1rem',
    margin: '0.5rem',
    borderRadius: '4px'
  }), [isSelected]);
  
  return (
    <div style={sectionStyle}>
      <h3>{section.name}</h3>
      <div>Diameter: {section.diameter}m</div>
      <div>Length: {section.length}m</div>
      <div>Pressure Drop: {sectionData.pressureDrop.toFixed(2)} Pa</div>
      <button onClick={() => handleUpdate({ diameter: section.diameter + 0.01 })}>
        Increase Diameter
      </button>
    </div>
  );
});

NetworkSection.displayName = 'NetworkSection';
```

### Virtual Scrolling

```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: PipeSection[];
}

// Virtualized pipe section list
const PipeSectionRow = memo<ListItemProps>(({ index, style, data }) => {
  const section = data[index];
  
  return (
    <div style={style} className="pipe-section-row">
      <div className="section-info">
        <span className="section-name">{section.name}</span>
        <span className="section-diameter">{section.diameter}m</span>
        <span className="section-length">{section.length}m</span>
      </div>
      <div className="section-actions">
        <button onClick={() => editSection(section.id)}>Edit</button>
        <button onClick={() => deleteSection(section.id)}>Delete</button>
      </div>
    </div>
  );
});

interface VirtualizedListProps {
  sections: PipeSection[];
  height: number;
  itemHeight: number;
}

export const VirtualizedPipeList = ({ sections, height, itemHeight }: VirtualizedListProps) => {
  return (
    <List
      height={height}
      itemCount={sections.length}
      itemSize={itemHeight}
      itemData={sections}
    >
      {PipeSectionRow}
    </List>
  );
};
```

### Image Optimization

```typescript
// Optimized image component
import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  placeholder, 
  width, 
  height, 
  className 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    let observer: IntersectionObserver;
    
    if (imgRef.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              img.src = img.dataset.src!;
              observer.unobserve(img);
            }
          });
        },
        { threshold: 0.1 }
      );
      
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);
  
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setHasError(true);
  };
  
  return (
    <div className={`optimized-image ${className || ''}`}>
      {!isLoaded && placeholder && (
        <img 
          src={placeholder} 
          alt="" 
          className="placeholder"
          style={{ width, height }}
        />
      )}
      
      <img
        ref={imgRef}
        data-src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`image ${isLoaded ? 'loaded' : 'loading'}`}
        style={{ 
          display: isLoaded ? 'block' : 'none',
          width, 
          height 
        }}
      />
      
      {hasError && (
        <div className="error-fallback">
          Failed to load image
        </div>
      )}
    </div>
  );
};
```

## Backend Optimization

### API Response Optimization

```python
# FastAPI response optimization
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel
import orjson

app = FastAPI(default_response_class=ORJSONResponse)

class OptimizedResponse(BaseModel):
    data: dict
    meta: dict = {}
    timestamp: str

@app.get("/api/optimized")
async def optimized_endpoint():
    # Pre-processed data
    data = get_optimized_data()
    
    response = OptimizedResponse(
        data=data,
        meta={"count": len(data)},
        timestamp=datetime.utcnow().isoformat()
    )
    
    return response

# Response compression
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
    compresslevel=6
)
```

### Database Query Optimization

```python
# Database optimization with SQLAlchemy
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload

class OptimizedQueryService:
    @staticmethod
    async def get_network_with_sections(network_id: str):
        # Use eager loading to avoid N+1 queries
        query = select(Network).where(Network.id == network_id).options(
            selectinload(Network.pipe_sections).selectinload(PipeSection.fittings),
            selectinload(Network.fluid_properties)
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_calculation_results_paginated(page: int, size: int):
        # Paginated results with count
        offset = (page - 1) * size
        
        # Count query
        count_query = select(func.count()).select_from(CalculationResult)
        total_count = await db.scalar(count_query)
        
        # Data query
        data_query = select(CalculationResult).offset(offset).limit(size)
        results = await db.execute(data_query)
        
        return {
            "data": results.scalars().all(),
            "pagination": {
                "page": page,
                "size": size,
                "total": total_count,
                "pages": (total_count + size - 1) // size
            }
        }
    
    @staticmethod
    async def search_calculations(query: str, filters: dict):
        # Optimized search with indexing
        search_query = select(Calculation).where(
            Calculation.name.ilike(f"%{query}%")
        )
        
        # Apply filters
        if filters.get("status"):
            search_query = search_query.where(
                Calculation.status == filters["status"]
            )
        
        if filters.get("date_from"):
            search_query = search_query.where(
                Calculation.created_at >= filters["date_from"]
            )
        
        # Order by relevance
        search_query = search_query.order_by(
            Calculation.created_at.desc()
        ).limit(50)
        
        results = await db.execute(search_query)
        return results.scalars().all()
```

### Caching Strategy

```python
# Redis-based caching
import redis
import json
from functools import wraps
from typing import Optional, Callable

class CacheService:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            db=int(os.getenv('REDIS_DB', 0)),
            decode_responses=True
        )
    
    def cache_result(self, ttl: int = 300):
        """Cache decorator for function results"""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = self._generate_key(func.__name__, args, kwargs)
                
                # Try to get from cache
                cached_result = self.redis_client.get(cache_key)
                if cached_result:
                    return json.loads(cached_result)
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                
                self.redis_client.setex(
                    cache_key, 
                    ttl, 
                    json.dumps(result, default=str)
                )
                
                return result
            return wrapper
        return decorator
    
    def _generate_key(self, func_name: str, args, kwargs) -> str:
        """Generate cache key from function name and arguments"""
        key_data = {
            'func': func_name,
            'args': args,
            'kwargs': kwargs
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return f"cache:{hash(key_string)}"
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        keys = self.redis_client.keys(f"cache:*{pattern}*")
        if keys:
            self.redis_client.delete(*keys)

# Usage example
cache_service = CacheService()

class CalculationService:
    @cache_service.cache_result(ttl=600)  # 10 minutes
    async def get_calculation_results(self, calculation_id: str):
        # Expensive calculation
        return await expensive_calculation(calculation_id)
    
    async def invalidate_calculation_cache(self, calculation_id: str):
        await cache_service.invalidate_pattern(calculation_id)
```

## Bundle Optimization

### Webpack/Vite Optimization

```typescript
// vite.config.ts optimization
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import CompressionPlugin from 'compression-plugin';

export default defineConfig({
  plugins: [
    react(),
    // Copy static assets
    viteStaticCopy({
      targets: [
        { src: 'src/assets/fonts', dest: '' }
      ]
    })
  ],
  
  // Bundle optimization
  build: {
    target: 'es2020',
    minify: 'terser',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts', 'chart.js'],
          state: ['zustand'],
          utils: ['lodash', 'moment']
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Compression
    rollupOptions: {
      plugins: [
        CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8
        })
      ]
    },
    // Size limits
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  
  // Performance optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@mui/material'
    ]
  },
  
  // Legacy browser support
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
```

### Bundle Analysis

```typescript
// Bundle analysis script
import { analyze } from 'rollup-plugin-analyzer';
import { visualizer } from 'rollup-plugin-visualizer';

// Add to vite.config.ts
export default defineConfig({
  plugins: [
    // ... other plugins
    analyze({
      summaryOnly: true,
      hideDeps: false
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});

// Bundle size monitoring
const BUNDLE_SIZE_LIMITS = {
  'js/vendor': 500 * 1024, // 500KB
  'js/main': 300 * 1024,   // 300KB
  'css/main': 100 * 1024,  // 100KB
  total: 1024 * 1024       // 1MB
};

function checkBundleSize(stats) {
  const errors = [];
  
  Object.entries(BUNDLE_SIZE_LIMITS).forEach(([chunk, limit]) => {
    const size = stats.assets.find(asset => asset.name.includes(chunk))?.size || 0;
    
    if (size > limit) {
      errors.push(`${chunk} size ${size} exceeds limit ${limit}`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Bundle size violations:\n${errors.join('\n')}`);
  }
}
```

### Tree Shaking

```typescript
// Ensure tree shaking works properly
// utils/math.ts - properly structured for tree shaking
export const add = (a: number, b: number): number => a + b;
export const multiply = (a: number, b: number): number => a * b;
export const calculatePressureDrop = (flowRate: number, diameter: number): number => {
  // Complex calculation
  return flowRate * multiply(diameter, 0.001);
};

// components/Chart.tsx - import only what you need
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
// Instead of: import * as Recharts from 'recharts';

// main.tsx - remove unused imports
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Remove: import { UnusedComponent } from './UnusedComponent';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

## Caching Strategies

### HTTP Caching

```typescript
// Service worker for HTTP caching
const CACHE_NAME = 'hydraulic-app-v1';
const CACHEABLE_PATHS = [
  '/static/',
  '/api/config/',
  '/api/calculations/'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/main.js',
        '/static/css/main.css',
        '/static/assets/logo.svg',
        '/manifest.json'
      ]);
    })
  );
});

// Fetch event - serve from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available and request is cacheable
      if (cachedResponse && isCacheableRequest(event.request)) {
        return cachedResponse;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse.ok && isCacheableRequest(event.request)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return networkResponse;
      });
    })
  );
});

function isCacheableRequest(request: Request): boolean {
  // Don't cache POST requests
  if (request.method === 'POST') return false;
  
  // Only cache specific paths
  return CACHEABLE_PATHS.some(path => request.url.includes(path));
}
```

### Browser Caching

```typescript
// Browser caching implementation
class BrowserCache {
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  static async get<T>(key: string): Promise<T | null> {
    try {
      // Try localStorage first
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - data.timestamp < this.CACHE_DURATION) {
          return data.value;
        } else {
          // Cache expired
          localStorage.removeItem(key);
        }
      }
      
      // Try IndexedDB as fallback
      return await this.getFromIndexedDB<T>(key);
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }
  
  static async set<T>(key: string, value: T): Promise<void> {
    try {
      // Store in localStorage
      const data = {
        value,
        timestamp: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      
      // Also store in IndexedDB for larger data
      await this.setToIndexedDB(key, value);
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }
  
  private static async getFromIndexedDB<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      // IndexedDB implementation for larger data
      // Implementation depends on application needs
      resolve(null);
    });
  }
  
  private static async setToIndexedDB<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      // IndexedDB implementation
      resolve();
    });
  }
  
  static clear(): void {
    try {
      localStorage.clear();
      // Clear IndexedDB as well
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }
}
```

## CDN Configuration

### Static Asset CDN

```javascript
// CDN configuration for static assets
const CDN_CONFIG = {
  baseUrl: process.env.CDN_BASE_URL || 'https://cdn.yourservice.com',
  assets: {
    images: '/images',
    fonts: '/fonts',
    scripts: '/scripts',
    styles: '/styles'
  },
  cache: {
    maxAge: '1y',
    immutable: true
  }
};

// CDN asset helper
function getCdnUrl(assetPath, options = {}) {
  const {
    width,
    height,
    format = 'auto',
    quality = 80
  } = options;
  
  const baseUrl = CDN_CONFIG.baseUrl;
  const assetUrl = `${baseUrl}${assetPath}`;
  
  // Add image optimization parameters
  if (assetPath.match(/\.(jpg|jpeg|png|webp)$/)) {
    const params = new URLSearchParams({
      w: width,
      h: height,
      f: format,
      q: quality
    });
    
    return `${assetUrl}?${params}`;
  }
  
  return assetUrl;
}

// Usage in components
const OptimizedImage = ({ src, alt, ...props }) => {
  const cdnUrl = getCdnUrl(src, {
    width: props.width,
    height: props.height,
    format: 'webp',
    quality: 80
  });
  
  return <img src={cdnUrl} alt={alt} {...props} />;
};
```

### API CDN Caching

```javascript
// API response caching with CDN
const express = require('express');
const app = express();

// Configure CDN caching headers
app.use((req, res, next) => {
  // Cache static API responses
  if (req.path.startsWith('/api/config/') || req.path.startsWith('/api/reference/')) {
    res.set({
      'Cache-Control': 'public, max-age=3600', // 1 hour
      'CDN-Cache-Control': 'max-age=86400', // 24 hours on CDN
      'Vary': 'Accept-Encoding'
    });
  }
  
  // Cache calculation results (shorter duration)
  if (req.path.startsWith('/api/calculations/') && req.method === 'GET') {
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'CDN-Cache-Control': 'max-age=1800', // 30 minutes on CDN
      'Vary': 'Authorization'
    });
  }
  
  next();
});

// Cache invalidation endpoint
app.post('/api/cache/invalidate', (req, res) => {
  const { paths } = req.body;
  
  // Invalidate CDN cache
  invalidateCDNCache(paths);
  
  res.json({ success: true });
});

async function invalidateCDNCache(paths) {
  // Implementation depends on CDN provider
  // Example for Cloudflare
  const response = await fetch('https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer API_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: paths.map(path => `${CDN_CONFIG.baseUrl}${path}`)
    })
  });
  
  if (!response.ok) {
    console.error('CDN cache invalidation failed');
  }
}
```

## Database Optimization

### Query Optimization

```sql
-- Database indexes for hydraulic application
CREATE INDEX idx_calculations_user_id ON calculations(user_id);
CREATE INDEX idx_calculations_created_at ON calculations(created_at);
CREATE INDEX idx_calculations_status ON calculations(status);
CREATE INDEX idx_pipe_sections_network_id ON pipe_sections(network_id);
CREATE INDEX idx_results_calculation_id ON calculation_results(calculation_id);

-- Composite indexes for common queries
CREATE INDEX idx_calculations_user_status ON calculations(user_id, status);
CREATE INDEX idx_calculations_user_created ON calculations(user_id, created_at DESC);
CREATE INDEX idx_sections_network_created ON pipe_sections(network_id, created_at);

-- Partial indexes for active records
CREATE INDEX idx_calculations_active ON calculations(user_id) WHERE status = 'active';
CREATE INDEX idx_networks_active ON networks(user_id) WHERE deleted_at IS NULL;
```

### Connection Pooling

```python
# Database connection pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool
import os

# Database engine with connection pooling
engine = create_engine(
    os.getenv('DATABASE_URL'),
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600,
    pool_pre_ping=True
)

# Async database setup
from databases import Database

database = Database(
    os.getenv('DATABASE_URL'),
    min_size=5,
    max_size=20,
    timeout=30
)
```

## Monitoring and Analysis

### Performance Monitoring Setup

```typescript
// Performance monitoring integration
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  // Initialize monitoring
  init() {
    this.setupCoreWebVitals();
    this.setupCustomMetrics();
    this.setupErrorTracking();
    this.setupResourceMonitoring();
  }
  
  // Core Web Vitals monitoring
  private setupCoreWebVitals() {
    // Import web-vitals library
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      const sendToAnalytics = (metric: any) => {
        this.recordMetric('web-vital', {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta
        });
      };
      
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    });
  }
  
  // Custom performance metrics
  private setupCustomMetrics() {
    // Route change timing
    this.measureRouteChanges();
    
    // API response times
    this.measureApiResponses();
    
    // Component render times
    this.measureComponentRenders();
  }
  
  // Record performance metric
  recordMetric(type: string, data: any) {
    const metric = {
      type,
      data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    this.metrics.set(`${type}_${Date.now()}`, metric);
    
    // Send to analytics service
    this.sendToAnalytics(metric);
  }
  
  // Send to analytics
  private sendToAnalytics(metric: any) {
    // Implementation depends on analytics provider
    // Could be Google Analytics, Mixpanel, custom analytics, etc.
    
    // Example with Google Analytics 4
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: metric.type,
        value: metric.data.value,
        custom_parameter_1: metric.data.name
      });
    }
    
    // Example with custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(console.error);
  }
  
  // Get performance report
  getReport() {
    return {
      timestamp: Date.now(),
      metrics: Array.from(this.metrics.values()),
      summary: this.generateSummary()
    };
  }
  
  private generateSummary() {
    const webVitals = Array.from(this.metrics.values())
      .filter(m => m.type === 'web-vital')
      .reduce((acc, metric) => {
        acc[metric.data.name] = metric.data;
        return acc;
      }, {});
    
    return {
      webVitals,
      totalMetrics: this.metrics.size,
      reportPeriod: 'session'
    };
  }
}

// Initialize performance monitoring
const performanceMonitor = PerformanceMonitor.getInstance();
performanceMonitor.init();

// Export for global access
window.performanceMonitor = performanceMonitor;
```

## Performance Budgets

### Budget Configuration

```typescript
// Performance budget configuration
const PERFORMANCE_BUDGETS = {
  // Bundle size budgets
  bundles: {
    'js/vendor': 500 * 1024,    // 500KB
    'js/main': 300 * 1024,      // 300KB
    'js/chunk': 100 * 1024,     // 100KB per chunk
    'css/main': 100 * 1024,     // 100KB
    'css/chunk': 50 * 1024      // 50KB per chunk
  },
  
  // Performance budgets
  performance: {
    fcp: 1500,    // First Contentful Paint: 1.5s
    lcp: 2500,    // Largest Contentful Paint: 2.5s
    fid: 100,     // First Input Delay: 100ms
    cls: 0.1,     // Cumulative Layout Shift: 0.1
    tti: 3500     // Time to Interactive: 3.5s
  },
  
  // Resource budgets
  resources: {
    totalRequests: 50,
    totalSize: 2 * 1024 * 1024,  // 2MB total
    images: 1 * 1024 * 1024,    // 1MB for images
    scripts: 500 * 1024,        // 500KB for scripts
    stylesheets: 100 * 1024,    // 100KB for CSS
    fonts: 200 * 1024           // 200KB for fonts
  }
};

// Budget enforcement
class PerformanceBudget {
  static checkBundleSize(stats: any) {
    const violations: string[] = [];
    
    // Check bundle sizes
    Object.entries(PERFORMANCE_BUDGETS.bundles).forEach(([chunk, budget]) => {
      const asset = stats.assets.find((a: any) => a.name.includes(chunk));
      if (asset && asset.size > budget) {
        violations.push(
          `${chunk} size ${formatBytes(asset.size)} exceeds budget ${formatBytes(budget)}`
        );
      }
    });
    
    return violations;
  }
  
  static checkPerformanceMetrics(metrics: any) {
    const violations: string[] = [];
    
    Object.entries(PERFORMANCE_BUDGETS.performance).forEach(([metric, budget]) => {
      const value = metrics[metric];
      if (value && value > budget) {
        violations.push(
          `${metric} ${value}ms exceeds budget ${budget}ms`
        );
      }
    });
    
    return violations;
  }
  
  static checkResourceUsage(resources: any) {
    const violations: string[] = [];
    
    // Check total requests
    if (resources.totalRequests > PERFORMANCE_BUDGETS.resources.totalRequests) {
      violations.push(
        `Total requests ${resources.totalRequests} exceeds budget ${PERFORMANCE_BUDGETS.resources.totalRequests}`
      );
    }
    
    // Check total size
    if (resources.totalSize > PERFORMANCE_BUDGETS.resources.totalSize) {
      violations.push(
        `Total size ${formatBytes(resources.totalSize)} exceeds budget ${formatBytes(PERFORMANCE_BUDGETS.resources.totalSize)}`
      );
    }
    
    return violations;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

## Best Practices

### Development Best Practices

1. **Code Splitting**: Split code into smaller chunks
2. **Lazy Loading**: Load components only when needed
3. **Bundle Analysis**: Regularly analyze bundle size
4. **Performance Testing**: Test performance in CI/CD
5. **Monitoring**: Monitor performance in production

### Production Best Practices

1. **CDN Usage**: Serve static assets from CDN
2. **Compression**: Enable gzip/brotli compression
3. **Caching**: Implement proper caching strategies
4. **Minification**: Minify and compress all assets
5. **Monitoring**: Set up performance monitoring

### Performance Checklist

```typescript
// Performance optimization checklist
const PERFORMANCE_CHECKLIST = [
  '✅ Implement code splitting',
  '✅ Add lazy loading for routes',
  '✅ Optimize images (WebP, compression)',
  '✅ Minify and compress assets',
  '✅ Enable gzip/brotli compression',
  '✅ Set up CDN for static assets',
  '✅ Implement caching strategies',
  '✅ Add performance monitoring',
  '✅ Set up performance budgets',
  '✅ Optimize database queries',
  '✅ Use efficient algorithms',
  '✅ Implement proper error boundaries',
  '✅ Add loading states',
  '✅ Optimize third-party integrations',
  '✅ Test on slow networks',
  '✅ Monitor Core Web Vitals'
];
```

---

For additional performance optimization support or questions, please refer to the [Development Guide](../docs/DEVELOPMENT.md) or contact the performance team.