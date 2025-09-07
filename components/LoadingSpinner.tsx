
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div
      className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
