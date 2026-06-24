import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({
  className = '',
  height = 16,
  width = 100,
  radius = 'sm',
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[radius];

  const heightStr = typeof height === 'number' ? `${height}px` : height;
  const widthStr = typeof width === 'number' ? `${width}%` : width;

  return (
    <div
      className={cn(baseClasses, radiusClasses, className)}
      style={{ height: heightStr, width: widthStr }}
    />
  );
}