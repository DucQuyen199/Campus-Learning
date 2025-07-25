/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRankings, fetchUserRanking, setTimeRange, setCategory } from '@/store/slices/rankingSlice';
import { 
  TrophyIcon, 
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Avatar } from '../../components';

const RankingTierBadge = ({ tier }) => {
  const badgeClass = {
    'MASTER': 'bg-purple-100 text-purple-800',
    'DIAMOND': 'bg-blue-100 text-blue-800',
    'PLATINUM': 'bg-gray-100 text-gray-800',
    'GOLD': 'bg-yellow-100 text-yellow-800',
    'SILVER': 'bg-gray-300 text-gray-800',
    'BRONZE': 'bg-amber-100 text-amber-800'
  }[tier] || 'bg-gray-100 text-gray-600';
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass}`}>
      {tier}
    </span>
  );
};

const Ranking = () => {
  const dispatch = useDispatch();
  const { rankings, loading, timeRange: storeTimeRange, category: storeCategory } = useSelector((state) => state.ranking);
  const { user } = useSelector((state) => state.auth);
  const [localTimeRange, setLocalTimeRange] = useState(storeTimeRange);
  const [localCategory, setLocalCategory] = useState(storeCategory);

  // Fetch rankings whenever filters change
  useEffect(() => {
    dispatch(fetchRankings({ timeRange: storeTimeRange, category: storeCategory }));
    
    // If user is logged in, fetch their ranking
    if (user?.id) {
      dispatch(fetchUserRanking(user.id));
    }
  }, [dispatch, storeTimeRange, storeCategory, user?.id]);

  const handleTimeRangeChange = (e) => {
    const newValue = e.target.value;
    setLocalTimeRange(newValue);
    dispatch(setTimeRange(newValue));
  };

  const handleCategoryChange = (e) => {
    const newValue = e.target.value;
    setLocalCategory(newValue);
    dispatch(setCategory(newValue));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">Bảng Xếp Hạng</h1>
        <p className="text-blue-100">Theo dõi và cạnh tranh với các học viên khác</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4">
        <select
          value={localTimeRange}
          onChange={handleTimeRangeChange}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
          <option value="all">Tất cả thời gian</option>
        </select>

        <select
          value={localCategory}
          onChange={handleCategoryChange}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả</option>
          <option value="courses">Khóa học</option>
        </select>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Hạng</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Học viên</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Cấp bậc</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Điểm số</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Khóa học</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rankings.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`${index < 3 ? 'bg-blue-50/50' : ''} ${user?.id === item.id ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center ${
                      index < 3 ? 'text-yellow-600 font-bold' : 'text-gray-500'
                    }`}>
                      {index < 3 ? (
                        <TrophyIcon className="w-5 h-5 mr-1" />
                      ) : null}
                      #{index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar
                        src={item.avatar}
                        name={item.name}
                        alt={item.name}
                        size="small"
                      />
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {user?.id === item.id && (
                          <div className="text-xs text-blue-600">Bạn</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RankingTierBadge tier={item.tier} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xl font-bold text-blue-600">{item.points}</div>
                    <div className="text-sm text-gray-500">điểm</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <AcademicCapIcon className="w-5 h-5 text-green-500 mr-2" />
                      {item.completedCourses || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Ranking; 
