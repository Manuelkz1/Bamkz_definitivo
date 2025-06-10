import React, { useState, useCallback } from 'react';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'skeleton' | 'none';
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onLoad,
  onError,
  placeholder = 'skeleton',
  fallbackSrc
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.();
    }
  }, [onError, fallbackSrc, currentSrc]);

  // Optimizar src para diferentes dispositivos
  const getOptimizedSrc = (originalSrc: string, deviceWidth?: number) => {
    // Si la imagen es de Cloudflare Images, Cloudinary, o similar, agregar transformaciones
    if (originalSrc.includes('cloudflare') || originalSrc.includes('cloudinary')) {
      const params = new URLSearchParams();
      if (deviceWidth) {
        params.append('w', deviceWidth.toString());
      }
      if (width) {
        params.append('w', width.toString());
      }
      if (height) {
        params.append('h', height.toString());
      }
      params.append('f', 'auto');
      params.append('q', '85');
      
      return `${originalSrc}?${params.toString()}`;
    }
    
    return originalSrc;
  };

  const PlaceholderComponent = ({ className }: { className: string }) => {
    if (placeholder === 'none') return null;
    
    if (placeholder === 'blur') {
      return (
        <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      );
    }
    
    // Skeleton por defecto
    return (
      <div className={`${className} bg-gray-200 animate-pulse`} />
    );
  };

  const ErrorComponent = ({ className }: { className: string }) => (
    <div className={`${className} bg-gray-100 flex items-center justify-center border border-gray-200`}>
      <div className="text-center text-gray-400">
        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
        <p className="text-xs">Imagen no disponible</p>
      </div>
    </div>
  );

  if (hasError && !fallbackSrc) {
    return <ErrorComponent className={className} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder mientras carga */}
      {isLoading && <PlaceholderComponent className="absolute inset-0" />}
      
      {/* Imagen principal */}
      <picture>
        {/* Versión WebP para navegadores compatibles */}
        <source 
          srcSet={`${getOptimizedSrc(currentSrc, 400)} 400w, ${getOptimizedSrc(currentSrc, 800)} 800w`}
          sizes="(max-width: 768px) 400px, 800px"
          type="image/webp"
        />
        
        {/* Imagen original como fallback */}
        <img
          src={getOptimizedSrc(currentSrc)}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 object-cover w-full h-full`}
          style={{
            aspectRatio: width && height ? `${width}/${height}` : undefined
          }}
        />
      </picture>
    </div>
  );
}

// Componente especializado para imágenes de productos
export function ProductImage({
  src,
  alt,
  className = '',
  onImageClick,
  showZoom = false
}: {
  src: string;
  alt: string;
  className?: string;
  onImageClick?: () => void;
  showZoom?: boolean;
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div 
      className={`relative group cursor-pointer ${className}`}
      onClick={() => {
        onImageClick?.();
        if (showZoom) setIsZoomed(!isZoomed);
      }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        className={`aspect-square transition-transform duration-300 ${
          showZoom && isZoomed ? 'scale-110' : 'group-hover:scale-105'
        }`}
        width={400}
        height={400}
        priority={false}
        fallbackSrc="/images/placeholder-product.jpg"
      />
      
      {/* Overlay para zoom */}
      {showZoom && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-2">
            <ImageIcon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para lazy loading de imágenes
export function useImageLazyLoading() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const markImageAsLoaded = useCallback((src: string) => {
    setLoadedImages(prev => new Set(prev).add(src));
  }, []);

  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.has(src);
  }, [loadedImages]);

  return { markImageAsLoaded, isImageLoaded };
}
