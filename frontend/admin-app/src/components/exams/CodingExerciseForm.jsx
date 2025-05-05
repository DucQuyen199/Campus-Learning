import React from 'react';
import {
  TextField, MenuItem, Grid, Typography, Box, Card, CardContent,
  IconButton, Button, Divider, Chip
} from '@mui/material';
import { Add, Delete, Code } from '@mui/icons-material';

const CodingExerciseForm = ({ codingExercise, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...codingExercise, [field]: value });
  };

  const handleTestCaseChange = (index, field, value) => {
    const updatedTestCases = [...codingExercise.testCases];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value
    };
    handleChange('testCases', updatedTestCases);
  };

  const addTestCase = () => {
    handleChange('testCases', [
      ...codingExercise.testCases,
      { input: '', output: '', description: '' }
    ]);
  };

  const removeTestCase = (index) => {
    if (codingExercise.testCases.length > 1) {
      const updatedTestCases = [...codingExercise.testCases];
      updatedTestCases.splice(index, 1);
      handleChange('testCases', updatedTestCases);
    }
  };

  return (
    <Box mt={3}>
      <Divider sx={{ mb: 3 }}>
        <Chip icon={<Code />} label="Coding Exercise Settings" />
      </Divider>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            required
            fullWidth
            label="Programming Language"
            value={codingExercise.programmingLanguage}
            onChange={(e) => handleChange('programmingLanguage', e.target.value)}
            margin="normal"
          >
            <MenuItem value="javascript">JavaScript</MenuItem>
            <MenuItem value="python">Python</MenuItem>
            <MenuItem value="java">Java</MenuItem>
            <MenuItem value="csharp">C#</MenuItem>
            <MenuItem value="cpp">C++</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            required
            fullWidth
            label="Difficulty"
            value={codingExercise.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value)}
            margin="normal"
          >
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
            <MenuItem value="expert">Expert</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Time Limit (ms)"
            type="number"
            value={codingExercise.timeLimit}
            onChange={(e) => handleChange('timeLimit', e.target.value)}
            margin="normal"
            InputProps={{ inputProps: { min: 100 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Memory Limit (MB)"
            type="number"
            value={codingExercise.memoryLimit}
            onChange={(e) => handleChange('memoryLimit', e.target.value)}
            margin="normal"
            InputProps={{ inputProps: { min: 16 } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Initial Code"
            multiline
            rows={4}
            value={codingExercise.initialCode}
            onChange={(e) => handleChange('initialCode', e.target.value)}
            margin="normal"
            placeholder={codingExercise.programmingLanguage === 'cpp' ? 
              `#include <iostream>

int main() {
    setlocale(LC_ALL, "en_US.UTF-8");
    std::cout.imbue(std::locale("en_US.UTF-8"));
    std::cin.imbue(std::locale("en_US.UTF-8"));

    // Viết code của bạn ở đây
    std::cout << "Hello, C++ World!" << std::endl;
    
    return 0;
}` : "// Code that will be shown to the student initially"}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Solution Code"
            multiline
            rows={4}
            value={codingExercise.solutionCode}
            onChange={(e) => handleChange('solutionCode', e.target.value)}
            margin="normal"
            placeholder="// Solution code for the exercise"
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Test Cases
          </Typography>
          {codingExercise.testCases.map((testCase, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Input"
                    value={testCase.input}
                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                    margin="dense"
                    placeholder="Input for this test case"
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Expected Output"
                    value={testCase.output}
                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                    margin="dense"
                    placeholder="Expected output for this test case"
                  />
                </Grid>
                <Grid item xs={10} sm={2}>
                  <Box display="flex" alignItems="center" height="100%">
                    <IconButton
                      color="error"
                      onClick={() => removeTestCase(index)}
                      disabled={codingExercise.testCases.length <= 1}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={testCase.description}
                    onChange={(e) => handleTestCaseChange(index, 'description', e.target.value)}
                    margin="dense"
                    placeholder="Description of what this test case is checking"
                  />
                </Grid>
              </Grid>
            </Card>
          ))}
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addTestCase}
            sx={{ mt: 1 }}
          >
            Add Test Case
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CodingExerciseForm; 