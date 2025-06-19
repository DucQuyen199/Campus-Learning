import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllExams, registerForExam } from '../../api/examApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'completed', 'registered'
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (exams.length > 0) {
      let filtered = [...exams];
      
      // Filter based on search term
      if (searchTerm) {
        filtered = filtered.filter(exam => 
          exam.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exam.Description && exam.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (exam.CourseName && exam.CourseName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // Filter based on current filter
      if (filter === 'upcoming') { // Upcoming exams
        filtered = filtered.filter(exam => new Date(exam.StartTime) > new Date());
      } else if (filter === 'ongoing') { // Ongoing exams
        const now = new Date();
        filtered = filtered.filter(exam => 
          new Date(exam.StartTime) <= now && new Date(exam.EndTime) >= now
        );
      } else if (filter === 'completed') { // Completed exams
        filtered = filtered.filter(exam => new Date(exam.EndTime) < new Date());
      } else if (filter === 'registered') { // Registered exams
        filtered = filtered.filter(exam => exam.IsRegistered);
      }
      
      setFilteredExams(filtered);
    } else {
      setFilteredExams([]);
    }
  }, [exams, searchTerm, filter]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await getAllExams();
      setExams(response.data || []);
      setFilteredExams(response.data || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách kỳ thi. Vui lòng thử lại sau.');
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (examId) => {
    try {
      setRegistering(prev => ({ ...prev, [examId]: true }));
      const response = await registerForExam(examId);
      
      // Update the exam with registration info and attempt counts
      setExams(exams.map(exam => 
        exam.ExamID === examId 
          ? { 
              ...exam, 
              IsRegistered: true,
              attemptsUsed: response.attemptsUsed || 1,
              maxAttempts: response.maxAttempts || 1
            } 
          : exam
      ));

      // Show success message with attempt information
      if (response.attemptsUsed > 1) {
        alert(`Đăng ký thành công! Đây là lần thử thứ ${response.attemptsUsed}/${response.maxAttempts === 'unlimited' ? '∞' : response.maxAttempts}.`);
      }
    } catch (err) {
      console.error('Error registering for exam:', err);
      
      // Handle already registered case
      if (err.response && err.response.status === 400) {
        if (err.response.data.message === 'Already registered for this exam and retakes are not allowed') {
          // Mark as registered but retakes not allowed
          setExams(exams.map(exam => 
            exam.ExamID === examId 
              ? { ...exam, IsRegistered: true, allowRetakes: false } 
              : exam
          ));
          alert('Bạn đã đăng ký kỳ thi này trước đó và không được phép thi lại.');
        } else if (err.response.data.message.includes('Maximum number of attempts')) {
          // Mark as registered with max attempts reached
          setExams(exams.map(exam => 
            exam.ExamID === examId 
              ? { ...exam, IsRegistered: true, attemptsMaxedOut: true } 
              : exam
          ));
          alert(err.response.data.message);
        } else if (err.response.data.message.includes('ongoing attempt')) {
          // Has an ongoing attempt
          setExams(exams.map(exam => 
            exam.ExamID === examId 
              ? { ...exam, IsRegistered: true, hasOngoingAttempt: true } 
              : exam
          ));
          alert('Bạn có một lượt thi đang diễn ra. Vui lòng hoàn thành trước khi đăng ký lượt mới.');
        } else {
          // Other error
          alert('Đăng ký không thành công: ' + err.response.data.message);
        }
      } else {
        // General error
        alert('Đăng ký không thành công: ' + (err.response?.data?.message || 'Vui lòng thử lại sau.'));
      }
    } finally {
      setRegistering(prev => ({ ...prev, [examId]: false }));
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const getExamStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return 'upcoming';
    } else if (now >= start && now <= end) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return 'Chưa xác định';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeToNow = (dateTime) => {
    try {
      return formatDistanceToNow(new Date(dateTime), { addSuffix: true, locale: vi });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getDifficultyLevel = (passingScore, totalPoints) => {
    const ratio = passingScore / totalPoints;
    if (ratio < 0.5) return 'Dễ';
    if (ratio < 0.7) return 'Trung bình';
    return 'Khó';
  };

    return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Danh Sách Kỳ Thi</h1>
        <p className="text-gray-600">
          Tham gia các kỳ thi để nâng cao kỹ năng và kiểm tra kiến thức của bạn
        </p>
      </div>

      {/* Filter tabs with search box on the right */}
      <div className="flex justify-between items-center mb-6 border-b">
        <div className="flex">
            <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium ${
              filter === 'all'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
            Tất cả
            </button>
            <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 font-medium ${
              filter === 'upcoming'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sắp diễn ra
            </button>
            <button
            onClick={() => setFilter('ongoing')}
            className={`px-4 py-2 font-medium ${
              filter === 'ongoing'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Đang diễn ra
            </button>
            <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 font-medium ${
              filter === 'completed'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Đã kết thúc
            </button>
            <button
            onClick={() => setFilter('registered')}
            className={`px-4 py-2 font-medium ${
              filter === 'registered'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Đã đăng ký
            </button>
          </div>

        <div className="relative pb-2">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm kỳ thi..."
                className="w-64 px-4 py-2 rounded-md text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
          <svg 
            className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" 
            fill="none" 
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
              </div>
            </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.length > 0 ? (
            filteredExams.map((exam) => {
              const status = getExamStatus(exam.StartTime, exam.EndTime);
              const difficulty = getDifficultyLevel(exam.PassingScore, exam.TotalPoints);
              
              return (
                <div 
                  key={exam.ExamID}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow flex flex-col h-full relative cursor-pointer hover:border hover:border-blue-400 group"
                  onClick={(e) => {
                    // Only navigate if not clicking on a button or link
                    if (!e.target.closest('button') && !e.target.closest('a')) {
                      navigate(`/exams/${exam.ExamID}`);
                    }
                  }}
                >
                  {/* Add a hint to show it's clickable */}
                  <div className="absolute top-2 right-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </div>
                  <div className="p-4 flex-grow">
                    <div className={`h-1 w-full -mt-4 mb-3 ${getStatusClass(status)}`}></div>
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2">{exam.Title}</h2>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{exam.Description || 'Không có mô tả'}</p>
                    <div className="text-sm text-gray-500 mb-4">
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                          {status === 'upcoming' && `Bắt đầu ${formatTimeToNow(exam.StartTime)}`}
                          {status === 'ongoing' && `Kết thúc ${formatTimeToNow(exam.EndTime)}`}
                          {status === 'completed' && `Kết thúc ${formatTimeToNow(exam.EndTime)}`}
                        </span>
                      </div>
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Thời gian: {exam.Duration} phút</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                        <span>{difficulty}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 h-16 flex items-center mt-auto">
                    {exam.IsRegistered ? (
                      <div className="mt-2">
                        {status === 'completed' ? (
                          <div className="flex flex-col space-y-2">
                            <Link 
                              to={`/exams/${exam.ExamID}/history`}
                              className="inline-block bg-indigo-100 text-indigo-700 py-2 px-4 rounded-md text-center hover:bg-indigo-200 transition-colors"
                              onClick={(e) => e.stopPropagation()} // Prevent the parent onClick from triggering
                            >
                              Xem lịch sử thi
                            </Link>
                            {exam.allowRetakes !== false && !exam.attemptsMaxedOut && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent the parent onClick from triggering
                                  handleRegister(exam.ExamID);
                                }}
                                disabled={registering[exam.ExamID]}
                                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                              >
                                {registering[exam.ExamID] ? 'Đang đăng ký...' : 'Đăng ký thi lại'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <Link 
                            to={`/exams/${exam.ExamID}/session`}
                            className="inline-block bg-green-500 text-white py-2 px-4 rounded-md w-full text-center hover:bg-green-600 transition-colors"
                            onClick={(e) => e.stopPropagation()} // Prevent the parent onClick from triggering
                          >
                            Vào thi ngay
                          </Link>
                        )}
                        {exam.attemptsUsed && exam.maxAttempts && (
                          <div className="mt-2 text-xs text-gray-500">
                            Lần thi: {exam.attemptsUsed}/{exam.maxAttempts === 'unlimited' ? '∞' : exam.maxAttempts}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent the parent onClick from triggering
                          handleRegister(exam.ExamID);
                        }}
                        disabled={registering[exam.ExamID] || status === 'completed'}
                        className={`mt-2 py-2 px-4 rounded-md w-full ${
                          status === 'completed'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } transition-colors disabled:opacity-70`}
                      >
                        {registering[exam.ExamID]
                          ? 'Đang đăng ký...'
                          : status === 'completed'
                            ? 'Đã kết thúc'
                            : 'Đăng ký tham gia'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center">
              <p className="text-gray-500">Không tìm thấy kỳ thi nào phù hợp với bộ lọc.</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Xóa tìm kiếm
                  </button>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamList;
