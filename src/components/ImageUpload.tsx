"use client";

import { useState, useRef } from "react";

export type UploadedImage = { id: string; url: string };

interface ImageUploadProps {
  onImageUploaded: (image: UploadedImage) => void;
  existingImages?: UploadedImage[];
  onImageRemoved?: (id: string) => void;
  maxImages?: number;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

    if (file.type && !ACCEPTED.includes(file.type)) {
      setError("Yalnız JPG, PNG, WEBP və ya GIF şəkil yükləyə bilərsiniz");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Fayl ölçüsü 10MB-dan çox ola bilməz");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Xəta baş verdi");
        return;
      }
      onImageUploaded({ id: data.id, url: data.url });
    } catch {
      setError("Fayl yüklənərkən xəta baş verdi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const canAddMore = existingImages.length < maxImages;

  return (
    <div className="space-y-3">
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {existingImages.map((img, index) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg border border-space-border overflow-hidden bg-space-surface-light"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- served by an authenticated API route */}
              <img src={img.url} alt={`Şəkil ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" />
              {onImageRemoved && (
                <button
                  type="button"
                  onClick={() => onImageRemoved(img.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`block w-full rounded-lg border-2 border-dashed border-space-border p-6 text-center cursor-pointer transition-colors ${
              uploading ? "opacity-50 cursor-not-allowed" : "hover:border-cosmic-purple hover:bg-space-surface-light"
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
                <div className="text-sm font-medium text-space-text-primary">Şəkil yükləyin</div>
                <div className="text-xs text-space-text-secondary">PNG, JPG, WEBP (max 10MB)</div>
              </div>
            )}
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-error-bg border border-error/30 px-4 py-3 text-sm text-error">{error}</div>
      )}

      {existingImages.length > 0 && (
        <div className="text-xs text-space-text-secondary">
          {existingImages.length} / {maxImages} şəkil yüklənib
        </div>
      )}
    </div>
  );
}
