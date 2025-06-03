import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  School,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { academicService, studentsService } from '../../../services/api';

const warningTypes = [
  { value: 'academic_performance', label: 'Kết quả học tập kém' },
  { value: 'attendance', label: 'Vắng mặt quá nhiều' },
  { value: 'conduct', label: 'Vi phạm quy chế' },
  { value: 'tuition', label: 'Chưa đóng học phí' },
  { value: 'other', label: 'Lý do khác' },
];

const AddAcademicWarning = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [semestersLoading, setSemestersLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
// eslint-disable-next-line no-unused-vars
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);

  // Fetch semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      setSemestersLoading(true);
      try {
        const response = await academicService.getAllSemesters();
        if (response && response.success) {
          setSemesters(response.data || []);
        } else {
          console.error('Failed to fetch semesters:', response?.message);
        }
      } catch (error) {
        console.error('Failed to fetch semesters:', error);
      } finally {
        setSemestersLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  // Search students - support searching by UserID as well
  useEffect(() => {
    const searchStudents = async () => {
      if (studentSearchTerm.length < 2) return;
      
      setStudentsLoading(true);
      try {
        // Check if search term is a numeric value (likely a UserID)
// eslint-disable-next-line no-unused-vars
        const isNumeric = /^\d+$/.test(studentSearchTerm.trim());
        let searchParam = studentSearchTerm;
        
        // If numeric, directly search by UserID if that's an available parameter
        const data = await studentsService.getAllStudents(1, 10, searchParam);
        setStudents(data.students || []);
      } catch (error) {
        console.error('Failed to search students:', error);
      } finally {
        setStudentsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (studentSearchTerm) searchStudents();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [studentSearchTerm]);

  // Fetch student details when selected
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!selectedStudent) {
        setStudentDetails(null);
        return;
      }
      
      setStudentDetailsLoading(true);
      try {
        const data = await studentsService.getStudentById(selectedStudent.id);
        setStudentDetails(data.student || null);
      } catch (error) {
        console.error('Failed to fetch student details:', error);
      } finally {
        setStudentDetailsLoading(false);
      }
    };

    fetchStudentDetails();
  }, [selectedStudent]);

  // Form validation schema
  const validationSchema = Yup.object({
    studentId: Yup.string().required('Vui lòng chọn sinh viên'),
    semesterId: Yup.string().required('Vui lòng chọn học kỳ'),
    warningType: Yup.string().required('Vui lòng chọn loại cảnh báo'),
    reason: Yup.string().required('Vui lòng nhập lý do cảnh báo').max(500, 'Tối đa 500 ký tự'),
    details: Yup.string().max(2000, 'Tối đa 2000 ký tự'),
  });

  // Formik form
  const formik = useFormik({
    initialValues: {
      studentId: '',
      semesterId: '',
      warningType: '',
      reason: '',
      details: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setSubmitError(null);
      
      try {
        const response = await academicService.createAcademicWarning(values);
        
        // Navigate to the detail page of the created warning
        navigate(`/academic/warnings/${response.warning.id}`);
      } catch (error) {
        const errorMsg = error?.response?.data?.message || 'Không thể tạo cảnh báo. Vui lòng thử lại sau.';
        setSubmitError(errorMsg);
        console.error('Failed to create academic warning:', error);
        setLoading(false);
      }
    },
  });

  // Update studentId value when student is selected
  useEffect(() => {
    if (selectedStudent) {
      formik.setFieldValue('studentId', selectedStudent.id);
    } else {
      formik.setFieldValue('studentId', '');
    }
  }, [/* eslint-disable-next-line react-hooks/exhaustive-deps */selectedStudent]);

  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/academic/warnings" underline="hover" color="inherit">
          Cảnh báo học tập
        </Link>
        <Typography color="text.primary">Thêm cảnh báo</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Thêm cảnh báo học tập mới
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/academic/warnings')}
        >
          Quay lại
        </Button>
      </Box>

      {/* Form */}
      <form onSubmit={formik.handleSubmit}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Student Selection */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1 }} /> Chọn sinh viên
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Autocomplete
                  options={students}
                  getOptionLabel={(option) => `${option.studentCode} - ${option.fullName} (ID: ${option.id})`}
                  loading={studentsLoading}
                  value={selectedStudent}
                  onChange={(_, newValue) => setSelectedStudent(newValue)}
                  onInputChange={(_, newInputValue) => setStudentSearchTerm(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tìm sinh viên"
                      placeholder="Nhập mã SV, tên hoặc UserID để tìm kiếm"
                      error={formik.touched.studentId && Boolean(formik.errors.studentId)}
                      helperText={formik.touched.studentId && formik.errors.studentId}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {studentsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                {selectedStudent && studentDetails && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Thông tin sinh viên:</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Mã sinh viên</Typography>
                        <Typography variant="body1">{studentDetails.studentCode}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Họ tên</Typography>
                        <Typography variant="body1">{studentDetails.fullName}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">UserID</Typography>
                        <Typography variant="body1">{studentDetails.id}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Lớp</Typography>
                        <Typography variant="body1">{studentDetails.className || '--'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Warning Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 1 }} /> Thông tin cảnh báo
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl 
                      fullWidth 
                      error={formik.touched.semesterId && Boolean(formik.errors.semesterId)}
                    >
                      <InputLabel>Học kỳ</InputLabel>
                      <Select
                        name="semesterId"
                        value={formik.values.semesterId || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Học kỳ"
                        disabled={semestersLoading}
                      >
                        {semestersLoading ? (
                          <MenuItem key="loading-semester" value="" disabled>
                            Đang tải...
                          </MenuItem>
                        ) : (
                          semesters.map((semester) => (
                            <MenuItem key={semester.id} value={semester.id}>
                              {semester.name} - {semester.AcademicYear || ''} 
                              {semester.status === 'Current' && ' (Hiện tại)'}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {formik.touched.semesterId && formik.errors.semesterId && (
                        <FormHelperText>{formik.errors.semesterId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth error={formik.touched.warningType && Boolean(formik.errors.warningType)}>
                      <InputLabel>Loại cảnh báo</InputLabel>
                      <Select
                        name="warningType"
                        label="Loại cảnh báo"
                        value={formik.values.warningType || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        {warningTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.warningType && formik.errors.warningType && (
                        <FormHelperText>{formik.errors.warningType}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Reason & Details */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <School sx={{ mr: 1 }} /> Lý do và chi tiết
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Lý do cảnh báo"
                      name="reason"
                      value={formik.values.reason}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.reason && Boolean(formik.errors.reason)}
                      helperText={formik.touched.reason && formik.errors.reason}
                      placeholder="Nhập lý do cảnh báo học tập"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      label="Mô tả chi tiết (không bắt buộc)"
                      name="details"
                      value={formik.values.details}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.details && Boolean(formik.errors.details)}
                      helperText={
                        (formik.touched.details && formik.errors.details) ||
                        'Thêm chi tiết về tình trạng học tập, kết quả, và thông tin khác nếu cần.'
                      }
                      placeholder="Nhập thông tin chi tiết về tình trạng học tập của sinh viên, kết quả học tập, và các thông tin khác nếu cần."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Submission */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={loading || !formik.isValid || !formik.dirty}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            sx={{
              px: 4,
              py: 1.2,
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            {loading ? 'Đang lưu...' : 'Lưu cảnh báo'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AddAcademicWarning; 