import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Stepper, Step, StepLabel,
  Button, TextField, MenuItem, FormControl, FormControlLabel,
  Switch, Grid, Card, CardContent, CircularProgress, Divider,
  Accordion, AccordionSummary, AccordionDetails, IconButton,
  Tooltip, Alert, Chip
} from '@mui/material';
import {
  Add, Delete, ArrowBack, ArrowForward, Save,
  ExpandMore, Description, NoteAdd
} from '@mui/icons-material';
import { createExam, addQuestionToExam, addEssayContent } from '../../api/exams';

// Steps for exam creation
const steps = ['Thông tin bài thi', 'Câu hỏi', 'Xem lại'];

const EssayExamPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [createdExamId, setCreatedExamId] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form data
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    type: 'essay',
    duration: 90,
    totalPoints: 100,
    passingScore: 60,
    startTime: '',
    endTime: '',
    instructions: '',
    allowReview: true,
    shuffleQuestions: false,
    courseId: '',
    status: 'ACTIVE'
  });

  // Questions array
  const [questions, setQuestions] = useState([]);

  // Current question being edited
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'essay',
    content: '',
    points: 10,
    orderIndex: 1,
    essayData: {
      content: '',
      keywords: [],
      minimumMatchPercentage: 60
    }
  });

  // Fetch courses for dropdown
  useEffect(() => {
    // This would typically fetch courses from an API
    // For now we're setting dummy data
    setCourses([
      { CourseID: 1, Title: 'Introduction to Programming' },
      { CourseID: 2, Title: 'Data Structures and Algorithms' },
      { CourseID: 3, Title: 'Web Development Fundamentals' }
    ]);
  }, []);

  const handleExamDataChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = e.target.type === 'checkbox' ? checked : value;
    setExamData({ ...examData, [name]: newValue });
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion({ ...currentQuestion, [name]: value });
  };

  const handleEssayDataChange = (field, value) => {
    setCurrentQuestion({
      ...currentQuestion,
      essayData: {
        ...currentQuestion.essayData,
        [field]: value
      }
    });
  };

  const addQuestion = () => {
    // Validate question data
    if (!currentQuestion.content) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    
    // Add question to the list
    setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
    setError(null);
    setSuccess('Đã thêm câu hỏi thành công');
    
    // Reset current question
    setCurrentQuestion({
      type: 'essay',
      content: '',
      points: 10,
      orderIndex: questions.length + 2,
      essayData: {
        content: '',
        keywords: [],
        minimumMatchPercentage: 60
      }
    });
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  const removeQuestion = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(questionIndex, 1);
    setQuestions(updatedQuestions);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate exam data
      if (!examData.title) {
        setError('Vui lòng nhập tiêu đề bài thi');
        return;
      }
      
      if (!examData.duration || examData.duration <= 0) {
        setError('Vui lòng nhập thời gian làm bài hợp lệ');
        return;
      }
      
      if (!examData.startTime || !examData.endTime) {
        setError('Vui lòng nhập thời gian bắt đầu và kết thúc');
        return;
      }
      
      // Create exam
      handleCreateExam();
    } else if (activeStep === 1) {
      // Validate questions
      if (questions.length === 0) {
        setError('Vui lòng thêm ít nhất một câu hỏi');
        return;
      }
      
      // Move to review step
      setActiveStep(activeStep + 1);
      setError(null);
    } else if (activeStep === 2) {
      // Finish and save
      handleFinish();
    }
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
    setError(null);
  };

  const handleCreateExam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kiểm tra lại dữ liệu đầu vào
      if (!examData.title.trim()) {
        setError('Tiêu đề bài thi không được để trống');
        setLoading(false);
        return;
      }
      
      if (!examData.duration || examData.duration <= 0) {
        setError('Thời gian làm bài phải lớn hơn 0');
        setLoading(false);
        return;
      }
      
      // Kiểm tra thời gian bắt đầu và kết thúc
      const start = new Date(examData.startTime);
      const end = new Date(examData.endTime);
      
      if (isNaN(start.getTime())) {
        setError('Thời gian bắt đầu không hợp lệ');
        setLoading(false);
        return;
      }
      
      if (isNaN(end.getTime())) {
        setError('Thời gian kết thúc không hợp lệ');
        setLoading(false);
        return;
      }
      
      if (start >= end) {
        setError('Thời gian kết thúc phải sau thời gian bắt đầu');
        setLoading(false);
        return;
      }
      
      // Format dates
      const formattedExamData = {
        ...examData,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        courseId: examData.courseId || null
      };
      
      console.log('Sending exam data:', formattedExamData);
      
      const response = await createExam(formattedExamData);
      console.log('Exam creation response:', response);
      
      if (response && response.examId) {
        setCreatedExamId(response.examId);
        setActiveStep(activeStep + 1);
      } else {
        setError('Không thể tạo bài thi. Vui lòng kiểm tra lại thông tin và thử lại.');
      }
    } catch (err) {
      console.error('Exam creation error:', err);
      
      // Kiểm tra lỗi từ API để hiển thị thông báo cụ thể
      if (err.response) {
        if (err.response.status === 400) {
          setError('Dữ liệu không hợp lệ: ' + (err.response.data.message || 'Vui lòng kiểm tra các trường thông tin'));
        } else if (err.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (err.response.status === 403) {
          setError('Bạn không có quyền thực hiện hành động này');
        } else if (err.response.status === 500) {
          setError('Lỗi máy chủ: ' + (err.response.data.message || 'Vui lòng thử lại sau'));
        } else {
          setError('Không thể tạo bài thi: ' + (err.response.data.message || 'Vui lòng thử lại sau'));
        }
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else {
        setError('Lỗi: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Upload all questions
      for (const question of questions) {
        // Add the question first
        const questionData = {
          type: 'essay',
          content: question.content,
          points: question.points,
          orderIndex: question.orderIndex
        };
        
        const questionResponse = await addQuestionToExam(createdExamId, questionData);
        const questionId = questionResponse.questionId;
        
        // Then add essay template
        if (question.essayData) {
          try {
            await addEssayContent(createdExamId, questionId, {
              content: question.essayData.content,
              keywords: question.essayData.keywords || [],
              minimumMatchPercentage: question.essayData.minimumMatchPercentage || 60
            });
          } catch (templateError) {
            console.error('Error adding essay template:', templateError);
            // Continue with other questions even if template fails
          }
        }
      }
      
      // Navigate to exams list
      navigate('/exams', { 
        state: { 
          success: 'Bài thi tự luận đã được tạo thành công'
        } 
      });
    } catch (err) {
      setError('Lỗi khi lưu câu hỏi. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/exams/create')}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h4">
            Tạo bài thi tự luận
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 3 }}>
          {/* Step 0: Thông tin bài thi */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin bài thi
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Tiêu đề bài thi"
                    name="title"
                    value={examData.title}
                    onChange={handleExamDataChange}
                    margin="normal"
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
                    <MenuItem value="DRAFT">Bản nháp</MenuItem>
                    <MenuItem value="PUBLISHED">Đã xuất bản</MenuItem>
                    <MenuItem value="UPCOMING">Sắp diễn ra</MenuItem>
                    <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                    <MenuItem value="INACTIVE">Không hoạt động</MenuItem>
                    <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
                    <MenuItem value="CANCELED">Đã hủy</MenuItem>
                    <MenuItem value="INREVIEW">Đang xét duyệt</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Loại bài thi"
                    value="Tự luận"
                    margin="normal"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Khóa học (tùy chọn)"
                    name="courseId"
                    value={examData.courseId}
                    onChange={handleExamDataChange}
                    margin="normal"
                  >
                    <MenuItem value="">Không thuộc khóa học</MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course.CourseID} value={course.CourseID}>
                        {course.Title}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Thời gian làm bài (phút)"
                    name="duration"
                    type="number"
                    value={examData.duration}
                    onChange={handleExamDataChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
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
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
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
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Thời gian bắt đầu"
                    name="startTime"
                    type="datetime-local"
                    value={examData.startTime}
                    onChange={handleExamDataChange}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Thời gian kết thúc"
                    name="endTime"
                    type="datetime-local"
                    value={examData.endTime}
                    onChange={handleExamDataChange}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Hướng dẫn làm bài"
                    name="instructions"
                    multiline
                    rows={4}
                    value={examData.instructions}
                    onChange={handleExamDataChange}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examData.allowReview}
                        onChange={handleExamDataChange}
                        name="allowReview"
                        color="primary"
                      />
                    }
                    label="Cho phép xem lại bài làm"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examData.shuffleQuestions}
                        onChange={handleExamDataChange}
                        name="shuffleQuestions"
                        color="primary"
                      />
                    }
                    label="Xáo trộn câu hỏi"
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
            </Box>
          )}
          
          {/* Step 1: Câu hỏi */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thêm câu hỏi tự luận
              </Typography>
              
              {/* Danh sách câu hỏi đã thêm */}
              {questions.length > 0 && (
                <Box mb={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Câu hỏi đã thêm: {questions.length}
                  </Typography>
                  {questions.map((question, index) => (
                    <Accordion key={question.id || index}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>
                          {index + 1}. Câu hỏi tự luận ({question.points} điểm)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography gutterBottom><strong>Nội dung:</strong> {question.content}</Typography>
                        
                        {question.essayData && (
                          <>
                            {question.essayData.content && (
                              <Typography gutterBottom sx={{ mt: 1 }}>
                                <strong>Nội dung mẫu:</strong> {question.essayData.content.substring(0, 100)}...
                              </Typography>
                            )}
                            
                            {question.essayData.keywords && question.essayData.keywords.length > 0 && (
                              <Typography gutterBottom>
                                <strong>Từ khóa:</strong> {question.essayData.keywords.join(', ')}
                              </Typography>
                            )}
                            
                            <Typography gutterBottom>
                              <strong>Tỷ lệ khớp tối thiểu:</strong> {question.essayData.minimumMatchPercentage}%
                            </Typography>
                          </>
                        )}
                        
                        <Box mt={2} display="flex" justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => removeQuestion(index)}
                          >
                            Xóa
                          </Button>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
              
              {/* Form thêm câu hỏi mới */}
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Thêm câu hỏi mới
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Điểm"
                      name="points"
                      type="number"
                      value={currentQuestion.points}
                      onChange={handleQuestionChange}
                      margin="normal"
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Nội dung câu hỏi"
                      name="content"
                      multiline
                      rows={3}
                      value={currentQuestion.content}
                      onChange={handleQuestionChange}
                      margin="normal"
                      placeholder="Nhập nội dung câu hỏi tự luận ở đây..."
                    />
                  </Grid>
                </Grid>
                
                <Box mt={3}>
                  <Divider sx={{ mb: 3 }}>
                    <Chip icon={<Description />} label="Nội dung mẫu và từ khóa" />
                  </Divider>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin đánh giá tự động
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nội dung mẫu"
                        multiline
                        rows={6}
                        value={currentQuestion.essayData.content}
                        onChange={(e) => handleEssayDataChange('content', e.target.value)}
                        margin="normal"
                        placeholder="Nhập nội dung mẫu làm cơ sở đánh giá câu trả lời của học viên"
                        helperText="Nội dung này sẽ được dùng để so sánh với bài làm của học viên"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Từ khóa (phân cách bằng dấu phẩy)"
                        value={Array.isArray(currentQuestion.essayData.keywords) ? currentQuestion.essayData.keywords.join(', ') : ''}
                        onChange={(e) => handleEssayDataChange('keywords', e.target.value.split(',').map(k => k.trim()))}
                        margin="normal"
                        placeholder="Ví dụ: thuật toán, mô hình dữ liệu, phân tích"
                        helperText="Các từ khóa quan trọng cần xuất hiện trong bài làm"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tỷ lệ khớp tối thiểu (%)"
                        type="number"
                        value={currentQuestion.essayData.minimumMatchPercentage}
                        onChange={(e) => handleEssayDataChange('minimumMatchPercentage', Number(e.target.value))}
                        margin="normal"
                        InputProps={{ inputProps: { min: 0, max: 100 } }}
                        helperText="Mức độ tương đồng tối thiểu để được chấm đỗ tự động"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button 
                        variant="outlined"
                        component="label"
                        startIcon={<NoteAdd />}
                      >
                        Tải lên file nội dung mẫu
                        <input
                          type="file"
                          hidden
                          accept=".txt,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                handleEssayDataChange('content', event.target.result);
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={addQuestion}
                    disabled={loading || !currentQuestion.content}
                  >
                    Thêm câu hỏi
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
          
          {/* Step 2: Xem lại */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Xem lại và xác nhận
              </Typography>
              
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6">Thông tin bài thi</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Tiêu đề:</strong> {examData.title}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Loại bài thi:</strong> Tự luận</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Thời gian làm bài:</strong> {examData.duration} phút</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Tổng điểm:</strong> {examData.totalPoints}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Điểm đạt:</strong> {examData.passingScore}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Trạng thái:</strong> {
                          examData.status === 'DRAFT' ? 'Bản nháp' :
                          examData.status === 'PUBLISHED' ? 'Đã xuất bản' :
                          examData.status === 'UPCOMING' ? 'Sắp diễn ra' :
                          examData.status === 'ACTIVE' ? 'Hoạt động' :
                          examData.status === 'INACTIVE' ? 'Không hoạt động' :
                          examData.status === 'COMPLETED' ? 'Hoàn thành' :
                          examData.status === 'CANCELED' ? 'Đã hủy' :
                          examData.status === 'INREVIEW' ? 'Đang xét duyệt' : examData.status
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Khóa học:</strong> {
                          examData.courseId ? 
                          courses.find(c => c.CourseID.toString() === examData.courseId.toString())?.Title || 'Không xác định' : 
                          'Không thuộc khóa học'
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Mô tả:</strong> {examData.description || 'Không có mô tả'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Typography variant="h6" gutterBottom>
                Câu hỏi ({questions.length})
              </Typography>
              
              {questions.map((question, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">
                      {index + 1}. Câu hỏi tự luận ({question.points} điểm)
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Nội dung:</strong> {question.content}
                    </Typography>
                    
                    <Box mt={2}>
                      <Typography variant="body2">
                        <strong>Nội dung mẫu:</strong> {question.essayData.content.length > 200 
                          ? `${question.essayData.content.substring(0, 200)}...` 
                          : question.essayData.content || 'Không có nội dung mẫu'}
                      </Typography>
                      
                      {question.essayData.keywords && question.essayData.keywords.length > 0 && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Từ khóa:</strong> {question.essayData.keywords.join(', ')}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Tỷ lệ khớp tối thiểu:</strong> {question.essayData.minimumMatchPercentage}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
          
          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBack />}
              disabled={activeStep === 0 || loading}
            >
              Quay lại
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              endIcon={activeStep === steps.length - 1 ? <Save /> : <ArrowForward />}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                activeStep === steps.length - 1 ? 'Hoàn thành' : 'Tiếp tục'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EssayExamPage; 