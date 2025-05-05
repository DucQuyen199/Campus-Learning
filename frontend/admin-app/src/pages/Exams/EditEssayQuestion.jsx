import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Breadcrumbs, 
  Link, CircularProgress, Alert, Button
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import EssayQuestionForm from '../../components/exams/EssayQuestionForm';
import { getExamById, getEssayTemplate } from '../../api/exams';

const EditEssayQuestion = () => {
  const { examId, questionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [question, setQuestion] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get exam details
        const examData = await getExamById(examId);
        setExam(examData);
        
        // Find the specific question
        const foundQuestion = examData.questions.find(q => q._id === questionId);
        if (!foundQuestion) {
          throw new Error('Question not found');
        }
        
        if (foundQuestion.type !== 'essay') {
          throw new Error('This is not an essay question');
        }
        
        setQuestion(foundQuestion);
        
        // Try to get essay template if exists
        try {
          await getEssayTemplate(questionId);
          // Template exists, but we'll load it in the EssayQuestionForm component
        } catch (err) {
          // No template found, this is okay for new questions
          console.log('No template found, this is okay for new questions');
        }
      } catch (err) {
        console.error('Error loading question:', err);
        setError(err.message || 'Error loading question data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [examId, questionId]);
  
  const handleBack = () => {
    navigate(`/exams/edit/${examId}`);
  };
  
  const handleSaveSuccess = () => {
    // Optional: Add any additional logic after successful save
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 3 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Back to Exam
          </Button>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Exam
        </Button>
        
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" onClick={() => navigate('/exams')}>
            Exams
          </Link>
          <Link color="inherit" onClick={handleBack}>
            {exam?.title || 'Exam'}
          </Link>
          <Typography color="text.primary">
            Edit Essay Question
          </Typography>
        </Breadcrumbs>
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {question?.text || 'Essay Question'}
          </Typography>
          {question?.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {question.description}
            </Typography>
          )}
          <Typography variant="body2" gutterBottom>
            Points: {question?.points || 0}
          </Typography>
        </Paper>
        
        <EssayQuestionForm 
          examId={examId} 
          questionId={questionId} 
          onSaveSuccess={handleSaveSuccess}
        />
      </Box>
    </Container>
  );
};

export default EditEssayQuestion; 