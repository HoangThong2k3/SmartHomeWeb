"use client";

import React from "react";
import { XCircle, CheckCircle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
      <div className="bg-[color:var(--surface)] rounded-lg p-6 w-full max-w-md card-shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
            <p className="text-sm text-[color:var(--muted)] mt-2">{message}</p>
          </div>
          <button onClick={onCancel} className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn btn-ghost px-4 py-2">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="btn btn-danger px-4 py-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


