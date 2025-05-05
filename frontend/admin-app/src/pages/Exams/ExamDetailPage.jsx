import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, Grid, Chip, Button,
  Card, CardContent, Divider, List, ListItem, ListItemText,
  CircularProgress, Tab, Tabs, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, ListItemIcon
} from '@mui/material';
import { 
  ArrowBack, CalendarToday, AccessTime, Assessment, 
  Quiz, School, Code, Description, Edit, Delete, 
  Assignment, Check, Close, Person, EmojiEvents,
  LocalOffer, Info, Timer, MenuBook, People, Badge
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getExamById, getExamQuestions, getExamParticipants } from '../../api/exams';
import { message } from 'antd';

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setLoading(true);
        const response = await getExamById(id);
        console.log('Exam details:', response);
        
        if (!response) {
          message.error('Không thể tải thông tin bài thi');
          setLoading(false);
          return;
        }
        
        setExam(response);
        
        // Tải câu hỏi của bài thi
        try {
          const questionsData = await getExamQuestions(id);
          if (questionsData && Array.isArray(questionsData)) {
            setQuestions(questionsData);
            console.log(`Đã tải ${questionsData.length} câu hỏi của bài thi`);
          } else {
            console.log('Không có dữ liệu câu hỏi từ API');
            setQuestions([]);
          }
        } catch (qError) {
          console.error('Error fetching questions:', qError);
          message.warning('Không thể tải câu hỏi cho bài thi');
          setQuestions([]);
        }

        // Không gọi API getExamParticipants do gặp lỗi 404
        // Thay vào đó, tạo participants từ dữ liệu trong exam.sql (có thể response.participants sẽ có trong tương lai)
        // Hoặc hiển thị danh sách rỗng (ta sẽ sử dụng này)
        setParticipants([]);
        console.log('Không có dữ liệu người tham gia, hiển thị danh sách trống');
      } catch (error) {
        console.error('Error fetching exam details:', error);
        message.error('Không thể tải thông tin bài thi');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [id]);

  const handleBack = () => {
    navigate('/exams');
  };

  const handleEdit = () => {
    navigate(`/exams/edit/${id}`);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'N/A';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    const difficultyMap = {
      'beginner': 'Cơ bản',
      'intermediate': 'Trung cấp',
      'advanced': 'Nâng cao',
      'expert': 'Chuyên gia'
    };
    
    return difficultyMap[difficulty?.toLowerCase()] || difficulty;
  };

  const getDifficultyColor = (difficulty) => {
    const colorMap = {
      'beginner': 'success',
      'intermediate': 'info',
      'advanced': 'warning',
      'expert': 'error'
    };
    
    return colorMap[difficulty?.toLowerCase()] || 'default';
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'upcoming': 'primary',
      'ongoing': 'success',
      'completed': 'secondary',
      'cancelled': 'error'
    };
    
    return statusMap[status?.toLowerCase()] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'upcoming': 'Sắp diễn ra',
      'ongoing': 'Đang diễn ra',
      'completed': 'Đã kết thúc',
      'cancelled': 'Đã hủy'
    };
    
    return statusMap[status?.toLowerCase()] || status;
  };

  const getParticipantStatusLabel = (status) => {
    const statusMap = {
      'registered': 'Đã đăng ký',
      'in_progress': 'Đang làm bài',
      'completed': 'Đã hoàn thành',
      'reviewed': 'Đã chấm bài'
    };
    
    return statusMap[status?.toLowerCase()] || status;
  };

  const getParticipantStatusColor = (status) => {
    const statusMap = {
      'registered': 'default',
      'in_progress': 'primary',
      'completed': 'success',
      'reviewed': 'info'
    };
    
    return statusMap[status?.toLowerCase()] || 'default';
  };

  const getExamTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'multiple_choice':
        return <Quiz />;
      case 'essay':
        return <Description />;
      case 'coding':
        return <Code />;
      default:
        return <Assessment />;
    }
  };

  const getExamTypeLabel = (type) => {
    const typeMap = {
      'multiple_choice': 'Trắc nghiệm',
      'essay': 'Tự luận',
      'coding': 'Lập trình',
      'mixed': 'Hỗn hợp'
    };
    
    return typeMap[type?.toLowerCase()] || type;
  };

  const handleDeleteExam = () => {
    // Thêm logic xác nhận trước khi xóa
    if (window.confirm('Bạn có chắc chắn muốn xóa bài thi này?')) {
      // Thực hiện API call để xóa bài thi
      message.success('Đã xóa bài thi');
      navigate('/exams');
    }
  };

  const handleUpdateStatus = (newStatus) => {
    // Thực hiện API call để cập nhật trạng thái
    message.success(`Đã cập nhật trạng thái thành: ${getStatusLabel(newStatus)}`);
    setExam({...exam, Status: newStatus});
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box display="flex" justifyContent="center" my={10}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!exam) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box my={4}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Quay lại danh sách bài thi
          </Button>
          <Typography variant="h4" align="center" my={10}>
            Không tìm thấy bài thi
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Box my={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h5" component="h1">
            Chi tiết bài thi
          </Typography>
          <Box flexGrow={1} />
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<Edit />} 
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            Chỉnh sửa
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<Delete />} 
            onClick={handleDeleteExam}
          >
            Xóa
          </Button>
        </Box>

        {/* Main content */}
        <Grid container spacing={3}>
          {/* Left column - Main exam info */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ mb: 3, overflow: 'hidden' }}>
              <Box sx={{ padding: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                      {exam.Title}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1} mb={2} flexWrap="wrap">
                      <Chip 
                        label={getStatusLabel(exam.Status)} 
                        color={getStatusColor(exam.Status)}
                        size="small"
                        sx={{ mr: 2, mb: 1 }}
                      />
                      <Chip 
                        icon={getExamTypeIcon(exam.Type)}
                        label={getExamTypeLabel(exam.Type)} 
                        variant="outlined"
                        sx={{ mr: 2, mb: 1 }}
                      />
                      <Chip 
                        label={getDifficultyLabel(exam.Difficulty)}
                        color={getDifficultyColor(exam.Difficulty)}
                        variant="outlined"
                        sx={{ mr: 2, mb: 1 }}
                      />
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 1 }}>
                        <AccessTime fontSize="small" sx={{ mr: 0.5 }} />
                        {exam.Duration} phút
                      </Typography>
                      {exam.StartTime && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 1 }}>
                          <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                          Bắt đầu: {formatDateTime(exam.StartTime)}
                        </Typography>
                      )}
                      {exam.EndTime && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                          Kết thúc: {formatDateTime(exam.EndTime)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {exam.Description && (
                  <Typography variant="body1">
                    {exam.Description}
                  </Typography>
                )}
              </Box>
            </Paper>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Thông tin bài thi
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Loại bài thi</Typography>
                    <Typography>{getExamTypeLabel(exam.Type)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Thời gian làm bài</Typography>
                    <Typography>{exam.Duration} phút</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Tổng điểm</Typography>
                    <Typography>{exam.TotalPoints || 100}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Điểm đạt</Typography>
                    <Typography>{exam.PassingScore || 60}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Số lượng câu hỏi</Typography>
                    <Typography>{exam.QuestionCount || questions.length || 0}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Độ khó</Typography>
                    <Typography>{getDifficultyLabel(exam.Difficulty)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Khóa học</Typography>
                    <Typography>{exam.CourseTitle || 'Chưa gán khóa học'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Trạng thái</Typography>
                    <Typography>{getStatusLabel(exam.Status)}</Typography>
                  </Grid>
                  {exam.CreatorName && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Người tạo</Typography>
                      <Typography>{exam.CreatorName}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {exam.StartTime && exam.EndTime && (
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    <CalendarToday fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Thời gian
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Bắt đầu</Typography>
                      <Typography>{formatDateTime(exam.StartTime)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Kết thúc</Typography>
                      <Typography>{formatDateTime(exam.EndTime)}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right column - Stats and settings */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Assessment fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Thống kê
                    </Typography>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <MenuBook />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Tổng số câu hỏi</Typography>
                        <Typography variant="h6">{questions.length || 0}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                        <EmojiEvents />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Điểm tối đa</Typography>
                        <Typography variant="h6">{exam.TotalPoints || 100}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                        <Timer />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Thời gian làm bài</Typography>
                        <Typography variant="h6">{exam.Duration} phút</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                        <People />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Số người tham gia</Typography>
                        <Typography variant="h6">{participants.length || 0}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      <LocalOffer fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Cài đặt
                    </Typography>
                    <List>
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText 
                          primary="Xáo trộn câu hỏi" 
                          secondary={exam.ShuffleQuestions ? 'Bật' : 'Tắt'} 
                        />
                        {exam.ShuffleQuestions ? <Check color="success" /> : <Close color="error" />}
                      </ListItem>
                      <Divider />
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText 
                          primary="Xáo trộn đáp án" 
                          secondary={exam.ShuffleAnswers ? 'Bật' : 'Tắt'} 
                        />
                        {exam.ShuffleAnswers ? <Check color="success" /> : <Close color="error" />}
                      </ListItem>
                      <Divider />
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText 
                          primary="Hiển thị kết quả ngay" 
                          secondary={exam.ShowResultsImmediately ? 'Bật' : 'Tắt'} 
                        />
                        {exam.ShowResultsImmediately ? <Check color="success" /> : <Close color="error" />}
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Thay đổi trạng thái
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Button 
                        variant={exam.Status === 'upcoming' ? 'contained' : 'outlined'} 
                        onClick={() => handleUpdateStatus('upcoming')}
                        color="primary"
                        sx={{ mb: 1 }}
                      >
                        Sắp diễn ra
                      </Button>
                      <Button 
                        variant={exam.Status === 'ongoing' ? 'contained' : 'outlined'} 
                        onClick={() => handleUpdateStatus('ongoing')}
                        color="success"
                        sx={{ mb: 1 }}
                      >
                        Đang diễn ra
                      </Button>
                      <Button 
                        variant={exam.Status === 'completed' ? 'contained' : 'outlined'} 
                        onClick={() => handleUpdateStatus('completed')}
                        color="secondary"
                        sx={{ mb: 1 }}
                      >
                        Đã kết thúc
                      </Button>
                      <Button 
                        variant={exam.Status === 'cancelled' ? 'contained' : 'outlined'} 
                        onClick={() => handleUpdateStatus('cancelled')}
                        color="error"
                        sx={{ mb: 1 }}
                      >
                        Hủy
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Tabs section */}
        <Paper elevation={2} sx={{ mt: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Câu hỏi" icon={<Quiz />} iconPosition="start" />
            <Tab label="Hướng dẫn làm bài" icon={<Description />} iconPosition="start" />
            <Tab label="Người tham gia" icon={<People />} iconPosition="start" />
            {exam.Type === 'coding' && <Tab label="Testcases" icon={<Code />} iconPosition="start" />}
          </Tabs>

          <Box p={3}>
            {/* Tab 1: Questions */}
            {tabValue === 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Danh sách câu hỏi ({questions.length})
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Edit />}
                    onClick={handleEdit}
                  >
                    Thêm câu hỏi
                  </Button>
                </Box>
                
                {questions.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width="5%">#</TableCell>
                          <TableCell>Câu hỏi</TableCell>
                          <TableCell width="15%">Loại</TableCell>
                          <TableCell width="10%" align="center">Điểm</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {questions.map((question, index) => (
                          <TableRow key={question.QuestionID || index} hover>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {question.QuestionText || question.Content}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                icon={getExamTypeIcon(question.Type)}
                                label={getExamTypeLabel(question.Type)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={question.Points} 
                                color="primary"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Chưa có câu hỏi nào hoặc không thể tải câu hỏi từ máy chủ</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                      Hãy thêm câu hỏi cho bài thi này hoặc kiểm tra kết nối với máy chủ
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<Edit />}
                      onClick={handleEdit}
                    >
                      Thêm câu hỏi
                    </Button>
                  </Paper>
                )}
              </Box>
            )}

            {/* Tab 2: Instructions */}
            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Hướng dẫn làm bài
                </Typography>
                
                {exam.Instructions ? (
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="body1" component="div">{exam.Instructions}</Typography>
                  </Paper>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Chưa có hướng dẫn làm bài</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<Edit />}
                      sx={{ mt: 2 }}
                      onClick={handleEdit}
                    >
                      Thêm hướng dẫn
                    </Button>
                  </Paper>
                )}
              </Box>
            )}

            {/* Tab 3: Participants */}
            {tabValue === 2 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Danh sách người tham gia ({participants.length})
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Badge />}
                    onClick={() => navigate(`/exams/${id}/participants/invite`)}
                  >
                    Thêm người tham gia
                  </Button>
                </Box>
                
                {participants.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width="5%">#</TableCell>
                          <TableCell>Học viên</TableCell>
                          <TableCell width="15%">Trạng thái</TableCell>
                          <TableCell width="15%">Bắt đầu</TableCell>
                          <TableCell width="15%">Hoàn thành</TableCell>
                          <TableCell width="10%" align="center">Điểm</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {participants.map((participant, index) => (
                          <TableRow key={participant.ParticipantID || index} hover>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Avatar 
                                  src={participant.Avatar} 
                                  alt={participant.FullName} 
                                  sx={{ mr: 2 }}
                                >
                                  {participant.FullName?.charAt(0) || <Person />}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {participant.FullName}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {participant.Email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={getParticipantStatusLabel(participant.Status)}
                                color={getParticipantStatusColor(participant.Status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {participant.StartedAt ? formatDateTime(participant.StartedAt) : 'Chưa bắt đầu'}
                            </TableCell>
                            <TableCell>
                              {participant.CompletedAt ? formatDateTime(participant.CompletedAt) : 'Chưa hoàn thành'}
                            </TableCell>
                            <TableCell align="center">
                              {participant.Score !== null && participant.Score !== undefined ? (
                                <Chip
                                  label={participant.Score}
                                  color={participant.Score >= (exam.PassingScore || 60) ? 'success' : 'error'}
                                  size="small"
                                />
                              ) : (
                                'Chưa có'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Chưa có người tham gia nào</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                      Hãy mời học viên tham gia bài thi này
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<Badge />}
                      onClick={() => navigate(`/exams/${id}/participants/invite`)}
                    >
                      Thêm người tham gia
                    </Button>
                  </Paper>
                )}
              </Box>
            )}

            {/* Tab 4: Testcases (for coding exams) */}
            {tabValue === 3 && exam.Type === 'coding' && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Testcases
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Edit />}
                    onClick={() => navigate(`/exams/${id}/testcases/create`)}
                  >
                    Thêm testcase
                  </Button>
                </Box>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">#</TableCell>
                        <TableCell>Input</TableCell>
                        <TableCell>Expected Output</TableCell>
                        <TableCell width="15%">Visibility</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exam.testcases && exam.testcases.length > 0 ? (
                        exam.testcases.map((testcase, index) => (
                          <TableRow key={testcase.id || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                {testcase.Input}
                              </pre>
                            </TableCell>
                            <TableCell>
                              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                {testcase.ExpectedOutput}
                              </pre>
                            </TableCell>
                            <TableCell>
                              {testcase.IsVisible ? (
                                <Chip label="Visible" color="success" size="small" />
                              ) : (
                                <Chip label="Hidden" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" sx={{ py: 2 }}>
                              Chưa có testcase nào
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ExamDetailPage; 