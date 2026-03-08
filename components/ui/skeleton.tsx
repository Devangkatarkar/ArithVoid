type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-[#E7F3FB] via-[#DCEEF9] to-[#E7F3FB] ${className}`}
    />
  );
}