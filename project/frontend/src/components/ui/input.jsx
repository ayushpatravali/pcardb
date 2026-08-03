import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
    <input
        type={type}
        ref={ref}
        className={cn(
            'flex w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 read-only:cursor-not-allowed read-only:border-stone-200 read-only:bg-stone-100 read-only:font-bold read-only:text-stone-700 disabled:cursor-not-allowed disabled:opacity-50',
            className
        )}
        {...props}
    />
));
Input.displayName = 'Input';

export { Input };
