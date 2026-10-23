import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    <a href="#main-content" className="skip-to-content focus:not-sr-only">
      Skip to main content
    </a>
  );
};
