/*-----------------------------------------------------------------
* File: chatUpload.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Chat file upload middleware supporting documents and media
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads cho chat nếu chưa tồn tại
const createChatUploadDirs = () => {
  const dirs = [
    'uploads/chat',
    'uploads/chat/documents',
    'uploads/chat/images',
    'uploads/chat/videos',
    'uploads/chat/audio'
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createChatUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mimeType = file.mimetype;
    
    // Phân loại file theo mime type
    if (mimeType.startsWith('image/')) {
      cb(null, 'uploads/chat/images');
    } else if (mimeType.startsWith('video/')) {
      cb(null, 'uploads/chat/videos');
    } else if (mimeType.startsWith('audio/')) {
      cb(null, 'uploads/chat/audio');
    } else {
      // Documents và các file khác
      cb(null, 'uploads/chat/documents');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

// Danh sách các loại file được phép
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    
    // Videos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
    
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    
    // Documents - Microsoft Office
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/msword', // .doc
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-powerpoint', // .ppt
    
    // PDF
    'application/pdf',
    
    // Text files
    'text/plain', 'text/csv',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    
    // Others
    'application/json',
    'application/xml'
  ];
  
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
    '.mp4', '.mpeg', '.mov', '.webm',
    '.mp3', '.wav', '.ogg', '.m4a',
    '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt',
    '.pdf', '.txt', '.csv',
    '.zip', '.rar', '.7z',
    '.json', '.xml'
  ];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Không hỗ trợ định dạng file ${fileExtension}. Chỉ hỗ trợ: ${allowedExtensions.join(', ')}`), false);
  }
};

// Hàm kiểm tra kích thước file theo loại
const getFileSizeLimit = (mimeType) => {
  if (mimeType.startsWith('video/')) {
    return 200 * 1024 * 1024; // 200MB cho video
  } else if (mimeType.startsWith('image/')) {
    return 10 * 1024 * 1024; // 10MB cho hình ảnh
  } else if (mimeType.startsWith('audio/')) {
    return 50 * 1024 * 1024; // 50MB cho audio
  } else {
    return 100 * 1024 * 1024; // 100MB cho documents
  }
};

const chatUploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // Giới hạn tối đa 200MB
    files: 5 // Tối đa 5 files cùng lúc
  }
});

// Middleware kiểm tra kích thước file chi tiết
const validateFileSize = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const sizeLimit = getFileSizeLimit(file.mimetype);
      if (file.size > sizeLimit) {
        const sizeLimitMB = Math.round(sizeLimit / (1024 * 1024));
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} vượt quá giới hạn ${sizeLimitMB}MB`
        });
      }
    }
  } else if (req.file) {
    const sizeLimit = getFileSizeLimit(req.file.mimetype);
    if (req.file.size > sizeLimit) {
      const sizeLimitMB = Math.round(sizeLimit / (1024 * 1024));
      return res.status(400).json({
        success: false,
        message: `File ${req.file.originalname} vượt quá giới hạn ${sizeLimitMB}MB`
      });
    }
  }
  next();
};

// Hàm helper để lấy loại file
const getFileType = (mimeType, filename) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  const ext = path.extname(filename).toLowerCase();
  if (['.doc', '.docx'].includes(ext)) return 'document_word';
  if (['.xls', '.xlsx'].includes(ext)) return 'document_excel';
  if (['.ppt', '.pptx'].includes(ext)) return 'document_powerpoint';
  if (ext === '.pdf') return 'document_pdf';
  if (['.txt', '.csv'].includes(ext)) return 'document_text';
  if (['.zip', '.rar', '.7z'].includes(ext)) return 'archive';
  
  return 'document';
};

// Hàm helper để format kích thước file
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  chatUploadMiddleware,
  validateFileSize,
  getFileType,
  formatFileSize
}; 