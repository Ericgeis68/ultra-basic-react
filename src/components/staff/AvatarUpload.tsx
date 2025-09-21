import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';

interface AvatarUploadProps {
  initialImage?: string; // This will be the Supabase URL
  onImageChange: (file: File | null, previewUrl: string | undefined) => void; // Modified to return File and previewUrl
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ initialImage, onImageChange }) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialImage);
  const [isDragging, setIsDragging] = useState(false);

  // Effect to update previewUrl when initialImage prop changes (for editing)
  useEffect(() => {
    setPreviewUrl(initialImage);
  }, [initialImage]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      onImageChange(file, result); // Pass the File object and the data URL preview
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setPreviewUrl(undefined);
    onImageChange(null, undefined); // Indicate no file and no preview
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`relative cursor-pointer ${isDragging ? 'ring-2 ring-primary' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Avatar className="h-32 w-32 border-2 border-muted">
          <AvatarImage src={previewUrl} alt="Avatar preview" />
          <AvatarFallback className="text-2xl bg-muted">
            {previewUrl ? '' : <Camera className="h-12 w-12 text-muted-foreground" />}
          </AvatarFallback>
        </Avatar>

        {previewUrl && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center">
        <label htmlFor="avatar-upload" className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" />
            <span>{previewUrl ? 'Changer l\'avatar' : 'Télécharger un avatar'}</span>
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          Formats acceptés : JPG, PNG. Max 5MB.
        </p>
      </div>
    </div>
  );
};

export default AvatarUpload;
