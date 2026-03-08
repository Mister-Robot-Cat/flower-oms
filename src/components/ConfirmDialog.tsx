"use client";

import { ReactNode } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Təsdiq et",
  cancelText = "Ləğv et",
  variant = "info",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl bg-space-surface border border-space-border shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-space-text-primary mb-2">{title}</h3>
          <p className="text-sm text-space-text-secondary mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-space-border text-space-text-primary hover:bg-space-surface-light transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-all hover:-translate-y-0.5 ${
                variant === "danger"
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                  : variant === "warning"
                  ? "bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/30"
                  : "bg-cosmic-purple hover:bg-cosmic-purple-light shadow-lg shadow-cosmic-purple/30"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
