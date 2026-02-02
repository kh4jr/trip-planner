"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type AlertType = "success" | "error" | "info";

type AlertProps = {
  type?: AlertType;
  title: string;
  description?: string;
  isVisible: boolean;
  onClose: () => void;
  autoHideMs?: number;
};

const styles: Record<AlertType, string> = {
  success: "bg-green-50 border-green-200 text-green-900",
  error: "bg-red-50 border-red-200 text-red-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

export default function Alert({
  type = "info",
  title,
  description,
  isVisible,
  onClose,
  autoHideMs = 4000,
}: AlertProps) {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoHideMs);

    return () => clearTimeout(timer);
  }, [isVisible, autoHideMs, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`mb-4 flex items-start gap-4 rounded-2xl border p-4 shadow-lg transition-all
        animate-in fade-in slide-in-from-top-2
        ${styles[type]}`}
    >
      <div className="flex-1">
        <p className="font-black">{title}</p>
        {description && (
          <p className="text-sm opacity-80 mt-1">{description}</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="opacity-60 hover:opacity-100 transition"
        aria-label="Zamknij"
      >
        <X size={18} />
      </button>
    </div>
  );
}
