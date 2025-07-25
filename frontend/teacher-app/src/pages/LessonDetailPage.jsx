/*-----------------------------------------------------------------
* File: LessonDetailPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetModuleLessonsQuery } from '../api/courseApi';
import { 
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  CodeBracketIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const LessonDetailPage = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const { data, error, isLoading } = useGetModuleLessonsQuery(moduleId);
  
  // Find the current lesson from the lessons data
  const currentLesson = data?.lessons?.find(l => l.LessonID.toString() === lessonId);
  
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
  
  if (!currentLesson) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy bài học này.</p>
        <Link to={`/courses/${courseId}/modules/${moduleId}`} className="mt-4 inline-block text-primary-600 hover:underline">
          Quay lại mô-đun
        </Link>
      </div>
    );
  }
  
  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoCameraIcon className="w-8 h-8 text-primary-500" />;
      case 'coding':
        return <CodeBracketIcon className="w-8 h-8 text-primary-500" />;
      case 'quiz':
        return <ClipboardDocumentCheckIcon className="w-8 h-8 text-primary-500" />;
      default:
        return <DocumentTextIcon className="w-8 h-8 text-primary-500" />;
    }
  };
  
  return (
    <div>
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Link to={`/courses/${courseId}/modules/${moduleId}`} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại mô-đun
        </Link>
        <div>
          <Link 
            to={`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/edit`} 
            className="btn btn-outline-primary flex items-center"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Chỉnh sửa bài học
          </Link>
        </div>
      </div>
      
      {/* Lesson header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start mb-4">
          <div className="mr-4">
            {getLessonIcon(currentLesson.Type)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{currentLesson.Title}</h1>
            {currentLesson.Description && (
              <p className="mt-2 text-gray-600">{currentLesson.Description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                {currentLesson.Type === 'video' ? 'Bài học video' : 
                 currentLesson.Type === 'coding' ? 'Bài tập lập trình' :
                 currentLesson.Type === 'quiz' ? 'Bài kiểm tra' : 'Bài học văn bản'}
              </span>
              {currentLesson.Duration && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                  {currentLesson.Duration} phút
                </span>
              )}
              {currentLesson.IsPreview && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                  Cho phép xem trước
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Lesson content */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Nội dung bài học</h2>
        
        {currentLesson.Type === 'video' ? (
          <div>
            <div className="aspect-w-16 aspect-h-9 mb-4">
              {currentLesson.VideoUrl ? (
                <iframe
                  src={currentLesson.VideoUrl}
                  title={currentLesson.Title}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                  <p className="text-gray-500">Video URL chưa được cung cấp</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900">URL Video:</h3>
              <p className="text-gray-600 mt-1">{currentLesson.VideoUrl || 'Không có URL video'}</p>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            {currentLesson.Content ? (
              <div dangerouslySetInnerHTML={{ __html: currentLesson.Content }} />
            ) : (
              <p className="text-gray-500">Không có nội dung bài học</p>
            )}
          </div>
        )}
      </div>
      
      {/* Coding exercises (if applicable) */}
      {currentLesson.Type === 'coding' && currentLesson.exercises && currentLesson.exercises.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Bài tập lập trình</h2>
          
          <div className="space-y-4">
            {currentLesson.exercises.map((exercise) => (
              <div key={exercise.ExerciseID} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{exercise.Title}</h3>
                <p className="text-gray-600 mt-1">{exercise.Description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {exercise.ProgrammingLanguage}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                    {exercise.Difficulty}
                  </span>
                  {exercise.Points > 0 && (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                      {exercise.Points} điểm
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Meta information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin bổ sung</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900">Thứ tự:</h3>
            <p className="text-gray-600 mt-1">{currentLesson.OrderIndex}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Trạng thái:</h3>
            <p className="text-gray-600 mt-1">
              {currentLesson.IsPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Ngày tạo:</h3>
            <p className="text-gray-600 mt-1">
              {new Date(currentLesson.CreatedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Cập nhật lần cuối:</h3>
            <p className="text-gray-600 mt-1">
              {currentLesson.UpdatedAt ? new Date(currentLesson.UpdatedAt).toLocaleString() : 'Chưa cập nhật'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage; 
