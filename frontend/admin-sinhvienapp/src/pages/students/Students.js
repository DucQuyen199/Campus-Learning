import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, IconButton, Chip, Alert, Snackbar,
  Divider, Paper, List, ListItem, ListItemText, Tooltip, Avatar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Search, Edit, Delete, Visibility, Person, FilterAlt, Close } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// API URL from environment or default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5011/api';

const Students = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAllEnabled, setShowAllEnabled] = useState(true);
  const [allStudentsLoaded, setAllStudentsLoaded] = useState(false); // Track if all students are loaded

  // Check if we were navigated here from AddStudent with a newly created student
  useEffect(() => {
    if (location.state?.refresh) {
      // Set message from navigation state
      setError(location.state.message || 'Sinh viên đã được thêm thành công!');
      setOpenSnackbar(true);
      
      // If we have a newly created student details, add it to the list
      if (location.state.newStudent) {
        // Select the newly created student to show details
        setSelectedStudent(location.state.newStudent);
        
        // Add the student to the list if not already present
        const newStudentId = location.state.newStudent.UserID || location.state.newStudent.id;
        if (newStudentId && !students.some(s => s.id === newStudentId)) {
          const formattedStudent = {
            id: newStudentId,
            studentId: newStudentId,
            fullName: location.state.newStudent.FullName || `${location.state.newStudent.firstName || ''} ${location.state.newStudent.lastName || ''}`,
            email: location.state.newStudent.Email || location.state.newStudent.email,
            program: location.state.newStudent.ProgramName || 'N/A',
            school: location.state.newStudent.School || 'N/A',
            status: location.state.newStudent.AccountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
            fullDetails: location.state.newStudent
          };
          
          setStudents(prevStudents => [formattedStudent, ...prevStudents]);
          setTotalCount(prevCount => prevCount + 1);
        }
      } else {
        // If we don't have the student details but need to refresh, reload the data
        fetchStudents(0, pageSize, '', true);
      }
      
      // Clear the navigation state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchStudents = async (page = 0, size = 100, search = '', prioritizeId = false) => {
    setLoading(true);
    if (search.trim() === '') {
      // Don't reset selected student if we're just doing a page change
      setSelectedStudent(null);
    }
    
    try {
      // For exact ID searches, use standard endpoint
      if (/^\d+$/.test(search.trim())) {
        const params = {
          exactUserId: search.trim(),
          role: 'STUDENT' // Ensure we only get students
        };
        
        console.log('Fetching student by exact ID:', params);
        
        const response = await axios.get(`${API_URL}/students`, {
          params: params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          processStudentData(response.data.data, search, params);
        } else {
          setError('No student found with this ID');
          setOpenSnackbar(true);
          setStudents([]);
          setTotalCount(0);
        }
        setLoading(false);
        return;
      }
      
      // For text searches, use standard endpoint
      if (search.trim() !== '') {
        const params = {
          search: search,
          searchFields: 'UserID,FullName,Email,School,StudentCode,Program,PhoneNumber,Class', // Expanded fields
          role: 'STUDENT', // Ensure we only get students
          fuzzyMatch: true // Enable fuzzy matching for better search results
        };
        
        console.log('Fetching with search params:', params);
        
        const response = await axios.get(`${API_URL}/students`, {
          params: params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          processStudentData(response.data.data, search, params);
        } else {
          setError(response.data.message || 'Error fetching students');
          setOpenSnackbar(true);
          setStudents([]);
          setTotalCount(0);
        }
        setLoading(false);
        return;
      }
      
      // If we're not searching and need all students, use direct endpoint first
      if (!search && !allStudentsLoaded) {
        try {
          console.log('Attempting to load all students using direct endpoint');
          const directResponse = await axios.get(`${API_URL}/students/all`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            timeout: 120000 // 2 minute timeout for large dataset
          });
          
          if (directResponse.data.success && Array.isArray(directResponse.data.data) && directResponse.data.data.length > 20) {
            console.log(`Direct API successful, loaded ${directResponse.data.data.length} students`);
            processStudentData(directResponse.data.data, search, {});
            return;
          }
        } catch (directError) {
          console.error('Direct endpoint failed in fetchStudents, trying alternative endpoint:', directError.message);
          
          try {
            console.log('Attempting to load all students using alternative endpoint');
            const altResponse = await axios.get(`${API_URL}/students/users/all`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              timeout: 120000
            });
            
            if (altResponse.data.success && Array.isArray(altResponse.data.data) && altResponse.data.data.length > 20) {
              console.log(`Alternative endpoint successful, loaded ${altResponse.data.data.length} students`);
              processStudentData(altResponse.data.data, search, {});
              return;
            }
          } catch (altError) {
            console.error('Alternative endpoint also failed in fetchStudents, using standard approach:', altError.message);
          }
        }
      }
      
      // Standard approach with optimized params if direct approach failed
      const params = {
        all: true,
        role: 'STUDENT',
        noLimit: true,
        pageSize: 10000,
        skipPagination: true,
        returnFullData: true,
        directSql: true,
        selectAll: true,
        timestamp: Date.now() // Add timestamp to avoid caching issues
      };
      
      console.log('Fetching with params:', params);
      
      const response = await axios.get(`${API_URL}/students`, {
        params: params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 60000 // Increase timeout to 60 seconds for large datasets
      });
      
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Extract and process student data
        processStudentData(response.data.data, search, params);
      } else {
        console.error('API returned success: false', response.data);
        setStudents([]);
        setTotalCount(0);
        setError(response.data.message || 'Error fetching students');
        setOpenSnackbar(true);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
      setTotalCount(0);
      setError(err.message || 'Failed to load students data');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to process student data from API
  const processStudentData = (data, search, params) => {
    // Extract students data based on response structure
    let studentsData = [];
    if (Array.isArray(data)) {
      studentsData = data;
    } else if (data && Array.isArray(data.students)) {
      studentsData = data.students;
    } else if (data && typeof data === 'object') {
      // Try to extract students if they're in a nested structure
      const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
        // Use the largest array found (likely the students list)
        studentsData = possibleArrays.reduce((a, b) => a.length > b.length ? a : b, []);
      }
    }
    
    // If we got a small number of students but this wasn't a specific search, try pagination approach
    if (studentsData.length <= 20 && !search && !allStudentsLoaded) {
      console.log(`Initial fetch returned only ${studentsData.length} students, trying pagination approach...`);
      
      // Indicate we're still loading while we try the pagination approach
      setLoading(true);
      
      // Use the existing pagination approach
      doPaginationFetch(studentsData);
      return;
    }
    
    // Ensure uniqueness of students by UserID
    const uniqueStudentMap = new Map();
    studentsData.forEach(student => {
      uniqueStudentMap.set(student.UserID, student);
    });
    
    // Convert back to array
    const uniqueStudentsData = Array.from(uniqueStudentMap.values());
    
    console.log(`After processing: ${uniqueStudentsData.length} unique students`);
    
    // Map data to match our component needs
    const formattedData = uniqueStudentsData.map(student => ({
      id: student.UserID,
      studentId: student.UserID,
      fullName: student.FullName,
      email: student.Email,
      program: student.ProgramName || 'N/A', 
      school: student.School || 'N/A',
      status: student.AccountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
      fullDetails: student
    }));
    
    setStudents(formattedData);
    setTotalCount(formattedData.length);
    
    // Only set allStudentsLoaded to true if this wasn't a search and we got a decent number of students
    if (!search && formattedData.length > 20) {
      setAllStudentsLoaded(true);
      setError(`Đã tải ${formattedData.length} sinh viên từ cơ sở dữ liệu thành công.`);
      setOpenSnackbar(true);
    } else if (search) {
      if (formattedData.length === 1) {
        setSelectedStudent(formattedData[0].fullDetails);
      }
    }
  };
  
  // Pagination fetch approach
  const doPaginationFetch = async (initialData = []) => {
    const batchSize = 100;
    const totalRecords = 5000; // Assume large number for pagination
    const totalPages = Math.ceil(totalRecords / batchSize);
    
    console.log(`Attempting to fetch students in ${totalPages} batches of ${batchSize}...`);
    
    let allStudents = [...initialData]; // Start with what we have
    const seenIds = new Set(initialData.map(student => student.UserID));
    
    // Batch requests with Promise.all for better performance
    const batchPromises = [];
    
    // Create batch requests (limit to 10 concurrent requests)
    for (let currentPage = 0; currentPage < Math.min(50, totalPages); currentPage++) {
      batchPromises.push(
        axios.get(`${API_URL}/students`, {
          params: {
            role: 'STUDENT',
            page: currentPage,
            pageSize: batchSize,
            skipCache: true,
            timestamp: Date.now() + currentPage // Add timestamp to avoid caching
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 30000
        }).catch(error => {
          console.error(`Error fetching batch ${currentPage}:`, error);
          return { data: { success: false } }; // Return a failed response object to avoid breaking Promise.all
        })
      );
    }
    
    // Process batches in chunks to avoid overwhelming the browser
    const chunkSize = 5;
    let uniqueCount = 0;
    
    for (let i = 0; i < batchPromises.length; i += chunkSize) {
      const chunkPromises = batchPromises.slice(i, i + chunkSize);
      const responses = await Promise.all(chunkPromises);
      
      for (let j = 0; j < responses.length; j++) {
        const response = responses[j];
        const currentPage = i + j;
        
        if (response.data?.success) {
          let batchData = [];
          
          if (Array.isArray(response.data.data)) {
            batchData = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data.students)) {
            batchData = response.data.data.students;
          }
          
          // Filter out duplicates
          const uniqueBatchData = batchData.filter(student => {
            if (!student.UserID || seenIds.has(student.UserID)) {
              return false;
            }
            seenIds.add(student.UserID);
            return true;
          });
          
          uniqueCount += uniqueBatchData.length;
          
          if (uniqueBatchData.length > 0) {
            allStudents = [...allStudents, ...uniqueBatchData];
            console.log(`Batch ${currentPage + 1} added ${uniqueBatchData.length} unique students. Total: ${allStudents.length}`);
          } else {
            console.log(`Batch ${currentPage + 1} returned no new unique students.`);
          }
        }
      }
      
      // If we've processed 5 batches and found no new students, we can stop
      if (uniqueCount === 0 && i >= 5 * chunkSize) {
        console.log('Stopping batch processing as no new students found in multiple batches');
        break;
      }
    }
    
    if (allStudents.length > initialData.length) {
      console.log(`Pagination approach successful, got ${allStudents.length} unique students vs original ${initialData.length}`);
      processStudentData(allStudents, '', {});
    } else {
      processStudentData(initialData, '', {});
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    const loadAllStudents = async () => {
      try {
        setLoading(true);
        console.log('Loading ALL students from database in a single query...');
        
        // First try the direct /all endpoint
        try {
          console.log('Using direct /students/all endpoint for efficient data loading');
          const response = await axios.get(`${API_URL}/students/all`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            timeout: 120000 // 2 minute timeout for large dataset
          });
          
          if (response.data.success && Array.isArray(response.data.data)) {
            const studentsData = response.data.data;
            console.log(`Direct endpoint successful, loaded ${studentsData.length} students`);
            
            // Map data to our component format
            const formattedData = studentsData.map(student => ({
              id: student.UserID,
              studentId: student.UserID,
              fullName: student.FullName,
              email: student.Email,
              program: student.ProgramName || 'N/A',
              school: student.School || 'N/A',
              status: student.AccountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
              fullDetails: student
            }));
            
            setStudents(formattedData);
            setTotalCount(formattedData.length);
            setAllStudentsLoaded(true);
            
            // Show success message
            setError(`Đã tải ${formattedData.length} sinh viên từ cơ sở dữ liệu thành công.`);
            setOpenSnackbar(true);
            setLoading(false);
            return;
          }
        } catch (directError) {
          console.error('Direct endpoint failed, trying alternative endpoint:', directError);
          
          // Try the alternative endpoint
          try {
            console.log('Using alternative /students/users/all endpoint');
            const altResponse = await axios.get(`${API_URL}/students/users/all`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              timeout: 120000
            });
            
            if (altResponse.data.success && Array.isArray(altResponse.data.data)) {
              const studentsData = altResponse.data.data;
              console.log(`Alternative endpoint successful, loaded ${studentsData.length} students`);
              
              // Map data to our component format
              const formattedData = studentsData.map(student => ({
                id: student.UserID,
                studentId: student.UserID,
                fullName: student.FullName,
                email: student.Email,
                program: 'N/A', // Basic user data might not have program info
                school: student.School || 'N/A',
                status: student.AccountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
                fullDetails: student
              }));
              
              setStudents(formattedData);
              setTotalCount(formattedData.length);
              setAllStudentsLoaded(true);
              
              // Show success message
              setError(`Đã tải ${formattedData.length} sinh viên từ cơ sở dữ liệu thành công.`);
              setOpenSnackbar(true);
              setLoading(false);
              return;
            }
          } catch (altError) {
            console.error('Alternative endpoint also failed, falling back to standard approach:', altError);
            // Continue with standard approach
          }
        }
        
        // Fall back to optimized parameters approach
        const response = await axios.get(`${API_URL}/students`, {
          params: {
            all: true,
            role: 'STUDENT',
            noLimit: true,
            pageSize: 10000,
            skipPagination: true,
            returnFullData: true,
            directSql: true,
            selectAll: true,
            timestamp: Date.now() // Prevent caching
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 120000 // Increased timeout for larger datasets (2 minutes)
        });
        
        if (response.data.success) {
          // Extract students data based on response structure
          let studentsData = [];
          if (Array.isArray(response.data.data)) {
            studentsData = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data.students)) {
            studentsData = response.data.data.students;
          } else if (response.data.data && typeof response.data.data === 'object') {
            // Try to extract students if they're in a nested structure
            const possibleArrays = Object.values(response.data.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              // Use the largest array found (likely the students list)
              studentsData = possibleArrays.reduce((a, b) => a.length > b.length ? a : b, []);
            }
          }
          
          console.log(`Initial data loaded: ${studentsData.length} students`);
          
          // If we got too few students, try our fallback pagination approach
          if (studentsData.length <= 20) {
            console.log('Initial load returned too few students. Proceeding with pagination approach...');
            fetchStudents(0, 5000, '', false);
            return;
          }
          
          // Process the data we got
          const uniqueStudentMap = new Map();
          studentsData.forEach(student => {
            uniqueStudentMap.set(student.UserID, student);
          });
          
          const uniqueStudentsData = Array.from(uniqueStudentMap.values());
          
          console.log(`Loaded ${uniqueStudentsData.length} unique students from database`);
          
          // Map data to our component format
          const formattedData = uniqueStudentsData.map(student => ({
            id: student.UserID,
            studentId: student.UserID,
            fullName: student.FullName,
            email: student.Email,
            program: student.ProgramName || 'N/A',
            school: student.School || 'N/A',
            status: student.AccountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
            fullDetails: student
          }));
          
          setStudents(formattedData);
          setTotalCount(formattedData.length);
          setAllStudentsLoaded(true);
          
          // Show success message
          setError(`Đã tải ${formattedData.length} sinh viên từ cơ sở dữ liệu thành công.`);
          setOpenSnackbar(true);
        } else {
          console.error('API returned success: false', response.data);
          setError(response.data.message || 'Không thể tải danh sách sinh viên');
          setOpenSnackbar(true);
          // Fall back to pagination approach
          fetchStudents(0, 5000, '', false);
        }
      } catch (err) {
        console.error('Failed to fetch students:', err);
        setError(err.message || 'Lỗi khi tải dữ liệu sinh viên');
        setOpenSnackbar(true);
        // Fall back to pagination approach
        fetchStudents(0, 5000, '', false);
      } finally {
        setLoading(false);
      }
    };

    loadAllStudents();
  }, []);

  const handlePageChange = (newPage) => {
    console.log('Page changed to:', newPage);
    setPage(newPage);
    // We don't need to fetch data again since we have all data loaded and use client-side pagination
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log('Page size changed to:', newPageSize);
    setPageSize(newPageSize);
    setPage(0); // Reset to first page when changing page size
    // We don't need to fetch data again since we have all data loaded
  };

  // Add debounce function
  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      if (value.trim().length > 0) {
        fetchStudents(0, pageSize, value, true);
        setPage(0);
      }
    }, 500),
    [pageSize]
  );

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // Trigger search automatically after typing
    if (value.trim().length > 2) {
      debouncedSearch(value);
    } else if (value.trim().length === 0) {
      // If search is cleared, reset to show all students
      if (allStudentsLoaded) {
        setSelectedStudent(null);
      } else {
        fetchStudents(0, pageSize, "", false);
      }
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    // When submitting a search, perform the search regardless of length
    if (searchTerm.trim().length > 0) {
      fetchStudents(0, pageSize, searchTerm, true);
      setPage(0); // Reset to first page when searching
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
      try {
        const response = await axios.delete(`${API_URL}/students/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          // Refresh the list
          fetchStudents(page, pageSize, searchTerm);
          setError("Xóa sinh viên thành công");
          setOpenSnackbar(true);
        } else {
          throw new Error(response.data.message || 'Failed to delete student');
        }
      } catch (err) {
        console.error('Error deleting student:', err);
        setError(err.message || 'Failed to delete student');
        setOpenSnackbar(true);
      }
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student.fullDetails);
  };

  const columns = [
    { 
      field: 'studentId', 
      headerName: 'Mã SV (UserID)', 
      minWidth: 120, 
      flex: 0.5,
      renderHeader: (params) => (
        <Tooltip title="UserID là mã số sinh viên trong hệ thống">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span>Mã SV (UserID)</span>
          </Box>
        </Tooltip>
      ),
      // Make the cell clickable to select the student
      renderCell: (params) => (
        <Box
          sx={{
            cursor: 'pointer',
            fontWeight: 'bold',
            color: 'primary.main',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleViewStudent(params.row);
          }}
        >
          {params.value}
        </Box>
      )
    },
    { 
      field: 'fullName', 
      headerName: 'Họ và tên', 
      minWidth: 180, 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontWeight: searchTerm && params.value.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bold' : 'normal'
        }}>
          <Avatar 
            src={params.row.fullDetails?.Avatar} 
            sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}
          >
            {params.value?.charAt(0)}
          </Avatar>
          <span>{params.value}</span>
        </Box>
      )
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      minWidth: 200, 
      flex: 1.2,
      renderCell: (params) => (
        <Box sx={{ 
          fontWeight: searchTerm && params.value.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bold' : 'normal'
        }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'school', 
      headerName: 'Trường học', 
      minWidth: 180, 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          fontWeight: searchTerm && params.value.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bold' : 'normal'
        }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'program', 
      headerName: 'Chương trình', 
      minWidth: 180, 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          fontWeight: searchTerm && params.value.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bold' : 'normal'
        }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'Active' ? 'success' : 'default'} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      minWidth: 150,
      flex: 0.7,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ ml: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => handleViewStudent(params.row)}
            title="Xem chi tiết"
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => navigate(`/students/edit/${params.row.id}`)}
            title="Chỉnh sửa"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => handleDeleteStudent(params.row.id)}
            title="Xóa"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // Component to display student details
  const StudentDetailView = ({ student }) => {
    if (!student) return null;
    
    return (
      <Card sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Person sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="div">
              Chi tiết sinh viên (Mã SV: {student.UserID})
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Thông tin cơ bản
                </Typography>
                <List disablePadding>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Họ và tên" 
                      secondary={student.FullName} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span', fontWeight: 'bold' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="UserID (Mã Sinh Viên)" 
                      secondary={student.UserID} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span', fontWeight: 'bold' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Email" 
                      secondary={student.Email} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Điện thoại" 
                      secondary={student.PhoneNumber || 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Ngày sinh" 
                      secondary={student.DateOfBirth ? new Date(student.DateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Thông tin học tập
                </Typography>
                <List disablePadding>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Trường học" 
                      secondary={student.School || 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Chương trình" 
                      secondary={student.ProgramName || 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Lớp" 
                      secondary={student.Class || 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Học kỳ hiện tại" 
                      secondary={student.CurrentSemester || 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Tình trạng học tập" 
                      secondary={student.AcademicStatus || 'Regular'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Thông tin bổ sung
                </Typography>
                <List disablePadding>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Địa chỉ" 
                      secondary={student.Address ? `${student.Address}, ${student.City || ''}, ${student.Country || ''}` : 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="CMND/CCCD" 
                      secondary={student.IdentityCardNumber || 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Trạng thái tài khoản" 
                      secondary={
                        <Box component="span">
                          <Chip 
                            label={student.AccountStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'} 
                            color={student.AccountStatus === 'ACTIVE' ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      } 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Ngày tạo" 
                      secondary={student.CreatedAt ? new Date(student.CreatedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Cập nhật lần cuối" 
                      secondary={student.UpdatedAt ? new Date(student.UpdatedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} 
                      primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Additional details section */}
          {student.Bio && (
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Giới thiệu
              </Typography>
              <Typography variant="body2">
                {student.Bio}
              </Typography>
            </Paper>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              startIcon={<Edit />} 
              onClick={() => navigate(`/students/edit/${student.UserID}`)}
              sx={{ mr: 1 }}
            >
              Chỉnh sửa
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Visibility />} 
              onClick={() => navigate(`/students/${student.UserID}`)}
            >
              Xem chi tiết
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={error && error.includes('thành công') ? "success" : "error"} 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Show loading alert when data is being fetched */}
      {loading && students.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Đang tải dữ liệu sinh viên từ cơ sở dữ liệu, vui lòng đợi...
        </Alert>
      )}

      {/* Show success message when students are loaded */}
      {!loading && students.length > 0 && !error && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Đã tải {students.length} sinh viên từ cơ sở dữ liệu
        </Alert>
      )}
      
      {/* Show warning if we only got a few students */}
      {!loading && students.length > 0 && students.length <= 20 && !error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Chỉ hiển thị {students.length} sinh viên. Hệ thống có thể đang giới hạn kết quả. Vui lòng sử dụng tính năng tìm kiếm.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="div">
          Quản lý sinh viên
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => navigate('/students/add')}
        >
          Thêm sinh viên
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={9}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Tìm kiếm theo tên, mã SV, email, lớp, chương trình học..."
                  value={searchTerm}
                  onChange={handleSearch}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      height: '48px'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSearchTerm('');
                            if (allStudentsLoaded) {
                              // Just clear the selection if all students are already loaded
                              setSelectedStudent(null);
                            } else {
                              // Reload all students if not loaded
                              fetchStudents(0, pageSize, '', false);
                            }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth
                  sx={{ 
                    height: '48px',
                    borderRadius: '4px'
                  }}
                >
                  Tìm kiếm
                </Button>
              </Grid>
            </Grid>
            {searchTerm && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Nhập ít nhất 3 ký tự để tìm kiếm tự động. Ấn Enter hoặc nút Tìm kiếm để tìm ngay lập tức.
                  {searchTerm.length === 1 || searchTerm.length === 2 ? 
                    ' Cần nhập thêm ' + (3 - searchTerm.length) + ' ký tự nữa để bắt đầu tìm kiếm.' : ''}
                </Typography>
              </Box>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Display search results info */}
      {searchTerm && students.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tìm thấy {students.length} sinh viên phù hợp với từ khóa "{searchTerm}"
        </Alert>
      )}

      {searchTerm && students.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Không tìm thấy sinh viên nào phù hợp với từ khóa "{searchTerm}". Vui lòng thử từ khóa khác.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterAlt sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">
                Danh sách sinh viên
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {students.length} sinh viên ({loading ? 'đang tải...' : 'đã tải xong'})
            </Typography>
          </Box>
          <Box sx={{ height: 'calc(100vh - 320px)' }}>
            <DataGrid
              rows={students}
              columns={columns}
              pagination
              page={page}
              pageSize={pageSize}
              rowCount={totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              rowsPerPageOptions={[10, 25, 50, 100, 500]}
              loading={loading}
              paginationMode="client"
              disableSelectionOnClick
              onRowClick={(params) => handleViewStudent(params.row)}
              initialState={{
                pagination: {
                  pageSize: 100,
                },
              }}
              autoHeight={false}
              density="standard"
              sx={{
                '& .MuiDataGrid-main': { width: '100%' },
                '& .MuiDataGrid-cell': { px: 2 },
                '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' },
                boxShadow: 1,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                '& .MuiDataGrid-virtualScroller': {
                  overflowY: 'auto'
                },
                // Add hover effect to rows
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  cursor: 'pointer'
                }
              }}
              componentsProps={{
                pagination: {
                  labelRowsPerPage: 'Số hàng mỗi trang:',
                  labelDisplayedRows: ({ from, to, count }) => 
                    `${from}–${to} của ${count !== -1 ? count : `hơn ${to}`}`
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
      
      {/* Student Information Section */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Thông tin chi tiết sinh viên
        </Typography>
        <Divider />
      </Box>

      {/* Display either the selected student or a message to select a student */}
      {selectedStudent ? (
        <StudentDetailView student={selectedStudent} />
      ) : (
        <Paper 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Person sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.7 }} />
          </Box>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Chọn một sinh viên từ danh sách bên trên để xem thông tin chi tiết
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hoặc tìm kiếm thông tin bằng thanh tìm kiếm ở trên
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Students; 