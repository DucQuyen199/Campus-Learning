/*-----------------------------------------------------------------
* File: TakeExam.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, Button, Paper, CircularProgress, 
  Stepper, Step, StepLabel, Grid, Card, CardContent, 
  FormControlLabel, Radio, RadioGroup, TextField, Alert
} from '@mui/material';
import { startExam, submitAnswer, completeExam } from '../../api/examApi';
import ExamMonitor from '../ExamMonitor';
import ExamTimer from './ExamTimer';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [examData, setExamData] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [examInProgress, setExamInProgress] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [cheatingDetected, setCheatingDetected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement !== null);
  
  // Start the exam and get participant ID
  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        const response = await startExam(examId);
        setParticipantId(response.participantId);
        setExamData(response.examData);
        setExamInProgress(true);
        setTimeRemaining(response.examData.duration * 60); // Convert minutes to seconds
        setLoading(false);
      } catch (error) {
        console.error('Error starting exam:', error);
        setError('Failed to start exam. Please try again.');
        setLoading(false);
      }
    };
    
    initExam();
  }, [examId]);
  
  // Handle time expiration
  const handleTimeExpired = () => {
    handleComplete();
  };
  
  // Handle fullscreen change from ExamMonitor
  const handleFullscreenChange = (fullscreenState) => {
    setIsFullscreen(fullscreenState);
  };
  
  // Handle cheating detection from ExamMonitor
  const handleCheatingDetected = () => {
    setCheatingDetected(true);
    // We don't need to do anything else because ExamMonitor will handle redirection
  };
  
  // Handle answer change for multiple choice questions
  const handleMultipleChoiceChange = (e) => {
    setCurrentAnswer(e.target.value);
  };
  
  // Handle text answer change
  const handleTextAnswerChange = (e) => {
    setCurrentAnswer(e.target.value);
  };
  
  // Save current answer before moving to next question
  const saveCurrentAnswer = async () => {
    if (!currentAnswer || cheatingDetected) return;
    
    try {
      const currentQuestion = examData.questions[activeStep];
      await submitAnswer(participantId, currentQuestion.id, currentAnswer);
      
      // Update answers state
      setAnswers({
        ...answers,
        [currentQuestion.id]: currentAnswer
      });
      
      // Clear current answer for next question
      setCurrentAnswer('');
    } catch (error) {
      console.error('Error saving answer:', error);
      setError('Failed to save your answer. Please try again.');
    }
  };
  
  // Navigate to previous question
  const handlePrevious = async () => {
    if (cheatingDetected) return;
    
    // Save current answer first
    await saveCurrentAnswer();
    
    // Move to previous question
    setActiveStep((prevStep) => Math.max(0, prevStep - 1));
    
    // Load previous answer if exists
    const prevQuestion = examData.questions[activeStep - 1];
    if (prevQuestion && answers[prevQuestion.id]) {
      setCurrentAnswer(answers[prevQuestion.id]);
    } else {
      setCurrentAnswer('');
    }
  };
  
  // Navigate to next question
  const handleNext = async () => {
    if (cheatingDetected) return;
    
    // Save current answer first
    await saveCurrentAnswer();
    
    // Move to next question
    if (activeStep < examData.questions.length - 1) {
      setActiveStep((prevStep) => prevStep + 1);
      
      // Load next answer if exists
      const nextQuestion = examData.questions[activeStep + 1];
      if (nextQuestion && answers[nextQuestion.id]) {
        setCurrentAnswer(answers[nextQuestion.id]);
      } else {
        setCurrentAnswer('');
      }
    }
  };
  
  // Complete the exam
  const handleComplete = async () => {
    if (cheatingDetected) return;
    
    try {
      setSubmitting(true);
      
      // Save the current answer first
      await saveCurrentAnswer();
      
      // Submit the exam
      const result = await completeExam(participantId);
      
      // Redirect to results page
      navigate(result.redirectTo || `/exam-results/${participantId}`);
    } catch (error) {
      console.error('Error completing exam:', error);
      setError('Failed to submit exam. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Render the current question
  const renderQuestion = () => {
    if (!examData || !examData.questions || examData.questions.length === 0) {
      return <Typography>No questions available.</Typography>;
    }
    
    if (!isFullscreen) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 5,
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          border: '1px dashed #ccc',
          textAlign: 'center'
        }}>
          <Typography variant="h6" color="error" gutterBottom fontWeight="bold">
            Nội dung bài thi bị ẩn
          </Typography>
          <Typography variant="body1" paragraph>
            Nội dung câu hỏi và ô nhập câu trả lời chỉ hiển thị trong chế độ toàn màn hình.
          </Typography>
          <Button 
            variant="contained"
            startIcon={<FullscreenIcon />}
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
              }
            }}
            sx={{ mt: 2 }}
          >
            Vào chế độ toàn màn hình để làm bài
          </Button>
        </Box>
      );
    }
    
    const currentQuestion = examData.questions[activeStep];
    
    return (
      <Card elevation={3} sx={{ opacity: cheatingDetected ? 0.6 : 1, pointerEvents: cheatingDetected ? 'none' : 'auto' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Question {activeStep + 1} of {examData.questions.length}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {currentQuestion.text}
          </Typography>
          
          {currentQuestion.type === 'multiple_choice' ? (
            <RadioGroup
              value={currentAnswer}
              onChange={handleMultipleChoiceChange}
              disabled={cheatingDetected}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option.value}
                  control={<Radio disabled={cheatingDetected} />}
                  label={option.text}
                />
              ))}
            </RadioGroup>
          ) : (
            <TextField
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={handleTextAnswerChange}
              disabled={cheatingDetected}
            />
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Add event listener for fullscreen changes
  useEffect(() => {
    const handleDocFullscreenChange = () => {
      const isDocFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isDocFullscreen);
    };

    document.addEventListener('fullscreenchange', handleDocFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleDocFullscreenChange);
    };
  }, []);
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading exam...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/exams')}>
          Back to Exams
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {participantId && <ExamMonitor 
        participantId={participantId} 
        onCheatingDetected={handleCheatingDetected}
        onFullscreenChange={handleFullscreenChange}
      />}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            {examData?.title || 'Exam'}
          </Typography>
          
          {examData && <ExamTimer 
            duration={examData.duration} 
            onTimeExpired={handleTimeExpired} 
          />}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {cheatingDetected && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Cheating Detected!
            </Typography>
            <Typography variant="body2">
              Exiting fullscreen mode is not permitted during an exam. Your submission has been marked as invalid.
            </Typography>
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {examData?.questions.map((question, index) => (
            <Step key={index}>
              <StepLabel>Q{index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderQuestion()}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || cheatingDetected}
            onClick={handlePrevious}
          >
            Previous
          </Button>
          
          <Box>
            {activeStep === examData?.questions.length - 1 ? (
              isFullscreen && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleComplete}
                  disabled={submitting || cheatingDetected}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Submit Exam'}
                </Button>
              )
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={cheatingDetected}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default TakeExam; 
