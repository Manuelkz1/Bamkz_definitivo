import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw, Download, Expand } from 'lucide-react';

interface AdvancedImageGalleryProps {
  images: string[];
  productName?: string;
  className?: string;
  showThumbnails?: boolean;
  allowZoom?: boolean;
  allowFullscreen?: boolean;
  allowDownload?: boolean;
}

export function AdvancedImageGallery({
  images,
  productName = '',
  className = '',
  showThumbnails = true,
  allowZoom = true,
  allowFullscreen = true,
  allowDownload = false
}: AdvancedImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Precargar imágenes
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          closeLightbox();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          rotate();
          break;
      }
    };

    if (isLightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen, currentIndex]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetImageState();
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetImageState();
  }, [images.length]);

  const resetImageState = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
    resetImageState();
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    resetImageState();
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 5));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const rotate = () => {
    setRotation(prev => prev + 90);
  };

  const downloadImage = async () => {
    if (!allowDownload) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${productName || 'imagen'}-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (images.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg flex items-center justify-center h-96">
        <p className="text-gray-500">No hay imágenes disponibles</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Imagen principal */}
      <div className="relative group">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={images[currentIndex]}
            alt={`${productName} - Imagen ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
            onClick={() => allowFullscreen && openLightbox(currentIndex)}
          />
        </div>

        {/* Overlay con controles */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex space-x-2">
              {allowFullscreen && (
                <button
                  onClick={() => openLightbox(currentIndex)}
                  className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all duration-200"
                  title="Ver en pantalla completa"
                >
                  <Expand className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {allowZoom && (
                <button
                  onClick={() => openLightbox(currentIndex)}
                  className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all duration-200"
                  title="Zoom"
                >
                  <ZoomIn className="h-4 w-4 text-gray-700" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navegación */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Siguiente imagen"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Indicador de imagen */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black bg-opacity-60 text-white text-sm rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {showThumbnails && images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`aspect-square rounded-md overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          {/* Controles superiores */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-center space-x-4 bg-black bg-opacity-60 rounded-full px-4 py-2">
              {allowZoom && (
                <>
                  <button
                    onClick={zoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Alejar"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={zoomIn}
                    disabled={zoomLevel >= 5}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Acercar"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                </>
              )}
              
              <button
                onClick={rotate}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                title="Rotar"
              >
                <RotateCw className="h-5 w-5" />
              </button>
              
              {allowDownload && (
                <button
                  onClick={downloadImage}
                  disabled={isLoading}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full disabled:opacity-50"
                  title="Descargar"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
            title="Cerrar (Esc)"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Imagen principal */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={images[currentIndex]}
              alt={`${productName} - Imagen ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-all duration-300"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            />
          </div>

          {/* Navegación del lightbox */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                title="Imagen anterior (←)"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                title="Siguiente imagen (→)"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Indicador de imagen en lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Instrucciones de teclado */}
          <div className="absolute bottom-4 right-4 text-white text-sm opacity-60">
            <div className="text-right">
              <p>← → Navegar</p>
              <p>+ - Zoom</p>
              <p>R Rotar</p>
              <p>Esc Cerrar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Versión compacta para usar en tarjetas de producto
export function CompactImageGallery({
  images,
  className = '',
  size = 'md'
}: {
  images: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sizeClasses = {
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-80'
  };

  if (images.length === 0) return null;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full rounded-lg overflow-hidden group">
        <img
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {images.length > 1 && (
          <>
            {/* Navegación */}
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
