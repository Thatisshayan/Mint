import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full font-bold uppercase tracking-[0.2em] transition-colors duration-200 disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-mint-500 text-mint-950 shadow-[0_20px_40px_rgba(13,148,136,.35)] hover:brightness-110',
        ghost: 'border border-white/10 hover:bg-white/5',
      },
      size: {
        md: 'h-12 px-6 text-sm',
        sm: 'h-9 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
