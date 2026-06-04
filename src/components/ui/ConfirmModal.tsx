"use client";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Usuń",
  cancelText = "Anuluj",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* modal */}
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-blue-100">
        <h3 className="text-xl font-black text-blue-900 mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-slate-500 font-bold mb-6">
            {description}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl font-black text-sm
                       bg-slate-100 text-slate-600
                       hover:bg-slate-200"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl font-black text-sm
                       bg-red-600 text-white
                       hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
