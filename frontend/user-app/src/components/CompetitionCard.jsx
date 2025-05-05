import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { format, isPast, isFuture } from 'date-fns';
import { vi } from 'date-fns/locale';

const CompetitionCard = ({ competition }) => {
  // Format date and determine competition status
  const startDate = new Date(competition.StartTime);
  const endDate = new Date(competition.EndTime);
  const now = new Date();
  
  const isActive = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;
  const isCompleted = now > endDate;
  
  const formattedDate = format(startDate, "dd/MM/yyyy HH:mm", { locale: vi });
  
  // Determine badge color
  const badgeColor = isActive 
    ? 'bg-green-100 text-green-800' 
    : isUpcoming 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-gray-100 text-gray-800';
  
  // Determine badge text
  const badgeText = isActive 
    ? 'Đang diễn ra' 
    : isUpcoming 
      ? 'Sắp diễn ra' 
      : 'Đã kết thúc';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Card Image */}
      <div className="relative">
        <img 
          src={competition.ThumbnailUrl || `https://picsum.photos/800/400?random=${competition.CompetitionID}`} 
          alt={competition.Title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-0 right-0 m-2">
          <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${badgeColor}`}>
            {badgeText}
          </span>
        </div>
        {isUpcoming && (
          <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-center text-xs py-1">
            Đăng ký trước để tham gia
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{competition.Title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{competition.Description}</p>
        
        {/* Competition Details */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>{competition.Duration} phút</span>
          </div>
          <div className="flex items-center text-gray-600">
            <UserGroupIcon className="w-4 h-4 mr-1" />
            <span>{competition.CurrentParticipants}/{competition.MaxParticipants}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <TrophyIcon className="w-4 h-4 mr-1" />
            <span>{competition.PrizePool ? `${competition.PrizePool.toLocaleString('vi-VN')} VND` : 'N/A'}</span>
          </div>
        </div>
        
        {/* Action Button */}
        <Link 
          to={`/competitions/${competition.CompetitionID}`} 
          className="block w-full text-center py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
        >
          {isActive 
            ? "Tham gia ngay" 
            : isUpcoming 
              ? "Đăng ký tham gia" 
              : "Xem chi tiết"}
        </Link>
      </div>
    </div>
  );
};

export default CompetitionCard; 