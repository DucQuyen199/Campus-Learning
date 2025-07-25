/*-----------------------------------------------------------------
* File: Button.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const Button = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  type = 'button',
  disabled = false,
  fullWidth = false,
  ...rest 
}) => {
  const { theme } = useTheme();
  
  // Base styles
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Variant styles with theme-aware colors
  const variantClasses = {
    primary: 'bg-theme-primary hover:bg-theme-hover text-white focus:ring-theme-primary',
    secondary: 'bg-theme-secondary hover:bg-theme-hover text-white focus:ring-theme-secondary',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400',
    info: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400',
    light: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white focus:ring-gray-300 dark:focus:ring-gray-700',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-700',
    link: 'bg-transparent text-theme-primary hover:text-theme-hover hover:underline p-0 focus:ring-theme-primary'
  };
  
  // Size styles
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  };
  
  // Width styles
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Disabled styles
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';
  
  // Combine all classes
  const buttonClasses = `
    ${baseClasses} 
    ${variantClasses[variant] || variantClasses.primary} 
    ${sizeClasses[size] || sizeClasses.md}
    ${widthClasses}
    ${disabledClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button; 
