import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface LoaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
};

const innerLogoSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-18 h-18'
};

export function LogoLoader({ className, size = 'md' }: LoaderProps) {
    return (
        <div className={cn('relative flex items-center justify-center', className)}>
            {/* Outer spinning border */}
            <div
                className={cn(
                    'absolute border-4 border-t-primary border-r-primary/30 border-b-primary/30 border-l-primary/30 rounded-full animate-spin',
                    sizeClasses[size]
                )}
                style={{
                    animationDuration: '1s',
                    animationTimingFunction: 'linear'
                }}
            />
            {/* Static logo in the center */}
            <img
                src={logo}
                alt="Loading..."
                className={cn(
                    'object-contain',
                    innerLogoSizeClasses[size]
                )}
            />
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <LogoLoader size="xl" />
        </div>
    );
}
