import React from 'react';

export const BankIllustration = ({ className = "bank-illustration", color = "#F3D2DB" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bank illustration"
    >
      {/* Triangular Pediment / Roof */}
      <path
        d="M80 12 L148 48 H12 L80 12Z"
        fill={color}
      />
      
      {/* Architrave / Upper Beam */}
      <rect
        x="16"
        y="50"
        width="128"
        height="10"
        rx="2"
        fill={color}
      />
      
      {/* 4 Classical Columns */}
      <rect x="28" y="64" width="16" height="54" rx="2" fill={color} />
      <rect x="58" y="64" width="16" height="54" rx="2" fill={color} />
      <rect x="86" y="64" width="16" height="54" rx="2" fill={color} />
      <rect x="116" y="64" width="16" height="54" rx="2" fill={color} />
      
      {/* Base Podium / Stepped Foundation */}
      <rect
        x="16"
        y="120"
        width="128"
        height="8"
        rx="2"
        fill={color}
      />
      <rect
        x="10"
        y="128"
        width="140"
        height="8"
        rx="2"
        fill={color}
      />
    </svg>
  );
};

export default BankIllustration;
