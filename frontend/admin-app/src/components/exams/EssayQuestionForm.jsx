import React, { useState, useEffect } from 'react';
import {
  TextField, Grid, Box, Button, Typography, Divider, Chip,
  Paper, IconButton, List, ListItem, ListItemText, Alert
} from '@mui/material';
import { Description, NoteAdd, Add, Delete, Save } from '@mui/icons-material';
import { getEssayTemplate, addEssayContent } from '../../api/exams';

const EssayQuestionForm = ({ examId, questionId, onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [essayData, setEssayData] = useState({
    content: '',
    keywords: [],
    minimumMatchPercentage: 60,
    scoringRubric: {}
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Fetch existing template if available
    const fetchTemplate = async () => {
      if (!questionId) return;
      
      try {
        setLoading(true);
        const response = await getEssayTemplate(questionId);
        if (response?.essayTemplate) {
          setEssayData(response.essayTemplate);
        }
      } catch (err) {
        console.log('No template found or error fetching:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [questionId]);

  const handleChange = (field, value) => {
    setEssayData({ ...essayData, [field]: value });
    // Reset success message when form is edited
    setSavedSuccess(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange('content', event.target.result);
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const updatedKeywords = [...essayData.keywords, newKeyword.trim()];
      handleChange('keywords', updatedKeywords);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index) => {
    const updatedKeywords = [...essayData.keywords];
    updatedKeywords.splice(index, 1);
    handleChange('keywords', updatedKeywords);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSavedSuccess(false);
      
      await addEssayContent(examId, questionId, essayData);
      
      setSavedSuccess(true);
      if (onSaveSuccess) {
        onSaveSuccess(essayData);
      }
    } catch (err) {
      console.error('Error saving essay content:', err);
      setError('Failed to save essay content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mt={3}>
      <Divider sx={{ mb: 3 }}>
        <Chip icon={<Description />} label="Essay Question Template" />
      </Divider>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {savedSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Essay content saved successfully!
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Model Answer Template
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This text will be used as a reference for automatic grading. The system will compare student 
          answers against this template to calculate similarity scores.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Essay Template Content"
              multiline
              rows={8}
              value={essayData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              margin="normal"
              placeholder="Enter model answer text that will be used for comparison when grading"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<NoteAdd />}
              sx={{ mb: 2 }}
            >
              Upload Template Text File
              <input
                type="file"
                hidden
                accept=".txt,.doc,.docx"
                onChange={handleFileChange}
              />
            </Button>
            {file && (
              <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                File: {file.name}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Keywords and Scoring
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Define important keywords that should appear in student answers. The grading algorithm will 
          check for these keywords when calculating scores.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Add Keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              margin="normal"
              placeholder="Enter keyword and press Enter or Add button"
            />
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addKeyword}
              sx={{ mt: 2 }}
              disabled={!newKeyword.trim()}
            >
              Add Keyword
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Keywords ({essayData.keywords.length})
            </Typography>
            {essayData.keywords.length > 0 ? (
              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {essayData.keywords.map((keyword, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => removeKeyword(index)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={keyword} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No keywords added yet
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Minimum Match Percentage"
              type="number"
              value={essayData.minimumMatchPercentage}
              onChange={(e) => handleChange('minimumMatchPercentage', Number(e.target.value))}
              margin="normal"
              InputProps={{ inputProps: { min: 0, max: 100 } }}
              helperText="Minimum percentage match required for auto-grading"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={loading || !essayData.content}
        >
          Save Essay Template
        </Button>
      </Box>
    </Box>
  );
};

export default EssayQuestionForm; 