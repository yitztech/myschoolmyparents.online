import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 min-h-[48px] min-w-[48px] px-4 py-2 border-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-ink text-paper border-ink shadow-[3px_3px_0_#FFC52E] hover:bg-[#39334F] hover:shadow-[4px_4px_0_#FFC52E]',
        sunny: 'bg-sun text-ink border-ink shadow-[3px_3px_0_#262134] hover:bg-[#FFD25E]',
        coral: 'bg-coral text-white border-ink shadow-[3px_3px_0_#262134] hover:bg-[#E04415]',
        leaf: 'bg-leaf text-white border-ink shadow-[3px_3px_0_#262134] hover:bg-leaf-deep',
        secondary: 'bg-white text-ink border-ink shadow-[3px_3px_0_#262134] hover:bg-paper-deep',
        outline: 'border-ink bg-paper hover:bg-paper-deep shadow-none',
        ghost: 'border-transparent shadow-none hover:bg-paper-deep hover:border-ink',
        destructive: 'bg-white text-coral-deep border-coral-deep shadow-[3px_3px_0_#B9320A] hover:bg-[#FFF0E8]',
      },
      size: { default: '', sm: 'min-h-[40px] px-3 text-[13px] rounded-lg', lg: 'px-6 py-3 text-base', icon: 'p-2' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
