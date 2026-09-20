import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('flex min-h-[48px] w-full rounded-xl border-2 border-ink bg-[#FFFEF9] px-4 py-2 text-base font-medium placeholder:text-ink-soft/60 placeholder:font-normal focus:bg-white focus:outline-none focus:shadow-[3px_3px_0_#FFC52E]', className)} {...props} />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('flex min-h-[120px] w-full rounded-xl border-2 border-ink bg-[#FFFEF9] px-4 py-3 text-base leading-relaxed placeholder:text-ink-soft/60 focus:bg-white focus:outline-none focus:shadow-[3px_3px_0_#FFC52E] paper-lines', className)} {...props} />
));
Textarea.displayName = 'Textarea';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  <label ref={ref} className={cn('text-sm font-bold text-ink', className)} {...props} />
));
Label.displayName = 'Label';

export { Input, Textarea, Label };
