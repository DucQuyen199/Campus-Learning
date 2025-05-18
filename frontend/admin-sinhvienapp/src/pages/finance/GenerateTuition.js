import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import {
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';

// Import API services
import { tuitionService, academicService } from '../../services/api';

// Define steps
const steps = ['Chọn thông số', 'Lựa chọn sinh viên', 'Cấu hình tùy chọn', 'Xác nhận và hoàn tất'];

const GenerateTuition = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // State for API data
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    academicYear: '',
    semester: '',
    semesterId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days from now
    programs: [],
    amountPerCredit: 850000,
    applyDiscount: false,
    discountPercentage: 0,
    notifyStudents: true,
    paymentDeadline: 14, // days
    latePaymentFee: 5, // percentage
    includePreviousBalance: true
  });
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentError, setStudentError] = useState(null);

  // Load initial data (programs, semesters)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setDataLoading(true);
        
        // Fetch programs
        const programsResponse = await tuitionService.getTuitionPrograms();
        if (programsResponse.success && programsResponse.data) {
          setPrograms(programsResponse.data);
        }
        
        // Fetch semesters
        const semestersResponse = await academicService.getAllSemesters();
        console.log('Semesters response:', semestersResponse);
        
        if (semestersResponse.success && semestersResponse.data) {
          const semestersData = semestersResponse.data;
          setSemesters(semestersData);
          
          // Extract unique academic years from semesters
          const years = [...new Set(semestersData.map(sem => sem.AcademicYear))].sort().reverse();
          setAcademicYears(years);
          
          // Set default selections if we have semesters
          if (semestersData.length > 0) {
            // Find current semester or use the first one
            const currentSemester = semestersData.find(s => s.IsCurrent === true) || semestersData[0];
            console.log('Selected semester:', currentSemester);
            
            // Ensure we update semesterId as a number
            const semesterId = typeof currentSemester.SemesterID === 'string' 
              ? parseInt(currentSemester.SemesterID, 10) 
              : currentSemester.SemesterID;
            
            setFormData(prev => ({
              ...prev,
              academicYear: currentSemester.AcademicYear,
              semester: currentSemester.SemesterName,
              semesterId: semesterId
            }));
          }
        } else {
          console.error('Failed to load semesters:', semestersResponse.message);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch students when parameters change
  const fetchStudents = async () => {
    if (!formData.semesterId) return;
    
    try {
      setStudentsLoading(true);
      setStudentError(null);
      
      // Make sure we have a clean array of program IDs as strings
      const programsParam = formData.programs.length > 0 
        ? formData.programs.map(id => id.toString()).join(',') 
        : '';
      
      // Ensure semesterId is a number
      const semesterId = parseInt(formData.semesterId, 10);
      
      if (isNaN(semesterId)) {
        throw new Error("ID học kỳ không hợp lệ");
      }
      
      console.log('Fetching tuition students with params:', {
        semesterId,
        programIds: programsParam,
        hasPreviousBalance: false
      });
      
      const response = await tuitionService.getTuitionStudents({
        semesterId,
        programIds: programsParam,
        hasPreviousBalance: false
      });
      
      console.log('Student API response:', response);
      
      if (response.success) {
        setAllStudents(response.data || []);
        setFilteredStudents(response.data || []);
        setSelectedStudents([]);
        setSelectAll(false);
        
        // Show info message if no students found
        if (!response.data || response.data.length === 0) {
          setStudentError(response.message || 'Không có sinh viên nào phù hợp với tiêu chí đã chọn');
        }
      } else {
        setStudentError(response.message || 'Không thể tải danh sách sinh viên');
        // Reset data to prevent UI issues
        setAllStudents([]);
        setFilteredStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Extract the actual error message from the API response if available
      let errorMessage = 'Đã xảy ra lỗi không xác định';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setStudentError('Lỗi khi tải danh sách sinh viên: ' + errorMessage);
      
      // Reset state to prevent UI issues
      setAllStudents([]);
      setFilteredStudents([]);
      setSelectedStudents([]);
      setSelectAll(false);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Handle form data changes
  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // If semester changes, update semesterId
    if (name === 'semester') {
      const selectedSemester = semesters.find(s => s.SemesterName === value);
      if (selectedSemester) {
        // Parse semesterId as a number to avoid type issues
        const semesterId = typeof selectedSemester.SemesterID === 'string' 
          ? parseInt(selectedSemester.SemesterID, 10) 
          : selectedSemester.SemesterID;
          
        if (isNaN(semesterId)) {
          console.error('Invalid semester ID:', selectedSemester.SemesterID);
          return;
        }
          
        setFormData(prev => ({
          ...prev,
          semesterId: semesterId,
          academicYear: selectedSemester.AcademicYear
        }));
        
        console.log('Updated semester selection:', {
          name: selectedSemester.SemesterName,
          id: semesterId,
          academicYear: selectedSemester.AcademicYear
        });
      }
    }
  };
  
  // Handle academic year change - filter semesters by year
  const handleAcademicYearChange = (e) => {
    const year = e.target.value;
    setFormData(prev => ({ ...prev, academicYear: year }));
    
    // Find semesters in this year
    const yearSemesters = semesters.filter(s => s.AcademicYear === year);
    if (yearSemesters.length > 0) {
      const selectedSemester = yearSemesters[0];
      
      // Parse semesterId as a number to avoid type issues
      const semesterId = typeof selectedSemester.SemesterID === 'string' 
        ? parseInt(selectedSemester.SemesterID, 10) 
        : selectedSemester.SemesterID;
        
      if (isNaN(semesterId)) {
        console.error('Invalid semester ID:', selectedSemester.SemesterID);
        return;
      }
        
      setFormData(prev => ({
        ...prev,
        semester: selectedSemester.SemesterName,
        semesterId: semesterId
      }));
      
      console.log('Selected semester from year change:', {
        name: selectedSemester.SemesterName,
        id: semesterId,
        academicYear: year
      });
    }
  };

  // Handle program selection
  const handleProgramChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      programs: typeof value === 'string' ? value.split(',') : value,
    });
  };

  // Handle step actions
  const isStepOptional = (step) => {
    return step === 2;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    if (activeStep === 0) {
      // Fetch students based on selected parameters
      fetchStudents();
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      throw new Error("Bạn không thể bỏ qua bước không tùy chọn.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      academicYear: '',
      semester: '',
      semesterId: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      programs: [],
      amountPerCredit: 850000,
      applyDiscount: false,
      discountPercentage: 0,
      notifyStudents: true,
      paymentDeadline: 14,
      latePaymentFee: 5,
      includePreviousBalance: true
    });
    setSelectedStudents([]);
    setFilteredStudents([]);
    setSelectAll(false);
    setSearchTerm('');
  };

  // Handle student selection
  const handleSelectAllStudents = (event) => {
    if (event.target.checked) {
      setSelectedStudents(filteredStudents.map(student => student.UserID));
    } else {
      setSelectedStudents([]);
    }
    setSelectAll(event.target.checked);
  };

  const handleSelectStudent = (studentId) => {
    if (!studentId) {
      console.error('Attempted to select a student with undefined ID');
      return;
    }
    
    const selectedIndex = selectedStudents.indexOf(studentId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedStudents, studentId];
    } else {
      newSelected = selectedStudents.filter(id => id !== studentId);
    }

    setSelectedStudents(newSelected);
    setSelectAll(newSelected.length === filteredStudents.length && filteredStudents.length > 0);
  };

  const isStudentSelected = (studentId) => {
    if (!studentId) return false;
    return selectedStudents.indexOf(studentId) !== -1;
  };

  // Handle student search
  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    if (searchValue) {
      const filtered = allStudents.filter(student =>
        student.FullName.toLowerCase().includes(searchValue.toLowerCase()) ||
        student.UserID.toString().includes(searchValue)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(allStudents);
    }
  };

  // Handle tuition generation
  const handleConfirmGeneration = () => {
    setConfirmDialogOpen(true);
  };

  const handleGenerateTuition = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);

    try {
      const payload = {
        semesterId: formData.semesterId,
        academicYear: formData.academicYear,
        dueDate: formData.dueDate,
        studentIds: selectedStudents,
        amountPerCredit: formData.amountPerCredit,
        discountPercentage: formData.applyDiscount ? formData.discountPercentage : 0,
        includePreviousBalance: formData.includePreviousBalance,
        paymentDeadline: formData.paymentDeadline,
        latePaymentFee: formData.latePaymentFee,
        notifyStudents: formData.notifyStudents
      };

      const response = await tuitionService.generateTuition(payload);

      if (response.success) {
        setSuccessDialogOpen(true);
      } else {
        throw new Error(response.message || 'Không thể tạo học phí');
      }
    } catch (error) {
      console.error('Error generating tuition:', error);
      alert(`Lỗi: ${error.message || 'Không thể tạo học phí, vui lòng thử lại sau.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialogOpen(false);
    navigate('/finance/tuition');
  };

  // Calculate summary data
  const getSelectedStudentsData = () => {
    return filteredStudents.filter(student => selectedStudents.includes(student.UserID));
  };

  const calculateTotalAmount = () => {
    const students = getSelectedStudentsData();
    let total = students.reduce((sum, student) => sum + student.TuitionAmount, 0);
    
    if (formData.applyDiscount && formData.discountPercentage > 0) {
      total = total * (1 - formData.discountPercentage / 100);
    }
    
    if (formData.includePreviousBalance) {
      total += students.reduce((sum, student) => sum + (student.CurrentBalance || 0), 0);
    }
    
    return total;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Content for each step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Năm học"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleAcademicYearChange}
                  select
                  disabled={dataLoading}
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Học kỳ"
                  name="semester"
                  value={formData.semester}
                  onChange={handleFormChange}
                  select
                  disabled={dataLoading}
                >
                  {semesters
                    .filter(sem => sem.AcademicYear === formData.academicYear)
                    .map((sem) => (
                      <MenuItem key={sem.SemesterID} value={sem.SemesterName}>
                        {sem.SemesterName}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ngày hẹn thanh toán"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={dataLoading}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={dataLoading}>
                  <InputLabel id="programs-label">Ngành học</InputLabel>
                  <Select
                    labelId="programs-label"
                    multiple
                    value={formData.programs}
                    onChange={handleProgramChange}
                    input={<OutlinedInput label="Ngành học" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const program = programs.find(p => p.ProgramID.toString() === value.toString());
                          return (
                            <Chip key={value} label={program ? program.ProgramName : value} />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {programs.map((program) => (
                      <MenuItem key={program.ProgramID} value={program.ProgramID.toString()}>
                        <Checkbox checked={formData.programs.indexOf(program.ProgramID.toString()) > -1} />
                        <ListItemText primary={program.ProgramName} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Để trống để bao gồm tất cả các ngành học</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Số tín chỉ mỗi đơn chữ"
                  name="amountPerCredit"
                  type="number"
                  value={formData.amountPerCredit}
                  onChange={handleFormChange}
                  inputProps={{ min: 0 }}
                  disabled={dataLoading}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <AlertTitle>Thông tin</AlertTitle>
                Chọn các thông số để xác định sinh viên sẽ được tạo học phí.
                Bạn có thể lọc theo ngành học hoặc bao gồm tất cả sinh viên.
              </Alert>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Tìm kiếm theo tên hoặc mã SV"
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                  }}
                  sx={{ width: 300, mr: 2 }}
                  disabled={studentsLoading}
                />
                <Typography variant="body2" color="text.secondary">
                  Đã chọn {selectedStudents.length} / {filteredStudents.length} sinh viên
                </Typography>
              </Box>
              {filteredStudents.length > 0 && (
                <Button 
                  variant="outlined" 
                  onClick={() => handleSelectAllStudents({ target: { checked: !selectAll } })}
                  disabled={studentsLoading}
                >
                  {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button>
              )}
            </Box>
            
            {studentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>Đang tải danh sách sinh viên...</Typography>
              </Box>
            ) : studentError ? (
              <Alert severity="error" sx={{ mb: 3 }}>{studentError}</Alert>
            ) : (
              <DataGrid
                rows={filteredStudents.map(student => ({ id: student.UserID, ...student }))}
                columns={[
                  { field: 'id', headerName: 'Mã SV', width: 120 },
                  { field: 'FullName', headerName: 'Họ và tên', width: 200, flex: 1 },
                  { field: 'ProgramName', headerName: 'Ngành học', width: 200, flex: 1 },
                  {
                    field: 'CurrentBalance',
                    headerName: 'Công nợ hiện tại',
                    width: 150,
                    type: 'number',
                    valueFormatter: (params) => formatCurrency(params.value || 0)
                  },
                  { field: 'TotalCredits', headerName: 'Số tín chỉ', width: 120, type: 'number' },
                  {
                    field: 'TuitionAmount',
                    headerName: 'Số tiền',
                    width: 150,
                    type: 'number',
                    valueFormatter: (params) => formatCurrency(params.value || 0)
                  }
                ]}
                checkboxSelection
                disableRowSelectionOnClick={false}
                selectionModel={selectedStudents}
                onSelectionModelChange={(newSelection) => setSelectedStudents(newSelection)}
                loading={studentsLoading}
                autoHeight
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                getRowId={(row) => row.id}
              />
            )}
            
            {!studentsLoading && selectedStudents.length === 0 && filteredStudents.length > 0 && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                Vui lòng chọn ít nhất một sinh viên để tiếp tục.
              </Alert>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Tùy chọn giảm học phí
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <FormControl>
                              <InputLabel>Áp dụng giảm học phí</InputLabel>
                              <Select
                                name="applyDiscount"
                                value={formData.applyDiscount}
                                label="Áp dụng giảm học phí"
                                onChange={handleFormChange}
                              >
                                <MenuItem value={true}>Có</MenuItem>
                                <MenuItem value={false}>Không</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              type="number"
                              label="Phần trăm giảm học phí"
                              name="discountPercentage"
                              value={formData.discountPercentage}
                              onChange={handleFormChange}
                              disabled={!formData.applyDiscount}
                              InputProps={{
                                endAdornment: <Typography variant="body2">%</Typography>,
                              }}
                            />
                          </Grid>
                        </Grid>
                      </FormControl>
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Tùy chọn thanh toán
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="number"
                        label="Hạn thanh toán (ngày)"
                        name="paymentDeadline"
                        value={formData.paymentDeadline}
                        onChange={handleFormChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="number"
                        label="Phí trễ hạn"
                        name="latePaymentFee"
                        value={formData.latePaymentFee}
                        onChange={handleFormChange}
                        InputProps={{
                          endAdornment: <Typography variant="body2">%</Typography>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <FormControl fullWidth>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Tùy chọn bổ sung
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Tính công nợ trước đó</InputLabel>
                        <Select
                          name="includePreviousBalance"
                          value={formData.includePreviousBalance}
                          label="Tính công nợ trước đó"
                          onChange={handleFormChange}
                        >
                          <MenuItem value={true}>Có</MenuItem>
                          <MenuItem value={false}>Không</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Thông báo cho sinh viên</InputLabel>
                        <Select
                          name="notifyStudents"
                          value={formData.notifyStudents}
                          label="Thông báo cho sinh viên"
                          onChange={handleFormChange}
                        >
                          <MenuItem value={true}>Có</MenuItem>
                          <MenuItem value={false}>Không</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <AlertTitle>Cấu hình</AlertTitle>
                Những cài đặt này sẽ áp dụng cho tất cả hóa đơn học phí được tạo.
                Bạn có thể tùy chọn áp dụng giảm học phí, đặt hạn thanh toán, và cấu hình thông báo.
              </Alert>
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon sx={{ mr: 1 }} color="primary" /> Tổng kết
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Năm học:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.academicYear}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Học kỳ:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.semester}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Ngày hẹn thanh toán:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.dueDate}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Ngành học đã chọn:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {formData.programs.length > 0 ? formData.programs.map(id => {
                            const program = programs.find(p => p.ProgramID.toString() === id);
                            return program ? program.ProgramName : id;
                          }).join(', ') : 'Tất cả các ngành'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Sinh viên:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{selectedStudents.length} sinh viên</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Giảm học phí:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {formData.applyDiscount ? `${formData.discountPercentage}%` : 'Không áp dụng'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Tính công nợ trước đó:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.includePreviousBalance ? 'Có' : 'Không'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Thông báo cho sinh viên:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.notifyStudents ? 'Có' : 'Không'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <ReceiptIcon sx={{ mr: 1 }} color="primary" /> Chi tiết tài chính
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Tổng số tiền: {formatCurrency(calculateTotalAmount())}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bao gồm học phí cho {selectedStudents.length} sinh viên
                      {formData.includePreviousBalance ? ', đã bao gồm công nợ trước đó' : ''}
                      {formData.applyDiscount ? `, với mức giảm ${formData.discountPercentage}%` : ''}.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Điều kiện thanh toán:
                      </Typography>
                      <Typography variant="body2">
                        • Hạn thanh toán: {formData.paymentDeadline} ngày sau khi tạo
                      </Typography>
                      <Typography variant="body2">
                        • Phí trễ hạn: {formData.latePaymentFee}% số tiền chưa thanh toán
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                
                <Box sx={{ mt: 3 }}>
                  {selectedStudents.length === 0 ? (
                    <Alert severity="error">
                      <AlertTitle>Lỗi</AlertTitle>
                      Không có sinh viên nào được chọn. Vui lòng quay lại và chọn ít nhất một sinh viên.
                    </Alert>
                  ) : (
                    <Alert severity="warning" icon={<WarningIcon />}>
                      <AlertTitle>Quan trọng</AlertTitle>
                      Bạn sắp tạo hóa đơn học phí cho {selectedStudents.length} sinh viên.
                      Hành động này không thể hoàn tác. Vui lòng xác nhận tất cả thông tin đã chính xác trước khi tiếp tục.
                    </Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Bước không xác định';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tạo học phí
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label, index) => {
            const stepProps = {};
            const labelProps = {};
            if (isStepOptional(index)) {
              labelProps.optional = <Typography variant="caption">Tùy chọn</Typography>;
            }
            if (isStepSkipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        
        {activeStep === steps.length ? (
          <Box sx={{ mt: 3, mb: 1 }}>
            <Typography sx={{ mt: 2, mb: 1 }}>
              Đã hoàn tất tất cả các bước
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleReset}>Làm lại</Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box>
              {getStepContent(activeStep)}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 3 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                sx={{ mr: 1 }}
              >
                Trở về
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {isStepOptional(activeStep) && (
                <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
                  Bỏ qua
                </Button>
              )}
              {activeStep === steps.length - 1 ? (
                <Button 
                  onClick={handleConfirmGeneration} 
                  variant="contained"
                  disabled={selectedStudents.length === 0 || loading}
                  startIcon={loading ? undefined : <SendIcon />}
                >
                  {loading ? 'Đang xử lý...' : 'Tạo học phí'}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  variant="contained"
                  disabled={(activeStep === 1 && selectedStudents.length === 0) || dataLoading}
                  endIcon={<ArrowForwardIcon />}
                >
                  Tiếp tục
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Xác nhận tạo học phí</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn sắp tạo hóa đơn học phí cho {selectedStudents.length} sinh viên 
            với tổng số tiền {formatCurrency(calculateTotalAmount())}.
            Hành động này không thể hoàn tác. Bạn có muốn tiếp tục?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleGenerateTuition} color="primary" variant="contained" autoFocus>
            Xác nhận tạo học phí
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={handleSuccessClose}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckIcon color="success" sx={{ mr: 1 }} />
            Tạo học phí thành công
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Đã tạo học phí thành công cho {selectedStudents.length} sinh viên.
            {formData.notifyStudents && ' Email thông báo đã được gửi đến tất cả sinh viên.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessClose} color="primary" variant="contained">
            Xem danh sách học phí
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenerateTuition; 