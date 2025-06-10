import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, FileImage, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // en MB
  allowedTypes?: string[];
  className?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizePerImage = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = ''
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Use: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }
    
    if (file.size > maxSizePerImage * 1024 * 1024) {
      return `El archivo es muy grande. Máximo ${maxSizePerImage}MB`;
    }
    
    return null;
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const error = validateFile(file);
        
        if (error) {
          toast.error(`${file.name}: ${error}`);
          continue;
        }

        try {
          const base64 = await convertToBase64(file);
          newImages.push(base64);
        } catch (error) {
          toast.error(`Error procesando ${file.name}`);
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} imagen(es) agregada(s)`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files) {
      handleFiles(files);
    }
  }, [images, maxImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Imagen eliminada');
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-2">
          <Upload className={`h-12 w-12 ${dragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= maxImages}
              className="text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Haz clic para subir'}
            </button>
            <span className="text-gray-500"> o arrastra aquí</span>
          </div>
          <p className="text-sm text-gray-500">
            {allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} hasta {maxSizePerImage}MB
          </p>
          <p className="text-xs text-gray-400">
            {images.length}/{maxImages} imágenes
          </p>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
            >
              <img
                src={image}
                alt={`Producto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Order Buttons */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded hover:bg-opacity-80"
                  >
                    ←
                  </button>
                )}
                
                <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                  {index + 1}
                </span>
                
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded hover:bg-opacity-80"
                  >
                    →
                  </button>
                )}
              </div>

              {/* Primary Image Indicator */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {images.length === 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span>La primera imagen será la imagen principal del producto</span>
        </div>
      )}
    </div>
  );
}
