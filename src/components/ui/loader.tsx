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

export function LogoLoader({ className, size = 'md' }: LoaderProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img
        src={logo}
        alt="Loading..."
        className={cn(
          'animate-spin',
          sizeClasses[size]
        )}
        style={{
          animationDuration: '1.5s',
          animationTimingFunction: 'ease-in-out'
        }}
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
