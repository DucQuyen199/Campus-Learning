import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllCompetitions } from '@/api/competitionService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const response = await getAllCompetitions();
        if (response.success) {
          setCompetitions(response.data || []);
        } else {
          setError('Failed to load competitions');
        }
      } catch (err) {
        console.error('Error fetching competitions:', err);
        setError('An error occurred while fetching competitions');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredCompetitions = competitions.filter(competition => {
    // First apply status filter
    if (filter !== 'all' && competition.Status !== filter) return false;
    
    // Then apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        competition.Title.toLowerCase().includes(searchLower) ||
        (competition.Description && competition.Description.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Helper function to get filter label
  const getFilterLabel = (filterValue) => {
    switch (filterValue) {
      case 'all': return 'Tất cả';
      case 'upcoming': return 'Sắp diễn ra';
      case 'ongoing': return 'Đang diễn ra';
      case 'completed': return 'Đã kết thúc';
      default: return 'Tất cả';
    }
  };

  const getCompetitionStatus = (status, startTime, endTime) => {
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

  const formatTimeToNow = (dateTime) => {
    try {
      return formatDistanceToNow(new Date(dateTime), { addSuffix: true, locale: vi });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Cuộc Thi Lập Trình</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Tham gia các cuộc thi lập trình để nâng cao kỹ năng và cạnh tranh với những người khác
        </p>
      </div>

      {/* Mobile optimized filter section */}
      <div className="flex flex-col space-y-4 mb-6">
        {/* Search box - full width on mobile */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm cuộc thi..."
            className="w-full px-4 py-2.5 rounded-md text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Mobile dropdown filter */}
        <div className="relative sm:hidden" ref={filterDropdownRef}>
          <button 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="w-full flex items-center justify-between bg-white px-4 py-2.5 rounded-md border border-gray-200 text-left text-gray-800 font-medium"
          >
            <span>{getFilterLabel(filter)}</span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown menu */}
          {showFilterDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1">
              <button
                onClick={() => {
                  setFilter('all');
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm ${
                  filter === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => {
                  setFilter('upcoming');
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm ${
                  filter === 'upcoming' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                Sắp diễn ra
              </button>
              <button
                onClick={() => {
                  setFilter('ongoing');
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm ${
                  filter === 'ongoing' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                Đang diễn ra
              </button>
              <button
                onClick={() => {
                  setFilter('completed');
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm ${
                  filter === 'completed' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                Đã kết thúc
              </button>
            </div>
          )}
        </div>

        {/* Desktop filter tabs - hidden on mobile */}
        <div className="hidden sm:block">
          <div className="flex mb-6 border-b">
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
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCompetitions.length > 0 ? (
            filteredCompetitions.map((competition) => {
              const status = getCompetitionStatus(
                competition.Status,
                competition.StartTime,
                competition.EndTime
              );
              
              return (
                <Link
                  to={`/competitions/${competition.CompetitionID}`}
                  key={competition.CompetitionID}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                    <img
                      src={competition.ThumbnailUrl || 'https://via.placeholder.com/600x400?text=Competition'}
                      alt={competition.Title}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg sm:text-xl font-semibold mb-2 line-clamp-2">{competition.Title}</h2>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">{competition.Description}</p>
                    <div className="text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center mb-1">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                          {status === 'upcoming' && `Bắt đầu ${formatTimeToNow(competition.StartTime)}`}
                          {status === 'ongoing' && `Kết thúc ${formatTimeToNow(competition.EndTime)}`}
                          {status === 'completed' && `Kết thúc ${formatTimeToNow(competition.EndTime)}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                        <span>{competition.Difficulty || 'Trung Bình'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full py-10 sm:py-16 text-center">
              <p className="text-gray-500 text-sm sm:text-base">
                {searchTerm 
                  ? `Không tìm thấy cuộc thi nào phù hợp với từ khóa "${searchTerm}".`
                  : 'Không tìm thấy cuộc thi nào phù hợp với bộ lọc.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
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

export default CompetitionsPage; 