import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCompetitions } from '../../api/competitionApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { 
  ArrowPathIcon, 
  UserGroupIcon, 
  ClockIcon, 
  TrophyIcon, 
  CalendarIcon,
  AdjustmentsHorizontalIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  EnvelopeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Avatar } from '../../components';

// Competition difficulty badge component
const DifficultyBadge = ({ level }) => {
  // Match SQL schema Difficulty values: 'Dễ', 'Trung bình', 'Khó'
  const badges = {
    'Dễ': 'bg-green-100 text-green-800',
    'Trung bình': 'bg-yellow-100 text-yellow-800',
    'Khó': 'bg-red-100 text-red-800',
    // English fallbacks
    'Beginner': 'bg-green-100 text-green-800',
    'Intermediate': 'bg-yellow-100 text-yellow-800',
    'Advanced': 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[level] || 'bg-gray-100 text-gray-800'}`}>
      {level}
    </span>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  // Match SQL schema Status values: 'upcoming', 'ongoing', 'completed', 'draft', 'cancelled'
  const badges = {
    'upcoming': 'bg-blue-100 text-blue-800',
    'ongoing': 'bg-green-100 text-green-800',
    'completed': 'bg-gray-100 text-gray-600',
    'draft': 'bg-purple-100 text-purple-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  
  const labels = {
    'upcoming': 'Sắp diễn ra',
    'ongoing': 'Đang diễn ra',
    'completed': 'Đã kết thúc',
    'draft': 'Bản nháp',
    'cancelled': 'Đã hủy'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
};

// Registration badge component
const RegistrationBadge = ({ status }) => {
  // Match SQL schema Registration Status values from CompetitionRegistrations
  const badges = {
    'REGISTERED': 'bg-purple-100 text-purple-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'DISQUALIFIED': 'bg-red-100 text-red-800',
    'ACTIVE': 'bg-blue-100 text-blue-800'
  };
  
  const labels = {
    'REGISTERED': 'Đã đăng ký',
    'COMPLETED': 'Đã hoàn thành',
    'DISQUALIFIED': 'Bị loại',
    'ACTIVE': 'Đang tham gia'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-purple-100 text-purple-800'}`}>
      {labels[status] || 'Đã đăng ký'}
    </span>
  );
};

// User info display component for consistency across the app
const UserInfoDisplay = ({ user }) => {
  if (!user) return null;
  
  // Handle different user object structures from API responses
  const name = user.fullName || user.FullName || user.username || user.Username || 'User';
  const email = user.email || user.Email || '';
  const image = user.avatar || user.Image || user.profileImage || '';
  const userId = user.id || user.ID || user.userId || user.UserID || '';
  
  return (
    <Link to={`/profile/${userId}`} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
      <Avatar
        src={image}
        name={name}
        alt={name}
        size="small"
        className="flex-shrink-0"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        {email && (
          <div className="flex items-center text-xs text-gray-500">
            <EnvelopeIcon className="h-3 w-3 mr-1" />
            <span className="truncate">{email}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

const CompetitionList = () => {
  const { currentUser } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Filter options
  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'upcoming', label: 'Sắp diễn ra' },
    { id: 'ongoing', label: 'Đang diễn ra' },
    { id: 'completed', label: 'Đã kết thúc' },
    { id: 'registered', label: 'Đã đăng ký', requiresAuth: true }
  ];

  // Fetch user profile data
  useEffect(() => {
    if (currentUser) {
      // Get user data from localStorage first for immediate display
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUserProfile(userData);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }

      // Then try to fetch fresh data if we have a token
      if (currentUser.token) {
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`
          }
        })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch user profile');
        })
        .then(data => {
          setUserProfile(data);
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch(err => {
          console.error('Error fetching user profile:', err);
        });
      }
    }
  }, [currentUser]);

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      // Prepare filter parameters
      const params = {};
      if (activeFilter !== 'all' && activeFilter !== 'registered') {
        params.status = activeFilter;
      }
      
      if (activeFilter === 'registered') {
        params.registered = true;
      }
      
      const data = await getAllCompetitions(
        params, 
        currentUser?.token
      );
      
      // Log the response for debugging
      console.log('Competition API response:', data);
      
      // Ensure participant count is properly processed
      const processedData = data.map(comp => {
        // Extract participant data with better fallbacks
        const participantCount = comp.CurrentParticipants || 
                               comp.ParticipantCount || 
                               comp.participantCount || 
                               comp.RegisteredCount || 0;
        
        // Log detailed info about participant data for debugging
        console.log(`Competition ${comp.CompetitionID || comp.ID} participant data:`, {
          Title: comp.Title,
          CurrentParticipants: comp.CurrentParticipants,
          ParticipantCount: comp.ParticipantCount,
          participantCount: comp.participantCount,
          RegisteredCount: comp.RegisteredCount,
          MaxParticipants: comp.MaxParticipants,
          Using: participantCount
        });
        
        // Determine the registration status from the API response
        // IsRegistered is a boolean, but RegistrationStatus might be a string from the database
        const isRegistered = comp.IsRegistered || false;
        const registrationStatus = comp.RegistrationStatus || (isRegistered ? 'REGISTERED' : null);
        
        // Process competition creator/organizer data if available
        let organizer = null;
        if (comp.Organizer) {
          organizer = {
            id: comp.Organizer.UserID || comp.Organizer.ID,
            fullName: comp.Organizer.FullName || comp.Organizer.username,
            email: comp.Organizer.Email || '',
            avatar: comp.Organizer.Image || comp.Organizer.avatar
          };
        }
        
        return {
          ...comp,
          ParticipantCount: participantCount,
          CurrentParticipants: participantCount,
          IsRegistered: isRegistered,
          RegistrationStatus: registrationStatus,
          Organizer: organizer
        };
      });
      
      setCompetitions(processedData);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch competitions when filter changes or component mounts
  useEffect(() => {
    fetchCompetitions();
  }, [activeFilter, currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCompetitions();
  };

  // Format date/time for display
  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate remaining time until start
  const getRemainingTime = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffMs = start - now;
    
    if (diffMs <= 0) return null;
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} ngày ${diffHours} giờ`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours} giờ ${diffMinutes} phút`;
    }
  };

  // Check if competition is active
  const isCompetitionActive = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  };

  // Get competition action button text
  const getActionButtonText = (competition) => {
    // Check if user is registered based on IsRegistered or RegistrationStatus
    if (competition.IsRegistered || competition.RegistrationStatus) {
      if (isCompetitionActive(competition.StartTime, competition.EndTime)) {
        return "Bắt đầu thi đấu";
      } else if (competition.Status === 'upcoming') {
        return "Đã đăng ký, chờ cuộc thi bắt đầu";
      } else {
        return "Đã kết thúc";
      }
    } else {
      if (competition.Status === 'upcoming' || competition.Status === 'ongoing') {
        return "Đăng ký để tham gia";
      } else {
        return "Xem kết quả";
      }
    }
  };

  // Get registration status display
  const getRegistrationDetails = (competition) => {
    if (!competition.IsRegistered && !competition.RegistrationStatus) {
      return null;
    }
    
    // If registered, determine the specific status from RegistrationStatus field
    const status = competition.RegistrationStatus || 'REGISTERED';
    
    return (
      <div className="flex items-center gap-1">
        <CheckBadgeIcon className="h-4 w-4 text-purple-600" />
        <RegistrationBadge status={status} />
      </div>
    );
  };

  // Format competition duration in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes || isNaN(minutes)) return "N/A";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} giờ${mins > 0 ? ` ${mins} phút` : ''}`;
    }
    return `${mins} phút`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white shadow">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cuộc thi Lập trình</h1>
              <p className="text-gray-600 text-sm md:text-base">Tham gia các cuộc thi và nâng cao kỹ năng lập trình của bạn</p>
            </div>
            <div className="flex items-center space-x-3">
              {currentUser && userProfile && (
                <div className="hidden md:block mr-2">
                  <UserInfoDisplay user={userProfile} />
                </div>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <AdjustmentsHorizontalIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Bộ lọc
              </button>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                disabled={refreshing}
              >
                <ArrowPathIcon className={`-ml-0.5 mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter tabs - collapsible on mobile */}
        <div className={`bg-white rounded-xl shadow-sm mb-6 overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96' : 'max-h-0 sm:max-h-none'}`}>
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto py-2 px-4 whitespace-nowrap">
              {filters.map((filter) => {
                // Skip "registered" filter if user is not logged in
                if (filter.requiresAuth && !currentUser) {
                  return null;
                }
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`
                      whitespace-nowrap py-2 px-4 rounded-md font-medium text-sm mr-2
                      transition-colors duration-200
                      ${activeFilter === filter.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                    `}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Competition list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
          </div>
        ) : competitions.length === 0 ? (
          <div className="bg-white shadow-sm rounded-xl p-8 md:p-12 text-center">
            <img 
              src="/assets/empty-competitions.svg" 
              alt="No competitions" 
              className="w-36 h-36 md:w-48 md:h-48 mx-auto mb-6 opacity-50"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              {activeFilter === 'registered' 
                ? 'Bạn chưa đăng ký tham gia cuộc thi nào' 
                : 'Không có cuộc thi nào trong danh mục này'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {activeFilter === 'registered' 
                ? 'Hãy khám phá và đăng ký tham gia các cuộc thi để cải thiện kỹ năng lập trình của bạn'
                : 'Vui lòng thử lại sau hoặc chọn một bộ lọc khác để xem các cuộc thi có sẵn'}
            </p>
            {activeFilter === 'registered' && (
              <button 
                onClick={() => setActiveFilter('all')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Xem tất cả cuộc thi
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {competitions.map((competition) => (
              <div 
                key={competition.ID || competition.CompetitionID}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
              >
                <Link
                  to={`/competitions/${competition.ID || competition.CompetitionID}`}
                  className="flex flex-col h-full"
                >
                  {/* Competition Cover Image - Sử dụng ảnh từ database */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={competition.CoverImageURL || competition.ThumbnailUrl}
                      alt={competition.Title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        // Fallback image theo loại cuộc thi
                        if (competition.Title.includes("An ninh mạng")) {
                          e.target.src = "https://dhannd.edu.vn/image/catalog/AnNinhMang.jpg";
                        } else if (competition.Title.includes("Bảo mật thông tin")) {
                          e.target.src = "https://dichvuthietkewebwordpress.com/wp-content/uploads/2018/10/bao-mat-thong-tin.jpg";
                        } else if (competition.Title.includes("Python")) {
                          e.target.src = "https://media.techmaster.vn/api/static/36/buoi16_hinh2.png";
                        } else {
                          // Fallback mặc định nếu không tìm thấy các từ khóa
                          e.target.src = "https://storage.googleapis.com/campus-learning/competitions/cover_coding_competition_2025.jpg";
                        }
                      }}
                    />
                    
                    {/* Status badges */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between">
                      <div className="flex gap-2">
                        <StatusBadge status={competition.Status} />
                        {competition.IsRegistered && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Đã đăng ký
                          </span>
                        )}
                      </div>
                      <DifficultyBadge level={competition.Difficulty} />
                    </div>
                    
                    {/* Time remaining for upcoming competitions */}
                    {competition.Status === 'upcoming' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="flex items-center text-white text-sm">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          <span>Bắt đầu sau: {getRemainingTime(competition.StartTime)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Competition Info */}
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-2">{competition.Title}</h3>
                    
                    {competition.Description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {competition.Description}
                      </p>
                    )}
                    
                    {/* Organizer information */}
                    {competition.Organizer && (
                      <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700 mb-1">Người tổ chức</p>
                        <UserInfoDisplay user={competition.Organizer} />
                      </div>
                    )}
                    
                    <div className="mt-auto pt-4 space-y-2">
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserGroupIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                          <span>
                            {competition.CurrentParticipants} {competition.MaxParticipants ? `/${competition.MaxParticipants}` : ''} người tham gia
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                          <span>{formatDuration(competition.Duration)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                          <span>{formatDateTime(competition.StartTime)}</span>
                        </div>
                        
                        {competition.PrizePool > 0 && (
                          <div className="flex items-center text-sm text-gray-600">
                            <TrophyIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                            <span>{parseFloat(competition.PrizePool).toLocaleString('vi-VN')} VND</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Registration status */}
                      {getRegistrationDetails(competition) && (
                        <div className="mt-2">
                          {getRegistrationDetails(competition)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                {/* Action Button - Outside the general Link element */}
                <div className="p-5 pt-0">
                  <Link
                    to={
                      competition.IsRegistered && isCompetitionActive(competition.StartTime, competition.EndTime)
                        ? `/arena/${competition.ID || competition.CompetitionID}`
                        : `/competitions/${competition.ID || competition.CompetitionID}`
                    }
                    className={`block w-full py-2 rounded-lg text-center font-medium ${
                      competition.IsRegistered
                        ? isCompetitionActive(competition.StartTime, competition.EndTime)
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-100 text-gray-800'
                        : competition.Status === 'upcoming'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : competition.Status === 'ongoing'
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getActionButtonText(competition)}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionList; 