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
  ExpandMore, CheckCircle
} from '@mui/icons-material';
import { createExam, addQuestionToExam } from '../../api/exams';

// Steps for exam creation
const steps = ['Thông tin bài thi', 'Câu hỏi', 'Xem lại'];

const MultipleChoiceExamPage = () => {
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
    type: 'multiple_choice',
    duration: 60,
    totalPoints: 100,
    passingScore: 60,
    startTime: '',
    endTime: '',
    instructions: '',
    allowReview: true,
    shuffleQuestions: false,
    courseId: '',
    status: 'draft'
  });

  // Questions array
  const [questions, setQuestions] = useState([]);

  // Current question being edited
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple_choice',
    content: '',
    points: 10,
    orderIndex: 1,
    options: [],
    correctAnswer: '',
    explanation: ''
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

  const addQuestion = () => {
    // Validate options and correct answer
    if (!currentQuestion.content) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    
    if (!currentQuestion.options || currentQuestion.options.length < 2) {
      setError('Vui lòng nhập ít nhất 2 lựa chọn');
      return;
    }
    
    if (!currentQuestion.correctAnswer) {
      setError('Vui lòng nhập đáp án đúng');
      return;
    }
    
    if (!currentQuestion.options.includes(currentQuestion.correctAnswer)) {
      setError('Đáp án đúng phải nằm trong các lựa chọn');
      return;
    }
    
    // Add question to the list
    setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
    setError(null);
    setSuccess('Đã thêm câu hỏi thành công');
    
    // Reset current question
    setCurrentQuestion({
      type: 'multiple_choice',
      content: '',
      points: 10,
      orderIndex: questions.length + 2,
      options: [],
      correctAnswer: '',
      explanation: ''
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
      
      // Format dates
      const formattedExamData = {
        ...examData,
        startTime: new Date(examData.startTime).toISOString(),
        endTime: new Date(examData.endTime).toISOString(),
        courseId: examData.courseId || null
      };
      
      const response = await createExam(formattedExamData);
      setCreatedExamId(response.examId);
      setActiveStep(activeStep + 1);
    } catch (err) {
      setError('Không thể tạo bài thi. Vui lòng kiểm tra lại thông tin và thử lại.');
      console.error(err);
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
        const questionData = {
          type: question.type,
          content: question.content,
          points: question.points,
          orderIndex: question.orderIndex,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        };
        
        await addQuestionToExam(createdExamId, questionData);
      }
      
      // Navigate to exams list
      navigate('/exams', { 
        state: { 
          success: 'Bài thi trắc nghiệm đã được tạo thành công'
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
            Tạo bài thi trắc nghiệm
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
                    <MenuItem value="draft">Bản nháp</MenuItem>
                    <MenuItem value="published">Đã xuất bản</MenuItem>
                    <MenuItem value="upcoming">Sắp diễn ra</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Loại bài thi"
                    value="Trắc nghiệm"
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
                Thêm câu hỏi trắc nghiệm
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
                          {index + 1}. Câu hỏi trắc nghiệm ({question.points} điểm)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography gutterBottom><strong>Nội dung:</strong> {question.content}</Typography>
                        
                        <Typography gutterBottom sx={{ mt: 1 }}><strong>Các lựa chọn:</strong></Typography>
                        <ul>
                          {question.options.map((option, i) => (
                            <li key={i}>
                              {option} {option === question.correctAnswer && <strong>(Đáp án đúng)</strong>}
                            </li>
                          ))}
                        </ul>
                        
                        {question.explanation && (
                          <Typography gutterBottom><strong>Giải thích:</strong> {question.explanation}</Typography>
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
                    />
                  </Grid>
                </Grid>
                
                <Box mt={3}>
                  <Divider sx={{ mb: 3 }}>
                    <Chip icon={<CheckCircle />} label="Lựa chọn" />
                  </Divider>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Các lựa chọn
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Các lựa chọn (mỗi lựa chọn một dòng)"
                        multiline
                        rows={4}
                        onChange={(e) => {
                          const options = e.target.value.split('\n').filter(option => option.trim() !== '');
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: options
                          });
                        }}
                        margin="normal"
                        placeholder="Nhập mỗi lựa chọn trên một dòng"
                        helperText="Ví dụ: A. Lựa chọn 1"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Đáp án đúng"
                        name="correctAnswer"
                        value={currentQuestion.correctAnswer}
                        onChange={handleQuestionChange}
                        margin="normal"
                        helperText="Nhập đáp án đúng (phải trùng với một trong các lựa chọn ở trên)"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Giải thích đáp án (tùy chọn)"
                        name="explanation"
                        multiline
                        rows={2}
                        value={currentQuestion.explanation}
                        onChange={handleQuestionChange}
                        margin="normal"
                        helperText="Giải thích tại sao đáp án này là đúng (sẽ hiển thị sau khi học viên làm bài xong)"
                      />
                    </Grid>
                  </Grid>
                </Box>
                
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={addQuestion}
                    disabled={loading}
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
                      <Typography variant="body2"><strong>Loại bài thi:</strong> Trắc nghiệm</Typography>
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
                          examData.status === 'draft' ? 'Bản nháp' :
                          examData.status === 'published' ? 'Đã xuất bản' :
                          examData.status === 'upcoming' ? 'Sắp diễn ra' : examData.status
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
                      {index + 1}. Câu hỏi trắc nghiệm ({question.points} điểm)
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Nội dung:</strong> {question.content}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Các lựa chọn:</strong>
                    </Typography>
                    <Box component="ul" sx={{ mt: 0 }}>
                      {question.options.map((option, i) => (
                        <li key={i}>
                          {option} {option === question.correctAnswer && <strong>(Đáp án đúng)</strong>}
                        </li>
                      ))}
                    </Box>
                    
                    {question.explanation && (
                      <Typography variant="body2">
                        <strong>Giải thích:</strong> {question.explanation}
                      </Typography>
                    )}
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

export default MultipleChoiceExamPage; 