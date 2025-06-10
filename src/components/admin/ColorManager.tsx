import React, { useState } from 'react';
import { Plus, X, Palette, Upload, Image } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ColorImage {
  color: string;
  image: string;
}

interface ColorManagerProps {
  availableColors: string[];
  colorImages: ColorImage[];
  onColorsChange: (colors: string[]) => void;
  onColorImagesChange: (colorImages: ColorImage[]) => void;
  className?: string;
}

export function ColorManager({
  availableColors,
  colorImages,
  onColorsChange,
  onColorImagesChange,
  className = ''
}: ColorManagerProps) {
  const [newColor, setNewColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const predefinedColors = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Rojo', hex: '#EF4444' },
    { name: 'Azul', hex: '#3B82F6' },
    { name: 'Verde', hex: '#10B981' },
    { name: 'Amarillo', hex: '#F59E0B' },
    { name: 'Rosa', hex: '#EC4899' },
    { name: 'Morado', hex: '#8B5CF6' },
    { name: 'Gris', hex: '#6B7280' },
    { name: 'Marrón', hex: '#92400E' },
    { name: 'Naranja', hex: '#F97316' },
    { name: 'Turquesa', hex: '#06B6D4' }
  ];

  const addColor = (colorName: string) => {
    if (!colorName.trim()) {
      toast.error('Ingresa un nombre para el color');
      return;
    }

    if (availableColors.includes(colorName.trim())) {
      toast.error('Este color ya existe');
      return;
    }

    const newColors = [...availableColors, colorName.trim()];
    onColorsChange(newColors);
    setNewColor('');
    toast.success(`Color "${colorName}" agregado`);
  };

  const removeColor = (colorToRemove: string) => {
    const newColors = availableColors.filter(color => color !== colorToRemove);
    onColorsChange(newColors);

    // También remover la imagen asociada si existe
    const newColorImages = colorImages.filter(ci => ci.color !== colorToRemove);
    onColorImagesChange(newColorImages);

    toast.success(`Color "${colorToRemove}" eliminado`);
  };

  const handleImageUpload = (color: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      
      // Actualizar o agregar imagen para este color
      const existingIndex = colorImages.findIndex(ci => ci.color === color);
      let newColorImages: ColorImage[];
      
      if (existingIndex >= 0) {
        newColorImages = [...colorImages];
        newColorImages[existingIndex] = { color, image: imageData };
      } else {
        newColorImages = [...colorImages, { color, image: imageData }];
      }
      
      onColorImagesChange(newColorImages);
      toast.success(`Imagen para color "${color}" actualizada`);
    };
    
    reader.readAsDataURL(file);
  };

  const removeColorImage = (color: string) => {
    const newColorImages = colorImages.filter(ci => ci.color !== color);
    onColorImagesChange(newColorImages);
    toast.success(`Imagen del color "${color}" eliminada`);
  };

  const getColorImage = (color: string): string | null => {
    const colorImage = colorImages.find(ci => ci.color === color);
    return colorImage?.image || null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Palette className="inline h-4 w-4 mr-1" />
          Colores disponibles
        </label>
        
        {/* Add Color Section */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="Nombre del color"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            onKeyPress={(e) => e.key === 'Enter' && addColor(newColor)}
          />
          <button
            type="button"
            onClick={() => addColor(newColor)}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </button>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>

        {/* Predefined Colors */}
        {showColorPicker && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-2">Colores predefinidos:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => addColor(color.name)}
                  disabled={availableColors.includes(color.name)}
                  className="flex items-center space-x-2 p-2 rounded border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Colors */}
        {availableColors.length > 0 ? (
          <div className="space-y-3">
            {availableColors.map((color) => {
              const colorImage = getColorImage(color);
              
              return (
                <div key={color} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{color}</span>
                      {colorImage && (
                        <Image className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Image Upload/Preview */}
                    {colorImage ? (
                      <div className="flex items-center space-x-2">
                        <img
                          src={colorImage}
                          alt={`Color ${color}`}
                          className="w-10 h-10 object-cover rounded border"
                        />
                        <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700">
                          <Upload className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(color, file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeColorImage(color)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer px-2 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded">
                        <Upload className="h-4 w-4 inline mr-1" />
                        Imagen
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(color, file);
                          }}
                        />
                      </label>
                    )}

                    {/* Remove Color */}
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Palette className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay colores configurados</p>
            <p className="text-sm">Agrega colores para que los clientes puedan elegir</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <Palette className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Gestión de colores
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Cada color puede tener su propia imagen de referencia</li>
                <li>Los clientes podrán seleccionar el color al hacer pedidos</li>
                <li>Si no agregas colores, el producto se considerará de color único</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
