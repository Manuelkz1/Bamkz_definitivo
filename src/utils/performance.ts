// Utilidades de performance y optimización
import React from 'react';

// Debounce para evitar llamadas excesivas
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle para limitar frecuencia de ejecución
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cache para resultados de funciones costosas
class MemoryCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const performanceCache = new MemoryCache(10); // 10 minutos TTL

// Memoización para React components
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return
): (...args: Args) => Return {
  const cache = new Map<string, Return>();
  
  return (...args: Args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
}

// Intersection Observer para lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (!window.IntersectionObserver) {
    console.warn('IntersectionObserver not supported');
    return null;
  }
  
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

// Hook para detectar si un elemento está visible
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const observer = createIntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      options
    );
    
    if (observer && ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer?.disconnect();
  }, [ref, options]);
  
  return isVisible;
}

// Optimización de imágenes
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality: number = 85
): string {
  try {
    const urlObj = new URL(url);
    
    // Para Cloudflare Images
    if (urlObj.hostname.includes('cloudflareimages.com')) {
      const params = new URLSearchParams();
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      params.append('quality', quality.toString());
      params.append('format', 'auto');
      
      return `${url}?${params.toString()}`;
    }
    
    // Para otras CDNs, retornar URL original
    return url;
  } catch {
    return url;
  }
}

// Batching de requests para evitar múltiples llamadas simultáneas
class RequestBatcher<T> {
  private pending = new Map<string, Promise<T>>();
  
  async batch(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }
    
    const promise = requestFn().finally(() => {
      this.pending.delete(key);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
}

export const requestBatcher = new RequestBatcher();

// Preloading de recursos críticos
export function preloadResource(href: string, as: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTimer(label: string): () => number {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.addMetric(label, duration);
      return duration;
    };
  }
  
  addMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Mantener solo los últimos 100 valores
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getAverage(label: string): number {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    this.metrics.forEach((values, label) => {
      result[label] = {
        average: this.getAverage(label),
        count: values.length
      };
    });
    
    return result;
  }
  
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Web Vitals monitoring
export function measureWebVitals(): void {
  // Core Web Vitals
  if ('web-vitals' in window) {
    return; // Ya está cargado
  }
  
  // Mediciones básicas sin librería externa
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        performanceMonitor.addMetric('LCP', entry.startTime);
      }
      
      if (entry.entryType === 'first-input') {
        performanceMonitor.addMetric('FID', (entry as any).processingStart - entry.startTime);
      }
      
      if (entry.entryType === 'layout-shift') {
        if (!(entry as any).hadRecentInput) {
          performanceMonitor.addMetric('CLS', (entry as any).value);
        }
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  } catch (error) {
    console.warn('Performance Observer not fully supported:', error);
  }
}

// Optimización de scroll
export function optimizeScrollListener(
  callback: (event: Event) => void,
  options: { passive?: boolean; throttle?: number } = {}
): () => void {
  const { passive = true, throttle: throttleMs = 100 } = options;
  
  const throttledCallback = throttle(callback, throttleMs);
  
  window.addEventListener('scroll', throttledCallback, { passive });
  
  return () => {
    window.removeEventListener('scroll', throttledCallback);
  };
}

// Bundle size analyzer (solo en desarrollo)
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const scripts = Array.from(document.scripts);
  const totalSize = scripts.reduce((size, script) => {
    if (script.src && script.src.includes('assets')) {
      // Estimar tamaño basado en nombre del archivo
      return size + 1; // Simplificado
    }
    return size;
  }, 0);
  
  console.log('Estimated bundle count:', totalSize);
}

// Cleanup de event listeners
export class EventListenerManager {
  private listeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
  }> = [];
  
  add(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }
  
  remove(element: EventTarget, event: string, handler: EventListener): void {
    element.removeEventListener(event, handler);
    this.listeners = this.listeners.filter(
      listener => !(listener.element === element && 
                   listener.event === event && 
                   listener.handler === handler)
    );
  }
  
  removeAll(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}
