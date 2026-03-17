import React, { useState, useCallback } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUpload: (url: string, fileName: string, fileType: string) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  acceptedTypes = ['image/*', 'application/pdf', 'video/*'],
  maxSizeMB = 10 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const validateFile = (file: File): boolean => {
    // Validar tamaño
    const maxSize = maxSizeMB * 1024 * 1024; // Convertir a bytes
    if (file.size > maxSize) {
      toast.error(`El archivo es muy grande. Máximo ${maxSizeMB}MB`);
      return false;
    }

    // Validar tipo
    const fileType = file.type;
    const isValid = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!isValid) {
      toast.error('Tipo de archivo no permitido');
      return false;
    }

    return true;
  };

  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    setUploading(true);
    setFileName(file.name);

    try {
      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Simular upload (en producción, usar apiService.uploadFile)
      const formData = new FormData();
      formData.append('file', file);

      // TODO: Reemplazar con llamada real al backend
      // const response = await apiService.uploadFile(formData);
      
      // Simulación de upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUrl = URL.createObjectURL(file);
      
      onFileUpload(mockUrl, file.name, file.type);
      toast.success('Archivo subido exitosamente');
    } catch (error) {
      toast.error('Error al subir archivo');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const clearFile = () => {
    setPreview(null);
    setFileName('');
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
    if (['mp4', 'avi', 'mov'].includes(ext || '')) return Film;
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return FileText;
    return File;
  };

  return (
    <div className="space-y-3">
      {/* Área de drag & drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {uploading ? 'Subiendo archivo...' : 'Arrastra un archivo aquí'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              o haz clic para seleccionar
            </p>
          </div>
          <input
            type="file"
            onChange={handleFileInput}
            accept={acceptedTypes.join(',')}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              className="cursor-pointer"
              asChild
            >
              <span>Seleccionar archivo</span>
            </Button>
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Máximo {maxSizeMB}MB
          </p>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {preview.startsWith('data:image') ? (
            <img
              src={preview}
              alt={fileName}
              className="w-full h-48 object-cover rounded"
            />
          ) : (
            <div className="flex items-center gap-3 p-4">
              {React.createElement(getFileIcon(fileName), { className: 'w-8 h-8 text-gray-400' })}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileName}</p>
                <p className="text-xs text-gray-500">Archivo cargado</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
