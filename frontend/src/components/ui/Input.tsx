import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none',
        className
      )}
      {...props}
    />
  );
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
