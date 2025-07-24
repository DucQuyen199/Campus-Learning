/*-----------------------------------------------------------------
* File: EventDetail.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchEventDetail, 
  registerEvent, 
  cancelRegistration, 
  checkRegistrationStatus, 
  clearCurrentEvent,
  setRegistrationStatus
} from '@/store/slices/eventSlice';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ListBulletIcon,
  TrophyIcon,
  CodeBracketIcon,
  CommandLineIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800'
};

const statusColors = {
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const { isAuthenticated } = useAuth();

  // Lấy event và trạng thái đăng ký từ Redux store
  const event = useSelector((state) => state.event.currentEvent);
  const isRegistered = useSelector((state) => state.event.isRegistered);

  useEffect(() => {
    const loadEventDetail = async () => {
      if (!eventId) {
        setError('Event ID không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching event details for ID:', eventId);
        
        // Dispatch action để lấy chi tiết sự kiện
        const result = await dispatch(fetchEventDetail(eventId)).unwrap();
        
        console.log('Successfully fetched event details:', result);
        
        // Kiểm tra kết quả
        if (!result) {
          setError('Sự kiện không tồn tại');
          return;
        }
        
        // Kiểm tra trạng thái đăng ký của người dùng ngay sau khi lấy dữ liệu sự kiện
        if (isAuthenticated) {
          await dispatch(checkRegistrationStatus(eventId));
        }
      } catch (err) {
        console.error('Error loading event detail:', err);
        
        // Xử lý các loại lỗi khác nhau
        if (err.response?.status === 404) {
          setError('Sự kiện không tồn tại');
        } else if (err.response?.status === 401) {
          // Không tự động chuyển về login, chỉ hiển thị thông báo lỗi
          setError('Vui lòng đăng nhập để xem chi tiết sự kiện');
        } else {
          setError(err.message || 'Không thể tải thông tin sự kiện');
        }
      } finally {
        setLoading(false);
      }
    };

    loadEventDetail();

    // Cleanup khi unmount
    return () => {
      dispatch(clearCurrentEvent());
    };
  }, [eventId, dispatch, isAuthenticated]);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return date;
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    try {
      return time.substring(0, 5);
    } catch (e) {
      console.error('Error formatting time:', e);
      return time;
    }
  };

  const handleRegisterEvent = async () => {
    if (!isAuthenticated) {
      // Lưu URL hiện tại và chuyển đến trang login
      navigate('/login', { 
        state: { returnUrl: `/events/${eventId}` }
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Registering for event with ID:', eventId);
      
      // Add user information to the registration request, only including teamName
      // since that's the only additional field supported by the schema
      const userData = {
        teamName: ''  // Default empty team name
      };
      
      const result = await dispatch(registerEvent({ 
        eventId, 
        userData
      })).unwrap();
      
      console.log('Registration result:', result);
      
      // Cập nhật trạng thái đăng ký ngay sau khi đăng ký thành công
      dispatch(setRegistrationStatus({ isRegistered: true, registrationInfo: { EventID: eventId } }));
      
      alert(result.message || 'Đăng ký tham gia sự kiện thành công!');
      
      // Refresh event details after successful registration
      await dispatch(fetchEventDetail(eventId)).unwrap();
    } catch (error) {
      console.error('Registration error:', error);
      
      // Kiểm tra xem lỗi có phải là do đã đăng ký chưa
      if (error.message === 'Bạn đã đăng ký sự kiện này') {
        // Tự động cập nhật trạng thái đã đăng ký nếu server báo người dùng đã đăng ký rồi
        dispatch(setRegistrationStatus({ isRegistered: true, registrationInfo: { EventID: eventId } }));
      }
      
      alert(error.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { returnUrl: `/events/${eventId}` }
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Cancelling registration for event with ID:', eventId);
      
      const result = await dispatch(cancelRegistration(eventId)).unwrap();
      
      console.log('Cancellation result:', result);
      
      // Cập nhật trạng thái đăng ký ngay sau khi hủy đăng ký thành công
      dispatch(setRegistrationStatus({ isRegistered: false, registrationInfo: null }));
      
      alert(result.message || 'Hủy đăng ký sự kiện thành công!');
      
      // Refresh event details after successful cancellation
      await dispatch(fetchEventDetail(eventId)).unwrap();
    } catch (error) {
      console.error('Cancellation error:', error);
      alert(error.message || 'Hủy đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">
            Vui lòng kiểm tra lại đường dẫn hoặc thử lại sau
          </p>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/events')}
          >
            Quay lại danh sách sự kiện
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy sự kiện
          </h2>
          <p className="text-gray-600 mb-6">
            Sự kiện này có thể đã bị xóa hoặc không tồn tại
          </p>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/events')}
          >
            Quay lại danh sách sự kiện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/events')}
          className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span>Quay lại danh sách sự kiện</span>
        </button>
      </div>

      {/* Header Image */}
      <div className="relative h-96 rounded-xl overflow-hidden mb-8">
        <img
          src={event.ImageUrl || '/default-event.jpg'}
          alt={event.Title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-4 py-2 rounded-full ${statusColors[event.Status] || 'bg-gray-100 text-gray-800'}`}>
            {event.Status}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('description')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'description'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mô tả sự kiện
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Lịch trình
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'prizes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Giải thưởng
          </button>
          <button
            onClick={() => setActiveTab('tech')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tech'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Công nghệ & Ngôn ngữ
          </button>
        </nav>
      </div>

      {/* Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.Title}</h1>
          
          {/* Description Tab Content */}
          {activeTab === 'description' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Mô tả sự kiện</h2>
              <p className="text-gray-700 whitespace-pre-line">{event.Description || 'Không có mô tả'}</p>
            </div>
          )}

          {/* Schedule Tab Content */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Lịch trình</h2>
              {event.schedule && event.schedule.length > 0 ? (
                <div className="space-y-4">
                  {event.schedule.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <ClockIcon className="h-6 w-6 text-gray-500 mt-1" />
                      <div>
                        <h3 className="font-semibold">{item.ActivityName}</h3>
                        <p className="text-gray-600">
                          {formatDate(item.StartTime)} {formatTime(item.StartTime)} - {formatTime(item.EndTime)}
                        </p>
                        <p className="text-gray-600">{item.Location}</p>
                        <p className="text-gray-600 mt-2">{item.Description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Chưa có lịch trình chi tiết cho sự kiện này</p>
              )}
            </div>
          )}

          {/* Prizes Tab Content */}
          {activeTab === 'prizes' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Giải thưởng</h2>
              {event.prizes && event.prizes.length > 0 ? (
                <div className="space-y-4">
                  {event.prizes.map((prize, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <TrophyIcon className="h-6 w-6 text-yellow-500 mt-1" />
                      <div>
                        <h3 className="font-semibold">Hạng {prize.Rank}</h3>
                        <p className="text-gray-800 font-medium">
                          {prize.PrizeAmount ? `${prize.PrizeAmount.toLocaleString('vi-VN')} VND` : ''}
                        </p>
                        <p className="text-gray-600 mt-1">{prize.Description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Chưa có thông tin về giải thưởng</p>
              )}
            </div>
          )}

          {/* Tech & Languages Tab Content */}
          {activeTab === 'tech' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Công nghệ & Ngôn ngữ lập trình</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <CodeBracketIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Ngôn ngữ lập trình
                </h3>
                
                {event.languages && event.languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {event.languages.map((lang, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {lang.Language}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Chưa có thông tin ngôn ngữ lập trình</p>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <CommandLineIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  Công nghệ sử dụng
                </h3>
                
                {event.technologies && event.technologies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {event.technologies.map((tech, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                        {tech.Technology}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Chưa có thông tin công nghệ</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin chi tiết</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-gray-600">Thời gian</p>
                  <p className="font-medium">
                    {formatDate(event.EventDate)} {formatTime(event.EventTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-gray-600">Địa điểm</p>
                  <p className="font-medium">{event.Location || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-gray-600">Số lượng người tham gia</p>
                  <p className="font-medium">
                    {event.CurrentAttendees || 0}/{event.MaxAttendees || 'Không giới hạn'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <AcademicCapIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-gray-600">Độ khó</p>
                  <span className={`px-2 py-1 rounded-full text-sm ${difficultyColors[event.Difficulty] || 'bg-gray-100 text-gray-800'}`}>
                    {event.Difficulty || 'Chưa xác định'}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-gray-600">Giá vé</p>
                  <p className="font-medium">
                    {event.Price && event.Price > 0 
                      ? `${event.Price.toLocaleString('vi-VN')} VND` 
                      : 'Miễn phí'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-gray-600">Đơn vị tổ chức</p>
                  <p className="font-medium">{event.Organizer || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {isRegistered ? (
              <button
                onClick={handleCancelRegistration}
                disabled={event.Status !== 'upcoming' || loading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white 
                  ${event.Status === 'upcoming' && !loading
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-400 cursor-not-allowed'}`
                }
              >
                {loading ? 'Đang xử lý...' : 'Hủy đăng ký tham gia'}
              </button>
            ) : (
              <button
                onClick={handleRegisterEvent}
                disabled={event.Status !== 'upcoming' || (event.CurrentAttendees >= event.MaxAttendees) || loading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white 
                  ${event.Status === 'upcoming' && (event.CurrentAttendees < event.MaxAttendees) && !loading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'}`
                }
              >
                {loading ? 'Đang xử lý...' :
                  event.Status !== 'upcoming'
                    ? 'Sự kiện không còn nhận đăng ký'
                    : event.CurrentAttendees >= event.MaxAttendees
                    ? 'Đã đủ số lượng người tham gia'
                    : 'Đăng ký tham gia'}
              </button>
            )}

            {!isAuthenticated && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Bạn cần đăng nhập để đăng ký tham gia
              </p>
            )}

            {isRegistered && (
              <p className="text-sm text-green-600 mt-2 text-center">
                Bạn đã đăng ký tham gia sự kiện này
              </p>
            )}
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <ListBulletIcon className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-gray-600">Danh mục</p>
                <p className="font-medium">{event.Category || 'Chưa phân loại'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail; 
