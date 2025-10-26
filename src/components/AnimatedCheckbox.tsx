import React from 'react';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-card-bg focus:ring-theme-brand-primary ${
        checked
          ? 'bg-theme-brand-primary border-theme-brand-primary'
          : 'bg-transparent border-theme-input-border hover:border-theme-brand-primary'
      }`}
    >
      <svg
        className={`w-3 h-3 text-white transition-transform duration-300 ease-in-out transform-gpu ${
          checked ? 'scale-100' : 'scale-0'
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </button>
  );
};

export default AnimatedCheckbox;