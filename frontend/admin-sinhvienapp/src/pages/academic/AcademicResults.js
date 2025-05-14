import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Button,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon
} from '@mui/icons-material';

const AcademicResults = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [semester, setSemester] = useState('');
  const [program, setProgram] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);

  const mockSemesters = [
    { id: 1, name: 'Spring 2023' },
    { id: 2, name: 'Fall 2023' },
    { id: 3, name: 'Spring 2024' },
  ];

  const mockPrograms = [
    { id: 1, name: 'Computer Science' },
    { id: 2, name: 'Business Administration' },
    { id: 3, name: 'Electrical Engineering' },
  ];

  const mockSubjects = [
    { id: 1, name: 'Introduction to Programming' },
    { id: 2, name: 'Data Structures and Algorithms' },
    { id: 3, name: 'Database Systems' },
  ];

  // Sample mock data
  const mockResults = [
    {
      id: 1,
      student: { id: '2020001', name: 'Nguyen Van A' },
      semester: 'Spring 2023',
      program: 'Computer Science',
      subject: 'Introduction to Programming',
      grade: 8.5,
      status: 'Passed',
      date: '2023-05-15',
      credits: 3,
    },
    {
      id: 2,
      student: { id: '2020002', name: 'Tran Thi B' },
      semester: 'Spring 2023',
      program: 'Computer Science',
      subject: 'Introduction to Programming',
      grade: 7.8,
      status: 'Passed',
      date: '2023-05-15',
      credits: 3,
    },
    {
      id: 3,
      student: { id: '2020003', name: 'Le Van C' },
      semester: 'Fall 2023',
      program: 'Computer Science',
      subject: 'Data Structures and Algorithms',
      grade: 6.5,
      status: 'Passed',
      date: '2023-12-10',
      credits: 4,
    },
    {
      id: 4,
      student: { id: '2020004', name: 'Pham Thi D' },
      semester: 'Fall 2023',
      program: 'Business Administration',
      subject: 'Principles of Marketing',
      grade: 5.5,
      status: 'Failed',
      date: '2023-12-12',
      credits: 3,
    },
    {
      id: 5,
      student: { id: '2020005', name: 'Vo Van E' },
      semester: 'Spring 2024',
      program: 'Electrical Engineering',
      subject: 'Electric Circuits',
      grade: 9.0,
      status: 'Passed',
      date: '2024-05-20',
      credits: 4,
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setResults(mockResults);
      setFilteredResults(mockResults);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    let filtered = [...results];
    
    if (searchTerm) {
      filtered = filtered.filter(
        result => 
          result.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.student.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (semester) {
      filtered = filtered.filter(result => result.semester === semester);
    }
    
    if (program) {
      filtered = filtered.filter(result => result.program === program);
    }
    
    if (subject) {
      filtered = filtered.filter(result => result.subject === subject);
    }
    
    setFilteredResults(filtered);
  }, [searchTerm, semester, program, subject, results]);

  const handleExport = () => {
    console.log('Exporting results...');
    // Implement export functionality
  };

  const handlePrint = () => {
    console.log('Printing results...');
    // Implement print functionality
  };

  const getStatusColor = (status) => {
    return status === 'Passed' ? 'success' : 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Academic Results
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search by Name or ID"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select
                value={semester}
                label="Semester"
                onChange={(e) => setSemester(e.target.value)}
              >
                <MenuItem value="">All Semesters</MenuItem>
                {mockSemesters.map((sem) => (
                  <MenuItem key={sem.id} value={sem.name}>{sem.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Program</InputLabel>
              <Select
                value={program}
                label="Program"
                onChange={(e) => setProgram(e.target.value)}
              >
                <MenuItem value="">All Programs</MenuItem>
                {mockPrograms.map((prog) => (
                  <MenuItem key={prog.id} value={prog.name}>{prog.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={subject}
                label="Subject"
                onChange={(e) => setSubject(e.target.value)}
              >
                <MenuItem value="">All Subjects</MenuItem>
                {mockSubjects.map((subj) => (
                  <MenuItem key={subj.id} value={subj.name}>{subj.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          sx={{ mr: 1 }}
        >
          Export
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student ID</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Program</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell align="center">Credits</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">No results found</TableCell>
              </TableRow>
            ) : (
              filteredResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.student.id}</TableCell>
                  <TableCell>{result.student.name}</TableCell>
                  <TableCell>{result.semester}</TableCell>
                  <TableCell>{result.program}</TableCell>
                  <TableCell>{result.subject}</TableCell>
                  <TableCell align="center">{result.credits}</TableCell>
                  <TableCell align="center">{result.grade.toFixed(1)}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={result.status} 
                      color={getStatusColor(result.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">{result.date}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AcademicResults; 