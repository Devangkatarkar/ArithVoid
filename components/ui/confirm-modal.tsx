"use client";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0A2342]/35 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-3xl border border-[#D6EAF7] bg-white p-6 shadow-[0_24px_60px_rgba(10,35,66,0.18)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF6FD] text-xl">
          ⚠️
        </div>

        <h3 className="mt-4 text-xl font-semibold text-[#0A2342]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#5B778F]">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[#C6E2F2] bg-white px-4 py-2 text-sm font-medium text-[#0A2342] transition hover:bg-[#F4FAFE] disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-[#0A2342] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#123A63] disabled:opacity-60"
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}