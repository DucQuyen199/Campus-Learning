import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllCompetitions } from '@/api/competitionService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'completed'

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
  }, []);

  const filteredCompetitions = competitions.filter(competition => {
    if (filter === 'all') return true;
    return competition.Status === filter;
  });

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cuộc Thi Lập Trình</h1>
        <p className="text-gray-600">
          Tham gia các cuộc thi lập trình để nâng cao kỹ năng và cạnh tranh với những người khác
        </p>
      </div>

      {/* Filter tabs */}
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2">{competition.Title}</h2>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{competition.Description}</p>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                          {status === 'upcoming' && `Bắt đầu ${formatTimeToNow(competition.StartTime)}`}
                          {status === 'ongoing' && `Kết thúc ${formatTimeToNow(competition.EndTime)}`}
                          {status === 'completed' && `Kết thúc ${formatTimeToNow(competition.EndTime)}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="col-span-full py-16 text-center">
              <p className="text-gray-500">Không tìm thấy cuộc thi nào phù hợp với bộ lọc.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitionsPage; 