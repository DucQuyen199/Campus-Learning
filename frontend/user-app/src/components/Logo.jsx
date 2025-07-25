/*-----------------------------------------------------------------
* File: Logo.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';

const Logo = ({ className = "h-24 w-auto" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 200 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 10h160v40H20z"
        fill="#2563EB"
      />
      <text
        x="100"
        y="37"
        fontFamily="Arial"
        fontSize="24"
        fill="white"
        textAnchor="middle"
        fontWeight="bold"
      >
        CampusLearning
      </text>
      <path
        d="M40 20c0 11.046-8.954 20-20 20V0c11.046 0 20 8.954 20 20z"
        fill="#1E40AF"
      />
      <circle
        cx="180"
        cy="20"
        r="10"
        fill="#60A5FA"
      />
    </svg>
  );
};

export default Logo; 
