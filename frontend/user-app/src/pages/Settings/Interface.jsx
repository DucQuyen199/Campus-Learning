/*-----------------------------------------------------------------
* File: Interface.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserSettings } from '@/store/slices/userSlice';
import { useTheme } from '@/contexts/ThemeContext';
import { HexColorPicker } from 'react-colorful';

const Interface = () => {
  const dispatch = useDispatch();
  const { settings, loading } = useSelector(state => state.user);
  const [localSettings, setLocalSettings] = useState(settings ? {...settings} : null);
  const { theme, themeColor, setThemeMode, setThemeColor, setCustomColors, availableColors } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [activeColorType, setActiveColorType] = useState('primary');

  // Colors for the custom color picker
  const [customColors, setCustomColorsState] = useState({
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#dbeafe',
    hover: '#2563eb',
    active: '#1d4ed8'
  });

  // Handle settings change
  const handleSettingChange = (category, key, value) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: value
      }
    });

    // Nếu thay đổi theme, cập nhật ThemeContext
    if (category === 'preferences' && key === 'theme') {
      setThemeMode(value);
    }

    // Nếu thay đổi màu chủ đạo, cập nhật ThemeContext
    if (category === 'preferences' && key === 'accentColor') {
      setThemeColor(value);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (category, key) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: !localSettings[category][key]
      }
    });
  };

  // Handle custom color change
  const handleCustomColorChange = (color, type) => {
    setCustomColor(color);
    setCustomColorsState({
      ...customColors,
      [type]: color
    });
  };

  // Apply custom colors
  const applyCustomColors = () => {
    setCustomColors(customColors);
    handleSettingChange('preferences', 'accentColor', 'custom');
    setShowColorPicker(false);
  };

  // Handle settings submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (localSettings) {
      dispatch(updateUserSettings(localSettings));
    }
  };

  // Sync themeColor with localSettings when component mounts
  useEffect(() => {
    if (settings && settings.preferences) {
      if (settings.preferences.theme) {
        setThemeMode(settings.preferences.theme);
      }
      if (settings.preferences.accentColor) {
        setThemeColor(settings.preferences.accentColor);
      }
    }
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-2">
        Giao diện
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Theme Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chủ đề</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => handleSettingChange('preferences', 'theme', 'light')}
                className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                  localSettings?.preferences?.theme === 'light' 
                    ? 'border-theme-primary bg-theme-accent bg-opacity-50' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="h-24 bg-white rounded-lg shadow-inner flex items-center justify-center mb-3">
                  <div className="w-3/4 h-4 bg-theme-primary rounded-md"></div>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Sáng</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Giao diện nền sáng
                </p>
                {localSettings?.preferences?.theme === 'light' && (
                  <div className="absolute top-2 right-2 h-4 w-4 bg-theme-primary rounded-full"></div>
                )}
              </div>
              
              <div 
                onClick={() => handleSettingChange('preferences', 'theme', 'dark')}
                className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                  localSettings?.preferences?.theme === 'dark' 
                    ? 'border-theme-primary bg-theme-accent bg-opacity-20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="h-24 bg-gray-900 rounded-lg shadow-inner flex items-center justify-center mb-3">
                  <div className="w-3/4 h-4 bg-theme-secondary rounded-md"></div>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Tối</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Giao diện nền tối
                </p>
                {localSettings?.preferences?.theme === 'dark' && (
                  <div className="absolute top-2 right-2 h-4 w-4 bg-theme-primary rounded-full"></div>
                )}
              </div>
              
              <div 
                onClick={() => handleSettingChange('preferences', 'theme', 'system')}
                className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                  localSettings?.preferences?.theme === 'system' 
                    ? 'border-theme-primary bg-theme-accent bg-opacity-50 dark:bg-opacity-20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="h-24 bg-gradient-to-r from-white to-gray-900 rounded-lg shadow-inner flex items-center justify-center mb-3">
                  <div className="w-3/4 h-4 bg-purple-500 rounded-md"></div>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Hệ thống</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tự động theo hệ thống
                </p>
                {localSettings?.preferences?.theme === 'system' && (
                  <div className="absolute top-2 right-2 h-4 w-4 bg-theme-primary rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cỡ chữ</h3>
          </div>
          <div className="p-5">
            <div className="max-w-md">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSettingChange('preferences', 'fontSize', 'small')}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm focus:outline-none border-2
                    ${localSettings?.preferences?.fontSize === 'small' ? 
                      'border-theme-primary bg-theme-accent text-theme-primary' : 
                      'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}
                    transition-colors
                  `}
                >
                  Nhỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingChange('preferences', 'fontSize', 'medium')}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-base focus:outline-none border-2
                    ${localSettings?.preferences?.fontSize === 'medium' ? 
                      'border-theme-primary bg-theme-accent text-theme-primary' : 
                      'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}
                    transition-colors
                  `}
                >
                  Vừa
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingChange('preferences', 'fontSize', 'large')}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-lg focus:outline-none border-2
                    ${localSettings?.preferences?.fontSize === 'large' ? 
                      'border-theme-primary bg-theme-accent text-theme-primary' : 
                      'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}
                    transition-colors
                  `}
                >
                  Lớn
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Điều chỉnh kích thước chữ cho toàn bộ ứng dụng
              </p>
            </div>
          </div>
        </div>

        {/* Color Customization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Màu sắc</h3>
          </div>
          <div className="p-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Màu chủ đạo
            </label>
            <div className="grid grid-cols-6 gap-3">
              {availableColors.filter(color => color !== 'custom').map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSettingChange('preferences', 'accentColor', color)}
                  className={`
                    w-10 h-10 rounded-full focus:outline-none border-2
                    ${localSettings?.preferences?.accentColor === color ? 'border-gray-600 dark:border-gray-300' : 'border-transparent'}
                    transition-colors
                  `}
                  style={{
                    backgroundColor: {
                      blue: '#3b82f6',
                      red: '#ef4444',
                      green: '#10b981',
                      purple: '#8b5cf6',
                      orange: '#f97316'
                    }[color]
                  }}
                  aria-label={`Màu ${color}`}
                />
              ))}
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`
                  w-10 h-10 rounded-full focus:outline-none border-2
                  ${localSettings?.preferences?.accentColor === 'custom' ? 'border-gray-600 dark:border-gray-300' : 'border-transparent'}
                  transition-colors bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white flex items-center justify-center
                `}
                aria-label="Tùy chỉnh màu"
              >
                +
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Thay đổi màu chủ đạo của giao diện người dùng
            </p>

            {/* Custom Color Picker */}
            {showColorPicker && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Tùy chỉnh màu sắc</h4>
                    <button 
                      type="button" 
                      onClick={() => setShowColorPicker(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex space-x-3 mb-4">
                    {['primary', 'secondary', 'accent', 'hover', 'active'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActiveColorType(type)}
                        className={`px-3 py-1.5 rounded text-xs font-medium ${
                          activeColorType === type 
                            ? 'bg-theme-primary text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <HexColorPicker 
                        color={customColors[activeColorType]} 
                        onChange={(color) => handleCustomColorChange(color, activeColorType)} 
                      />
                    </div>
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Giá trị hex
                        </label>
                        <input
                          type="text"
                          value={customColors[activeColorType]}
                          onChange={(e) => handleCustomColorChange(e.target.value, activeColorType)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Xem trước
                        </label>
                        <div className="w-full h-24 rounded-md flex items-center justify-center" style={{backgroundColor: customColors.primary}}>
                          <span className="text-white font-bold">Chính</span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-1/2 h-12 rounded-md flex items-center justify-center" style={{backgroundColor: customColors.secondary}}>
                            <span className="text-white text-sm">Phụ</span>
                          </div>
                          <div className="w-1/2 h-12 rounded-md flex items-center justify-center" style={{backgroundColor: customColors.accent}}>
                            <span className="text-gray-800 text-sm">Nhấn</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={applyCustomColors}
                      className="px-4 py-2 bg-theme-primary text-white rounded-md hover:bg-theme-hover"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Layout Options */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bố cục</h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hiển thị thanh bên
              </label>
              <div className="relative">
                <select
                  value={localSettings?.preferences?.sidebarPosition || 'left'}
                  onChange={(e) => handleSettingChange('preferences', 'sidebarPosition', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="left">Bên trái</option>
                  <option value="right">Bên phải</option>
                  <option value="hidden">Ẩn</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Vị trí hiển thị của thanh điều hướng bên
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Hiệu ứng chuyển động</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bật/tắt hiệu ứng chuyển động trong giao diện người dùng</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings?.preferences?.animations !== false}
                  onChange={() => handleCheckboxChange('preferences', 'animations')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full peer bg-gray-200 dark:bg-gray-700 peer-checked:bg-theme-primary
                    peer-focus:ring-4 peer-focus:ring-theme-accent
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                    after:bg-white after:rounded-full after:h-5 after:w-5
                    after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Chế độ tiết kiệm dữ liệu</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Giảm tải hình ảnh và hiệu ứng để tiết kiệm dữ liệu</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings?.preferences?.dataSaver === true}
                  onChange={() => handleCheckboxChange('preferences', 'dataSaver')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full peer bg-gray-200 dark:bg-gray-700 peer-checked:bg-theme-primary
                    peer-focus:ring-4 peer-focus:ring-theme-accent
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                    after:bg-white after:rounded-full after:h-5 after:w-5
                    after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Custom CSS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">CSS tùy chỉnh</h3>
          </div>
          <div className="p-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mã CSS tùy chỉnh
              </label>
              <textarea
                rows="5"
                placeholder="/* Nhập mã CSS tùy chỉnh của bạn tại đây */"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              ></textarea>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Thêm mã CSS tùy chỉnh để điều chỉnh giao diện người dùng. Cài đặt này chỉ áp dụng cho tài khoản của bạn.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md text-white bg-theme-primary hover:bg-theme-hover active:bg-theme-active focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Interface;

