type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
};

export default function EmptyState({
  icon = "📁",
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[#C6E2F2] bg-[#F9FCFE] p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF6FD] text-3xl">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#0A2342]">{title}</h3>
      <p className="mt-2 text-sm text-[#5B778F]">{description}</p>
    </div>
  );
}