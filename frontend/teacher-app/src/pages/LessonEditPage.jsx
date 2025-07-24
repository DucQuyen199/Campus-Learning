/*-----------------------------------------------------------------
* File: LessonEditPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetModuleLessonsQuery, useUpdateLessonMutation } from '../api/courseApi';
import { 
  ArrowLeftIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  CodeBracketIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const LessonEditPage = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetModuleLessonsQuery(moduleId);
  const [updateLesson, { isLoading: isUpdating }] = useUpdateLessonMutation();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'text',
    videoUrl: '',
    duration: 30,
    orderIndex: 1,
    isPreview: false,
    isPublished: false
  });
  
  const [errors, setErrors] = useState({});
  
  // Find the current lesson from the lessons data and populate form
  useEffect(() => {
    if (data?.lessons) {
      const currentLesson = data.lessons.find(l => l.LessonID.toString() === lessonId);
      if (currentLesson) {
        setFormData({
          title: currentLesson.Title || '',
          description: currentLesson.Description || '',
          content: currentLesson.Content || '',
          type: currentLesson.Type || 'text',
          videoUrl: currentLesson.VideoUrl || '',
          duration: currentLesson.Duration || 30,
          orderIndex: currentLesson.OrderIndex || 1,
          isPreview: currentLesson.IsPreview || false,
          isPublished: currentLesson.IsPublished || false
        });
      }
    }
  }, [data, lessonId]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề bài học không được để trống';
    }
    
    if (formData.type === 'video' && !formData.videoUrl.trim()) {
      newErrors.videoUrl = 'URL video không được để trống';
    } else if (formData.type !== 'video' && !formData.content.trim()) {
      newErrors.content = 'Nội dung bài học không được để trống';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin bài học');
      return;
    }
    
    try {
      await updateLesson({
        lessonId,
        title: formData.title,
        description: formData.description,
        content: formData.content,
        type: formData.type,
        videoUrl: formData.videoUrl,
        duration: parseInt(formData.duration, 10),
        orderIndex: parseInt(formData.orderIndex, 10),
        isPreview: formData.isPreview,
        isPublished: formData.isPublished
      }).unwrap();
      
      toast.success('Cập nhật bài học thành công');
      navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
    } catch (err) {
      console.error('Failed to update lesson:', err);
      toast.error('Có lỗi xảy ra khi cập nhật bài học');
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin bài học...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-500 text-center">
        <p>Không thể tải thông tin bài học. Vui lòng thử lại.</p>
        <p className="mt-2">{error.message || 'Lỗi không xác định'}</p>
      </div>
    );
  }
  
  if (!data?.lessons?.find(l => l.LessonID.toString() === lessonId)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy bài học này.</p>
        <Link to={`/courses/${courseId}/modules/${moduleId}`} className="mt-4 inline-block text-primary-600 hover:underline">
          Quay lại mô-đun
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {/* Back button */}
      <div className="mb-6">
        <Link to={`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại chi tiết bài học
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Chỉnh sửa bài học
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lesson Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại bài học
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                className={`p-3 rounded-md flex flex-col items-center ${
                  formData.type === 'text' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                }`}
                onClick={() => setFormData({ ...formData, type: 'text' })}
              >
                <DocumentTextIcon className="w-6 h-6 text-gray-700 mb-1" />
                <span className="text-sm">Bài học văn bản</span>
              </button>
              
              <button
                type="button"
                className={`p-3 rounded-md flex flex-col items-center ${
                  formData.type === 'video' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                }`}
                onClick={() => setFormData({ ...formData, type: 'video' })}
              >
                <VideoCameraIcon className="w-6 h-6 text-gray-700 mb-1" />
                <span className="text-sm">Bài học video</span>
              </button>
              
              <button
                type="button"
                className={`p-3 rounded-md flex flex-col items-center ${
                  formData.type === 'coding' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                }`}
                onClick={() => setFormData({ ...formData, type: 'coding' })}
              >
                <CodeBracketIcon className="w-6 h-6 text-gray-700 mb-1" />
                <span className="text-sm">Bài tập lập trình</span>
              </button>
              
              <button
                type="button"
                className={`p-3 rounded-md flex flex-col items-center ${
                  formData.type === 'quiz' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                }`}
                onClick={() => setFormData({ ...formData, type: 'quiz' })}
              >
                <ClipboardDocumentCheckIcon className="w-6 h-6 text-gray-700 mb-1" />
                <span className="text-sm">Bài kiểm tra</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề bài học*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`block w-full rounded-md border ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500`}
                placeholder="Nhập tiêu đề bài học"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Nhập mô tả ngắn về bài học"
              />
            </div>
            
            {/* Video URL for video type */}
            {formData.type === 'video' && (
              <div className="md:col-span-2">
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL Video*
                </label>
                <input
                  type="text"
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${
                    errors.videoUrl ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500`}
                  placeholder="Nhập URL video (Youtube, Vimeo...)"
                />
                {errors.videoUrl && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                    {errors.videoUrl}
                  </p>
                )}
              </div>
            )}
            
            {/* Content for non-video types */}
            {formData.type !== 'video' && (
              <div className="md:col-span-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung*
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={8}
                  value={formData.content}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${
                    errors.content ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500`}
                  placeholder={
                    formData.type === 'coding' 
                      ? 'Nhập đề bài và hướng dẫn cho bài tập lập trình' 
                      : formData.type === 'quiz'
                      ? 'Nhập các câu hỏi và lựa chọn cho bài kiểm tra'
                      : 'Nhập nội dung bài học'
                  }
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                    {errors.content}
                  </p>
                )}
              </div>
            )}
            
            {/* Duration & Order */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Thời lượng (phút)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                min="1"
                value={formData.duration}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 mb-1">
                Thứ tự
              </label>
              <input
                type="number"
                id="orderIndex"
                name="orderIndex"
                min="1"
                value={formData.orderIndex}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            
            {/* Checkboxes */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPreview"
                  name="isPreview"
                  checked={formData.isPreview}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPreview" className="ml-2 block text-sm text-gray-700">
                  Cho phép xem trước (không cần đăng ký khóa học)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                  Xuất bản bài học (hiển thị cho học viên)
                </label>
              </div>
            </div>
          </div>
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              to={`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`}
              className="btn btn-outline-secondary"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isUpdating}
              className="btn btn-primary"
            >
              {isUpdating ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonEditPage; 
