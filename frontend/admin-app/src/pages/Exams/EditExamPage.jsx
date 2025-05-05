import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Accordion, AccordionSummary,
  AccordionDetails, Button, TextField, MenuItem, Grid, CircularProgress,
  Divider, Chip, Alert, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions
} from '@mui/material';
import {
  Save, Delete, EditNote, ExpandMore, ArrowBack
} from '@mui/icons-material';
import { getExamById, updateExam, deleteQuestion } from '../../api/exams';

const EditExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, questionIndex: null });
  
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
    questions: []
  });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const data = await getExamById(examId);
        setExamData(data);
      } catch (err) {
        console.error('Error fetching exam:', err);
        setError('Failed to load exam data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleExamDataChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = e.target.type === 'checkbox' ? checked : value;
    setExamData({ ...examData, [name]: newValue });
  };

  const handleSaveExam = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await updateExam(examId, {
        title: examData.title,
        description: examData.description,
        duration: examData.duration,
        totalPoints: examData.totalPoints,
        passingScore: examData.passingScore,
        startTime: examData.startTime,
        endTime: examData.endTime,
        instructions: examData.instructions,
        allowReview: examData.allowReview,
        shuffleQuestions: examData.shuffleQuestions,
        status: examData.status
      });
      
      setSuccess('Exam updated successfully');
    } catch (err) {
      console.error('Error updating exam:', err);
      setError('Failed to update exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteQuestion(examId, questionId);
      
      // Update questions list
      const updatedQuestions = examData.questions.filter(q => q._id !== questionId);
      setExamData({ ...examData, questions: updatedQuestions });
      
      setSuccess('Question deleted successfully');
      setConfirmDelete({ open: false, questionIndex: null });
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete question. Please try again.');
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

  if (loading && !examData.title) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress />
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
          Back to Exams
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Edit Exam
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
            Exam Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
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
                label="Status"
                name="status"
                value={examData.status}
                onChange={handleExamDataChange}
                margin="normal"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                name="duration"
                type="number"
                value={examData.duration}
                onChange={handleExamDataChange}
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Total Points"
                name="totalPoints"
                type="number"
                value={examData.totalPoints}
                onChange={handleExamDataChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Passing Score"
                name="passingScore"
                type="number"
                value={examData.passingScore}
                onChange={handleExamDataChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0, max: examData.totalPoints } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
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
                label="Description"
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
              disabled={loading}
            >
              Save Exam Details
            </Button>
          </Box>
        </Paper>
        
        {/* Questions Section */}
        <Box mb={4}>
          <Divider sx={{ mb: 3 }}>
            <Chip label="Questions" />
          </Divider>
          
          <Typography variant="subtitle1" gutterBottom>
            Questions ({examData.questions?.length || 0})
          </Typography>
          
          {examData.questions?.length > 0 ? (
            examData.questions.map((question, index) => (
              <Accordion key={question._id || index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>
                    {index + 1}. {question.type === 'essay' ? 'Essay' : 
                        question.type === 'coding' ? 'Coding' : 'Multiple Choice'} Question 
                    ({question.points} points)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography gutterBottom><strong>Content:</strong> {question.text || question.content}</Typography>
                  
                  {question.description && (
                    <Typography gutterBottom><strong>Description:</strong> {question.description}</Typography>
                  )}
                  
                  <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                    {question.type === 'essay' && (
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditNote />}
                        onClick={() => navigate(`/exams/${examId}/questions/${question._id}/essay-edit`)}
                      >
                        Edit Essay Content
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => openDeleteConfirm(index)}
                    >
                      Remove
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography color="text.secondary">
              No questions added to this exam yet.
            </Typography>
          )}
          
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate(`/exams/${examId}/add-question`)}
            >
              Add New Question
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDelete.open}
        onClose={closeDeleteConfirm}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this question? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm}>Cancel</Button>
          <Button 
            onClick={() => {
              const questionId = examData.questions[confirmDelete.questionIndex]?._id;
              if (questionId) {
                handleDeleteQuestion(questionId);
              }
            }} 
            color="error" 
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditExamPage; 