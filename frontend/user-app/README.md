# CampusT Student Application

## Tính năng AI Chat

Ứng dụng đã tích hợp tính năng AI Chat sử dụng Gemini API từ Google. Tính năng này cho phép người dùng trò chuyện với AI để nhận hỗ trợ về học tập, lập trình, và các vấn đề liên quan đến công nghệ.

### Cài đặt

1. Cấu hình API key:
   - Đăng ký Gemini API key tại: https://aistudio.google.com/app/apikey
   - Mở file `.env` trong thư mục `frontend/user-app`
   - Thêm API key vào biến môi trường `VITE_GEMINI_API_KEY`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

### Sử dụng

1. Truy cập vào trang AI Chat từ menu chính hoặc đường dẫn `/ai-chat`
2. Nhập câu hỏi vào ô nhập liệu và nhấn Enter hoặc nhấn nút gửi
3. AI sẽ xử lý và trả lời câu hỏi của bạn

### Tính năng chính

- Hỗ trợ định dạng Markdown trong phản hồi từ AI
- Lưu trữ lịch sử cuộc trò chuyện trong phiên hiện tại
- Khả năng đặt lại cuộc trò chuyện
- Giao diện thân thiện, dễ sử dụng

### Giới hạn

- Gemini API có giới hạn số lượng token cho mỗi phiên
- Một số chủ đề nhạy cảm có thể bị hạn chế theo chính sách của Google

### Tham khảo

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [Gemini API Documentation](https://ai.google.dev/docs/gemini_api_overview)

## API Integration Notes

- All API calls should use the `/api` prefix (e.g., `/api/competitions/1` instead of `/competitions/1`)
- The base API URL is configured in `.env` as `VITE_API_URL`
- When using direct `fetch` calls, make sure to include the `/api` prefix in the URL path
- Utility functions in `src/api/` folders already include the proper prefixes

# Campust User App Frontend

The frontend application for the Campust learning platform.

## Features

- Modern React-based learning platform
- Interactive code editor with syntax highlighting
- Docker-based code execution backend
- Support for JavaScript, Python, C++, Java, and C#
- Real-time notifications and chat
- Course enrollment and progress tracking

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file and modify it for your environment:

```bash
cp .env.example .env
```

4. Start the development server:

```bash
npm run dev
```

## Code Execution

The application uses a Docker-based code execution system for running code in various programming languages. This offers several advantages:

- Better language support - all programming languages can be supported regardless of browser compatibility
- More consistent execution environment
- Better resource isolation and security
- Easier to update and maintain language runtimes

The backend API handles all code execution inside Docker containers and returns the results to the frontend.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run serve` - Serve the production build locally
- `npm run lint` - Lint the code
- `npm run test` - Run tests

## Environment Variables

The following environment variables can be set in the `.env` file:

- `VITE_API_URL` - The URL of the backend API
- `VITE_WEBSOCKET_URL` - The URL of the WebSocket server
- `VITE_ENABLE_ANALYTICS` - Whether to enable analytics
- `VITE_ENVIRONMENT` - The environment (development, staging, production)

# Docker-based Code Execution

The application uses a Docker-based code execution system to run user code safely in competitions and course exercises. This document explains how it's implemented and how to work with it.

## Overview

Code execution is handled through Docker containers on the backend, with fallbacks for specific languages when Docker isn't available.

### Components

1. **CodeRunner Utility**: `src/utils/codeRunner.js` - Client-side interface for code execution
2. **Competition Integration**: `src/pages/Competitions/CompetitionDetail.jsx` - Code execution in competitions
3. **Course Integration**: `src/pages/Courses/CourseLearning.jsx` - Code execution in course exercises

## How It Works

1. Frontend initializes the code execution environment through `codeRunner.initialize()`
2. Code is submitted through the `runCode()` method
3. Backend executes the code in a Docker container
4. Results are returned to the frontend for display

### Supported Languages

The system supports these languages:

- JavaScript (Node.js) - Always supported (fallback to in-browser execution)
- Python - Always supported (fallback to backend VM)
- C++ (GCC) - Requires Docker
- Java (OpenJDK) - Requires Docker
- C# (.NET) - Requires Docker
- Rust - Experimental support, requires Docker

## Implementation Details

### CodeRunner Utility

The `codeRunner.js` utility provides these key methods:

```javascript
// Initialize runtime and check Docker availability
await codeRunner.initialize();

// Execute code in any supported language
const result = await codeRunner.runCode({
  code: "console.log('Hello, world!');",
  language: "javascript",
  stdin: "optional input"
});

// Check if a language is supported
const isSupported = codeRunner.isLanguageSupported("python");

// Get detailed support information
const languageInfo = codeRunner.getLanguageSupportInfo("java");
```

### Docker Availability

The system checks Docker availability on initialization:

```javascript
// Docker availability flag
const isDockerAvailable = codeRunner.dockerAvailable;

// Show appropriate UI based on availability
if (!isDockerAvailable) {
  // Show warning about limited language support
}
```

## Integration with Components

### Competition Integration

In CompetitionDetail.jsx, Docker initialization happens when users enter competitions:

```javascript
// Initialize before competitions
const initializeCodeRuntime = async () => {
  const initialized = await codeRunner.initialize();
  // Check Docker availability
  const isDockerAvailable = codeRunner.dockerAvailable;
  // Update UI based on support
};
```

### Course Integration

In CourseLearning.jsx, the code editor integrates with Docker:

```javascript
// Execute code in the editor
const executeCode = async () => {
  // Check language support
  const languageInfo = codeRunner.getLanguageSupportInfo(selectedLanguage);
  
  // Execute through Docker if available
  const result = await codeRunner.runCode({
    code: editorContent,
    language: selectedLanguage,
    stdin: stdinInput
  });
  
  // Display results in console
};
```

## Troubleshooting

### Docker Not Available

If Docker isn't available on the backend:
1. JavaScript will still work through client-side and server-side fallbacks
2. Python will work if the Python interpreter is available on the server
3. Other languages (C++, Java, C#, Rust) won't work and will display error messages

### Connection Issues

If you see "Error executing code" messages:
1. Check if the backend server is running
2. Verify Docker is running on the backend server
3. Check network connectivity between frontend and backend 