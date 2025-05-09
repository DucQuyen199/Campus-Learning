import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCompetitionDetails, registerForCompetition, startCompetition, getScoreboard } from '@/api/competitionService';
import { format, formatDistance } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';

const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [starting, setStarting] = useState(false);
  const [tabActive, setTabActive] = useState('overview'); // 'overview', 'problems', 'scoreboard'
  const [scoreboard, setScoreboard] = useState(null);
  const [scoreboardLoading, setScoreboardLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      try {
        setLoading(true);
        const response = await getCompetitionDetails(id);
        if (response.success) {
          setCompetition(response.data);
          
          // If the competition data shows the user is already registered,
          // update UI to reflect this instead of trying to register again
          if (response.data.isRegistered) {
            console.log('User is already registered for this competition');
          }
        } else {
          setError('Failed to load competition details');
        }
      } catch (err) {
        console.error('Error fetching competition details:', err);
        setError('An error occurred while fetching competition details');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionDetails();
  }, [id]);

  const fetchScoreboard = async () => {
    if (!competition) return;
    
    try {
      setScoreboardLoading(true);
      const response = await getScoreboard(id);
      if (response.success) {
        setScoreboard(response.data);
      } else {
        toast.error('Failed to load scoreboard');
      }
    } catch (err) {
      console.error('Error fetching scoreboard:', err);
      toast.error('An error occurred while fetching scoreboard');
    } finally {
      setScoreboardLoading(false);
    }
  };

  useEffect(() => {
    if (tabActive === 'scoreboard' && !scoreboard) {
      fetchScoreboard();
    }
  }, [tabActive, scoreboard]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to register for this competition');
      navigate('/login', { state: { from: `/competitions/${id}` } });
      return;
    }

    try {
      setRegistering(true);
      console.log('Attempting to register for competition:', id);
      const response = await registerForCompetition(id);
      console.log('Registration response received:', response);
      
      if (response.success) {
        // Handle special case where user is already registered
        if (response.alreadyRegistered) {
          console.log('User is already registered, showing info toast');
          toast.info(response.message || 'You are already registered for this competition');
          setJustRegistered(true); // Consider them newly registered for UI purposes
        } else {
          console.log('Registration successful, showing success toast');
          toast.success('Successfully registered for the competition');
          setJustRegistered(true); // Set the just registered state to true
        }
        
        // Refresh competition data
        console.log('Refreshing competition data after registration');
        const updatedCompetition = await getCompetitionDetails(id);
        if (updatedCompetition.success) {
          setCompetition({
            ...updatedCompetition.data,
            isRegistered: true // Ensure isRegistered is true even if the backend hasn't updated yet
          });
        }
      } else {
        console.log('Registration response indicates failure:', response);
        toast.error(response.message || 'Failed to register for the competition');
      }
    } catch (err) {
      console.error('Error registering for competition:', err);
      
      // Log additional error details for debugging
      if (err.response) {
        console.error('Error response details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
      }
      
      // Provide better error messages to the user based on status code
      if (err.response) {
        const { status, data } = err.response;
        
        switch (status) {
          case 400:
            // Special handling for "already registered" errors that might not be caught by the API service
            if (data.message && data.message.toLowerCase().includes('already registered')) {
              console.log('Handling already registered error in component');
              toast.info('You are already registered for this competition');
              
              // Refresh the competition details to show registration status
              const updatedCompetition = await getCompetitionDetails(id);
              if (updatedCompetition.success) {
                setCompetition(updatedCompetition.data);
              }
              break;
            }
            toast.error(data.message || 'Invalid registration request');
            break;
          case 401:
            toast.error('Please log in to register for this competition');
            navigate('/login', { state: { from: `/competitions/${id}` } });
            break;
          case 404:
            toast.error('Competition not found');
            break;
          case 500:
            toast.error('Server error. Please try again later.');
            break;
          default:
            toast.error(data.message || 'An error occurred while registering');
        }
      } else {
        toast.error('Connection error. Please check your internet connection and try again.');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleStart = async () => {
    try {
      setStarting(true);
      const response = await startCompetition(id);
      if (response.success) {
        toast.success('Competition started successfully');
        // Redirect to first problem or update UI
        if (competition.problems && competition.problems.length > 0) {
          navigate(`/competitions/${id}/problems/${competition.problems[0].ProblemID}`);
        } else {
          // Refresh competition data
          const updatedCompetition = await getCompetitionDetails(id);
          if (updatedCompetition.success) {
            setCompetition(updatedCompetition.data);
          }
        }
      } else {
        toast.error(response.message || 'Failed to start the competition');
      }
    } catch (err) {
      console.error('Error starting competition:', err);
      toast.error(err.response?.data?.message || 'An error occurred while starting the competition');
    } finally {
      setStarting(false);
    }
  };

  const getCompetitionStatus = () => {
    if (!competition) return '';
    
    const now = new Date();
    const start = new Date(competition.StartTime);
    const end = new Date(competition.EndTime);
    
    if (now < start) {
      return 'upcoming';
    } else if (now >= start && now <= end) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };

  const formatDateTime = (dateTime) => {
    try {
      return format(new Date(dateTime), 'HH:mm dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return 'Invalid date';
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
      case 'cancelled':
        return 'Đã hủy';
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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Dễ':
        return 'text-green-600';
      case 'Trung bình':
        return 'text-yellow-600';
      case 'Khó':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderActionButton = () => {
    if (!competition) return null;
    
    // If user is not logged in, show login to register button
    if (!isAuthenticated) {
      return (
        <button
          onClick={() => navigate('/login', { state: { from: `/competitions/${id}` } })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Đăng nhập để tham gia
        </button>
      );
    }

    const status = getCompetitionStatus();
    const isRegistered = competition.isRegistered || justRegistered;
    const participantStatus = competition.participantStatus;

    // User is registered and has started the competition
    if (isRegistered && participantStatus && participantStatus.Status === 'active') {
      return (
        <div>
          <Link
            to={`/competitions/${id}/problems/${competition.problems[0]?.ProblemID}`}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md block text-center"
          >
            Tiếp tục làm bài
          </Link>
          <div className="mt-2 text-sm text-gray-500 text-center">
            Cuộc thi kết thúc vào: {formatDateTime(participantStatus.EndTime)}
          </div>
        </div>
      );
    }

    // User is registered but hasn't started yet (or just registered)
    if (isRegistered && (!participantStatus || participantStatus.Status === 'registered' || justRegistered)) {
      if (status === 'ongoing' || justRegistered) {
        return (
          <div>
            {justRegistered && (
              <div className="bg-green-50 border border-green-100 rounded-md p-3 mb-4">
                <div className="flex items-center text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Đăng ký thành công!</span>
                </div>
                <p className="mt-1 text-sm text-green-600">
                  Bạn đã đăng ký tham gia cuộc thi thành công và có thể bắt đầu ngay bây giờ.
                </p>
              </div>
            )}
            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
            >
              {starting ? 'Đang khởi tạo...' : 'Bắt đầu làm bài ngay'}
            </button>
          </div>
        );
      } else if (status === 'upcoming') {
        return (
          <div>
            {justRegistered && (
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
                <div className="flex items-center text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Đăng ký thành công!</span>
                </div>
                <p className="mt-1 text-sm text-blue-600">
                  Bạn đã đăng ký tham gia cuộc thi thành công. Hãy quay lại khi cuộc thi bắt đầu.
                </p>
              </div>
            )}
            <button
              disabled
              className="w-full bg-gray-300 text-gray-600 font-medium py-2 px-4 rounded-md cursor-not-allowed"
            >
              Đã đăng ký - Chờ cuộc thi bắt đầu
            </button>
          </div>
        );
      } else {
        return (
          <div>
            {justRegistered && (
              <div className="bg-gray-50 border border-gray-100 rounded-md p-3 mb-4">
                <div className="flex items-center text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Đăng ký thành công!</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Bạn đã đăng ký thành công, nhưng rất tiếc cuộc thi đã kết thúc.
                </p>
              </div>
            )}
            <button
              disabled
              className="w-full bg-gray-300 text-gray-600 font-medium py-2 px-4 rounded-md cursor-not-allowed"
            >
              Đã kết thúc - Bạn chưa tham gia
            </button>
          </div>
        );
      }
    }

    // User is not registered
    if (status === 'upcoming' || status === 'ongoing') {
      return (
        <button
          onClick={handleRegister}
          disabled={registering}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          {registering ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
        </button>
      );
    } else {
      return (
        <button
          disabled
          className="w-full bg-gray-300 text-gray-600 font-medium py-2 px-4 rounded-md cursor-not-allowed"
        >
          Cuộc thi đã kết thúc
        </button>
      );
    }
  };

  const renderContent = () => {
    if (!competition) return null;

    switch (tabActive) {
      case 'overview':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Mô tả cuộc thi</h2>
            <div className="prose max-w-none">
              <p>{competition.Description}</p>
            </div>
            
            <h3 className="text-xl font-semibold mt-8 mb-4">Thông tin chung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Thời gian bắt đầu</h4>
                <p>{formatDateTime(competition.StartTime)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Thời gian kết thúc</h4>
                <p>{formatDateTime(competition.EndTime)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Thời lượng</h4>
                <p>{competition.Duration} phút</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Độ khó</h4>
                <p className={getDifficultyColor(competition.Difficulty)}>
                  {competition.Difficulty || 'Trung bình'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Số lượng người tham gia</h4>
                <p>{competition.CurrentParticipants} / {competition.MaxParticipants}</p>
              </div>
              {competition.OrganizerName && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Tổ chức bởi</h4>
                  <p>{competition.OrganizerName}</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'problems':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Danh sách bài tập</h2>
            {!competition.isRegistered ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Bạn cần đăng ký tham gia cuộc thi để xem chi tiết bài tập</p>
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  {registering ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                </button>
              </div>
            ) : competition.participantStatus?.Status !== 'active' ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Bạn cần bắt đầu làm bài để xem chi tiết</p>
                <button
                  onClick={handleStart}
                  disabled={starting || getCompetitionStatus() !== 'ongoing'}
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md ${getCompetitionStatus() !== 'ongoing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {starting ? 'Đang khởi tạo...' : 'Bắt đầu làm bài'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên bài
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Độ khó
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Điểm
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {competition.problems.map((problem) => (
                      <tr key={problem.ProblemID} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/competitions/${id}/problems/${problem.ProblemID}`)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {problem.Title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${getDifficultyColor(problem.Difficulty)}`}>
                            {problem.Difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {problem.Points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* Here you would show the user's progress */}
                          <span className="text-sm text-gray-500">Chưa nộp bài</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      
      case 'scoreboard':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Bảng xếp hạng</h2>
            {scoreboardLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : !scoreboard ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Không thể tải bảng xếp hạng</p>
              </div>
            ) : scoreboard.participants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Chưa có người tham gia</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Xếp hạng
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người tham gia
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Điểm
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số bài đã giải
                      </th>
                      {scoreboard.problems.map(problem => (
                        <th key={problem.ProblemID} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {problem.Title.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scoreboard.participants.map((participant) => (
                      <tr key={participant.ParticipantID}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {participant.rank}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <img className="h-8 w-8 rounded-full" src={participant.Image || 'https://via.placeholder.com/40'} alt="" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {participant.FullName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {participant.Score}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {participant.TotalProblemsSolved}
                        </td>
                        {scoreboard.problems.map(problem => {
                          const submission = participant.problems[problem.ProblemID];
                          return (
                            <td key={problem.ProblemID} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {submission ? (
                                submission.accepted ? (
                                  <span className="text-green-600 font-medium">{submission.score}</span>
                                ) : (
                                  <span className="text-red-600">-{submission.attempts}</span>
                                )
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Reset justRegistered after a delay
  useEffect(() => {
    if (justRegistered) {
      const timer = setTimeout(() => {
        setJustRegistered(false);
      }, 60000); // Reset after 60 seconds
      
      return () => clearTimeout(timer);
    }
  }, [justRegistered]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error || 'Competition not found'}
        </div>
        <div className="mt-4">
          <Link to="/competitions" className="text-blue-600 hover:text-blue-800">
            ← Quay lại danh sách cuộc thi
          </Link>
        </div>
      </div>
    );
  }

  const status = getCompetitionStatus();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-4">
        <Link to="/competitions" className="text-blue-600 hover:text-blue-800">
          ← Quay lại danh sách cuộc thi
        </Link>
      </div>

      {/* Cover image */}
      <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-6">
        <img
          src={competition.CoverImageURL || 'https://via.placeholder.com/1200x400?text=Competition+Cover'}
          alt={competition.Title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="p-6 text-white w-full">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{competition.Title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(status)}`}>
                {getStatusLabel(status)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <span className="text-sm bg-black bg-opacity-30 px-2 py-1 rounded">
                Bắt đầu: {formatDateTime(competition.StartTime)}
              </span>
              <span className="text-sm bg-black bg-opacity-30 px-2 py-1 rounded">
                Kết thúc: {formatDateTime(competition.EndTime)}
              </span>
              <span className="text-sm bg-black bg-opacity-30 px-2 py-1 rounded">
                Thời lượng: {competition.Duration} phút
              </span>
              <span className="text-sm bg-black bg-opacity-30 px-2 py-1 rounded">
                Độ khó: {competition.Difficulty}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2">
          {/* Tabs */}
          <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b">
              <button
                className={`flex-1 py-3 px-4 text-center ${
                  tabActive === 'overview'
                    ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setTabActive('overview')}
              >
                Tổng quan
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center ${
                  tabActive === 'problems'
                    ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setTabActive('problems')}
              >
                Bài tập
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center ${
                  tabActive === 'scoreboard'
                    ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => {
                  setTabActive('scoreboard');
                  fetchScoreboard(); // Refresh the scoreboard when the tab is clicked
                }}
              >
                Bảng xếp hạng
              </button>
            </div>
          </div>

          {/* Tab content */}
          {renderContent()}
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Tham gia cuộc thi</h2>
            
            {/* Registration status */}
            {competition.isRegistered && (
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
                <div className="flex items-center text-blue-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="font-medium">Bạn đã đăng ký tham gia</span>
                </div>
                {competition.participantStatus?.StartTime && (
                  <p className="mt-1 text-sm text-blue-700">
                    Bắt đầu lúc: {formatDateTime(competition.participantStatus.StartTime)}
                  </p>
                )}
              </div>
            )}
            
            {/* Action button */}
            <div className="mt-4">
              {renderActionButton()}
            </div>
            
            {/* Additional info */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Thông tin thêm</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Số lượng bài tập:</span>
                  <span className="text-sm font-medium">{competition.problems?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Người tham gia:</span>
                  <span className="text-sm font-medium">{competition.CurrentParticipants} / {competition.MaxParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Độ khó:</span>
                  <span className={`text-sm font-medium ${getDifficultyColor(competition.Difficulty)}`}>
                    {competition.Difficulty}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetail; 