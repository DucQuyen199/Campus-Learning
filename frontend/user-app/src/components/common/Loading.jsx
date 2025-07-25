/*-----------------------------------------------------------------
* File: Loading.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';

const Loading = ({ size = 'default', message = 'Đang tải...' }) => {
  let spinnerSize;
  let textSize;
  
  switch (size) {
    case 'small':
      spinnerSize = 'h-6 w-6';
      textSize = 'text-sm';
      break;
    case 'large':
      spinnerSize = 'h-12 w-12';
      textSize = 'text-xl';
      break;
    default:
      spinnerSize = 'h-8 w-8';
      textSize = 'text-base';
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-700">
      <div className={`animate-spin rounded-full ${spinnerSize} border-t-2 border-b-2 border-blue-500`}></div>
      <p className={`mt-4 ${textSize}`}>{message}</p>
    </div>
  );
};

export default Loading;
