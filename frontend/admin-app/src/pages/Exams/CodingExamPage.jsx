/*-----------------------------------------------------------------
* File: CodingExamPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
  ExpandMore, Code, Download, Done, DoneAll
} from '@mui/icons-material';
import { createExam, addQuestionToExam, addCodingExercise } from '../../api/exams';

// Steps for exam creation
const steps = ['Thông tin bài thi', 'Câu hỏi', 'Xem lại'];

const CodingExamPage = () => {
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
    type: 'coding',
    duration: 120,
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
    type: 'coding',
    content: '',
    points: 10,
    orderIndex: 1,
    codingExercise: {
      programmingLanguage: 'javascript',
      initialCode: '',
      solutionCode: '',
      testCases: [{ input: '', output: '', description: '' }],
      timeLimit: 1000,
      memoryLimit: 256,
      difficulty: 'medium'
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

  const handleCodingExerciseChange = (field, value) => {
    setCurrentQuestion({
      ...currentQuestion,
      codingExercise: {
        ...currentQuestion.codingExercise,
        [field]: value
      }
    });
  };

  const handleTestCaseChange = (index, field, value) => {
    const updatedTestCases = [...currentQuestion.codingExercise.testCases];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value
    };
    
    handleCodingExerciseChange('testCases', updatedTestCases);
  };

  const addTestCase = () => {
    const updatedTestCases = [...currentQuestion.codingExercise.testCases, { 
      input: '', 
      output: '', 
      description: '' 
    }];
    
    handleCodingExerciseChange('testCases', updatedTestCases);
  };

  const removeTestCase = (index) => {
    if (currentQuestion.codingExercise.testCases.length <= 1) {
      setError('Cần có ít nhất một test case');
      return;
    }
    
    const updatedTestCases = [...currentQuestion.codingExercise.testCases];
    updatedTestCases.splice(index, 1);
    
    handleCodingExerciseChange('testCases', updatedTestCases);
  };

  const addQuestion = () => {
    // Validate question data
    if (!currentQuestion.content) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    
    if (!currentQuestion.codingExercise.solutionCode) {
      setError('Vui lòng nhập mã giải pháp');
      return;
    }
    
    if (!currentQuestion.codingExercise.testCases.some(tc => tc.input && tc.output)) {
      setError('Vui lòng nhập ít nhất một test case đầy đủ');
      return;
    }
    
    // Add question to the list
    setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
    setError(null);
    setSuccess('Đã thêm câu hỏi thành công');
    
    // Reset current question
    setCurrentQuestion({
      type: 'coding',
      content: '',
      points: 10,
      orderIndex: questions.length + 2,
      codingExercise: {
        programmingLanguage: 'javascript',
        initialCode: '',
        solutionCode: '',
        testCases: [{ input: '', output: '', description: '' }],
        timeLimit: 1000,
        memoryLimit: 256,
        difficulty: 'medium'
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
          type: question.type,
          content: question.content,
          points: question.points,
          orderIndex: question.orderIndex
        };
        
        const questionResponse = await addQuestionToExam(createdExamId, questionData);
        const questionId = questionResponse.questionId;
        
        // Then add coding exercise
        if (question.codingExercise) {
          await addCodingExercise(createdExamId, questionId, question.codingExercise);
        }
      }
      
      // Navigate to exams list
      navigate('/exams', { 
        state: { 
          success: 'Bài thi lập trình đã được tạo thành công'
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
            Tạo bài thi lập trình
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
                    value="Lập trình"
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
                Thêm câu hỏi lập trình
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
                          {index + 1}. Bài tập lập trình: {question.content.substring(0, 50)}... ({question.points} điểm)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography gutterBottom><strong>Nội dung:</strong> {question.content}</Typography>
                        
                        <Typography gutterBottom sx={{ mt: 2 }}>
                          <strong>Ngôn ngữ lập trình:</strong> {question.codingExercise.programmingLanguage}
                        </Typography>
                        
                        <Typography gutterBottom>
                          <strong>Độ khó:</strong> {
                            question.codingExercise.difficulty === 'easy' ? 'Dễ' :
                            question.codingExercise.difficulty === 'medium' ? 'Trung bình' :
                            question.codingExercise.difficulty === 'hard' ? 'Khó' : question.codingExercise.difficulty
                          }
                        </Typography>
                        
                        <Typography gutterBottom>
                          <strong>Số lượng test cases:</strong> {question.codingExercise.testCases.length}
                        </Typography>
                        
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
                  Thêm bài tập lập trình mới
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
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Ngôn ngữ lập trình"
                      value={currentQuestion.codingExercise.programmingLanguage}
                      onChange={(e) => handleCodingExerciseChange('programmingLanguage', e.target.value)}
                      margin="normal"
                    >
                      <MenuItem value="javascript">JavaScript</MenuItem>
                      <MenuItem value="python">Python</MenuItem>
                      <MenuItem value="java">Java</MenuItem>
                      <MenuItem value="cpp">C++</MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Tên và mô tả bài tập"
                      name="content"
                      multiline
                      rows={3}
                      value={currentQuestion.content}
                      onChange={handleQuestionChange}
                      margin="normal"
                      placeholder="Nhập tên và yêu cầu của bài tập lập trình..."
                    />
                  </Grid>
                </Grid>
                
                <Box mt={3}>
                  <Divider sx={{ mb: 3 }}>
                    <Chip icon={<Code />} label="Mã và kiểm thử" />
                  </Divider>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Độ khó"
                        value={currentQuestion.codingExercise.difficulty}
                        onChange={(e) => handleCodingExerciseChange('difficulty', e.target.value)}
                        margin="normal"
                      >
                        <MenuItem value="easy">Dễ</MenuItem>
                        <MenuItem value="medium">Trung bình</MenuItem>
                        <MenuItem value="hard">Khó</MenuItem>
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Thời gian chạy tối đa (ms)"
                        type="number"
                        value={currentQuestion.codingExercise.timeLimit}
                        onChange={(e) => handleCodingExerciseChange('timeLimit', Number(e.target.value))}
                        margin="normal"
                        InputProps={{ inputProps: { min: 100 } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Giới hạn bộ nhớ (MB)"
                        type="number"
                        value={currentQuestion.codingExercise.memoryLimit}
                        onChange={(e) => handleCodingExerciseChange('memoryLimit', Number(e.target.value))}
                        margin="normal"
                        InputProps={{ inputProps: { min: 16 } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Mã khởi tạo"
                        multiline
                        rows={5}
                        value={currentQuestion.codingExercise.initialCode}
                        onChange={(e) => handleCodingExerciseChange('initialCode', e.target.value)}
                        margin="normal"
                        placeholder={`// Mã khởi tạo cho học viên\nfunction solve(input) {\n  // Mã của học viên\n}`}
                        helperText="Mã này sẽ được hiển thị cho học viên khi bắt đầu làm bài"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Mã giải pháp"
                        multiline
                        rows={5}
                        value={currentQuestion.codingExercise.solutionCode}
                        onChange={(e) => handleCodingExerciseChange('solutionCode', e.target.value)}
                        margin="normal"
                        placeholder={`// Giải pháp mẫu\nfunction solve(input) {\n  // Mã giải pháp\n  return output;\n}`}
                        helperText="Mã giải pháp chính xác cho bài tập (không hiển thị cho học viên)"
                      />
                    </Grid>
                  </Grid>
                  
                  <Box mt={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Test Cases
                    </Typography>
                    
                    {currentQuestion.codingExercise.testCases.map((testCase, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle2">
                            Test Case #{index + 1}
                          </Typography>
                          <IconButton 
                            color="error" 
                            onClick={() => removeTestCase(index)}
                            disabled={currentQuestion.codingExercise.testCases.length <= 1}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Mô tả test case"
                              value={testCase.description}
                              onChange={(e) => handleTestCaseChange(index, 'description', e.target.value)}
                              margin="dense"
                              placeholder="Ví dụ: Kiểm tra với mảng rỗng"
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              required
                              label="Input"
                              multiline
                              rows={3}
                              value={testCase.input}
                              onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                              margin="dense"
                              placeholder="Nhập dữ liệu đầu vào"
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              required
                              label="Expected Output"
                              multiline
                              rows={3}
                              value={testCase.output}
                              onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                              margin="dense"
                              placeholder="Nhập kết quả mong đợi"
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                    
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={addTestCase}
                      >
                        Thêm test case mới
                      </Button>
                    </Box>
                  </Box>
                </Box>
                
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={addQuestion}
                    disabled={loading || !currentQuestion.content || !currentQuestion.codingExercise.solutionCode}
                  >
                    Thêm bài tập
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
                      <Typography variant="body2"><strong>Loại bài thi:</strong> Lập trình</Typography>
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
                Bài tập lập trình ({questions.length})
              </Typography>
              
              {questions.map((question, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">
                      {index + 1}. Bài tập lập trình ({question.points} điểm)
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Nội dung:</strong> {question.content}
                    </Typography>
                    
                    <Box mt={2}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2">
                            <strong>Ngôn ngữ:</strong> {question.codingExercise.programmingLanguage}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2">
                            <strong>Độ khó:</strong> {
                              question.codingExercise.difficulty === 'easy' ? 'Dễ' :
                              question.codingExercise.difficulty === 'medium' ? 'Trung bình' :
                              question.codingExercise.difficulty === 'hard' ? 'Khó' : question.codingExercise.difficulty
                            }
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2">
                            <strong>Test cases:</strong> {question.codingExercise.testCases.length}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Thời gian chạy tối đa:</strong> {question.codingExercise.timeLimit} ms
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Giới hạn bộ nhớ:</strong> {question.codingExercise.memoryLimit} MB
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2">
                            <strong>Chi tiết test cases</strong>
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {question.codingExercise.testCases.map((testCase, tcIndex) => (
                            <Box key={tcIndex} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                              <Typography variant="body2">
                                <strong>Test #{tcIndex + 1}:</strong> {testCase.description || 'Không có mô tả'}
                              </Typography>
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    <strong>Input:</strong> {testCase.input || 'Không có'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    <strong>Output:</strong> {testCase.output || 'Không có'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                        </AccordionDetails>
                      </Accordion>
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

export default CodingExamPage; 
