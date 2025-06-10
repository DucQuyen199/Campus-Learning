import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  onClick,
  hoverable = false,
  bordered = true,
  shadow = 'md',
  padding = 'md' 
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg';
  
  const hoverableClass = hoverable ? 'cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg' : '';
  
  const borderClass = bordered ? 'border border-gray-200 dark:border-gray-700' : '';
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const paddingClasses = {
    none: 'p-0',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  const cardClasses = `
    ${baseClasses}
    ${hoverableClass}
    ${borderClass}
    ${shadowClasses[shadow] || shadowClasses.md}
    ${paddingClasses[padding] || paddingClasses.md}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <div 
      className={cardClasses}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card; 