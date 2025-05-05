import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCoursesQuery } from '../api/courseApi';
import { AcademicCapIcon, PlusIcon } from '@heroicons/react/24/outline';

const CoursesPage = () => {
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    category: '',
  });
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useGetCoursesQuery({ 
    ...filter, 
    page, 
    limit: 10 
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset page when filter changes
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
        <Link 
          to="/courses/create" 
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="form-label">Search</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filter.search}
              onChange={handleFilterChange}
              placeholder="Search courses..."
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="status" className="form-label">Status</label>
            <select
              id="status"
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              name="category"
              value={filter.category}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Categories</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-500 text-center">
          Failed to load courses. Please try again.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.courses?.map((course) => (
              <Link
                key={course.CourseID}
                to={`/courses/${course.CourseID}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-gray-200 relative">
                  {course.Image ? (
                    <img
                      src={course.Image}
                      alt={course.Title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-100">
                      <AcademicCapIcon className="w-16 h-16 text-primary-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white text-xs font-medium px-2 py-1 rounded-full">
                    {course.Status}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">{course.Title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.Description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      {course.EnrollmentsCount} students
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {course.ModulesCount} modules
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center">
                <button
                  onClick={() => setPage(page => Math.max(page - 1, 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-md mr-2 border border-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {page} of {data.pagination.totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(page => Math.min(page + 1, data.pagination.totalPages))}
                  disabled={page >= data.pagination.totalPages}
                  className="px-3 py-1 rounded-md ml-2 border border-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}

          {data?.courses?.length === 0 && (
            <div className="text-center py-12">
              <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-xl font-medium text-gray-700">No courses found</h3>
              <p className="mt-2 text-gray-500">Try adjusting your filters or create a new course.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CoursesPage; 