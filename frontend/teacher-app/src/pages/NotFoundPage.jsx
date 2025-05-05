import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center px-4">
      <h1 className="text-9xl font-bold text-primary-500">404</h1>
      <h2 className="text-3xl font-semibold text-gray-800 mt-4">Không Tìm Thấy Trang</h2>
      <p className="text-gray-600 mt-2 max-w-md">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 btn btn-primary px-6 py-3"
      >
        Đi đến Tổng Quan
      </Link>
    </div>
  );
};

export default NotFoundPage; 