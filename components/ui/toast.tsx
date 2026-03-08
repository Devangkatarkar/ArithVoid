"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  open: boolean;
  onClose: () => void;
};

export default function Toast({
  message,
  type = "info",
  open,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  const styles =
    type === "success"
      ? "border-[#BFE6D1] bg-[#F2FBF6] text-[#1D6B46]"
      : type === "error"
      ? "border-[#F2C9C9] bg-[#FFF5F5] text-[#B42318]"
      : "border-[#D6EAF7] bg-white text-[#0A2342]";

  const icon =
    type === "success" ? "✓" : type === "error" ? "!" : "i";

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100]">
      <div
        className={`pointer-events-auto min-w-[280px] max-w-sm rounded-2xl border px-4 py-3 shadow-[0_14px_40px_rgba(10,35,66,0.12)] ${styles}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 text-sm font-semibold">
            {icon}
          </div>
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}