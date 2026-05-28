'use client';

import React, { useState, useRef } from 'react';
import { Upload, Trash2, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  validationError?: string | null;
  className?: string;
  labelClassName?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Ảnh minh họa sản phẩm',
  validationError,
  className = 'aspect-[4/3] min-h-[360px]', // Default size for backwards compatibility
  labelClassName = 'text-base md:text-lg font-black text-zinc-950 dark:text-zinc-100 mb-3 tracking-tight',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasError = Boolean(validationError || uploadError);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Chỉ cho phép tải lên file hình ảnh!');
      return;
    }
    setUploadError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi xảy ra trong quá trình tải lên!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label className={`block ${labelClassName}`}>
        {label}
      </label>

      {value ? (
        <div
          className={`relative group ${className} w-full rounded-2xl overflow-hidden shadow-sm bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border ${
            hasError ? 'border-rose-500 dark:border-rose-500' : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/90 hover:bg-white text-zinc-800 rounded-full font-medium text-xs shadow-md transition-all flex items-center gap-1.5 hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              Thay ảnh khác
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-3 bg-red-600/90 hover:bg-red-600 text-white rounded-full font-medium text-xs shadow-md transition-all flex items-center gap-1.5 hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              Xóa ảnh
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`w-full ${className} border-2 border-dashed rounded-3xl cursor-pointer flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${
            hasError
              ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/10'
              : isDragOver
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99] shadow-inner'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Đang tải ảnh lên hệ thống...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm mb-2 border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-300" />
              </div>
              <span className="text-sm font-medium text-zinc-850 dark:text-zinc-200">Kéo thả ảnh hoặc click để tải lên</span>
            </div>
          )}
        </div>
      )}

      {(validationError || uploadError) && (
        <p className="text-xs text-rose-500 mt-2 font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {validationError || uploadError}
        </p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
