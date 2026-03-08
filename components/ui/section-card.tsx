import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <div
      className={`rounded-3xl border border-[#D6EAF7] bg-white p-6 shadow-sm ${className}`}
    >
      {title ? (
        <h2 className="text-xl font-semibold text-[#0A2342]">{title}</h2>
      ) : null}

      {subtitle ? (
        <p className="mt-1 text-sm text-[#5B778F]">{subtitle}</p>
      ) : null}

      <div className={title || subtitle ? "mt-5" : ""}>{children}</div>
    </div>
  );
}