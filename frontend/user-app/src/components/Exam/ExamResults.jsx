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

  const { participant, answers } = results;
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
    <Box sx={{ mt: 4, mb: 8, maxWidth: 1200, mx: 'auto' }}>
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
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
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
                    <strong>Số câu:</strong> {answers?.length || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2">
                    <strong>Câu trả lời đúng:</strong> {answers?.filter(a => a.IsCorrect === 1).length || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Cancel sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="body2">
                    <strong>Câu trả lời sai:</strong> {answers?.filter(a => a.IsCorrect === 0).length || 0}
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
        
        <Grid item xs={12} md={8}>
          {/* Detailed Answers Section */}
          <Typography variant="h6" gutterBottom>
            Chi tiết bài làm
          </Typography>
          
          {answers && answers.length > 0 ? (
            <Box>
              {answers.map((answer, index) => {
                // Get analysis data if available
                const analysis = answer.Analysis ? answer.Analysis : null;
                
                return (
                  <Accordion key={index} sx={{ mb: 2 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      aria-controls={`answer-${index}-content`}
                      id={`answer-${index}-header`}
                      sx={{
                        backgroundColor: answer.IsCorrect === 1 
                          ? 'rgba(76, 175, 80, 0.1)' 
                          : 'rgba(244, 67, 54, 0.1)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                        <Typography>
                          <strong>Câu {index + 1}:</strong> {answer.QuestionContent?.substring(0, 50)}...
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            size="small" 
                            label={`${answer.Score || 0} / ${answer.MaxScore || 0} điểm`}
                            color={answer.IsCorrect === 1 ? "success" : "error"}
                            sx={{ ml: 2 }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Câu hỏi:
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {answer.QuestionContent}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Đáp án của bạn:
                            </Typography>
                            <Paper 
                              variant="outlined" 
                              sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                            >
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {answer.Answer || 'Không có câu trả lời'}
                              </Typography>
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Đáp án mẫu:
                            </Typography>
                            <Paper 
                              variant="outlined" 
                              sx={{ p: 2, backgroundColor: 'rgba(25, 118, 210, 0.05)' }}
                            >
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {answer.TemplateAnswer || 'Không có đáp án mẫu'}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                        
                        {/* Comparison Results */}
                        {analysis && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Kết quả phân tích:
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" gutterBottom>
                                    Độ tương đồng tổng thể:
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={Math.min(100, Number(analysis.MatchPercentage) || 0)} 
                                        sx={{ 
                                          height: 10, 
                                          borderRadius: 5,
                                          backgroundColor: 'rgba(0,0,0,0.09)',
                                          '& .MuiLinearProgress-bar': {
                                            borderRadius: 5,
                                            backgroundColor: (analysis.MatchPercentage >= 70) ? 'success.main' : 'warning.main',
                                          }
                                        }}
                                      />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        {Math.round(Number(analysis.MatchPercentage) || 0)}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" gutterBottom>
                                  Từ khóa khớp: {analysis.KeywordsMatched || 0}/{analysis.TotalKeywords || 0}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={analysis.TotalKeywords > 0 
                                        ? Math.min(100, (analysis.KeywordsMatched / analysis.TotalKeywords) * 100) 
                                        : 0} 
                                      sx={{ 
                                        height: 10, 
                                        borderRadius: 5,
                                        backgroundColor: 'rgba(0,0,0,0.09)',
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 5,
                                          backgroundColor: 'info.main'
                                        }
                                      }}
                                    />
                                  </Box>
                                  <Box sx={{ minWidth: 35 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {analysis.TotalKeywords > 0 
                                        ? Math.round((analysis.KeywordsMatched / analysis.TotalKeywords) * 100) 
                                        : 0}%
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              {analysis.ContentSimilarity !== null && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" gutterBottom>
                                    Độ tương đồng nội dung:
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={Math.min(100, Number(analysis.ContentSimilarity) || 0)} 
                                        sx={{ 
                                          height: 10, 
                                          borderRadius: 5,
                                          backgroundColor: 'rgba(0,0,0,0.09)',
                                          '& .MuiLinearProgress-bar': {
                                            borderRadius: 5,
                                            backgroundColor: 'secondary.main'
                                          }
                                        }}
                                      />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        {Math.round(Number(analysis.ContentSimilarity) || 0)}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              )}
                              
                              <Grid item xs={12} sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  <strong>Điểm đánh giá:</strong> {analysis.FinalScore || 0} điểm
                                </Typography>
                              </Grid>
                            </Grid>
                          </>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          ) : (
            <Alert severity="info">
              Không có dữ liệu câu trả lời
            </Alert>
          )}
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
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
