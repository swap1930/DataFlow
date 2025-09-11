import React from 'react';

// Define props interface for type safety and customization
interface LoaderProps {
  size?: string; // Size of the loader (e.g., 'h-32 w-32', 'h-16 w-16')
  borderColor?: string; // Border color class (e.g., 'border-blue-600')
  borderWidth?: string; // Border thickness (e.g., 'border-b-2')
  className?: string; // Additional classes for customization
  ariaLabel?: string; // Accessibility label
}

const Loader: React.FC<LoaderProps> = ({
  size = 'h-32 w-32',
  borderColor = 'border-blue-600',
  borderWidth = 'border-b-2',
  className = '',
  ariaLabel = 'Loading',
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full ${size} ${borderWidth} ${borderColor} border-t-transparent`}
        role="status"
        aria-label={ariaLabel}
      >
        <span className="sr-only">{ariaLabel}</span>
      </div>
    </div>
  );
};

export default Loader;