/*-----------------------------------------------------------------
* File: EditExamPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Accordion, AccordionSummary,
  AccordionDetails, Button, TextField, MenuItem, Grid, CircularProgress,
  Divider, Chip, Alert, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Switch, FormControlLabel
} from '@mui/material';
import {
  Save, Delete, EditNote, ExpandMore, ArrowBack
} from '@mui/icons-material';
import { getExamById, updateExam, deleteQuestion } from '../../api/exams';
import { message } from 'antd';

const EditExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, questionIndex: null });
  const [originalData, setOriginalData] = useState(null);
  
  // Exam data
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    type: '',
    duration: 0,
    totalPoints: 0,
    passingScore: 0,
    startTime: '',
    endTime: '',
    instructions: '',
    allowReview: true,
    shuffleQuestions: false,
    courseId: '',
    status: '',
    allowRetakes: false,
    maxRetakes: 0,
    questions: []
  });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching exam data for ID:', examId);
        const response = await getExamById(examId);
        
        if (!response) {
          setError('Không thể tải thông tin bài thi');
          return;
        }
        
        console.log('Exam data received:', response);
        
        // Extract exam data from API response
        const exam = response.exam || response;
        
        // Format dates for input fields
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            // Format as yyyy-MM-ddThh:mm which is required by datetime-local input
            return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
              .toISOString()
              .slice(0, 16);
          } catch (e) {
            console.error('Error formatting date:', e);
            return '';
          }
        };

        // Map API response to form state
        const formattedExamData = {
          title: exam.Title || '',
          description: exam.Description || '',
          type: exam.Type || '',
          duration: exam.Duration || 0,
          totalPoints: exam.TotalPoints || 100,
          passingScore: exam.PassingScore || 60,
          startTime: formatDateForInput(exam.StartTime),
          endTime: formatDateForInput(exam.EndTime),
          instructions: exam.Instructions || '',
          allowReview: exam.AllowReview !== false,
          shuffleQuestions: exam.ShuffleQuestions || false,
          courseId: exam.CourseID || '',
          status: (exam.Status || '').toLowerCase() || 'draft',
          allowRetakes: exam.AllowRetakes || false,
          maxRetakes: exam.MaxRetakes || 0,
          questions: exam.questions || []
        };
        
        console.log('Formatted exam data:', formattedExamData);
        
        // Store the original data for reference
        setOriginalData(formattedExamData);
        setExamData(formattedExamData);
      } catch (err) {
        console.error('Error fetching exam:', err);
        setError('Không thể tải thông tin bài thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleExamDataChange = (e) => {
    const { name, value, checked } = e.target;
    let newValue = e.target.type === 'checkbox' ? checked : value;
    
    // Special handling for maxRetakes if allowRetakes is toggled off
    if (name === 'allowRetakes' && !checked) {
      setExamData({ 
        ...examData, 
        [name]: newValue,
        maxRetakes: 0
      });
    } else {
      setExamData({ ...examData, [name]: newValue });
    }
  };

  const handleSaveExam = async () => {
    try {
      setSaveLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate data before submission
      if (!examData.title) {
        setError('Vui lòng nhập tiêu đề bài thi');
        setSaveLoading(false);
        return;
      }
      
      if (!examData.duration || examData.duration <= 0) {
        setError('Thời gian làm bài phải lớn hơn 0');
        setSaveLoading(false);
        return;
      }
      
      if (!examData.startTime || !examData.endTime) {
        setError('Vui lòng nhập thời gian bắt đầu và kết thúc');
        setSaveLoading(false);
        return;
      }
      
      // Format data for API
      const payload = {
        title: examData.title,
        description: examData.description,
        type: examData.type,
        duration: parseInt(examData.duration, 10),
        totalPoints: parseInt(examData.totalPoints, 10),
        passingScore: parseInt(examData.passingScore, 10),
        startTime: new Date(examData.startTime).toISOString(),
        endTime: new Date(examData.endTime).toISOString(),
        instructions: examData.instructions,
        allowReview: examData.allowReview,
        shuffleQuestions: examData.shuffleQuestions,
        courseId: examData.courseId || null,
        status: examData.status,
        allowRetakes: examData.allowRetakes,
        maxRetakes: examData.allowRetakes ? parseInt(examData.maxRetakes, 10) : 0
      };
      
      console.log('Updating exam with data:', payload);
      
      await updateExam(examId, payload);
      
      setSuccess('Cập nhật bài thi thành công');
      message.success('Đã lưu thay đổi');
    } catch (err) {
      console.error('Error updating exam:', err);
      setError('Không thể cập nhật bài thi. Vui lòng thử lại.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteQuestion(questionId);
      
      // Update questions list
      const updatedQuestions = examData.questions.filter(q => q.QuestionID !== questionId);
      setExamData({ ...examData, questions: updatedQuestions });
      
      setSuccess('Đã xóa câu hỏi thành công');
      setConfirmDelete({ open: false, questionIndex: null });
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Không thể xóa câu hỏi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (questionIndex) => {
    setConfirmDelete({ open: true, questionIndex });
  };

  const closeDeleteConfirm = () => {
    setConfirmDelete({ open: false, questionIndex: null });
  };

  if (loading && !originalData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Đang tải thông tin bài thi...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/exams')}
          sx={{ mb: 2 }}
        >
          Quay lại danh sách bài thi
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Chỉnh sửa bài thi
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        {/* Exam Details Form */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Thông tin bài thi
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tiêu đề"
                name="title"
                value={examData.title}
                onChange={handleExamDataChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Trạng thái"
                name="status"
                value={examData.status}
                onChange={handleExamDataChange}
                margin="normal"
              >
                <MenuItem value="draft">Nháp</MenuItem>
                <MenuItem value="upcoming">Sắp diễn ra</MenuItem>
                <MenuItem value="ongoing">Đang diễn ra</MenuItem>
                <MenuItem value="completed">Đã kết thúc</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Loại bài thi"
                name="type"
                value={examData.type}
                onChange={handleExamDataChange}
                margin="normal"
              >
                <MenuItem value="multiple_choice">Trắc nghiệm</MenuItem>
                <MenuItem value="essay">Tự luận</MenuItem>
                <MenuItem value="coding">Lập trình</MenuItem>
                <MenuItem value="mixed">Kết hợp</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Thời gian làm bài (phút)"
                name="duration"
                type="number"
                value={examData.duration}
                onChange={handleExamDataChange}
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Thời gian bắt đầu"
                name="startTime"
                type="datetime-local"
                value={examData.startTime}
                onChange={handleExamDataChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Thời gian kết thúc"
                name="endTime"
                type="datetime-local"
                value={examData.endTime}
                onChange={handleExamDataChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tổng điểm"
                name="totalPoints"
                type="number"
                value={examData.totalPoints}
                onChange={handleExamDataChange}
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Điểm đạt"
                name="passingScore"
                type="number"
                value={examData.passingScore}
                onChange={handleExamDataChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0, max: examData.totalPoints } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={examData.allowRetakes}
                      onChange={handleExamDataChange}
                      name="allowRetakes"
                    />
                  }
                  label="Cho phép thi lại"
                />
              </Box>
            </Grid>
            {examData.allowRetakes && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Số lần thi lại tối đa (0 = không giới hạn)"
                  name="maxRetakes"
                  type="number"
                  value={examData.maxRetakes}
                  onChange={handleExamDataChange}
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <Box sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={examData.shuffleQuestions}
                      onChange={handleExamDataChange}
                      name="shuffleQuestions"
                    />
                  }
                  label="Xáo trộn câu hỏi"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={examData.allowReview}
                      onChange={handleExamDataChange}
                      name="allowReview"
                    />
                  }
                  label="Cho phép xem lại bài làm"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hướng dẫn làm bài"
                name="instructions"
                multiline
                rows={3}
                value={examData.instructions}
                onChange={handleExamDataChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả bài thi"
                name="description"
                multiline
                rows={3}
                value={examData.description}
                onChange={handleExamDataChange}
                margin="normal"
              />
            </Grid>
          </Grid>
          
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSaveExam}
              disabled={saveLoading}
              sx={{ minWidth: 160 }}
            >
              {saveLoading ? <CircularProgress size={24} /> : 'Lưu thay đổi'}
            </Button>
          </Box>
        </Paper>
        
        {/* Questions Section */}
        <Box mb={4}>
          <Divider sx={{ mb: 3 }}>
            <Chip label="Danh sách câu hỏi" />
          </Divider>
          
          <Typography variant="subtitle1" gutterBottom>
            Số câu hỏi: {examData.questions?.length || 0}
          </Typography>
          
          {examData.questions?.length > 0 ? (
            examData.questions.map((question, index) => (
              <Accordion key={question.QuestionID || index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>
                    {index + 1}. {question.Type === 'essay' ? 'Tự luận' : 
                        question.Type === 'coding' ? 'Lập trình' : 'Trắc nghiệm'} 
                    ({question.Points} điểm)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography gutterBottom><strong>Nội dung:</strong> {question.Content}</Typography>
                  
                  {question.Explanation && (
                    <Typography gutterBottom><strong>Giải thích:</strong> {question.Explanation}</Typography>
                  )}
                  
                  {question.Type === 'multiple_choice' && question.Options && (
                    <Box mt={2}>
                      <Typography gutterBottom><strong>Các lựa chọn:</strong></Typography>
                      <ul>
                        {JSON.parse(question.Options).map((option, i) => (
                          <li key={i}>{option}</li>
                        ))}
                      </ul>
                      <Typography gutterBottom><strong>Đáp án:</strong> {question.CorrectAnswer}</Typography>
                    </Box>
                  )}
                  
                  <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                    {question.Type === 'essay' && (
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditNote />}
                        onClick={() => navigate(`/exams/${examId}/questions/${question.QuestionID}/essay-edit`)}
                      >
                        Chỉnh sửa đáp án mẫu
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => openDeleteConfirm(index)}
                    >
                      Xóa câu hỏi
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography color="text.secondary">
              Bài thi chưa có câu hỏi nào.
            </Typography>
          )}
          
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate(`/exams/${examId}/add-question`)}
            >
              Thêm câu hỏi mới
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDelete.open}
        onClose={closeDeleteConfirm}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm}>Hủy</Button>
          <Button 
            onClick={() => {
              const questionId = examData.questions[confirmDelete.questionIndex]?.QuestionID;
              if (questionId) {
                handleDeleteQuestion(questionId);
              } else {
                closeDeleteConfirm();
                setError('Không tìm thấy ID câu hỏi');
              }
            }} 
            color="error" 
            autoFocus
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditExamPage; 
