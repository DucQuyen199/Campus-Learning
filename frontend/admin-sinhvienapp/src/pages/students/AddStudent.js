import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Paper, TextField,
  MenuItem, FormControl, FormHelperText, InputLabel, Select,
// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line no-unused-vars
  Card, CardContent, Divider, FormControlLabel, Switch,
// eslint-disable-next-line no-unused-vars
  Tabs, Tab, Chip, Alert, Link, CircularProgress,
// eslint-disable-next-line no-unused-vars
  Container, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  ArrowBack, Save, Upload, Download, Person, PersonAdd,
  School, Description, Help
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { studentsService, academicService } from '../../services/api';

const validationSchema = Yup.object({
  firstName: Yup.string().required('Họ là bắt buộc'),
  lastName: Yup.string().required('Tên là bắt buộc'),
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Email là bắt buộc')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Email không đúng định dạng'
    ),
  phone: Yup.string()
    .required('Số điện thoại là bắt buộc')
    .matches(
      /^[0-9]{10,11}$/,
      'Số điện thoại phải có 10-11 chữ số'
    ),
  dateOfBirth: Yup.date()
    .required('Ngày sinh là bắt buộc')
    .max(new Date(), 'Ngày sinh không thể trong tương lai')
    .test(
      'is-adult',
      'Sinh viên phải trên 16 tuổi',
      value => {
        if (!value) return true;
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age >= 16;
      }
    ),
  gender: Yup.string().required('Giới tính là bắt buộc'),
  address: Yup.string().required('Địa chỉ là bắt buộc'),
  programId: Yup.number().required('Chương trình học là bắt buộc'),
  studentCode: Yup.string()
    .required('Mã sinh viên là bắt buộc')
    .matches(
      /^[A-Za-z0-9]{3,10}$/,
      'Mã sinh viên phải có 3-10 ký tự (chữ hoặc số)'
    ),
});

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AddStudent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [programs, setPrograms] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ loading: false, success: false, error: null });
  const [uploadResults, setUploadResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('');

  // Get programId from location state if available
  const preselectedProgramId = location.state?.programId;

  // Fetch academic programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const response = await academicService.getAllPrograms();
        if (response && response.success) {
          setPrograms(response.data || []);
        } else {
          console.error('Failed to fetch programs:', response?.message);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const initialValues = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: null,
    gender: '',
    address: '',
    programId: preselectedProgramId || '',
    studentCode: '',
    isActive: true
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Format date correctly for API (YYYY-MM-DD format)
      const formattedDate = values.dateOfBirth 
        ? new Date(values.dateOfBirth).toISOString().split('T')[0] 
        : null;
      
      // Format the data for the API
      const studentData = {
        username: values.email.split('@')[0], // Generate username from email
        email: values.email,
        fullName: `${values.firstName} ${values.lastName}`,
        password: 'password123', // Default password
        dateOfBirth: formattedDate,
        phoneNumber: values.phone,
        studentCode: values.studentCode || `SV${Date.now().toString().slice(-6)}`, // Generate code if not provided
        gender: values.gender,
        address: values.address,
        programId: parseInt(values.programId), // Ensure programId is a number
        entryYear: new Date().getFullYear(),
        expectedGraduationYear: new Date().getFullYear() + 4,
        role: 'STUDENT', // Explicitly set role
        accountStatus: 'ACTIVE', // Explicitly set account status
        isActive: values.isActive
      };

      console.log('Sending student data to API:', studentData);

      // Call the API to create student
      const response = await studentsService.createStudent(studentData);
      
      if (response && response.data && response.data.success) {
        // Store the created student data to pass to Students page
        const createdStudent = response.data.data;
        
        // Show success message
        alert('Sinh viên đã được thêm thành công!');
        
        // Reset form
        resetForm();
        
        // Navigate back to students page with state to trigger refresh
        // and info about the newly created student
        navigate('/students', { 
          state: { 
            refresh: true, 
            newStudent: createdStudent,
            message: `Sinh viên ${studentData.fullName} đã được thêm thành công!`
          } 
        });
      } else {
        throw new Error(response?.data?.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      
      // Extract detailed error message from response if available
      let errorMessage = 'Không thể thêm sinh viên';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        errorMessage = error.response.data?.message || 
                       error.response.data?.error || 
                       `Lỗi ${error.response.status}: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setUploadStatus({ loading: false, success: false, error: 'Please select a CSV file' });
      return;
    }

    setUploadStatus({ loading: true, success: false, error: null });
    setUploadResults(null);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      // Use the studentsService instead of direct axios call
      const response = await studentsService.importStudentsFromCsv(formData);

      if (response.data.success) {
        setUploadStatus({
          loading: false,
          success: true,
          error: null
        });
        setUploadResults(response.data);
        setCsvFile(null);
        // Reset file input
        document.getElementById('csv-file-upload').value = '';
        
        // Show confirmation dialog instead of using confirm()
        setConfirmDialogMessage(`Đã nhập ${response.data.createdCount || 0} sinh viên thành công. Bạn có muốn quay lại trang danh sách sinh viên?`);
        setShowConfirmDialog(true);
      } else {
        throw new Error(response.data.message || 'Import failed');
      }
    } catch (error) {
      console.error('CSV upload error:', error);
      setUploadStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to import CSV'
      });
    }
  };

  // Function to handle confirmation dialog response
  const handleConfirmNavigation = () => {
    navigate('/students', { 
      state: { 
        refresh: true, 
        message: `Đã nhập ${uploadResults?.createdCount || 0} sinh viên thành công.`
      } 
    });
    setShowConfirmDialog(false);
  };

  // Function to close the dialog without navigating
  const handleCloseDialog = () => {
    setShowConfirmDialog(false);
  };

  const handleDownloadTemplate = () => {
    // Create CSV template content
    const csvContent = `firstname,lastname,email,phone,dateOfBirth,gender,address,studentCode,programId
John,Doe,john.doe@example.com,0901234567,2000-01-01,Nam,123 Main St,SV001,1
Jane,Smith,jane.smith@example.com,0901234568,2001-02-15,Nữ,456 Elm St,SV002,2`;

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger the download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="xl">
      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Thành công"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialogMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Ở lại trang này</Button>
          <Button onClick={handleConfirmNavigation} autoFocus variant="contained">
            Đi đến danh sách sinh viên
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <School sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" component="h1" fontWeight={600}>
                Thêm sinh viên mới
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thêm thông tin sinh viên vào hệ thống
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={() => navigate('/students')}
            sx={{ 
              fontWeight: 500,
              borderRadius: 2,
              px: 2.5
            }}
          >
            Quay lại
          </Button>
        </Box>

        <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="student addition method"
              sx={{ 
                '& .MuiTab-root': { 
                  py: 2,
                  fontWeight: 500
                },
                '& .Mui-selected': { 
                  fontWeight: 600
                }
              }}
            >
              <Tab 
                icon={<Person />} 
                iconPosition="start" 
                label="Thêm thủ công" 
                id="student-tab-0" 
              />
              <Tab 
                icon={<Upload />} 
                iconPosition="start" 
                label="Nhập từ CSV" 
                id="student-tab-1" 
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
                <Form>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: '#f8f9fa', 
                          display: 'flex', 
                          alignItems: 'center',
                          borderBottom: '1px solid #e0e0e0'
                        }}>
                          <School color="primary" sx={{ mr: 1.5 }} />
                          <Typography variant="h6" fontWeight={600}>
                            Thông tin cá nhân
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 3 }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                id="firstName"
                                name="firstName"
                                label="Họ"
                                value={values.firstName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.firstName && Boolean(errors.firstName)}
                                helperText={touched.firstName && errors.firstName}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                id="lastName"
                                name="lastName"
                                label="Tên"
                                value={values.lastName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.lastName && Boolean(errors.lastName)}
                                helperText={touched.lastName && errors.lastName}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <DatePicker
                                label="Ngày sinh"
                                value={values.dateOfBirth}
                                onChange={(date) => setFieldValue('dateOfBirth', date)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    fullWidth
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    error={touched.dateOfBirth && Boolean(errors.dateOfBirth)}
                                    helperText={touched.dateOfBirth && errors.dateOfBirth}
                                  />
                                )}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <FormControl 
                                fullWidth
                                error={touched.gender && Boolean(errors.gender)}
                              >
                                <InputLabel id="gender-label">Giới tính</InputLabel>
                                <Select
                                  labelId="gender-label"
                                  id="gender"
                                  name="gender"
                                  value={values.gender}
                                  label="Giới tính"
                                  onChange={handleChange}
                                >
                                  <MenuItem value="Nam">Nam</MenuItem>
                                  <MenuItem value="Nữ">Nữ</MenuItem>
                                  <MenuItem value="Khác">Khác</MenuItem>
                                </Select>
                                {touched.gender && errors.gender && (
                                  <FormHelperText>{errors.gender}</FormHelperText>
                                )}
                              </FormControl>
                            </Grid>
                          </Grid>
                        </Box>
                      </Paper>
                  
                      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: '#f8f9fa', 
                          display: 'flex', 
                          alignItems: 'center',
                          borderBottom: '1px solid #e0e0e0'
                        }}>
                          <Description color="primary" sx={{ mr: 1.5 }} />
                          <Typography variant="h6" fontWeight={600}>
                            Thông tin liên hệ
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 3 }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email"
                                type="email"
                                value={values.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.email && Boolean(errors.email)}
                                helperText={touched.email && errors.email}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                id="phone"
                                name="phone"
                                label="Số điện thoại"
                                value={values.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.phone && Boolean(errors.phone)}
                                helperText={touched.phone && errors.phone}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                id="address"
                                name="address"
                                label="Địa chỉ"
                                multiline
                                rows={3}
                                value={values.address}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.address && Boolean(errors.address)}
                                helperText={touched.address && errors.address}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: '#f8f9fa', 
                          display: 'flex', 
                          alignItems: 'center',
                          borderBottom: '1px solid #e0e0e0'
                        }}>
                          <School color="primary" sx={{ mr: 1.5 }} />
                          <Typography variant="h6" fontWeight={600}>
                            Thông tin học tập
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 3 }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                id="studentCode"
                                name="studentCode"
                                label="Mã sinh viên"
                                value={values.studentCode}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.studentCode && Boolean(errors.studentCode)}
                                helperText={touched.studentCode && errors.studentCode}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControl 
                                fullWidth
                                error={touched.programId && Boolean(errors.programId)}
                              >
                                <InputLabel id="program-label">Chương trình học</InputLabel>
                                <Select
                                  labelId="program-label"
                                  id="programId"
                                  name="programId"
                                  value={values.programId}
                                  label="Chương trình học"
                                  onChange={handleChange}
                                >
                                  {loading ? (
                                    <MenuItem disabled>Đang tải...</MenuItem>
                                  ) : (
                                    programs.map(program => (
                                      <MenuItem key={program.id || program.ProgramID} value={program.id || program.ProgramID}>
                                        {program.name || program.ProgramName}
                                      </MenuItem>
                                    ))
                                  )}
                                </Select>
                                {touched.programId && errors.programId && (
                                  <FormHelperText>{errors.programId}</FormHelperText>
                                )}
                              </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    id="isActive"
                                    name="isActive"
                                    checked={values.isActive}
                                    onChange={handleChange}
                                    color="primary"
                                  />
                                }
                                label="Kích hoạt tài khoản"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Paper>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/students')}
                          sx={{ mr: 2 }}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<Save />}
                          disabled={isSubmitting}
                          sx={{ 
                            fontWeight: 500,
                            borderRadius: 2,
                            px: 3
                          }}
                        >
                          {isSubmitting ? 'Đang lưu...' : 'Lưu sinh viên'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: '#f0f7ff', 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: 4
                  }}>
                    <Help color="primary" sx={{ fontSize: 24, mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Hướng dẫn nhập sinh viên từ file CSV
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tải mẫu file CSV và điền thông tin sinh viên theo đúng định dạng. Định dạng này cho phép bạn thêm nhiều sinh viên cùng lúc.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600} 
                      gutterBottom 
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ width: 24, display: 'inline-block', textAlign: 'center', marginRight: 8 }}>1</span>
                      Tải mẫu file CSV
                    </Typography>
                    <Box sx={{ pl: 5 }}>
                      <Typography variant="body2" paragraph color="text.secondary">
                        Tải mẫu file CSV và mở bằng Excel hoặc Google Sheets để điền thông tin sinh viên
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<Download />}
                        onClick={handleDownloadTemplate}
                        sx={{ mt: 1 }}
                      >
                        Tải mẫu CSV
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600} 
                      gutterBottom 
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ width: 24, display: 'inline-block', textAlign: 'center', marginRight: 8 }}>2</span>
                      Điền thông tin và lưu file
                    </Typography>
                    <Box sx={{ pl: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Điền đầy đủ thông tin sinh viên vào file CSV (không thay đổi tên cột)
                      </Typography>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Các trường bắt buộc:</strong> firstname, lastname, email, studentCode
                        </Typography>
                      </Alert>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600} 
                      gutterBottom 
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ width: 24, display: 'inline-block', textAlign: 'center', marginRight: 8 }}>3</span>
                      Tải lên file CSV
                    </Typography>
                    <Box sx={{ pl: 5 }}>
                      <input
                        accept=".csv"
                        id="csv-file-upload"
                        type="file"
                        onChange={handleCsvFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="csv-file-upload">
                        <Button 
                          variant="outlined" 
                          component="span" 
                          startIcon={<Upload />}
                        >
                          Chọn file CSV
                        </Button>
                      </label>
                      
                      {csvFile && (
                        <Chip 
                          label={csvFile.name} 
                          onDelete={() => {
                            setCsvFile(null);
                            document.getElementById('csv-file-upload').value = '';
                          }} 
                          sx={{ ml: 2 }} 
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600} 
                      gutterBottom 
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ width: 24, display: 'inline-block', textAlign: 'center', marginRight: 8 }}>4</span>
                      Nhập sinh viên
                    </Typography>
                    <Box sx={{ pl: 5 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={uploadStatus.loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                        onClick={handleCsvUpload}
                        disabled={!csvFile || uploadStatus.loading}
                        sx={{ 
                          fontWeight: 500,
                          borderRadius: 2,
                          px: 3
                        }}
                      >
                        {uploadStatus.loading ? 'Đang xử lý...' : 'Nhập sinh viên'}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Kết quả nhập liệu
                  </Typography>

                  {uploadStatus.error && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                      {uploadStatus.error}
                    </Alert>
                  )}

                  {uploadStatus.success && (
                    <Alert severity="success" sx={{ mt: 3 }}>
                      Import thành công! Đã nhập {uploadResults?.createdCount || 0} sinh viên.
                    </Alert>
                  )}

                  {uploadResults && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Thống kê:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Tổng số: ${uploadResults.totalCount || 0}`} 
                          color="primary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`Thành công: ${uploadResults.createdCount || 0}`} 
                          color="success" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`Lỗi: ${uploadResults.failedCount || 0}`} 
                          color="error" 
                          variant="outlined"
                        />
                      </Box>

                      {uploadResults.failedCount > 0 && uploadResults.errors && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="error" gutterBottom>
                            Lỗi:
                          </Typography>
                          {uploadResults.errors.map((error, index) => (
                            <Typography key={index} variant="body2" color="error" sx={{ mb: 0.5 }}>
                              • Dòng {error.row}: {error.message}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={() => navigate('/students', {
                            state: {
                              refresh: true,
                              message: `Đã nhập ${uploadResults.createdCount || 0} sinh viên thành công.`
                            }
                          })}
                          sx={{ 
                            fontWeight: 500,
                            borderRadius: 2,
                            px: 3
                          }}
                        >
                          Xem kết quả
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {!uploadResults && !uploadStatus.error && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 'calc(100% - 50px)',
                      color: 'text.secondary'
                    }}>
                      <Upload sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                      <Typography variant="body2" align="center">
                        Chưa có dữ liệu. Vui lòng tải lên file CSV và nhấn nút "Nhập sinh viên".
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>
      </Box>
    </Container>
  );
};

export default AddStudent; 