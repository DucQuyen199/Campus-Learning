/*-----------------------------------------------------------------
* File: AcademicResults.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
  Alert,
  TablePagination
} from '@mui/material';
import { 
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5011/api';

const AcademicResults = () => {
// eslint-disable-next-line no-unused-vars
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentId, setStudentId] = useState('');
  const [semester, setSemester] = useState('');
  const [program, setProgram] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
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
        if (studentId) params.append('studentId', studentId);
        if (semester) params.append('semesterId', semester);
        if (program) params.append('programId', program);
        if (subject) params.append('subjectId', subject);

        const response = await axios.get(`${API_BASE_URL}/academic/academic-results`, { params });
        if (response.data.success) {
          const data = response.data.data || [];
          console.log('Academic results:', data);
          setResults(data);
          setFilteredResults(data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch academic results');
        }
      } catch (err) {
        console.error('Error fetching academic results:', err);
        setError('Không thể tải dữ liệu kết quả học tập');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchTerm, studentId, semester, program, subject]);

  const handleExport = () => {
    console.log('Exporting results...');
    // Implement export functionality - convert results to CSV or Excel
    const csvContent = generateCsv(filteredResults);
    downloadCsv(csvContent, 'academic-results.csv');
  };

  // CSV generation helper
  const generateCsv = (data) => {
    const headers = [
      'Mã SV', 'Họ Tên', 'Học Kỳ', 'Chương Trình', 
      'Môn Học', 'Mã Môn', 'Số Tín Chỉ', 'Điểm TB', 
      'Điểm Chữ', 'Trạng Thái', 'Ngày Cập Nhật'
    ];
    
    const rows = data.map(item => [
      item.StudentCode || '',
      item.StudentName || '',
      item.SemesterName || item.Semester || '',
      item.ProgramName || item.Program || '',
      item.SubjectName || item.Subject || '',
      item.SubjectCode || '',
      item.Credits || '',
      item.TotalScore || item.Grade || '',
      item.LetterGrade || '',
      item.IsPassed ? 'Đạt' : 'Không Đạt',
      formatDate(item.UpdatedAt || item.Date || '')
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(value => `"${value}"`).join(','))
      .join('\n');
  };
  
  // Download CSV helper
  const downloadCsv = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    console.log('Printing results...');
    window.print();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

// eslint-disable-next-line no-unused-vars
  const getStatusColor = (status) => {
    return status === 'Passed' ? 'success' : 'error';
  };

// eslint-disable-next-line no-unused-vars
  const translateStatus = (status) => {
    return status === 'Passed' ? 'Đạt' : 'Không đạt';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Format grade to always show one decimal place
  const formatGrade = (grade) => {
    if (grade === null || grade === undefined) return '-';
    return parseFloat(grade).toFixed(1);
  };

  // Get paginated data
  const paginatedResults = filteredResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleReset = () => {
    setSearchTerm('');
    setStudentId('');
    setSemester('');
    setProgram('');
    setSubject('');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Kết Quả Học Tập
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              label="Tìm kiếm theo tên"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              label="Mã sinh viên"
              variant="outlined"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={semester}
                label="Học kỳ"
                onChange={(e) => setSemester(e.target.value)}
              >
                <MenuItem key="all-semesters" value="">Tất cả học kỳ</MenuItem>
                {semesters.map((sem) => (
                  <MenuItem key={sem.SemesterID || `semester-${sem.id}`} value={sem.SemesterID || sem.id}>
                    {sem.SemesterName || sem.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth>
              <InputLabel>Chương trình</InputLabel>
              <Select
                value={program}
                label="Chương trình"
                onChange={(e) => setProgram(e.target.value)}
              >
                <MenuItem key="all-programs" value="">Tất cả chương trình</MenuItem>
                {programs.map((prog) => (
                  <MenuItem key={prog.ProgramID || prog.id || `program-${prog.name}`} value={prog.ProgramID || prog.id}>
                    {prog.ProgramName || prog.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth>
              <InputLabel>Môn học</InputLabel>
              <Select
                value={subject}
                label="Môn học"
                onChange={(e) => setSubject(e.target.value)}
              >
                <MenuItem key="all-subjects" value="">Tất cả môn học</MenuItem>
                {subjects.map((subj) => (
                  <MenuItem key={subj.SubjectID || subj.id || `subject-${subj.name}`} value={subj.SubjectID || subj.id}>
                    {subj.SubjectName || subj.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleReset}
            sx={{ mr: 1 }}
          >
            Đặt lại bộ lọc
          </Button>
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
      </Paper>
      
      {error && (
        <Box sx={{ textAlign: 'center', my: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
              <TableCell>Mã SV</TableCell>
              <TableCell>Họ tên</TableCell>
              <TableCell>Học kỳ</TableCell>
              <TableCell>Chương trình</TableCell>
              <TableCell>Môn học</TableCell>
              <TableCell align="center">Số tín chỉ</TableCell>
              <TableCell align="center">Điểm TB</TableCell>
              <TableCell align="center">Điểm chữ</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Ngày cập nhật</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : paginatedResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">Không tìm thấy kết quả</TableCell>
              </TableRow>
            ) : (
              paginatedResults.map((result) => (
                <TableRow key={result.ResultID || `result-${result.StudentID || result.UserID}-${result.SubjectID}`}>
                  <TableCell>{result.StudentCode}</TableCell>
                  <TableCell>{result.StudentName || result.FullName}</TableCell>
                  <TableCell>
                    {result.SemesterName || result.Semester}
                    {result.AcademicYear && <Typography variant="caption" display="block" color="text.secondary">
                      {result.AcademicYear}
                    </Typography>}
                  </TableCell>
                  <TableCell>{result.ProgramName || result.Program}</TableCell>
                  <TableCell>
                    <Typography fontWeight="medium">
                      {result.SubjectName || result.Subject}
                    </Typography>
                    {result.SubjectCode && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {result.SubjectCode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'medium' }}>
                    {result.Credits}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'medium' }}>
                    {formatGrade(result.TotalScore || result.Grade)}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'medium' }}>
                    {result.LetterGrade || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={result.IsPassed ? 'Đạt' : 'Không đạt'} 
                      color={result.IsPassed ? 'success' : 'error'} 
                      size="small" 
                      sx={{ fontWeight: 'medium' }}
                    />
                  </TableCell>
                  <TableCell align="center">{formatDate(result.UpdatedAt || result.Date)}</TableCell>
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
        <TablePagination
          component="div"
          count={filteredResults.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Hiển thị:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </TableContainer>
    </Box>
  );
};

export default AcademicResults; 
