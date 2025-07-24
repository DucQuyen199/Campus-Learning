/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const OtherCourses = () => {
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: 'Tiếng Anh cho IT',
      description: 'Khóa học tiếng Anh chuyên ngành cho lập trình viên',
      instructor: 'John Doe',
      duration: '40 giờ',
      level: 'Trung cấp',
      category: 'language',
      thumbnail: '/course-thumbnails/english.jpg'
    },
    {
      id: 2,
      title: 'Kỹ năng mềm cho Developer',
      description: 'Phát triển kỹ năng giao tiếp và làm việc nhóm',
      instructor: 'Jane Smith',
      duration: '20 giờ',
      level: 'Cơ bản',
      category: 'soft-skills',
      thumbnail: '/course-thumbnails/soft-skills.jpg'
    },
    // Thêm các khóa học khác...
  ]);

  const [filters, setFilters] = useState({
    category: 'all',
    level: 'all',
    search: ''
  });

  const filteredCourses = courses.filter(course => {
    const matchesCategory = filters.category === 'all' || course.category === filters.category;
    const matchesLevel = filters.level === 'all' || course.level === filters.level;
    const matchesSearch = course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         course.description.toLowerCase().includes(filters.search.toLowerCase());
    return matchesCategory && matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Các khóa học khác</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="all">Tất cả</option>
              <option value="language">Ngoại ngữ</option>
              <option value="soft-skills">Kỹ năng mềm</option>
              <option value="business">Kinh doanh</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trình độ
            </label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="all">Tất cả</option>
              <option value="Cơ bản">Cơ bản</option>
              <option value="Trung cấp">Trung cấp</option>
              <option value="Nâng cao">Nâng cao</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Tìm kiếm khóa học..."
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48 bg-gray-200">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{course.description}</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>
                  <span className="font-medium">Giảng viên:</span> {course.instructor}
                </p>
                <p>
                  <span className="font-medium">Thời lượng:</span> {course.duration}
                </p>
                <p>
                  <span className="font-medium">Trình độ:</span> {course.level}
                </p>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Đăng ký học
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không tìm thấy khóa học nào phù hợp với điều kiện tìm kiếm
        </div>
      )}
    </div>
  );
};

export default OtherCourses; 
