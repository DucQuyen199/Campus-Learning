/*-----------------------------------------------------------------
* File: ExamHistory.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Alert, CircularProgress, LinearProgress } from '@mui/material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import axiosInstance from '../../utils/axiosInstance';

// Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ngày không hợp lệ';
  }
};

const ExamHistory = () => {
  const { examId } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examData, setExamData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  
  // Function to fetch exam history data
  const fetchExamHistory = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/exams/${examId}/attempts`);
      setExamData(response.data.data.examDetails);
      setAttempts(response.data.data.attempts);
      setError(null);
      setLastUpdateTime(Date.now());
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải lịch sử thi');
      console.error('Error loading exam history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchExamHistory();
  }, [examId]);
  
  // Refresh data whenever user returns to this page or when coming from exam session
  useEffect(() => {
    // If returning from another page, refresh the data
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing exam history');
        fetchExamHistory();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [examId]);
  
  // Set up periodic polling for updates if there are in-progress attempts
  useEffect(() => {
    // Check if there are any in-progress attempts that need monitoring
    const hasInProgressAttempts = attempts.some(attempt => 
      attempt.Status === 'in_progress' || attempt.Status === 'registered'
    );
    
    if (!hasInProgressAttempts) {
      return; // No need to poll if there are no in-progress attempts
    }
    
    console.log('Setting up polling for in-progress attempts');
    const pollingInterval = setInterval(() => {
      fetchExamHistory();
    }, 30000); // Poll every 30 seconds
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, [attempts, examId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge bg-success">Đã hoàn thành</span>;
      case 'in_progress':
        return <span className="badge bg-warning">Đang làm bài</span>;
      case 'registered':
        return <span className="badge bg-info">Đã đăng ký</span>;
      case 'reviewed':
        return <span className="badge bg-primary">Đã chấm điểm</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const registerForNewAttempt = async () => {
    try {
      setLoading(true);
      await axiosInstance.post(`/exams/${examId}/register`);
      // Reload attempts after registration
      const response = await axiosInstance.get(`/exams/${examId}/attempts`);
      setExamData(response.data.data.examDetails);
      setAttempts(response.data.data.attempts);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thi lại không thành công');
      console.error('Error registering for exam:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh button handler
  const handleRefresh = () => {
    fetchExamHistory();
  };

  if (loading && !attempts.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleRefresh}
          sx={{ mt: 2 }}
        >
          Thử lại
        </Button>
      </Box>
    );
  }

  if (!examData) {
    return (
      <Box p={3}>
        <Alert severity="warning">Không tìm thấy thông tin kỳ thi</Alert>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleRefresh}
          sx={{ mt: 2 }}
        >
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          {examData.Title} - Lịch sử thi
        </Typography>
        <Button 
          variant="outlined"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Cập nhật'}
        </Button>
      </Box>
      
      <Box mb={3}>
        <Typography variant="body1">
          <strong>Tổng điểm:</strong> {examData.TotalPoints}
        </Typography>
        <Typography variant="body1">
          <strong>Điểm đạt:</strong> {examData.PassingScore}
        </Typography>
        <Typography variant="body1">
          <strong>Cho phép thi lại:</strong> {examData.AllowRetakes ? 'Có' : 'Không'}
          {examData.AllowRetakes && examData.MaxRetakes > 0 ? ` (Tối đa ${examData.MaxRetakes + 1} lần)` : ''}
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {attempts.length === 0 ? (
        <Alert severity="info">
          Bạn chưa tham gia kỳ thi này
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Lần thi</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Bắt đầu</TableCell>
                <TableCell>Hoàn thành</TableCell>
                <TableCell>Thời gian làm</TableCell>
                <TableCell>Điểm số</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow key={attempt.ParticipantID}>
                  <TableCell>{attempt.AttemptNumber}</TableCell>
                  <TableCell>{getStatusBadge(attempt.Status)}</TableCell>
                  <TableCell>{attempt.StartedAt ? formatDate(attempt.StartedAt) : 'Chưa bắt đầu'}</TableCell>
                  <TableCell>{attempt.CompletedAt ? formatDate(attempt.CompletedAt) : 'Chưa hoàn thành'}</TableCell>
                  <TableCell>
                    {attempt.TimeSpent ? `${attempt.TimeSpent} phút` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {attempt.Score !== null ? (
                      <span className={attempt.Score >= examData.PassingScore ? 'text-success' : 'text-danger'}>
                        {attempt.Score}/{examData.TotalPoints}
                      </span>
                    ) : 'Chưa có điểm'}
                  </TableCell>
                  <TableCell>
                    {attempt.Status === 'registered' && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small" 
                        component={Link} 
                        to={`/exams/${examId}/session?participantId=${attempt.ParticipantID}`}
                      >
                        Bắt đầu
                      </Button>
                    )}
                    {attempt.Status === 'in_progress' && (
                      <Button 
                        variant="contained" 
                        color="warning" 
                        size="small" 
                        component={Link} 
                        to={`/exams/${examId}/session?participantId=${attempt.ParticipantID}`}
                      >
                        Tiếp tục
                      </Button>
                    )}
                    {/* Ẩn nút xem kết quả để không cho phép truy cập chi tiết bài làm */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {examData.AllowRetakes && (
        examData.MaxRetakes === 0 || attempts.length < examData.MaxRetakes + 1 ? (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={registerForNewAttempt}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Đăng ký thi lại'}
          </Button>
        ) : (
          <Alert severity="warning">
            Bạn đã đạt đến số lần thi tối đa cho phép.
          </Alert>
        )
      )}

      <Box mt={3}>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/exams/${examId}`}
        >
          Quay lại chi tiết kỳ thi
        </Button>
      </Box>
    </Box>
  );
};

export default ExamHistory; 
