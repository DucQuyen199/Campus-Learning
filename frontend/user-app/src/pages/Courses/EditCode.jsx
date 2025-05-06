import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import courseApi from '../../api/courseApi';
import { useAuth } from '../../contexts/AuthContext';
import { initializeCodeServer } from './components/code-server-bridge';

const EditCode = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const iframeRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [codeServerUrl, setCodeServerUrl] = useState('');
  
  useEffect(() => {
    const initializeEnvironment = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để truy cập bài tập');
      navigate('/login', { state: { from: `/courses/${courseId}/edit-code/${lessonId}` } });
        return;
    }
  
      try {
        setLoading(true);
        
        // Khởi tạo code-server trước khi tải dữ liệu bài tập
        const codeServerResponse = await initializeCodeServer({
          courseId,
          lessonId,
          port: 8080
        });
          
        if (!codeServerResponse.success) {
          throw new Error(codeServerResponse.message);
        }
        
        // Đặt URL ngay lập tức để iframe có thể bắt đầu tải
        setCodeServerUrl(codeServerResponse.url);
        
        // Sau đó tải dữ liệu bài tập
        const exerciseResponse = await courseApi.getCodeExercise(courseId, lessonId);
        if (!exerciseResponse || !exerciseResponse.success) {
          throw new Error(exerciseResponse?.message || 'Không thể tải thông tin bài tập');
        }
        
        const exerciseData = exerciseResponse.data;
        setExercise(exerciseData);
        
        if (exerciseData.moduleTitle) {
          setModuleTitle(exerciseData.moduleTitle);
        }
        
        if (exerciseData.exerciseContent) {
          // Tạo hoặc cập nhật file README.md trong workspace
          try {
            const content = exerciseData.exerciseContent;
            console.log('Creating README.md in workspace with content:', content);
            // Phần này có thể được xử lý bởi backend để tạo file trong workspace
          } catch (error) {
            console.error('Failed to create README.md in workspace:', error);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing code environment:', err);
        setError(err.message || 'Có lỗi xảy ra khi tải môi trường code. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    initializeEnvironment();
    
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
    }
    };
  }, [courseId, lessonId, isAuthenticated, navigate]);
  
  if (loading && !codeServerUrl) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-3 max-w-md text-sm">
          <p className="font-medium">{error}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Thử lại
          </button>
        <button 
          onClick={() => navigate(`/courses/${courseId}`)} 
            className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
        >
          Quay lại khóa học
        </button>
      </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">
      {/* Header trống - chỉ hiển thị đường viền mỏng */}
      <header className="bg-white border-b border-gray-200 h-1"></header>
      
      {/* Main content layout - thu nhỏ tổng thể thêm 4px */}
      <div className="flex-1 flex max-h-[calc(100vh-4.5rem)] overflow-hidden">
        {/* Exercise description in left panel - giữ tỷ lệ 20% */}
        {exercise && (
          <div className="w-1/5 border-r border-gray-200 p-2 h-full flex flex-col max-h-full">
            {/* Phần nội dung đề bài - thu nhỏ */}
            <div className="flex-1 overflow-y-auto pr-1 text-xs">
              {/* Tiêu đề bài tập và module - thu nhỏ */}
              <div className="border-b pb-1.5 mb-2">
                <h1 className="font-bold text-sm text-gray-800">{exercise?.title || 'Hello C++ World'}</h1>
                {moduleTitle && (
                  <div className="text-xs text-gray-600 mt-0.5">
                    Module: {moduleTitle}
              </div>
            )}
          </div>
              
              <div className="mb-2">
                {exercise.description && (
                  <div className="prose prose-xs max-w-none" dangerouslySetInnerHTML={{ __html: exercise.description }} />
            )}
          </div>
          
              {exercise.instructions && (
                <div className="mb-2">
                  <h3 className="text-xs font-semibold mb-1">Hướng dẫn</h3>
                  <div className="prose prose-xs max-w-none" dangerouslySetInnerHTML={{ __html: exercise.instructions }} />
            </div>
          )}
          
              {exercise.hints && exercise.hints.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-xs font-semibold mb-1">Gợi ý</h3>
                  <ul className="list-disc pl-3 space-y-0.5 text-xs">
                    {exercise.hints.map((hint, index) => (
                      <li key={index} className="text-gray-700">{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {exercise.testCases && exercise.testCases.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-xs font-semibold mb-1">Các test case</h3>
                  <div className="space-y-1">
                    {exercise.testCases.map((test, index) => (
                      <div key={index} className="bg-gray-50 p-1.5 rounded border text-xs">
                        <p className="font-medium text-xs">Test {index + 1}:</p>
                        {test.input && (
                          <p className="text-xs leading-tight"><span className="font-medium">Input:</span> {test.input}</p>
                        )}
                        {test.expected && (
                          <p className="text-xs leading-tight"><span className="font-medium">Expected:</span> {test.expected}</p>
                        )}
                      </div>
                    ))}
                        </div>
                        </div>
                      )}
              
              {exercise.exerciseContent && !exercise.description && !exercise.instructions && (
                <div className="prose prose-xs max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: exercise.exerciseContent }} />
                            </div>
                          )}
                        </div>
            
            {/* Nút quay lại bài học đặt ở dưới cùng */}
            <div className="mt-2">
              <Link 
                to={`/courses/${courseId}/learn`} 
                className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs flex items-center justify-center"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Quay lại bài học
              </Link>
            </div>
          </div>
        )}
        
        {/* Code-server iframe in right panel - giữ tỷ lệ 80% */}
        <div className="w-4/5 h-full">
          {codeServerUrl ? (
            <iframe
              ref={iframeRef}
              src={codeServerUrl}
              className="w-full h-full border-none"
              title="Code Editor"
              allow="fullscreen"
            />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-xs text-gray-500">Đang tải môi trường code...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditCode;
