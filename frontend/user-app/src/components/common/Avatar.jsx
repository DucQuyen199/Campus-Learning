import React from 'react';

const Avatar = ({ src, alt, name, className = '', size = 'medium', onClick }) => {
  const sizeClasses = {
    tiny: 'h-6 w-6',
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xl: 'h-24 w-24',
    xxl: 'h-32 w-32'
  };
  
  // Determine the actual pixel size for UI Avatars
  const pixelSizes = {
    tiny: 24,
    small: 32,
    medium: 48,
    large: 64,
    xl: 96,
    xxl: 128
  };
  
  // Improved classes to ensure proper image display in circular frame
  const defaultClass = `rounded-full ${sizeClasses[size]} object-cover object-center flex-shrink-0`;
  const combinedClass = className ? `${defaultClass} ${className}` : defaultClass;
  
  // Generate UI Avatars URL with the name (if provided) or a default "User" text
  const getUiAvatarUrl = () => {
    const displayName = name || alt || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=${pixelSizes[size]}&rounded=true`;
  };
  
  // Get a valid image source or fallback to UI Avatars
  const getImageSource = () => {
    // If src is provided directly, use it
    if (src && typeof src === 'string' && src.trim() !== '') {
      return src;
    }
    
    // Otherwise, generate UI Avatars URL
    return getUiAvatarUrl();
  };
  
  // Use UI Avatars as fallback
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = getUiAvatarUrl();
  };
  
  // Get the image source using our helper
  const imageSrc = getImageSource();
  
  return (
    <div 
      className={`overflow-hidden rounded-full ${sizeClasses[size]} bg-gray-100 flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
      onClick={onClick}
    >
      <img 
        src={imageSrc} 
        alt={alt || name || 'User avatar'} 
        className="w-full h-full object-cover object-center"
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

export default Avatar; 