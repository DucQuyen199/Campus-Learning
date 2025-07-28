/*-----------------------------------------------------------------
* File: Loading.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const Loading = ({ size = 'default', message = 'Đang tải...', variant = 'default', fullscreen = true }) => {
  let spinnerSize;
  let textSize;
  let containerClass;
  let iconSize;
  
  switch (size) {
    case 'small':
      spinnerSize = 'h-8 w-8';
      iconSize = 'h-10 w-10';
      textSize = 'text-sm';
      containerClass = fullscreen ? 'min-h-screen' : 'min-h-[200px]';
      break;
    case 'large':
      spinnerSize = 'h-16 w-16';
      iconSize = 'h-20 w-20';
      textSize = 'text-2xl';
      containerClass = 'min-h-screen';
      break;
    default:
      spinnerSize = 'h-12 w-12';
      iconSize = 'h-16 w-16';
      textSize = 'text-lg';
      containerClass = fullscreen ? 'min-h-screen' : 'min-h-[400px]';
  }

  // Color schemes based on variant
  const colorSchemes = {
    default: {
      bg: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900',
      primary: 'border-t-blue-500 border-r-purple-500',
      secondary: 'border-t-pink-400',
      dots: ['bg-blue-500', 'bg-purple-500', 'bg-pink-500'],
      blobs: ['from-blue-400/20 to-purple-600/20', 'from-pink-400/20 to-blue-600/20']
    },
    success: {
      bg: 'bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900',
      primary: 'border-t-green-500 border-r-emerald-500',
      secondary: 'border-t-green-400',
      dots: ['bg-green-500', 'bg-emerald-500', 'bg-teal-500'],
      blobs: ['from-green-400/20 to-emerald-600/20', 'from-teal-400/20 to-green-600/20']
    }
  };

  const colors = colorSchemes[variant] || colorSchemes.default;
  
  const fullscreenClass = fullscreen ? 'fixed inset-0 z-50' : '';
  
  return (
    <div className={`flex flex-col items-center justify-center ${containerClass} ${colors.bg} ${fullscreenClass}`}>
      {/* Modern animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br ${colors.blobs[0]} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br ${colors.blobs[1]} rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700`}></div>
      </div>
      
      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        {/* Modern spinner with gradient or success icon */}
        <div className="relative">
          {variant === 'success' ? (
            <div className="relative">
              <CheckCircleIcon className={`${iconSize} text-green-500 animate-pulse`} />
              <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping"></div>
            </div>
          ) : (
            <>
              <div className={`${spinnerSize} rounded-full border-4 border-gray-200 dark:border-gray-700`}></div>
              <div className={`${spinnerSize} rounded-full border-4 border-transparent ${colors.primary} absolute top-0 left-0 animate-spin`}></div>
              <div className={`${spinnerSize} rounded-full border-2 border-transparent ${colors.secondary} absolute top-0 left-0`} style={{
                animation: 'reverse-spin 1.5s linear infinite'
              }}></div>
            </>
          )}
        </div>
        
        {/* Message with modern styling */}
        <div className="text-center space-y-2">
          <p className={`${textSize} font-semibold text-gray-800 dark:text-gray-200 tracking-wide`}>
            {message}
          </p>
          <div className="flex space-x-1 justify-center">
            <div className={`w-2 h-2 ${colors.dots[0]} rounded-full animate-bounce`}></div>
            <div className={`w-2 h-2 ${colors.dots[1]} rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
            <div className={`w-2 h-2 ${colors.dots[2]} rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
      
      {/* CSS for reverse spin animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes reverse-spin {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }
        `
      }} />
    </div>
  );
};

export default Loading;
