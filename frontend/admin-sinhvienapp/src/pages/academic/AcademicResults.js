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
  CircularProgress,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import axios from 'axios';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5011/api';

const AcademicResults = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [semester, setSemester] = useState('');
  const [program, setProgram] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for dropdown options
  const [semesters, setSemesters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Fetch semesters for dropdown
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/academic/semesters`);
        if (response.data.success) {
          setSemesters(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching semesters:', err);
        setError('Không thể tải dữ liệu học kỳ');
      }
    };

    fetchSemesters();
  }, []);

  // Fetch programs for dropdown
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/academic/programs-list`);
        if (response.data.success) {
          setPrograms(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Không thể tải dữ liệu chương trình đào tạo');
      }
    };

    fetchPrograms();
  }, []);

  // Fetch subjects for dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/academic/subjects-list`);
        if (response.data.success) {
          setSubjects(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Không thể tải dữ liệu môn học');
      }
    };

    fetchSubjects();
  }, []);

  // Fetch academic results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build query params
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (semester) params.append('semester', semester);
        if (program) params.append('program', program);
        if (subject) params.append('subject', subject);

        const response = await axios.get(`${API_BASE_URL}/academic/academic-results`, { params });
        if (response.data.success) {
          setResults(response.data.data);
          setFilteredResults(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching academic results:', err);
        setError('Không thể tải dữ liệu kết quả học tập');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchTerm, semester, program, subject]);

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

  const translateStatus = (status) => {
    return status === 'Passed' ? 'Đạt' : 'Không đạt';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Kết Quả Học Tập
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Tìm kiếm theo tên hoặc mã SV"
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
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={semester}
                label="Học kỳ"
                onChange={(e) => setSemester(e.target.value)}
              >
                <MenuItem key="all-semesters" value="">Tất cả học kỳ</MenuItem>
                {semesters.map((sem) => (
                  <MenuItem key={sem.id} value={sem.name}>{sem.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Chương trình</InputLabel>
              <Select
                value={program}
                label="Chương trình"
                onChange={(e) => setProgram(e.target.value)}
              >
                <MenuItem key="all-programs" value="">Tất cả chương trình</MenuItem>
                {programs.map((prog) => (
                  <MenuItem key={prog.id} value={prog.name}>{prog.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Môn học</InputLabel>
              <Select
                value={subject}
                label="Môn học"
                onChange={(e) => setSubject(e.target.value)}
              >
                <MenuItem key="all-subjects" value="">Tất cả môn học</MenuItem>
                {subjects.map((subj) => (
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
          Xuất file
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          In
        </Button>
      </Box>
      
      {error && (
        <Box sx={{ textAlign: 'center', my: 3 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã SV</TableCell>
              <TableCell>Họ tên</TableCell>
              <TableCell>Học kỳ</TableCell>
              <TableCell>Chương trình</TableCell>
              <TableCell>Môn học</TableCell>
              <TableCell align="center">Số tín chỉ</TableCell>
              <TableCell align="center">Điểm</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Ngày cập nhật</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">Không tìm thấy kết quả</TableCell>
              </TableRow>
            ) : (
              filteredResults.map((result) => (
                <TableRow key={result.ResultID}>
                  <TableCell>{result.StudentID}</TableCell>
                  <TableCell>{result.StudentName}</TableCell>
                  <TableCell>{result.Semester}</TableCell>
                  <TableCell>{result.Program}</TableCell>
                  <TableCell>{result.Subject}</TableCell>
                  <TableCell align="center">{result.Credits}</TableCell>
                  <TableCell align="center">{parseFloat(result.Grade).toFixed(1)}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={translateStatus(result.Status)} 
                      color={getStatusColor(result.Status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">{formatDate(result.Date)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem chi tiết">
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