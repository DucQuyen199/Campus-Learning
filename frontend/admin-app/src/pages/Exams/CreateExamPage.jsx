/*-----------------------------------------------------------------
* File: CreateExamPage.jsx
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
  ExpandMore, Code, Description, NoteAdd, CheckCircle
} from '@mui/icons-material';
import { createExam, addQuestionToExam, addAnswerTemplate, addCodingExercise, uploadEssayFile } from '../../api/exams';
import CodingExerciseForm from '../../components/exams/CodingExerciseForm';
import EssayQuestionForm from '../../components/exams/EssayQuestionForm';

// Steps for exam creation
const steps = ['Chọn loại bài thi', 'Thông tin bài thi', 'Câu hỏi', 'Xem lại'];

const CreateExamPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [createdExamId, setCreatedExamId] = useState(null);

  // Form data
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    type: 'mixed', // Default to mixed for both essay and coding
    duration: 120,
    totalPoints: 100,
    passingScore: 60,
    startTime: '',
    endTime: '',
    instructions: '',
    allowReview: true,
    shuffleQuestions: false,
    courseId: '', // This can be empty
    status: 'upcoming'
  });

  // Questions array
  const [questions, setQuestions] = useState([]);

  // Current question being edited
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'essay',
    content: '',
    points: 10,
    orderIndex: 1,
    options: null,
    correctAnswer: null,
    explanation: null
  });

  // Current coding exercise
  const [codingExercise, setCodingExercise] = useState({
    programmingLanguage: 'javascript',
    initialCode: '',
    solutionCode: '',
    testCases: [{ input: '', output: '', description: '' }],
    timeLimit: 1000,
    memoryLimit: 256,
    difficulty: 'medium'
  });

  // Current essay data
  const [essayData, setEssayData] = useState({
    file: null,
    content: '',
    keywords: [],
    minimumMatchPercentage: 60
  });

  // Thêm state để lưu loại bài thi
  const [examType, setExamType] = useState('');

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
    setCodingExercise({ ...codingExercise, [field]: value });
  };

  const handleEssayDataChange = (field, value) => {
    setEssayData({ ...essayData, [field]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEssayData({ ...essayData, file: e.target.files[0] });
    }
  };

  const addQuestion = () => {
    // Add question to the list
    setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
    
    // Reset current question
    setCurrentQuestion({
      type: 'essay',
      content: '',
      points: 10,
      orderIndex: questions.length + 2,
      options: null,
      correctAnswer: null,
      explanation: null
    });
  };

  const removeQuestion = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(questionIndex, 1);
    setQuestions(updatedQuestions);
  };

  const handleNext = () => {
    if (activeStep === 0 && !examType) {
      // Kiểm tra xem người dùng đã chọn loại bài thi chưa
      setError('Vui lòng chọn loại bài thi trước khi tiếp tục');
      return;
    }
    
    if (activeStep === 1) {
      // Xử lý khi chuyển từ bước thông tin sang bước câu hỏi
      // Cần tạo bài thi trước
      handleCreateExam();
    } else if (activeStep === steps.length - 1) {
      // Xử lý hoàn thành bài thi
      handleFinish();
    } else {
      // Chuyển sang bước tiếp theo
      setError(null);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
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
        
        const questionResponse = await addQuestionToExam(createdExamId, questionData);
        const questionId = questionResponse.questionId;
        
        // If it's a coding question, add the coding exercise
        if (question.type === 'coding' && question.codingExercise) {
          await addCodingExercise(createdExamId, questionId, question.codingExercise);
        }
        
        // If it's an essay question, upload file if exists
        if (question.type === 'essay' && question.essayData && question.essayData.file) {
          const formData = new FormData();
          formData.append('essayFile', question.essayData.file);
          await uploadEssayFile(createdExamId, questionId, formData);
        }
      }
      
      // Add essay template for essay exams
      if (examData.type === 'essay' || examData.type === 'mixed') {
        const essayTemplateQuestions = questions.filter(q => q.type === 'essay');
        if (essayTemplateQuestions.length > 0) {
          const templateData = {
            content: essayData.content,
            keywords: essayData.keywords,
            minimumMatchPercentage: essayData.minimumMatchPercentage
          };
          await addAnswerTemplate(createdExamId, templateData);
        }
      }
      
      // Navigate to exams list
      navigate('/exams');
    } catch (err) {
      setError('Error saving exam questions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addCodingExerciseToCurrentQuestion = () => {
    setCurrentQuestion({
      ...currentQuestion,
      type: 'coding',
      codingExercise: { ...codingExercise }
    });
  };

  const addEssayDataToCurrentQuestion = () => {
    setCurrentQuestion({
      ...currentQuestion,
      type: 'essay',
      essayData: { ...essayData }
    });
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
        // Nếu courseId trống, không gửi trường này hoặc gửi giá trị null
        courseId: examData.courseId || null
      };
      
      const response = await createExam(formattedExamData);
      setCreatedExamId(response.examId);
      setActiveStep(prevStep => prevStep + 1);
    } catch (err) {
      setError('Failed to create exam. Please check your inputs and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm điều hướng đến trang tạo bài thi cụ thể
  const handleExamTypeSelect = (type) => {
    if (loading) return;
    
    setLoading(true);
    
    setTimeout(() => {
      if (type === 'multiple_choice') {
        navigate('/exams/create/multiple-choice');
      } else if (type === 'essay') {
        navigate('/exams/create/essay');
      } else if (type === 'coding') {
        navigate('/exams/create/coding');
      }
      setLoading(false);
    }, 300); // Thêm một chút delay để hiệu ứng chọn hiển thị tốt hơn
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/exams')}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h4">
            Tạo bài thi mới
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h6" sx={{ mb: 3 }}>
          Vui lòng chọn loại bài thi bạn muốn tạo:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 5, transform: 'translateY(-8px)' }
              }}
              onClick={() => handleExamTypeSelect('multiple_choice')}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ fontSize: 70, color: 'primary.main', mb: 3 }}>
                  <CheckCircle />
                </Box>
                <Typography variant="h5" gutterBottom>
                  Trắc nghiệm
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Tạo bài thi với các câu hỏi trắc nghiệm có đáp án
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Chọn'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 5, transform: 'translateY(-8px)' }
              }}
              onClick={() => handleExamTypeSelect('essay')}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ fontSize: 70, color: 'primary.main', mb: 3 }}>
                  <Description />
                </Box>
                <Typography variant="h5" gutterBottom>
                  Tự luận
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Tạo bài thi với các câu hỏi tự luận, học viên trả lời bằng văn bản
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Chọn'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 5, transform: 'translateY(-8px)' }
              }}
              onClick={() => handleExamTypeSelect('coding')}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ fontSize: 70, color: 'primary.main', mb: 3 }}>
                  <Code />
                </Box>
                <Typography variant="h5" gutterBottom>
                  Bài tập lập trình
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Tạo bài thi lập trình với các bài tập code và test cases
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Chọn'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CreateExamPage; 
