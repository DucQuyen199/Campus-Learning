import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  UserGroupIcon, 
  ClockIcon, 
  TrophyIcon,
  ChartBarIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { API_URL } from '../../config';
import { 
  getCompetitionById, 
  getCompetitionLeaderboard, 
  registerCompetition,
  finishCompetition,
  checkRegistrationStatus as checkRegistrationStatusApi,
  submitCompetitionSolution,
  getCompetitionProblems,
  getCompletedProblems
} from '../../api/competitionApi';
import axios from 'axios';
import CodeEditor from '../../pages/Arena/index';

const CompetitionDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userParticipation, setUserParticipation] = useState(null);
  const [userRanking, setUserRanking] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState(null);
  const [participating, setParticipating] = useState(false);
  const [isCompetitionActive, setIsCompetitionActive] = useState(false);
  const [isCompetitionUpcoming, setIsCompetitionUpcoming] = useState(false);
  const [isFinishing, setFinishing] = useState(false);
  const [codeRuntimeStatus, setCodeRuntimeStatus] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showSolutionEditor, setShowSolutionEditor] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedProblems, setCompletedProblems] = useState([]);

  useEffect(() => {
    fetchCompetitionData();
    fetchLeaderboard()
      .then(() => {
        // After leaderboard is fetched, check registration status
        if (currentUser && currentUser.id) {
          checkRegistrationStatus();
          fetchUserRanking();
        }
      });
    
    // Initialize code runtime for competitions
    initializeCodeRuntime();
    
    // Show success toast if user was redirected from registration
    if (location.state?.registered) {
      toast.success('Đăng ký cuộc thi thành công');
    }
    
    // Check if we're returning from the arena
    if (location.state?.fromArena) {
      toast.success('Bạn đã quay trở lại từ đấu trường');
      // Make sure to refresh the leaderboard and display it
      fetchLeaderboard();
      setActiveTab('leaderboard');
    }

    // Set up interval to refresh leaderboard every 30 seconds if competition is active
    const leaderboardInterval = setInterval(() => {
      if (isCompetitionActive) {
        fetchLeaderboard();
      }
    }, 30000);  // Mỗi 30 giây

    return () => clearInterval(leaderboardInterval);
  }, [id, currentUser, location.state]);

  useEffect(() => {
    // Update competition status whenever competition data changes
    if (competition) {
      const now = new Date();
      const startTime = new Date(competition.StartTime);
      const endTime = new Date(competition.EndTime);
      
      setIsCompetitionActive(now >= startTime && now < endTime);
      setIsCompetitionUpcoming(now < startTime);
    }
  }, [competition]);

  useEffect(() => {
    if (currentUser && currentUser.id && competition) {
      fetchCompletedProblems();
    }
  }, [currentUser, competition]);

  // Ensure we update the participant count whenever we get new data
  useEffect(() => {
    if (competition) {
      // Update participation count whenever leaderboard changes
      if (leaderboard && leaderboard.length > 0) {
        const participantCount = Math.max(competition.CurrentParticipants || 0, leaderboard.length);
        
        if (participantCount !== competition.CurrentParticipants) {
          console.log(`Updating participant count from ${competition.CurrentParticipants} to ${participantCount}`);
          setCompetition(prevComp => ({
            ...prevComp,
            CurrentParticipants: participantCount
          }));
        }
      }
    }
  }, [leaderboard, competition]);

  // Add a function to get accurate participant count
  const getParticipantCount = () => {
    if (!competition) return 0;
    
    // If we have a leaderboard, use the higher count between API data and leaderboard entries
    if (leaderboard && leaderboard.length > 0) {
      return Math.max(competition.CurrentParticipants || 0, leaderboard.length);
    }
    
    // Otherwise use the count from API
    return competition.CurrentParticipants || 0;
  };

  const fetchCompetitionData = async () => {
    try {
      setLoading(true);
      
      // Use the imported API function
      const data = await getCompetitionById(id, currentUser?.token);
      
      if (data) {
        console.log('Competition detail data:', data);
        
        // Log participant count changes for debugging
        const oldCount = competition?.CurrentParticipants || 0;
        const newCount = data.CurrentParticipants || 0;
        const leaderboardCount = leaderboard?.length || 0;
        
        console.log(`Participant counts - API: ${newCount}, Previous: ${oldCount}, Leaderboard: ${leaderboardCount}`);
        
        // Ensure we don't lose participants when updating from API
        if (leaderboardCount > newCount) {
          data.CurrentParticipants = leaderboardCount;
          console.log(`Using leaderboard count (${leaderboardCount}) instead of API count (${newCount})`);
        }
        
        setCompetition(data);
        
        // If the participant count changed significantly, refresh the leaderboard
        if (Math.abs(oldCount - newCount) > 1) {
          console.log('Significant participant count change detected, refreshing leaderboard');
          fetchLeaderboard();
        }
      } else {
        console.error('Failed to fetch competition details');
        toast.error('Lỗi khi tải thông tin cuộc thi');
      }
    } catch (error) {
      console.error('Error fetching competition details:', error);
      toast.error('Lỗi khi tải thông tin cuộc thi');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!currentUser || !id) return;
    
    try {
      const response = await checkRegistrationStatusApi(id, currentUser.token);
      
      if (response && response.isRegistered) {
        setIsRegistered(true);
        
        // Nếu người dùng đã đăng ký nhưng không có trong bảng xếp hạng, 
        // cập nhật bảng xếp hạng để bao gồm họ
        if (leaderboard.length > 0) {
          const userInLeaderboard = isUserInLeaderboard(currentUser.id, leaderboard);
          
          if (!userInLeaderboard) {
            // Gọi lại để cập nhật bảng xếp hạng với người dùng hiện tại
            fetchLeaderboard();
          }
        } else {
          // Nếu bảng xếp hạng trống, đảm bảo tạo một bảng xếp hạng mới
          createFallbackLeaderboard();
        }
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      
      // Nếu không thể kiểm tra trạng thái đăng ký nhưng người dùng xuất hiện 
      // trong bảng xếp hạng, đánh dấu họ là đã đăng ký
      if (leaderboard.length > 0 && currentUser) {
        const userInLeaderboard = isUserInLeaderboard(currentUser.id, leaderboard);
        
        if (userInLeaderboard) {
          setIsRegistered(true);
        }
      }
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // Use the imported API function
      const data = await getCompetitionLeaderboard(id);
      
      if (data && Array.isArray(data)) {
        // Map response data to standardized format first
        const standardizedData = data.map(participant => ({
          id: participant.id || participant.userId || participant.userID || participant.UserID,
          userId: participant.userId || participant.userID || participant.UserID || participant.id,
          name: participant.name || participant.userName || participant.fullName || 'Unknown User',
          avatar: participant.avatar || participant.imageUrl || participant.Image,
          score: parseInt(participant.score || 0, 10),
          problemsSolved: parseInt(participant.problemsSolved || 0, 10),
          competitionTime: parseInt(participant.competitionTime || participant.solvedTime || 0, 10),
          rank: participant.rank || 0,
          isCurrentUser: false
        }));
        
        // Đảm bảo dữ liệu leaderboard được sắp xếp theo thứ hạng
        const sortedLeaderboard = standardizedData.sort((a, b) => {
          // Nếu có thứ hạng từ server, ưu tiên sử dụng
          if (a.rank && b.rank) return a.rank - b.rank;
          
          // Sắp xếp theo điểm cao nhất trước
          if (b.score !== a.score) return b.score - a.score;
          
          // Nếu điểm bằng nhau, người hoàn thành nhiều bài hơn xếp trên
          if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
          
          // Nếu số bài giải bằng nhau, người làm nhanh hơn xếp trên
          return a.competitionTime - b.competitionTime;
        });
        
        // Cập nhật thứ hạng nếu không có từ server
        const leaderboardWithRanks = sortedLeaderboard.map((participant, index) => {
          if (!participant.rank) {
            participant.rank = index + 1;
          }
          return participant;
        });
        
        // Kiểm tra xem người dùng hiện tại có trong bảng xếp hạng không
        const addCurrentUser = () => {
          if (currentUser && currentUser.id && isRegistered) {
            const currentUserId = String(currentUser.id);
            const userExists = isUserInLeaderboard(currentUserId, leaderboardWithRanks);
            
            // Nếu người dùng không có trong bảng xếp hạng nhưng đã đăng ký thì thêm họ vào
            if (!userExists) {
              console.log('Adding current user to the leaderboard as they are registered but not found');
              
              // Tạo entry mới cho người dùng
              const newUserEntry = {
                id: currentUserId,
                userId: currentUserId,
                name: currentUser.fullName || currentUser.username || currentUser.userName || 'Current User',
                avatar: currentUser.avatar || currentUser.Image,
                score: 0,
                problemsSolved: 0,
                competitionTime: 0,
                isCurrentUser: true,
                rank: leaderboardWithRanks.length + 1 // Add at the end initially
              };
              
              // Thêm người dùng vào danh sách
              leaderboardWithRanks.push(newUserEntry);
              
              // Cập nhật lại thứ hạng
              leaderboardWithRanks.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
                return a.competitionTime - b.competitionTime;
              }).forEach((participant, index) => {
                participant.rank = index + 1;
              });
              
              return true;
            } else {
              // Đánh dấu người dùng hiện tại trong bảng xếp hạng
              const userEntry = leaderboardWithRanks.find(p => 
                String(p.id) === currentUserId || 
                String(p.userId) === currentUserId
              );
              if (userEntry) {
                userEntry.isCurrentUser = true;
              }
            }
          }
          return false;
        };
        
        // Thêm người dùng hiện tại nếu cần và đã đăng ký
        const userAdded = isRegistered ? addCurrentUser() : false;
        
        setLeaderboard(leaderboardWithRanks);
        
        // Nếu người dùng xuất hiện trong bảng xếp hạng nhưng chưa được đánh dấu là đã đăng ký
        if (currentUser && currentUser.id) {
          const userInLeaderboard = isUserInLeaderboard(currentUser.id, leaderboardWithRanks);
          
          if (userInLeaderboard && !isRegistered) {
            console.log('User is in the leaderboard but not marked as registered - updating registration status');
            setIsRegistered(true);
          }
        }
        
        // Fetch user ranking from backend to update user tier info
        if (currentUser && currentUser.token) {
          fetchUserRanking();
        }
        
        return leaderboardWithRanks;
      } else {
        console.error('Failed to fetch leaderboard or invalid data format');
        
        // Nếu không có dữ liệu nhưng người dùng đã đăng ký, tạo bảng xếp hạng với người dùng hiện tại
        if (isRegistered && currentUser) {
          createFallbackLeaderboard();
        }
        
        return [];
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      
      // Tạo bảng xếp hạng dự phòng nếu có lỗi
      if (isRegistered && currentUser) {
        createFallbackLeaderboard();
      }
      
      return [];
    }
  };

  // Helper function to check if a user is in the leaderboard
  const isUserInLeaderboard = (userId, leaderboardData) => {
    if (!userId || !leaderboardData || !Array.isArray(leaderboardData)) return false;
    
    const userIdStr = String(userId);
    return leaderboardData.some(entry => 
      String(entry.id) === userIdStr || 
      String(entry.userId) === userIdStr ||
      entry.isCurrentUser === true
    );
  };

  // Create a fallback leaderboard when API call fails and user is registered
  // Đảm bảo người dùng đã đăng ký luôn xuất hiện trong bảng xếp hạng ngay cả khi có lỗi
  const createFallbackLeaderboard = () => {
    if (!currentUser) return;
    
    // Create a basic leaderboard entry for the current user
    const fallbackEntry = {
      id: currentUser.id,
      userId: currentUser.id,
      name: currentUser.fullName || currentUser.username || currentUser.userName || 'Current User',
      avatar: currentUser.avatar || currentUser.Image,
      score: 0,
      rank: 1,
      problemsSolved: 0,
      competitionTime: 0,
      isCurrentUser: true
    };
    
    setLeaderboard([fallbackEntry]);
    console.log('Created fallback leaderboard with current user');
  };

  const fetchUserRanking = async () => {
    if (!currentUser || !currentUser.token || !currentUser.user) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rankings/user/${currentUser.user.id}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserRanking(data);
      } else if (response.status === 404) {
        console.log('User ranking not found, creating default profile');
        setUserRanking({
          id: currentUser.user.id,
          name: currentUser.user.fullName || currentUser.user.username,
          totalPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          tier: 'BRONZE',
          problemsSolved: 0,
          accuracy: 0,
          wins: 0,
          achievements: []
        });
      }
    } catch (error) {
      console.error('Error fetching user ranking:', error);
      // Set default ranking to avoid UI errors
      setUserRanking({
        id: currentUser.user.id,
        name: currentUser.user.fullName || currentUser.user.username,
        totalPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        tier: 'BRONZE',
        problemsSolved: 0,
        accuracy: 0,
        wins: 0,
        achievements: []
      });
    }
  };

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      setRegistrationMessage({ type: 'info', content: 'Đang đăng ký...' });
      
      if (!currentUser || !currentUser.token) {
        setRegistrationMessage({ type: 'error', content: 'Bạn cần đăng nhập để đăng ký tham gia' });
        setIsRegistering(false);
        return;
      }
      
      // Check real-time status before registration
      const realTimeStatus = getCompetitionStatus();
      if (realTimeStatus === 'completed') {
        setRegistrationMessage({ type: 'error', content: 'Cuộc thi đã kết thúc. Không thể đăng ký.' });
        setIsRegistering(false);
        return;
      }
      
      console.log('Competition ID for registration:', competition.CompetitionID);
      console.log('User token available:', !!currentUser.token);
      console.log('Real-time competition status:', realTimeStatus);
      
      // Use the imported API function instead of direct fetch
      const response = await registerCompetition(competition.CompetitionID, currentUser.token);
      console.log('Registration response:', response);
      
      if (response.success === false) {
        // Handle specific error cases
        if (response.error && response.error.includes('converting date')) {
          // Temporary database issue with date formatting
          setRegistrationMessage({ 
            type: 'error', 
            content: 'Có lỗi với hệ thống đăng ký. Vui lòng thử lại sau vài phút.' 
          });
          
          // Show technical details in console but not to user
          console.error('Technical error details:', response.error);
          
          // Auto-refresh after a delay to attempt to fix any temporary issues
          setTimeout(() => {
            setRegistrationMessage({ type: 'info', content: 'Đang làm mới trang...' });
            window.location.reload();
          }, 5000);
          
          setIsRegistering(false);
          return;
        }
        
        // Other general errors
        setRegistrationMessage({ 
          type: 'error', 
          content: response.message || 'Đăng ký thất bại. Vui lòng thử lại sau.' 
        });
        setIsRegistering(false);
        return;
      }
      
      // When user is already registered, still mark registration as successful
      if (response.isAlreadyRegistered) {
        setRegistrationMessage({ type: 'success', content: response.message || 'Bạn đã đăng ký cuộc thi này trước đó' });
        setIsRegistered(true);
        
        // Refresh competition status
        fetchCompetitionData();
        
        // Refresh user ranking
        fetchUserRanking();
        
        // Kiểm tra xem người dùng đã có trong bảng xếp hạng chưa
        const userInLeaderboard = isUserInLeaderboard(currentUser.id, leaderboard);
        
        // Nếu chưa có trong bảng xếp hạng, thêm vào ngay
        if (!userInLeaderboard) {
          addUserToLeaderboard();
        } else {
          // Nếu đã có trong bảng xếp hạng, vẫn refresh để cập nhật thông tin mới nhất
          fetchLeaderboard();
        }
        
        // Auto-switch to the leaderboard tab after registration
        setTimeout(() => {
          setActiveTab('leaderboard');
        }, 1000);
        
        setIsRegistering(false);
        return;
      }
      
      // Success case for new registration
      setRegistrationMessage({ type: 'success', content: 'Đăng ký thành công!' });
      setIsRegistered(true);
      
      // Update the participant count in the UI immediately
      if (competition) {
        // Increment participant count immediately for responsive UI
        setCompetition(prevCompetition => {
          // Check if we need to increment
          const currentCount = getParticipantCount();
          let newCount = currentCount + 1;
          
          // Only increment if user isn't already in the leaderboard
          if (leaderboard && isUserInLeaderboard(currentUser.id, leaderboard)) {
            newCount = currentCount;
            console.log('User already in leaderboard, keeping participant count at', currentCount);
          } else {
            console.log(`Incrementing participant count from ${currentCount} to ${newCount}`);
          }
          
          return {
            ...prevCompetition,
            CurrentParticipants: newCount
          };
        });
      }
      
      // Refresh competition status
      fetchCompetitionData();
      
      // Refresh user ranking
      fetchUserRanking();
      
      // Thêm người dùng vào bảng xếp hạng ngay lập tức
      addUserToLeaderboard();
      
      // Auto-switch to the leaderboard tab after registration
      setTimeout(() => {
        setActiveTab('leaderboard');
      }, 1000);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      
      setRegistrationMessage({ 
        type: 'error', 
        content: error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.' 
      });
    } finally {
      setIsRegistering(false);
      // Show message for 5 seconds
      setTimeout(() => {
        setRegistrationMessage(null);
      }, 5000);
    }
  };

  // Helper function to add the current user to the leaderboard
  // Hàm này được sử dụng để đảm bảo người dùng đã đăng ký sẽ luôn có mặt trong bảng xếp hạng
  const addUserToLeaderboard = () => {
    if (!currentUser) return;
    
    // Tạo entry mới cho người dùng với điểm ban đầu là 0
    const newUserEntry = {
      id: currentUser.id,
      userId: currentUser.id,
      name: currentUser.fullName || currentUser.username || currentUser.userName || 'Current User',
      avatar: currentUser.avatar || currentUser.Image,
      score: 0,
      problemsSolved: 0,
      competitionTime: 0,
      isCurrentUser: true,
      rank: leaderboard.length + 1 // Xếp hạng cuối cùng ban đầu
    };
    
    // Cập nhật state leaderboard ngay lập tức
    setLeaderboard(prevLeaderboard => {
      // Kiểm tra xem người dùng đã có trong bảng xếp hạng chưa
      const userExists = isUserInLeaderboard(currentUser.id, prevLeaderboard);
      
      if (userExists) {
        console.log('User already exists in leaderboard, not adding again');
        return prevLeaderboard; // Không thêm lại nếu đã tồn tại
      }
      
      console.log('Adding user to leaderboard after registration');
      
      // Thêm người dùng vào bảng xếp hạng và sắp xếp lại
      const newLeaderboard = [...prevLeaderboard, newUserEntry]
        .sort((a, b) => {
          // Sắp xếp theo điểm cao nhất trước
          if (b.score !== a.score) return b.score - a.score;
          
          // Nếu điểm bằng nhau, người hoàn thành nhiều bài hơn xếp trên
          if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
          
          // Nếu số bài giải bằng nhau, người làm nhanh hơn xếp trên
          return a.competitionTime - b.competitionTime;
        })
        .map((participant, index) => ({
          ...participant,
          rank: index + 1
        }));
        
      return newLeaderboard;
    });
    
    // Sau đó vẫn gọi API để lấy bảng xếp hạng chính thức từ server
    fetchLeaderboard();
  };

  const handleFinishCompetition = async () => {
    try {
      setFinishing(true);
      
      const response = await finishCompetition(id, currentUser.token);
      
      toast.success('Hoàn thành cuộc thi thành công');
      
      // Display ranking promotion if provided
      if (response.newTier && response.newTier !== userRanking?.tier) {
        toast.success(`Chúc mừng! Bạn đã thăng hạng lên ${response.newTier}`, {
          duration: 5000,
          icon: '🏆'
        });
      }
      
      fetchCompetitionData();
      fetchLeaderboard();
      fetchUserRanking();
    } catch (error) {
      console.error('Error finishing competition:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi hoàn thành cuộc thi';
      toast.error(errorMessage);
    } finally {
      setFinishing(false);
    }
  };

  const renderTierBadge = (tier) => {
    const tierColors = {
      'BRONZE': 'bg-amber-700',
      'SILVER': 'bg-gray-400',
      'GOLD': 'bg-amber-400',
      'PLATINUM': 'bg-emerald-400',
      'DIAMOND': 'bg-blue-400',
      'MASTER': 'bg-purple-600'
    };
    
    return (
      <span className={`px-3 py-1 ${tierColors[tier]} text-white rounded-full text-sm font-medium`}>
        {tier}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRemainingTime = () => {
    if (!competition) return '';
    
    const start = new Date(competition.StartTime);
    const end = new Date(start.getTime() + competition.Duration * 60000);
    const now = new Date();
    
    if (now < start) {
      // Competition not started yet
      const diff = start - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `Bắt đầu sau: ${days ? days + 'd ' : ''}${hours}h ${minutes}m`;
    } else if (now < end) {
      // Competition ongoing
      const diff = end - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours ? hours + ':' : ''}${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    } else {
      // Competition ended
      return 'Đã kết thúc';
    }
  };

  const getProgressPercentage = () => {
    if (!competition) return 0;
    
    const start = new Date(competition.StartTime);
    const end = new Date(start.getTime() + competition.Duration * 60000);
    const now = new Date();
    
    if (now < start) {
      return 0;
    } else if (now > end) {
      return 100;
    } else {
      const totalDuration = end - start;
      const elapsed = now - start;
      return Math.floor((elapsed / totalDuration) * 100);
    }
  };

  const getCompetitionStatus = () => {
    if (!competition) return 'unknown';
    
    const now = new Date();
    const startTime = new Date(competition.StartTime);
    const endTime = new Date(competition.EndTime);
    
    if (now < startTime) {
      return 'upcoming';
    } else if (now >= startTime && now < endTime) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };
  
  const competitionStatus = getCompetitionStatus();
  const isCompetitionEnded = competitionStatus === 'completed';
  
  // Set the state variables based on competition status
  useEffect(() => {
    if (competition) {
      setIsCompetitionActive(competitionStatus === 'ongoing');
      setIsCompetitionUpcoming(competitionStatus === 'upcoming');
    }
  }, [competitionStatus, competition]);
  
  // For debugging
  if (competition && competition.Status !== competitionStatus) {
    console.log(`Competition status mismatch: Backend says "${competition.Status}" but real-time status is "${competitionStatus}"`);
  }

  // Initialize code runtime for competitions
  const initializeCodeRuntime = async () => {
    try {
      // Check Docker availability directly from the API
      const dockerStatus = await fetch(`${API_URL}/api/code-execution/health`, {
        headers: {
          'Authorization': currentUser?.token ? `Bearer ${currentUser.token}` : ''
        }
      });
      
      const dockerData = await dockerStatus.json();
      console.log(`Code runtime initialized. Docker available:`, dockerData);
      
      setCodeRuntimeStatus({
        initialized: dockerData.success,
        dockerAvailable: dockerData.success,
        javaScriptSupported: true,
        pythonSupported: true,
        cppSupported: true
      });
      
      return dockerData.success;
    } catch (error) {
      console.error('Failed to initialize code runtime:', error);
      setCodeRuntimeStatus({
        initialized: false,
        dockerAvailable: false,
        error: error.message
      });
      return false;
    }
  };

  const handleParticipateCompetition = () => {
    setParticipating(true);
    // Show loading state
    const toastId = toast.loading('Đang chuẩn bị đấu trường...');
    
    // First check if competition is still active
    if (!isCompetitionActive) {
      toast.dismiss(toastId);
      toast.error('Cuộc thi này không còn diễn ra. Vui lòng làm mới trang để cập nhật trạng thái.');
      setParticipating(false);
      return;
    }
    
    // Ensure leaderboard is up to date
    fetchLeaderboard().then(() => {
      // Check if Docker runtime is initialized
      initializeCodeRuntime()
        .then(dockerAvailable => {
          if (dockerAvailable) {
            toast.dismiss(toastId);
            toast.success('Môi trường Docker đã sẵn sàng. Đang vào đấu trường...');
            proceedToArena();
          } else {
            toast.dismiss(toastId);
            console.error('Docker environment is not available');
            
            // Ask user if they want to continue anyway
            if (window.confirm(
              'Môi trường Docker không khả dụng. ' +
              'Điều này sẽ ảnh hưởng đến khả năng thực thi mã trong cuộc thi. ' +
              'Bạn vẫn muốn tiếp tục không?'
            )) {
              proceedToArena();
            } else {
              setParticipating(false);
              toast.error('Đã hủy việc vào đấu trường');
            }
          }
        })
        .catch(error => {
          toast.dismiss(toastId);
          console.error('Error initializing Docker runtime:', error);
          toast.error('Lỗi khi khởi tạo môi trường thực thi: ' + error.message);
          setParticipating(false);
        });
    }).catch(error => {
      toast.dismiss(toastId);
      console.error('Error fetching leaderboard:', error);
      toast.error('Lỗi khi lấy dữ liệu bảng xếp hạng: ' + error.message);
      setParticipating(false);
    });
  };
  
  const proceedToArena = async () => {
    // Check if Docker supports the required languages
    try {
      // Call API to check supported languages
      const response = await fetch(`${API_URL}/api/code-execution/supported-languages`, {
        headers: {
          'Authorization': currentUser?.token ? `Bearer ${currentUser.token}` : ''
        }
      }).catch(() => {
        // If API not available, assume JavaScript and Python are supported
        return { ok: false };
      });

      let supportedLanguages = ['javascript', 'python']; // Default assumption
      
      if (response.ok) {
        const data = await response.json();
        supportedLanguages = data.languages || supportedLanguages;
      }
      
      // Check if required languages are supported
      const requiredLanguages = ['javascript', 'python'];
      const missingLanguages = requiredLanguages.filter(
        lang => !supportedLanguages.includes(lang)
      );
      
      if (missingLanguages.length > 0) {
        console.warn(`Some required languages are not supported: ${missingLanguages.join(', ')}`);
        toast.warning(
          `Một số ngôn ngữ lập trình (${missingLanguages.join(', ')}) không được hỗ trợ đầy đủ. ` +
          'Điều này có thể ảnh hưởng đến trải nghiệm cuộc thi.',
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Error checking supported languages:', error);
    }
    
    // Navigate programmatically to ensure we're not carrying over any redirects
    setTimeout(() => {
      // Navigate with state to indicate we're coming from the details page
      navigate(`/arena/${id}`, {
        state: {
          fromCompetitionDetails: true,
          competitionTitle: competition?.Title || 'Cuộc thi',
          codeRuntimeStatus: codeRuntimeStatus
        }
      });
    }, 500);
  };

  const getRegistrationButtonText = () => {
    if (isRegistered) {
      return 'Đã đăng ký';
    }
    
    const status = getCompetitionStatus();
    
    if (status === 'upcoming') {
      return 'Đăng ký tham gia';
    } else if (status === 'ongoing') {
      return 'Đăng ký và bắt đầu thi đấu';
    } else {
      return 'Cuộc thi đã kết thúc';
    }
  };

  const getRegistrationButtonProps = () => {
    const status = getCompetitionStatus();
    
    if (isRegistered) {
      return {
        disabled: true,
        className: "px-4 py-2 rounded-md bg-gray-400 text-white font-medium cursor-not-allowed"
      };
    }
    
    if (status === 'completed') {
      return {
        disabled: true,
        className: "px-4 py-2 rounded-md bg-gray-400 text-white font-medium cursor-not-allowed"
      };
    }
    
    return {
      disabled: false,
      className: "px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium"
    };
  };

  const fetchCompletedProblems = async () => {
    try {
      if (!currentUser || !currentUser.token || !competition) return;
      
      // Get completed problems from the API
      const apiCompletedProblems = await getCompletedProblems(competition.CompetitionID, currentUser.token);
      
      // Process the API response - ensure we have an array of problem IDs
      let problemIds = [];
      if (Array.isArray(apiCompletedProblems)) {
        problemIds = apiCompletedProblems.map(problem => 
          problem.ProblemID || problem.problemId || problem.id
        );
      }
      
      // Also check localStorage for any recently completed problems
      // This ensures we show problems as completed immediately, even before the backend is updated
      try {
        const localStorageKey = `completedProblems_${competition.CompetitionID}`;
        const localCompletedProblems = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        
        // Combine API and localStorage results, removing duplicates
        if (localCompletedProblems.length > 0) {
          problemIds = [...new Set([...problemIds, ...localCompletedProblems])];
          console.log('Combined completed problems:', problemIds);
        }
      } catch (err) {
        console.error('Error reading from localStorage:', err);
      }
      
      setCompletedProblems(problemIds);
      
      // After getting updated completed problems, refresh the leaderboard
      // to show the user's updated score and ranking
      if (problemIds.length > 0) {
        console.log(`User has completed ${problemIds.length} problems, refreshing leaderboard`);
        fetchLeaderboard();
      }
      
      return problemIds;
    } catch (error) {
      console.error('Error fetching completed problems:', error);
      
      // Still try to get data from localStorage as fallback
      try {
        const localStorageKey = `completedProblems_${competition.CompetitionID}`;
        const localCompletedProblems = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        if (localCompletedProblems.length > 0) {
          setCompletedProblems(localCompletedProblems);
          return localCompletedProblems;
        }
      } catch (err) {
        console.error('Error reading from localStorage:', err);
      }
      
      setCompletedProblems([]);
      return [];
    }
  };

  const handleSolveProblem = (problem) => {
    setSelectedProblem(problem);
    setShowSolutionEditor(true);
    // Set initial code from problem starter code if available
    setCode(problem.StarterCode || '// Write your code here');
    setLanguage('javascript'); // Default language
    setSubmissionResult(null);
  };

  const handleSubmitSolution = async () => {
    if (!selectedProblem || !code || !language) {
      toast.error('Please write your solution before submitting');
      return;
    }
    
    // Check if problem is already completed
    if (completedProblems.includes(selectedProblem.ProblemID)) {
      toast.info('This problem has already been completed!');
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionResult(null);
    
    try {
      const result = await submitCompetitionSolution(
        selectedProblem.ProblemID,
        code,
        language,
        currentUser.token
      );
      
      setSubmissionResult(result);
      
      // Check if solution passed
      if (result.success && result.data && result.data.passed) {
        toast.success('Congratulations! Your solution passed all test cases!');
        
        // Update completedProblems state
        if (!completedProblems.includes(selectedProblem.ProblemID)) {
          const updatedCompletedProblems = [...completedProblems, selectedProblem.ProblemID];
          setCompletedProblems(updatedCompletedProblems);
          
          // Save to localStorage to persist between page refreshes
          const localStorageKey = `completedProblems_${competition.CompetitionID}`;
          localStorage.setItem(localStorageKey, JSON.stringify(updatedCompletedProblems));
          
          // Hiển thị điểm đã nhận được
          if (result.data.score) {
            toast.success(`Bạn đã được cộng ${result.data.score} điểm!`, {
              duration: 5000,
              icon: '🎯'
            });
            
            // Thêm thông báo rõ ràng về chính sách tính điểm
            toast.info(`Điểm chỉ được tính khi giải pháp đúng với tất cả các test case.`, {
              duration: 7000,
              icon: 'ℹ️'
            });
          }
          
          // Cập nhật bảng xếp hạng sau khi nộp bài thành công
          const updateLeaderboard = async () => {
            try {
              // Lấy dữ liệu bảng xếp hạng mới nhất
              const updatedLeaderboard = await getCompetitionLeaderboard(id);
              
              if (updatedLeaderboard && Array.isArray(updatedLeaderboard)) {
                // Chuẩn hóa dữ liệu và cập nhật state
                const standardizedData = updatedLeaderboard.map(participant => ({
                  id: participant.id || participant.userId || participant.userID || participant.UserID,
                  userId: participant.userId || participant.userID || participant.UserID || participant.id,
                  name: participant.name || participant.userName || participant.fullName || 'Unknown User',
                  avatar: participant.avatar || participant.imageUrl || participant.Image,
                  score: parseInt(participant.score || 0, 10),
                  problemsSolved: parseInt(participant.problemsSolved || 0, 10),
                  competitionTime: parseInt(participant.competitionTime || participant.solvedTime || 0, 10),
                  rank: participant.rank || 0,
                  isCurrentUser: false
                }));
                
                // Sắp xếp theo thứ hạng
                const sortedLeaderboard = standardizedData.sort((a, b) => {
                  if (a.rank && b.rank) return a.rank - b.rank;
                  if (b.score !== a.score) return b.score - a.score;
                  if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
                  return a.competitionTime - b.competitionTime;
                });
                
                // Đánh dấu người dùng hiện tại
                if (currentUser && currentUser.id) {
                  const userEntry = sortedLeaderboard.find(p => 
                    String(p.id) === String(currentUser.id) || 
                    String(p.userId) === String(currentUser.id)
                  );
                  
                  if (userEntry) {
                    userEntry.isCurrentUser = true;
                  }
                }
                
                setLeaderboard(sortedLeaderboard);
              }
            } catch (error) {
              console.error('Error updating leaderboard:', error);
            }
          };
          
          // Cập nhật ngay lập tức và sau đó lập lịch các lần cập nhật tiếp theo
          updateLeaderboard();
          
          // Thiết lập lịch cập nhật bảng xếp hạng nhiều lần
          const refreshIntervals = [2000, 5000, 10000];
          refreshIntervals.forEach(interval => {
            setTimeout(updateLeaderboard, interval);
          });
        }
        
        // After a short delay, close the editor and show the leaderboard
        setTimeout(() => {
          setShowSolutionEditor(false);
          // Switch to leaderboard tab
          setActiveTab('leaderboard');
          
          // Thông báo cho người dùng xem bảng xếp hạng
          toast.success('Chuyển sang xem bảng xếp hạng', {
            icon: '🏆'
          });
        }, 3000);
        
      } else if (result.success) {
        toast.error('Your solution did not pass all test cases. Please try again.');
        
        // Nhắc nhở người dùng về chính sách tính điểm
        toast.info('Điểm chỉ được tính khi giải pháp đúng với tất cả các test case.', {
          duration: 5000,
          icon: 'ℹ️'
        });
      } else {
        toast.error(result.message || 'Error submitting solution');
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
      toast.error('Failed to submit solution. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh all competition data together
  const refreshAllData = async () => {
    try {
      const toastId = toast.loading('Đang cập nhật thông tin cuộc thi...');
      
      // Fetch competition data and leaderboard in parallel
      const [compData] = await Promise.all([
        fetchCompetitionData(),
        fetchLeaderboard()
      ]);
      
      // Check if participant count matches the leaderboard length
      if (competition && leaderboard.length > 0) {
        console.log('Comparing participant counts:', {
          ApiParticipants: competition.CurrentParticipants,
          LeaderboardParticipants: leaderboard.length
        });
        
        // If there's a mismatch, update the competition data with the correct count
        // This ensures UI shows accurate count even if the API returns incorrect data
        if (competition.CurrentParticipants !== leaderboard.length) {
          console.log(`Participant count mismatch: API reports ${competition.CurrentParticipants}, but leaderboard has ${leaderboard.length} participants`);
          
          // Only update if leaderboard count is higher (API is missing participants)
          if (leaderboard.length > competition.CurrentParticipants) {
            console.log('Updating participant count in UI to match leaderboard count');
            setCompetition(prevComp => ({
              ...prevComp,
              CurrentParticipants: leaderboard.length
            }));
          }
        }
      }
      
      // Check registration status after data is fetched
      if (currentUser && currentUser.id) {
        await checkRegistrationStatus();
      }
      
      toast.dismiss(toastId);
      toast.success('Đã cập nhật thông tin cuộc thi');
    } catch (error) {
      console.error('Error refreshing competition data:', error);
      toast.error('Lỗi khi cập nhật thông tin cuộc thi');
    }
  };

  // Thêm một effect mới để đảm bảo bảng xếp hạng được cập nhật khi người dùng hoàn thành bài tập
  useEffect(() => {
    // Nếu xác định là đã hoàn thành bài tập mới, cập nhật bảng xếp hạng
    if (completedProblems && completedProblems.length > 0) {
      console.log(`User has completed ${completedProblems.length} problems, refreshing leaderboard`);
      
      // Thiết lập một interval để làm mới bảng xếp hạng nhiều lần sau khi người dùng hoàn thành bài tập
      const refreshCount = { current: 0 };
      const maxRefreshes = 3;
      const refreshInterval = setInterval(() => {
        fetchLeaderboard();
        refreshCount.current += 1;
        
        // Dừng làm mới sau số lần quy định
        if (refreshCount.current >= maxRefreshes) {
          clearInterval(refreshInterval);
        }
      }, 3000); // Làm mới mỗi 3 giây
      
      return () => clearInterval(refreshInterval);
    }
  }, [completedProblems]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="flex flex-col items-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Không tìm thấy cuộc thi</h3>
          <p className="text-gray-500 mb-6">Cuộc thi này không tồn tại hoặc đã bị xóa</p>
          <Link to="/competitions" className="text-purple-600 hover:text-purple-700 flex items-center">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Quay lại danh sách cuộc thi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Giảm chiều cao */}
      <div className="relative h-[30vh] w-full overflow-hidden">
        {/* Breadcrumb - Đưa lên góc trên cùng bên trái */}
        <div className="absolute top-0 left-0 z-20 w-full">
          <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
            <div className="inline-flex items-center py-3 px-4 bg-white rounded-b-lg shadow-md mt-0">
              <Link to="/competitions" className="text-gray-700 hover:text-purple-600 flex items-center transition-colors font-medium">
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Quay lại
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">Chi tiết cuộc thi</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0">
          <img 
            src={competition?.CoverImageURL || competition?.ThumbnailUrl}
            alt={competition?.Title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback image dựa trên tiêu đề cuộc thi
              if (competition?.Title?.includes("An ninh mạng")) {
                e.target.src = "https://dhannd.edu.vn/image/catalog/AnNinhMang.jpg";
              } else if (competition?.Title?.includes("Bảo mật thông tin")) {
                e.target.src = "https://dichvuthietkewebwordpress.com/wp-content/uploads/2018/10/bao-mat-thong-tin.jpg";
              } else if (competition?.Title?.includes("Python")) {
                e.target.src = "https://media.techmaster.vn/api/static/36/buoi16_hinh2.png";
              } else {
                // Fallback mặc định
                e.target.src = "https://storage.googleapis.com/campus-learning/competitions/cover_coding_competition_2025.jpg";
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-indigo-900/80 to-purple-900/90" />
        </div>
        
        {/* Hero Content - Điều chỉnh padding */}
        <div className="relative h-full max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-end h-full pb-8"> {/* Giảm padding bottom */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Giảm gap */}
              {/* Left Column - Title & Description */}
              <div className="lg:col-span-2">
                <div className="flex flex-wrap gap-2 mb-3"> {/* Giảm gap và margin */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    competition?.Status === 'ongoing' ? 'bg-green-500' : 
                    competition?.Status === 'upcoming' ? 'bg-blue-500' : 
                    'bg-gray-500'
                  } text-white`}>
                    {competition?.Status === 'ongoing' ? 'Đang diễn ra' : 
                     competition?.Status === 'upcoming' ? 'Sắp diễn ra' : 
                     'Đã kết thúc'}
                  </span>
                  <span className="px-3 py-1 bg-purple-500 rounded-full text-xs font-medium text-white">
                    {competition?.Difficulty}
                  </span>
                  {codeRuntimeStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      codeRuntimeStatus.dockerAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {codeRuntimeStatus.dockerAvailable ? 'Docker sẵn sàng' : 'Docker không khả dụng'}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3"> {/* Giảm font size và margin */}
                  {competition?.Title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80"> {/* Giảm gap và font size */}
                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-2" /> {/* Giảm kích thước icon */}
                    <span>{competition?.CurrentParticipants}/{competition?.MaxParticipants} người tham gia</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>{competition?.Duration} phút</span>
                  </div>
                  <div className="flex items-center">
                    <TrophyIcon className="w-4 h-4 mr-2" />
                    <span>{parseFloat(competition?.PrizePool).toLocaleString('vi-VN')} VND</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Actions */}
              <div className="lg:col-span-1 flex flex-col justify-end">
                {isRegistered ? (
                  <div className="space-y-4">
                    {isCompetitionActive && (
                      <button 
                        onClick={handleParticipateCompetition}
                        disabled={participating}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center"
                      >
                        {participating ? (
                          <>
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                            Đang vào đấu trường...
                          </>
                        ) : (
                          <>
                            <CodeBracketIcon className="w-5 h-5 mr-2" />
                            Vào đấu trường ngay
                          </>
                        )}
                      </button>
                    )}
                    {!isCompetitionActive && !isCompetitionEnded && (
                      <div className="w-full px-6 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 flex items-center justify-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-gray-500" />
                        Đã đăng ký, chờ cuộc thi bắt đầu
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleRegister}
                    disabled={isRegistering || isCompetitionEnded}
                    className={`w-full px-6 py-3 rounded-xl font-medium shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center ${
                      isCompetitionEnded
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple-500/25'
                    }`}
                  >
                    {isRegistering ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                        Đang đăng ký...
                      </>
                    ) : (
                      getRegistrationButtonText()
                    )}
                  </button>
                )}

                {/* Competition Progress */}
                {isCompetitionActive && (
                  <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                      <span>Tiến độ cuộc thi</span>
                      <span>{getRemainingTime()}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Điều chỉnh margin top */}
      <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 -mt-6 relative z-10 pb-20"> {/* Giảm margin top */}
        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-100">
            <div className="flex">
              {['overview', 'problems', 'leaderboard'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'overview' && 'Tổng quan'}
                  {tab === 'problems' && 'Danh sách bài tập'}
                  {tab === 'leaderboard' && 'Bảng xếp hạng'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Competition stats */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Thông tin cuộc thi</h2>
                  <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200">
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Độ khó</p>
                        <p className={`font-medium ${
                          competition.Difficulty === 'Khó' 
                            ? 'text-red-600' 
                            : competition.Difficulty === 'Trung bình'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}>
                          {competition.Difficulty}
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Người tham gia</p>
                        <p className="font-medium">
                          {/* Use the accurate participant count function */}
                          {getParticipantCount()}/{competition.MaxParticipants}
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Ngày bắt đầu</p>
                        <p className="font-medium">{formatDate(competition.StartTime)}</p>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Ngày kết thúc</p>
                        <p className="font-medium">{formatDate(competition.EndTime)}</p>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Người tổ chức</p>
                        <p className="font-medium">{competition.Organizer?.FullName || 'Admin'}</p>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Giải thưởng</p>
                        <p className="font-medium">{parseFloat(competition?.PrizePool).toLocaleString('vi-VN')} VND</p>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Thời gian</p>
                        <p className="font-medium">{competition?.Duration} phút</p>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                        <p className={`font-medium ${
                          competitionStatus === 'ongoing' ? 'text-green-600' : 
                          competitionStatus === 'upcoming' ? 'text-blue-600' : 
                          'text-gray-600'
                        }`}>
                          {competitionStatus === 'ongoing' ? 'Đang diễn ra' : 
                          competitionStatus === 'upcoming' ? 'Sắp diễn ra' : 
                          'Đã kết thúc'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-4">Hướng dẫn</h2>
                  <div className="prose max-w-none">
                    <ul>
                      <li>Mỗi cuộc thi có nhiều bài tập khác nhau.</li>
                      <li>Bạn có thể làm các bài tập theo thứ tự tùy ý.</li>
                      <li>Điểm của bạn sẽ được tính dựa trên số bài tập đã giải quyết và thời gian hoàn thành.</li>
                      <li>Mã nguồn của bạn sẽ được đánh giá tự động.</li>
                      <li>Kết quả sẽ được công bố ngay sau khi cuộc thi kết thúc.</li>
                    </ul>
                  </div>
                </div>
                
                {userRanking && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Thứ hạng của bạn</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Tier:</span>
                          {renderTierBadge(userRanking.tier)}
                        </div>
                        <div>
                          <span className="font-medium mr-2">Tổng điểm:</span>
                          <span>{userRanking.totalPoints} điểm</span>
                        </div>
                        <div>
                          <span className="font-medium mr-2">Số trận thắng:</span>
                          <span>{userRanking.wins}</span>
                        </div>
                        <div>
                          <span className="font-medium mr-2">Bài tập đã giải:</span>
                          <span>{userRanking.problemsSolved}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'problems' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Danh sách bài tập</h2>
                {competition.CompetitionProblems && competition.CompetitionProblems.length > 0 ? (
                  <div className="space-y-6">
                    {competition.CompetitionProblems.map((problem) => (
                      <div key={problem.ProblemID} className="bg-white border rounded-lg overflow-hidden">
                        {/* Problem Header */}
                        <div className="border-b p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold mb-1">{problem.Title}</h3>
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  problem.Difficulty === 'Khó' 
                                    ? 'bg-red-100 text-red-800'
                                    : problem.Difficulty === 'Trung bình'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                }`}>
                                  {problem.Difficulty}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {problem.Points} điểm
                                </span>
                                {problem.Tags && (
                                  <div className="flex items-center space-x-1">
                                    {problem.Tags.split(',').map(tag => (
                                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        {tag.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {completedProblems.includes(problem.ProblemID) && (
                                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs flex items-center">
                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                    Đã hoàn thành
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => handleSolveProblem(problem)}
                              className={`px-4 py-2 rounded-lg text-sm ${
                                completedProblems.includes(problem.ProblemID)
                                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              } transition-colors duration-200`}
                              disabled={completedProblems.includes(problem.ProblemID)}
                            >
                              {completedProblems.includes(problem.ProblemID) ? 'Đã hoàn thành' : 'Giải bài tập'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Problem Description with optional image */}
                        <div className="p-4">
                          {problem.ImageURL && (
                            <div className="mb-4">
                              <img 
                                src={problem.ImageURL} 
                                alt={problem.Title} 
                                className="rounded-lg max-h-64 object-contain mx-auto"
                                onError={(e) => {
                                  console.log(`Problem image error for ${problem.Title}:`, e);
                                  
                                  // Fallback theo chủ đề bài tập
                                  if (problem.Title.includes("An ninh") || problem.Title.includes("Phát hiện xâm nhập")) {
                                    e.target.src = "https://dhannd.edu.vn/image/catalog/AnNinhMang.jpg";
                                  } else if (problem.Title.includes("Bảo mật") || problem.Title.includes("Mã hóa")) {
                                    e.target.src = "https://dichvuthietkewebwordpress.com/wp-content/uploads/2018/10/bao-mat-thong-tin.jpg";
                                  } else if (problem.Title.includes("Python") || problem.Title.toLowerCase().includes("tính tổng")) {
                                    e.target.src = "https://media.techmaster.vn/api/static/36/buoi16_hinh2.png";
                                  } else {
                                    e.target.src = "https://storage.googleapis.com/campus-learning/competitions/problem_default.jpg";
                                  }
                                }}
                              />
                            </div>
                          )}
                          
                          {problem.Instructions && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <h4 className="font-medium text-blue-700 mb-1">Hướng dẫn:</h4>
                              <p className="text-sm text-gray-700">{problem.Instructions}</p>
                            </div>
                          )}
                          
                          <div className="prose max-w-none">
                            <p>{problem.Description}</p>
                          </div>
                          
                          {/* Sample input/output */}
                          {problem.SampleInput && problem.SampleOutput && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-1">Mẫu đầu vào:</h4>
                                <pre className="text-sm text-gray-600 whitespace-pre-wrap">{problem.SampleInput}</pre>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-1">Mẫu đầu ra:</h4>
                                <pre className="text-sm text-gray-600 whitespace-pre-wrap">{problem.SampleOutput}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <CodeBracketIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có bài tập nào cho cuộc thi này</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'leaderboard' && (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Bảng xếp hạng</h2>
                
                {/* Registered users count */}
                <div className="mb-4 flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="w-4 h-4 mr-2 text-purple-600" />
                  <span>
                    {/* Use the accurate participant count function */}
                    {getParticipantCount()}/{competition.MaxParticipants} người đã đăng ký cuộc thi
                  </span>
                  {/* Show discrepancy notice if counts don't match */}
                  {competition.CurrentParticipants !== leaderboard.length && leaderboard.length > 0 && (
                    <span className="ml-2 text-gray-500">
                      ({leaderboard.length} người hiển thị trong bảng xếp hạng)
                    </span>
                  )}
                </div>
                
                {/* Loading state */}
                {loading && (
                  <div className="py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    <p className="mt-2 text-gray-500">Đang tải bảng xếp hạng...</p>
                  </div>
                )}
                
                {/* Error state */}
                {!loading && leaderboard && leaderboard.length === 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có người tham gia cuộc thi này</p>
                    {isRegistered && (
                      <p className="text-blue-600 mt-2">
                        Bạn đã đăng ký tham gia. Hãy là người đầu tiên xuất hiện trên bảng xếp hạng!
                      </p>
                    )}
                    {!isRegistered && (
                      <button 
                        onClick={handleRegister}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                        disabled={isRegistering}
                      >
                        {isRegistering ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
                      </button>
                    )}
                  </div>
                )}
                
                {/* Leaderboard table */}
                {!loading && leaderboard && leaderboard.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hạng
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Người tham gia
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Điểm
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bài đã giải
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thời gian
                          </th>
                          {userRanking && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hạng
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaderboard.map((participant) => {
                          const isCurrentUser = participant.isCurrentUser ||
                            (currentUser && (
                              String(participant.id) === String(currentUser.id) || 
                              String(participant.userId) === String(currentUser.id)
                            ));
                          
                          return (
                            <tr 
                              key={participant.id || participant.userId} 
                              className={`hover:bg-gray-50 transition-colors ${
                                isCurrentUser 
                                  ? 'bg-purple-50 border-l-4 border-purple-500' 
                                  : ''
                              }`}
                            >
                              {/* Rank column with medal for top 3 */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {participant.rank <= 3 ? (
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                      participant.rank === 1 
                                        ? 'bg-yellow-400' 
                                        : participant.rank === 2
                                          ? 'bg-gray-300'
                                          : 'bg-amber-700'
                                    } text-white font-bold`}>
                                      {participant.rank}
                                    </span>
                                  ) : (
                                    <span className="px-2">{participant.rank}</span>
                                  )}
                                </div>
                              </td>
                              
                              {/* User info column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {participant.avatar ? (
                                    <img 
                                      src={participant.avatar} 
                                      alt={participant.name}
                                      className="w-8 h-8 rounded-full mr-3 object-cover"
                                      onError={(e) => {
                                        // Sử dụng ảnh avatar mặc định
                                        e.target.src = `/assets/default-avatar.png`;
                                        // Fallback nếu default-avatar.png không tồn tại
                                        e.target.onerror = () => {
                                          e.target.src = "https://storage.googleapis.com/campus-learning/profile/default-avatar.jpg";
                                          e.target.onerror = null; // Tránh vòng lặp vô hạn
                                        };
                                      }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                                      <span className="text-gray-500 text-sm font-medium">
                                        {participant.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <div className={`text-sm font-medium ${isCurrentUser ? 'text-purple-800' : 'text-gray-900'}`}>
                                    {participant.name}
                                    {isCurrentUser && <span className="ml-2 text-xs text-purple-600">(Bạn)</span>}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Score column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${
                                  participant.score > 0 
                                    ? 'text-green-600' 
                                    : 'text-gray-500'
                                }`}>
                                  {participant.score || 0}
                                </div>
                              </td>
                              
                              {/* Problems solved column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${
                                  participant.problemsSolved > 0 
                                    ? 'text-blue-600 font-medium' 
                                    : 'text-gray-500'
                                }`}>
                                  {participant.problemsSolved || 0}
                                </div>
                              </td>
                              
                              {/* Time column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {participant.competitionTime ? 
                                    (participant.competitionTime >= 60 ?
                                      `${Math.floor(participant.competitionTime / 60)} giờ ${participant.competitionTime % 60} phút` :
                                      `${participant.competitionTime} phút`) : 
                                    '-'
                                  }
                                </div>
                              </td>
                              
                              {/* Tier column - only shown if we have user ranking data */}
                              {userRanking && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {isCurrentUser && userRanking.tier ? 
                                    renderTierBadge(userRanking.tier) : 
                                    <span className="text-sm text-gray-400">-</span>
                                  }
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Message for registered users not in leaderboard */}
                    {currentUser && isRegistered && 
                     !isUserInLeaderboard(currentUser.id, leaderboard) && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                              Bạn đã đăng ký cuộc thi thành công!
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>
                                Bạn sẽ xuất hiện trên bảng xếp hạng sau khi bắt đầu giải các bài tập. 
                                Mỗi bài tập bạn hoàn thành sẽ cập nhật điểm số của bạn trên bảng xếp hạng.
                              </p>
                            </div>
                            <div className="mt-4">
                              <button
                                onClick={() => setActiveTab('problems')}
                                className="inline-flex items-center px-3 py-2 border border-blue-400 text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Bắt đầu giải bài tập ngay
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Controls for refreshing leaderboard */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={refreshAllData}
                        className="flex items-center px-3 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition"
                      >
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Làm mới dữ liệu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add code editor modal */}
      {showSolutionEditor && selectedProblem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl h-5/6 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedProblem.Title}</h3>
              <button 
                onClick={() => setShowSolutionEditor(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <XCircleIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Problem description sidebar */}
              <div className="w-1/3 p-4 border-r overflow-y-auto">
                <div className="prose max-w-none text-sm">
                  <p>{selectedProblem.Description}</p>
                  
                  {selectedProblem.SampleInput && selectedProblem.SampleOutput && (
                    <>
                      <h4>Mẫu đầu vào:</h4>
                      <pre className="bg-gray-50 p-2 rounded">{selectedProblem.SampleInput}</pre>
                      <h4>Mẫu đầu ra:</h4>
                      <pre className="bg-gray-50 p-2 rounded">{selectedProblem.SampleOutput}</pre>
                    </>
                  )}
                  
                  {submissionResult && (
                    <div className={`mt-4 p-3 rounded ${
                      submissionResult.data?.passed 
                        ? 'bg-green-50 border border-green-100' 
                        : 'bg-red-50 border border-red-100'
                    }`}>
                      <h4 className={`font-medium ${
                        submissionResult.data?.passed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {submissionResult.data?.passed ? 'Bài làm đúng!' : 'Bài làm chưa đúng'}
                      </h4>
                      
                      {submissionResult.data?.details && (
                        <>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Đầu ra của bạn:</p>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                              {submissionResult.data.details.actualOutput || '(không có đầu ra)'}
                            </pre>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Đầu ra mong muốn:</p>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                              {submissionResult.data.details.expectedOutput}
                            </pre>
                          </div>
                          
                          {submissionResult.data.passed && submissionResult.data.details.metrics && (
                            <div className="mt-2 text-xs text-gray-600">
                              <p>Thời gian chạy: {submissionResult.data.details.metrics.executionTime.toFixed(2)} ms</p>
                              <p>Bộ nhớ sử dụng: {(submissionResult.data.details.metrics.memoryUsage / 1024).toFixed(2)} MB</p>
                              <p className="font-medium text-green-600">Điểm: {submissionResult.data.score}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Code editor */}
              <div className="flex-1 flex flex-col">
                <div className="p-2 border-b flex items-center">
                  <label className="mr-2 text-sm">Ngôn ngữ:</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="p-1 border rounded text-sm"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <CodeEditor
                    code={code}
                    onChange={setCode}
                    language={language}
                    theme="vs-dark"
                  />
                </div>
                
                <div className="p-3 border-t flex justify-between">
                  <button
                    onClick={() => setShowSolutionEditor(false)}
                    className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  
                  <button
                    onClick={handleSubmitSolution}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-md ${
                      isSubmitting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white font-medium flex items-center`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Đang gửi...
                      </>
                    ) : (
                      'Nộp bài'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionDetail; 