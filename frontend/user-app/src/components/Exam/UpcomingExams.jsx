/*-----------------------------------------------------------------
* File: UpcomingExams.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  CircularProgress,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import { 
  CalendarMonth, 
  AccessTime,
  ArrowForward
} from '@mui/icons-material';
import { getUpcomingExams } from '../../api/examApi';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { vi } from 'date-fns/locale';

const UpcomingExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUpcomingExams();
  }, []);

  const fetchUpcomingExams = async () => {
    try {
      setLoading(true);
      const response = await getUpcomingExams();
      setExams(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching upcoming exams:', err);
      setError('Không thể tải danh sách kỳ thi sắp tới. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntil = (startTime) => {
    const now = new Date();
    const examTime = new Date(startTime);
    const days = differenceInDays(examTime, now);
    
    if (days > 0) {
      return `${days} ngày nữa`;
    }
    
    const hours = differenceInHours(examTime, now);
    if (hours > 0) {
      return `${hours} giờ nữa`;
    }
    
    return 'Sắp bắt đầu';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="error">
          <AlertTitle>Lỗi</AlertTitle>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchUpcomingExams} sx={{ mt: 2 }}>
          Tải lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Kỳ thi sắp diễn ra
      </Typography>
      
      {exams.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>Không có kỳ thi nào sắp diễn ra</AlertTitle>
          Hiện tại chưa có kỳ thi nào được lên lịch trong thời gian tới.
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {exams.map((exam) => (
            <Grid item xs={12} key={exam.ExamID}>
              <Card 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: { xs: '100%', sm: '200px' }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'primary.light',
                    color: 'white'
                  }}
                >
                  <CalendarMonth fontSize="large" />
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {format(new Date(exam.StartTime), 'dd/MM/yyyy', { locale: vi })}
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(exam.StartTime), 'HH:mm', { locale: vi })}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, fontWeight: 'bold' }}>
                    {getTimeUntil(exam.StartTime)}
                  </Typography>
                </Box>
                
                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {exam.Title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      {exam.Description ? 
                        (exam.Description.length > 150 ? 
                          `${exam.Description.substring(0, 150)}...` : 
                          exam.Description) : 
                        'Không có mô tả'}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                          Thời gian: {exam.Duration} phút
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          Loại: {
                            exam.Type === 'essay' ? 'Tự luận' : 
                            exam.Type === 'multiple_choice' ? 'Trắc nghiệm' : 
                            exam.Type === 'coding' ? 'Lập trình' : 
                            'Hỗn hợp'
                          }
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      component={Link} 
                      to={`/exams/${exam.ExamID}`}
                      variant="contained" 
                      color="primary"
                      endIcon={<ArrowForward />}
                      size="small"
                    >
                      {exam.IsRegistered ? 'Xem chi tiết' : 'Đăng ký'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          component={Link}
          to="/exams"
          variant="outlined"
        >
          Xem tất cả kỳ thi
        </Button>
      </Box>
    </Box>
  );
};

export default UpcomingExams;

