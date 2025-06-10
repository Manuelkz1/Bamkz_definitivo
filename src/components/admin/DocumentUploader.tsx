import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Download, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DocumentUploaderProps {
  document: string | null;
  onDocumentChange: (document: string | null) => void;
  maxSize?: number; // en MB
  allowedTypes?: string[];
  className?: string;
  label?: string;
}

export function DocumentUploader({
  document,
  onDocumentChange,
  maxSize = 10,
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  className = '',
  label = 'Manual del producto'
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileExtension = (mimeType: string): string => {
    const mimeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'text/plain': 'TXT'
    };
    return mimeMap[mimeType] || 'DOC';
  };

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Use: ${allowedTypes.map(t => getFileExtension(t)).join(', ')}`;
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo es muy grande. Máximo ${maxSize}MB`;
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

  const handleFile = async (file: File) => {
    const error = validateFile(file);
    
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    
    try {
      const base64 = await convertToBase64(file);
      onDocumentChange(base64);
      toast.success(`${label} subido correctamente`);
    } catch (error) {
      toast.error('Error al procesar el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const removeDocument = () => {
    onDocumentChange(null);
    toast.success('Documento eliminado');
  };

  const downloadDocument = () => {
    if (!document) return;
    
    try {
      const link = document.createElement('a');
      link.href = document;
      link.download = `manual-producto.${document.includes('pdf') ? 'pdf' : 'doc'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Error al descargar el documento');
    }
  };

  const getDocumentInfo = () => {
    if (!document) return null;
    
    try {
      // Extract file type from base64 data URL
      const mimeType = document.substring(document.indexOf(':') + 1, document.indexOf(';'));
      const extension = getFileExtension(mimeType);
      
      return {
        type: extension,
        size: Math.round((document.length * 0.75) / 1024), // Approximate size in KB
      };
    } catch {
      return { type: 'DOC', size: 0 };
    }
  };

  const documentInfo = getDocumentInfo();

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {!document ? (
        /* Upload Area */
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
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-2">
            <FileText className={`h-12 w-12 ${dragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
              >
                {uploading ? 'Subiendo...' : 'Haz clic para subir documento'}
              </button>
              <span className="text-gray-500"> o arrastra aquí</span>
            </div>
            <p className="text-sm text-gray-500">
              {allowedTypes.map(t => getFileExtension(t)).join(', ')} hasta {maxSize}MB
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span>Manual de usuario, instrucciones o documentación del producto</span>
            </div>
          </div>
        </div>
      ) : (
        /* Document Preview */
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Manual del producto
                </p>
                <p className="text-xs text-gray-500">
                  {documentInfo?.type} • ~{documentInfo?.size}KB
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={downloadDocument}
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Descargar documento"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={removeDocument}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Eliminar documento"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Button when document exists */}
      {document && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : 'Reemplazar documento'}
        </button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
