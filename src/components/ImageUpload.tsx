"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  existingImages?: string[];
  onImageRemoved?: (url: string) => void;
  maxImages?: number;
}

export default function ImageUpload({
  onImageUploaded,
  existingImages = [],
  onImageRemoved,
  maxImages = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа
    if (!file.type.startsWith("image/")) {
      setError("Yalnız şəkil faylları yükləyə bilərsiniz");
      return;
    }

    // Проверка размера
    if (file.size > 10 * 1024 * 1024) {
      setError("Fayl ölçüsü 10MB-dan çox ola bilməz");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Xəta baş verdi");
        setUploading(false);
        return;
      }

      onImageUploaded(data.url);
      setUploading(false);

      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError("Fayl yüklənərkən xəta baş verdi");
      setUploading(false);
    }
  };

  const canAddMore = existingImages.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Превью загруженных изображений */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {existingImages.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border border-space-border overflow-hidden bg-space-surface-light"
            >
              <Image
                src={url}
                alt={`Şəkil ${index + 1}`}
                fill
                className="object-cover"
              />
              {onImageRemoved && (
                <button
                  type="button"
                  onClick={() => onImageRemoved(url)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Кнопка загрузки */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`block w-full rounded-lg border-2 border-dashed border-space-border p-6 text-center cursor-pointer transition-colors ${
              uploading
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-cosmic-purple hover:bg-space-surface-light"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cosmic-purple-light/30 border-t-cosmic-purple-light"></div>
                <span className="text-sm text-space-text-secondary">Yüklənir...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl">📷</div>
                <div className="text-sm font-medium text-space-text-primary">
                  Şəkil yükləyin
                </div>
                <div className="text-xs text-space-text-secondary">
                  PNG, JPG, WEBP (max 10MB)
                </div>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Информация */}
      {existingImages.length > 0 && (
        <div className="text-xs text-space-text-secondary">
          {existingImages.length} / {maxImages} şəkil yüklənib
        </div>
      )}
    </div>
  );
}
