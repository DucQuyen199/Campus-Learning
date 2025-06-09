import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetCourseByIdQuery, useCreateLessonMutation, useGetModuleLessonsQuery } from '../api/courseApi';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  CodeBracketIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ModuleDetailPage = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { data: courseData, error: courseError, isLoading: isLoadingCourse } = useGetCourseByIdQuery(courseId);
  const { data: lessonsData, error: lessonsError, isLoading: isLoadingLessons } = useGetModuleLessonsQuery(moduleId);
  const [createLesson, { isLoading: isCreating }] = useCreateLessonMutation();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [lessonType, setLessonType] = useState('text');
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    duration: 30,
    isPreview: false
  });
  
  // Get the current module from the course data
  const currentModule = courseData?.modules?.find(m => m.ModuleID.toString() === moduleId);
  
  // Get lessons from the module lessons query
  const lessons = lessonsData?.lessons || [];
  
  const isLoading = isLoadingCourse || isLoadingLessons;
  const error = courseError || lessonsError;
  
  const handleLessonFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLessonForm({
      ...lessonForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleAddLesson = async (e) => {
    e.preventDefault();
    
    if (!lessonForm.title || !lessonForm.content) {
      toast.error('Vui lòng nhập tiêu đề và nội dung bài học');
      return;
    }
    
    try {
      await createLesson({
        moduleId,
        title: lessonForm.title,
        content: lessonForm.content,
        type: lessonType,
        duration: parseInt(lessonForm.duration, 10),
        isPreview: lessonForm.isPreview
      }).unwrap();
      
      toast.success('Thêm bài học thành công');
      setShowAddForm(false);
      setLessonForm({
        title: '',
        content: '',
        duration: 30,
        isPreview: false
      });
    } catch (err) {
      console.error('Failed to create lesson:', err);
      toast.error('Có lỗi xảy ra khi thêm bài học');
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-500 text-center">
        <p>Không thể tải thông tin. Vui lòng thử lại.</p>
        <p className="mt-2">{error.message || 'Lỗi không xác định'}</p>
      </div>
    );
  }
  
  if (!currentModule) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy mô-đun này.</p>
        <Link to={`/courses/${courseId}`} className="mt-4 inline-block text-primary-600 hover:underline">
          Quay lại khóa học
        </Link>
      </div>
    );
  }
  
  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoCameraIcon className="w-5 h-5 text-primary-500" />;
      case 'coding':
        return <CodeBracketIcon className="w-5 h-5 text-primary-500" />;
      case 'quiz':
        return <ClipboardDocumentCheckIcon className="w-5 h-5 text-primary-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-primary-500" />;
    }
  };
  
  return (
    <div>
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Link to={`/courses/${courseId}`} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại khóa học
        </Link>
        <div className="flex gap-2">
          <button 
            className="btn btn-primary flex items-center"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (
              'Hủy'
            ) : (
              <>
                <PlusIcon className="w-4 h-4 mr-2" />
                Thêm bài học
              </>
            )}
          </button>
          <Link to={`/courses/${courseId}/modules/${moduleId}/edit`} className="btn btn-outline-primary flex items-center">
            <PencilIcon className="w-4 h-4 mr-2" />
            Chỉnh sửa mô-đun
          </Link>
        </div>
      </div>
      
      {/* Module header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{currentModule.Title}</h1>
        {currentModule.Description && (
          <p className="mt-2 text-gray-600">{currentModule.Description}</p>
        )}
        
        <div className="flex items-center mt-4 text-sm text-gray-500">
          <span className="mr-4">Thứ tự: {currentModule.OrderIndex}</span>
          <span>Tạo lúc: {new Date(currentModule.CreatedAt).toLocaleString()}</span>
        </div>
      </div>
      
      {/* Add Lesson Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thêm bài học mới</h2>
          
          <form onSubmit={handleAddLesson}>
            <div className="space-y-4">
              {/* Lesson Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại bài học
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    className={`p-3 rounded-md flex flex-col items-center ${
                      lessonType === 'text' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                    onClick={() => setLessonType('text')}
                  >
                    <DocumentTextIcon className="w-6 h-6 text-gray-700 mb-1" />
                    <span className="text-sm">Bài học văn bản</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`p-3 rounded-md flex flex-col items-center ${
                      lessonType === 'video' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                    onClick={() => setLessonType('video')}
                  >
                    <VideoCameraIcon className="w-6 h-6 text-gray-700 mb-1" />
                    <span className="text-sm">Bài học video</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`p-3 rounded-md flex flex-col items-center ${
                      lessonType === 'coding' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                    onClick={() => setLessonType('coding')}
                  >
                    <CodeBracketIcon className="w-6 h-6 text-gray-700 mb-1" />
                    <span className="text-sm">Bài tập lập trình</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`p-3 rounded-md flex flex-col items-center ${
                      lessonType === 'quiz' ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                    onClick={() => setLessonType('quiz')}
                  >
                    <ClipboardDocumentCheckIcon className="w-6 h-6 text-gray-700 mb-1" />
                    <span className="text-sm">Bài kiểm tra</span>
                  </button>
                </div>
              </div>
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề bài học*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={lessonForm.title}
                  onChange={handleLessonFormChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  placeholder="Nhập tiêu đề bài học"
                />
              </div>
              
              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung*
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={5}
                  value={lessonForm.content}
                  onChange={handleLessonFormChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  placeholder={
                    lessonType === 'video' 
                      ? 'Nhập URL video (Youtube, Vimeo...)' 
                      : 'Nhập nội dung bài học'
                  }
                />
              </div>
              
              {/* Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  min="1"
                  value={lessonForm.duration}
                  onChange={handleLessonFormChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
              
              {/* Is Preview */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPreview"
                  name="isPreview"
                  checked={lessonForm.isPreview}
                  onChange={handleLessonFormChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPreview" className="ml-2 block text-sm text-gray-700">
                  Cho phép xem trước (không cần đăng ký khóa học)
                </label>
              </div>
              
              {/* Submit buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-outline-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn btn-primary"
                >
                  {isCreating ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                      Đang tạo...
                    </>
                  ) : (
                    'Thêm bài học'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Lessons List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Danh sách bài học</h2>
        
        {lessons.length > 0 ? (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson.LessonID} className="border border-gray-200 rounded-lg">
                <div className="p-4 flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="mr-3">
                      {getLessonIcon(lesson.Type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{lesson.Title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {lesson.Type === 'video' ? 'Bài học video' : 
                         lesson.Type === 'coding' ? 'Bài tập lập trình' :
                         lesson.Type === 'quiz' ? 'Bài kiểm tra' : 'Bài học văn bản'}
                        {lesson.Duration && ` • ${lesson.Duration} phút`}
                        {lesson.IsPreview && ' • Xem trước'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link 
                      to={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.LessonID}`}
                      className="text-primary-600 text-sm hover:underline"
                    >
                      Chi tiết
                    </Link>
                    <Link 
                      to={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.LessonID}/edit`}
                      className="text-gray-600 text-sm hover:underline"
                    >
                      Chỉnh sửa
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Mô-đun này chưa có bài học nào. Hãy thêm bài học đầu tiên!
          </p>
        )}
      </div>
    </div>
  );
};

export default ModuleDetailPage; 