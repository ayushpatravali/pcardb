import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary-100 text-primary-800',
                accent: 'border-transparent bg-accent-100 text-accent-800',
                success: 'border-transparent bg-emerald-100 text-emerald-800',
                warning: 'border-transparent bg-amber-100 text-amber-800',
                outline: 'border-stone-200 text-stone-600',
            },
        },
        defaultVariants: { variant: 'default' },
    }
);

function Badge({ className, variant, ...props }) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
