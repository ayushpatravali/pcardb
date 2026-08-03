import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary-700 text-white shadow-sm hover:bg-primary-800',
                secondary: 'bg-primary-50 text-primary-800 border border-primary-200 hover:bg-primary-100',
                outline: 'border border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-50 hover:text-stone-900',
                ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                accent: 'bg-accent-400 text-primary-950 shadow-sm hover:bg-accent-500',
                destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 rounded-lg px-3 text-xs',
                lg: 'h-12 rounded-xl px-6 text-base',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
));
Button.displayName = 'Button';

export { Button, buttonVariants };
