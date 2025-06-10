import React, { createContext, useContext, useState, useEffect } from 'react';

// Định nghĩa các bảng màu theo chủ đề
const themeColors = {
  blue: {
    primary: '#3b82f6', // blue-500
    secondary: '#60a5fa', // blue-400
    accent: '#dbeafe', // blue-100
    hover: '#2563eb', // blue-600
    active: '#1d4ed8', // blue-700
  },
  red: {
    primary: '#ef4444', // red-500
    secondary: '#f87171', // red-400
    accent: '#fee2e2', // red-100
    hover: '#dc2626', // red-600
    active: '#b91c1c', // red-700
  },
  green: {
    primary: '#10b981', // green-500
    secondary: '#34d399', // green-400
    accent: '#d1fae5', // green-100
    hover: '#059669', // green-600
    active: '#047857', // green-700
  },
  purple: {
    primary: '#8b5cf6', // purple-500
    secondary: '#a78bfa', // purple-400
    accent: '#ede9fe', // purple-100
    hover: '#7c3aed', // purple-600
    active: '#6d28d9', // purple-700
  },
  orange: {
    primary: '#f97316', // orange-500
    secondary: '#fb923c', // orange-400
    accent: '#ffedd5', // orange-100
    hover: '#ea580c', // orange-600
    active: '#c2410c', // orange-700
  },
  // Cho phép tùy chỉnh màu riêng
  custom: {
    primary: '#3b82f6', // Mặc định bắt đầu với blue
    secondary: '#60a5fa',
    accent: '#dbeafe',
    hover: '#2563eb',
    active: '#1d4ed8',
  }
};

// Định nghĩa CSS Variables cho các màu sắc theme
const generateCSSVariables = (colors) => {
  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-hover': colors.hover,
    '--color-active': colors.active,
  };
};

// Tạo context
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Lấy theme từ localStorage hoặc dùng theme mặc định
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedColor = localStorage.getItem('themeColor');
    
    return {
      mode: savedTheme || 'light',
      color: savedColor || 'blue',
      customColors: JSON.parse(localStorage.getItem('customColors')) || null
    };
  });

  // Cập nhật lưu trữ cục bộ và áp dụng theme khi thay đổi
  useEffect(() => {
    localStorage.setItem('theme', currentTheme.mode);
    localStorage.setItem('themeColor', currentTheme.color);
    
    // Áp dụng dark mode
    if (currentTheme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Áp dụng các màu sắc theme
    let colors;
    if (currentTheme.color === 'custom' && currentTheme.customColors) {
      colors = currentTheme.customColors;
    } else {
      colors = themeColors[currentTheme.color];
    }

    const cssVariables = generateCSSVariables(colors);
    Object.entries(cssVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });

    // Lưu custom colors nếu có
    if (currentTheme.customColors) {
      localStorage.setItem('customColors', JSON.stringify(currentTheme.customColors));
    }
  }, [currentTheme]);

  // Hàm thay đổi theme
  const setThemeMode = (mode) => {
    setCurrentTheme(prev => ({ ...prev, mode }));
  };

  // Hàm thay đổi màu sắc theme
  const setThemeColor = (color) => {
    setCurrentTheme(prev => ({ ...prev, color }));
  };

  // Hàm đặt màu sắc tùy chỉnh
  const setCustomColors = (colors) => {
    setCurrentTheme(prev => ({
      ...prev,
      color: 'custom',
      customColors: colors
    }));
  };

  // Giá trị của context
  const value = {
    theme: currentTheme.mode,
    themeColor: currentTheme.color,
    colors: currentTheme.color === 'custom' && currentTheme.customColors 
      ? currentTheme.customColors 
      : themeColors[currentTheme.color],
    setThemeMode,
    setThemeColor,
    setCustomColors,
    availableColors: Object.keys(themeColors)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 