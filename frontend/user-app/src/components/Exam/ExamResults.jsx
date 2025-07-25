/*-----------------------------------------------------------------
* File: ExamResults.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore,
  Timer,
  CheckCircle,
  Cancel,
  Psychology,
  EmojiEvents,
  School
} from '@mui/icons-material';
import { getExamResults } from '../../api/examApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ExamResults = () => {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await getExamResults(participantId);
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to load results');
        }
        
        setResults(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching exam results:', err);
        setError('Không thể tải kết quả kỳ thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [participantId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          Đang tải kết quả...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error">
          <AlertTitle>Lỗi</AlertTitle>
          {error}
        </Alert>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/exams')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách kỳ thi
        </Button>
      </Box>
    );
  }

  if (!results) {
    return (
      <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="warning">
          <AlertTitle>Không tìm thấy</AlertTitle>
          Không tìm thấy kết quả bài thi.
        </Alert>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/exams')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách kỳ thi
        </Button>
      </Box>
    );
  }

  const { participant, answers = [] } = results;

  // Deduplicate answers by QuestionID to ensure correct question count
  const uniqueAnswerMap = new Map();
  answers.forEach(ans => {
    if (ans && ans.QuestionID) {
      // Keep the first occurrence (or we could replace to keep latest)
      if (!uniqueAnswerMap.has(ans.QuestionID)) {
        uniqueAnswerMap.set(ans.QuestionID, ans);
      }
    }
  });
  const uniqueAnswers = Array.from(uniqueAnswerMap.values());

  // Calculate total score based on sum of all points instead of percentage
  const totalPoints = 10; // Total points is 10
  const passingPointValue = (participant.PassingScore / 100) * totalPoints; // Convert percentage to points
  const isPassed = participant.Score >= passingPointValue;

  // Format time spent
  const formatTimeSpent = (minutes) => {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} phút`;
    }
    
    return `${hours} giờ ${mins} phút`;
  };

  return (
    <Box
      sx={{
        mt: 4,
        mb: 8,
        px: { xs: 2, md: 5 }, // horizontal padding responsive
        width: '100%',
        maxWidth: { lg: '1400px', xl: '1800px' }, // allow wider screens to stretch
        mx: 'auto',
      }}
    >
      <Paper elevation={3} sx={{ p: 3, mb: 4, position: 'relative', overflow: 'hidden' }}>
        {/* Background element for aesthetic */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            width: '30%', 
            height: '100%', 
            background: isPassed ? 'linear-gradient(135deg, transparent, rgba(76, 175, 80, 0.1))' : 'linear-gradient(135deg, transparent, rgba(244, 67, 54, 0.1))',
            zIndex: 0 
          }} 
        />
        
        <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Kết quả bài thi
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {participant.ExamTitle}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Chip 
                icon={isPassed ? <CheckCircle /> : <Cancel />} 
                label={isPassed ? 'Đạt' : 'Chưa đạt'} 
                color={isPassed ? 'success' : 'error'} 
                sx={{ mr: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Hoàn thành vào: {
                  participant.CompletedAt 
                    ? format(new Date(participant.CompletedAt), 'HH:mm - dd/MM/yyyy', { locale: vi })
                    : 'N/A'
                }
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={(participant.Score / totalPoints) * 100} // Convert score to percentage for progress
                  size={120}
                  thickness={5}
                  sx={{ 
                    color: 
                      (participant.Score / totalPoints) * 100 >= 80 ? 'success.main' :
                      (participant.Score / totalPoints) * 100 >= 60 ? 'primary.main' : 'error.main'
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div" color="text.secondary">
                    {participant.Score}/{totalPoints}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Điểm đạt: {passingPointValue.toFixed(1)}/{totalPoints}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={{ xs: 2, md: 4 }}>
        <Grid item xs={12} md={5} lg={4}>
          {/* Information Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin bài thi
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ '& > div': { mb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Timer sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    <strong>Thời gian làm bài:</strong> {formatTimeSpent(participant.TimeSpent)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <School sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    <strong>Số câu:</strong> {uniqueAnswers.length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2">
                    <strong>Câu trả lời đúng:</strong> {uniqueAnswers.filter(a => a.IsCorrect === 1).length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Cancel sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="body2">
                    <strong>Câu trả lời sai:</strong> {uniqueAnswers.filter(a => a.IsCorrect === 0).length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmojiEvents sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="body2">
                    <strong>Kết quả:</strong> {isPassed ? 'Đạt' : 'Chưa đạt'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          {/* Add Compare Answer Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                So sánh đáp án
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" paragraph>
                Điểm của bạn được tính dựa trên mức độ tương đồng giữa đáp án của bạn với đáp án mẫu.
              </Typography>
              <Typography variant="body2">
                Hệ thống so sánh:
              </Typography>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                <li>Các từ khóa quan trọng (70%)</li>
                <li>Độ tương đồng nội dung (30%)</li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={7} lg={8} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          {/* Detailed answers have been disabled intentionally */}
          <Alert severity="warning" sx={{ mb: 3 }}>
            Chi tiết bài làm đã được ẩn theo yêu cầu.
          </Alert>
          
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              component={Link} 
              to="/exams"
            >
              Quay lại danh sách kỳ thi
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExamResults;

