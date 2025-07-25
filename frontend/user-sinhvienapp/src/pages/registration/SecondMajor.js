/*-----------------------------------------------------------------
* File: SecondMajor.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  useTheme,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

const steps = ['Chọn ngành học', 'Thông tin bổ sung', 'Xác nhận'];

// Add a timeout to axios requests
const axiosWithTimeout = (timeout = 15000) => {
  const instance = axios.create({
    timeout: timeout
  });
  return instance;
};

const SecondMajor = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [reason, setReason] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [currentGPA, setCurrentGPA] = useState('');
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [availableMajors, setAvailableMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRegistrations, setExistingRegistrations] = useState([]);
  const [completedCredits, setCompletedCredits] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [loadingTimeoutExceeded, setLoadingTimeoutExceeded] = useState(false);
  
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    titleSection: {
      marginBottom: theme.spacing(3)
    },
    formControl: {
      minWidth: 200,
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(3)
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: theme.spacing(3)
    },
    card: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    stepper: {
      padding: theme.spacing(3, 0, 5)
    },
    infoSection: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.default
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      height: '200px'
    },
    retryButton: {
      marginTop: theme.spacing(2)
    }
  };

  // Set a loading timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        setLoadingTimeoutExceeded(true);
        setLoading(false);
        setLoadError('Thời gian tải dữ liệu quá lâu. Vui lòng thử lại.');
      }, 20000); // 20 seconds timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    setLoadingTimeoutExceeded(false);
    
    try {
      // Create an axios instance with timeout
      const api = axiosWithTimeout();
      
      // Run API calls in parallel for better performance
      const [eligibilityResponse, programsResponse, registrationsResponse] = await Promise.allSettled([
        // Check eligibility
        api.get(`${API_BASE_URL}/second-major/eligibility/${currentUser.id}`),
        
        // Get available programs
        api.get(`${API_BASE_URL}/second-major/programs`),
        
        // Get existing registrations if any
        api.get(`${API_BASE_URL}/second-major/registrations/${currentUser.id}`)
      ]);
      
      // Process eligibility response
      if (eligibilityResponse.status === 'fulfilled' && eligibilityResponse.value.data.success) {
        const data = eligibilityResponse.value.data;
        setIsEligible(data.isEligible);
        
        if (!data.isEligible) {
          setEligibilityMessage(data.reason);
          
          // If the student already has a registration
          if (data.existingRegistration) {
            setExistingRegistrations([data.existingRegistration]);
          }
        } else {
          // Set current GPA and completed credits
          if (data.metrics) {
            setCurrentGPA(data.metrics.CumulativeGPA.toFixed(2));
            setCompletedCredits(data.metrics.TotalCredits);
          }
        }
      } else if (eligibilityResponse.status === 'rejected') {
        console.error('Error fetching eligibility:', eligibilityResponse.reason);
      }
      
      // Process programs response
      if (programsResponse.status === 'fulfilled' && programsResponse.value.data.success) {
        setAvailableMajors(programsResponse.value.data.data || []);
      } else if (programsResponse.status === 'rejected') {
        console.error('Error fetching programs:', programsResponse.reason);
      }
      
      // Process registrations response
      if (registrationsResponse.status === 'fulfilled' && 
          registrationsResponse.value.data.success && 
          registrationsResponse.value.data.data.length > 0) {
        setExistingRegistrations(registrationsResponse.value.data.data);
      } else if (registrationsResponse.status === 'rejected') {
        console.error('Error fetching registrations:', registrationsResponse.reason);
      }
      
      // If all requests failed, set an error
      if (eligibilityResponse.status === 'rejected' && 
          programsResponse.status === 'rejected' && 
          registrationsResponse.status === 'rejected') {
        setLoadError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoadError(
        error.response?.data?.message || 
        'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchData();
    }
  }, [currentUser]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedMajor('');
    setReason('');
    setRegistrationStatus(null);
  };

  const handleMajorChange = (event) => {
    setSelectedMajor(event.target.value);
  };

  const handleReasonChange = (event) => {
    setReason(event.target.value);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setRegistrationStatus(null);
    
    try {
      const api = axiosWithTimeout(30000); // Longer timeout for submission
      const response = await api.post(`${API_BASE_URL}/second-major/register`, {
        userId: currentUser.id,
        programId: selectedMajor,
        reason: reason
      });
      
      if (response.data.success) {
        setRegistrationStatus({
          type: 'success',
          message: 'Đăng ký học ngành 2 thành công. Yêu cầu của bạn đang được xử lý.'
        });
        setActiveStep(steps.length);
        
        // Update existing registrations
        setExistingRegistrations([response.data.data, ...existingRegistrations]);
      } else {
        setRegistrationStatus({
          type: 'error',
          message: response.data.message || 'Đăng ký thất bại. Vui lòng thử lại sau.'
        });
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED') {
        setRegistrationStatus({
          type: 'error',
          message: 'Đăng ký đã hết thời gian chờ. Vui lòng thử lại sau.'
        });
      } else {
        setRegistrationStatus({
          type: 'error',
          message: error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại sau.'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn ngành học thứ hai
            </Typography>
            <FormControl sx={styles.formControl} fullWidth>
              <InputLabel>Ngành học</InputLabel>
              <Select
                value={selectedMajor}
                onChange={handleMajorChange}
                label="Ngành học"
              >
                {availableMajors.map((major) => (
                  <MenuItem key={major.ProgramID} value={major.ProgramID}>
                    {major.ProgramName} ({major.ProgramCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Card sx={styles.card}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yêu cầu học ngành 2
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Điểm trung bình tích lũy (GPA)" 
                      secondary="Tối thiểu 2.5/4.0" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Số tín chỉ đã tích lũy" 
                      secondary="Tối thiểu 30 tín chỉ" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Thời gian đăng ký" 
                      secondary="Từ học kỳ 3 trở đi" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Phê duyệt" 
                      secondary="Yêu cầu được Khoa chấp thuận" 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
            
            {existingRegistrations.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Bạn đã có đăng ký ngành 2 trước đó với trạng thái: {existingRegistrations[0].Status}
              </Alert>
            )}
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Thông tin bổ sung
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Điểm trung bình tích lũy hiện tại (GPA)"
                  value={currentGPA}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Tổng số tín chỉ đã tích lũy"
                  value={completedCredits}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Lý do đăng ký học ngành 2"
                  multiline
                  rows={4}
                  value={reason}
                  onChange={handleReasonChange}
                  fullWidth
                  placeholder="Vui lòng nêu lý do bạn muốn học ngành thứ hai và mục tiêu nghề nghiệp của bạn..."
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        const selectedProgram = availableMajors.find(m => m.ProgramID === selectedMajor);
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xác nhận thông tin
            </Typography>
            
            <Card sx={styles.card}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Ngành học thứ hai
                    </Typography>
                    <Typography variant="body1">
                      {selectedProgram ? selectedProgram.ProgramName : 'Chưa chọn'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Khoa/Viện
                    </Typography>
                    <Typography variant="body1">
                      {selectedProgram ? selectedProgram.Faculty : 'Chưa chọn'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Điểm trung bình tích lũy
                    </Typography>
                    <Typography variant="body1">
                      {currentGPA}/4.0
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Số tín chỉ đã tích lũy
                    </Typography>
                    <Typography variant="body1">
                      {completedCredits}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      Lý do đăng ký
                    </Typography>
                    <Typography variant="body1">
                      {reason || 'Chưa nhập'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Bằng cách nhấn "Xác nhận", bạn cam kết rằng tất cả thông tin được cung cấp là chính xác và đồng ý với các điều kiện học ngành thứ hai của trường.
            </Alert>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  // If there's a loading error, show error message with retry button
  if (loadError) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Đăng ký học ngành 2
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <Alert severity="error" sx={{ width: '100%', maxWidth: '500px' }}>
              {loadError}
            </Alert>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchData} 
              sx={styles.retryButton}
            >
              Tải lại
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  // Loading state with indication of what's happening
  if (loading) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Đăng ký học ngành 2
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Đang tải dữ liệu...
            </Typography>
          </Box>
        </Paper>
      </div>
    );
  }

  // Show existing registrations if not eligible
  if (!isEligible && existingRegistrations.length === 0) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Đăng ký học ngành 2
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Đăng ký học cùng lúc ngành học thứ hai
            </Typography>
            <Divider sx={{ mt: 2 }} />
          </Box>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            Bạn chưa đủ điều kiện để đăng ký học ngành 2. {eligibilityMessage}
          </Alert>

          <Box sx={styles.infoSection}>
            <Typography variant="body1" gutterBottom>
              <strong>Yêu cầu để đăng ký học ngành 2:</strong>
            </Typography>
            <Typography variant="body2" component="ul">
              <li>Điểm trung bình tích lũy (GPA) tối thiểu 2.5/4.0</li>
              <li>Đã tích lũy tối thiểu 30 tín chỉ</li>
              <li>Đang học từ học kỳ 3 trở đi</li>
            </Typography>
          </Box>
        </Paper>
      </div>
    );
  }

  // Show list of existing registrations
  if (existingRegistrations.length > 0) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Đăng ký học ngành 2
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Trạng thái đăng ký ngành 2 của bạn
            </Typography>
            <Divider sx={{ mt: 2 }} />
          </Box>

          {existingRegistrations.map((registration, index) => (
            <Card key={index} sx={styles.card}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Ngành học thứ hai
                    </Typography>
                    <Typography variant="body1">
                      {registration.ProgramName} ({registration.ProgramCode})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Khoa/Viện
                    </Typography>
                    <Typography variant="body1">
                      {registration.Faculty}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Trạng thái
                    </Typography>
                    <Typography variant="body1" color={
                      registration.Status === 'Approved' ? 'success.main' :
                      registration.Status === 'Rejected' ? 'error.main' :
                      registration.Status === 'Pending' ? 'warning.main' : 'text.primary'
                    }>
                      {registration.Status === 'Approved' ? 'Đã duyệt' :
                       registration.Status === 'Rejected' ? 'Từ chối' :
                       registration.Status === 'Pending' ? 'Đang xử lý' :
                       registration.Status === 'Cancelled' ? 'Đã hủy' : registration.Status}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Ngày đăng ký
                    </Typography>
                    <Typography variant="body1">
                      {new Date(registration.RegistrationDate).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Grid>
                  {registration.ReviewedAt && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">
                          Người duyệt
                        </Typography>
                        <Typography variant="body1">
                          {registration.ReviewedByName || 'Chưa có thông tin'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">
                          Ngày duyệt
                        </Typography>
                        <Typography variant="body1">
                          {new Date(registration.ReviewedAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  {registration.Comments && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1">
                        Ghi chú
                      </Typography>
                      <Typography variant="body1">
                        {registration.Comments}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Paper>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Đăng ký học ngành 2
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Đăng ký học cùng lúc ngành học thứ hai
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {registrationStatus && (
          <Alert 
            severity={registrationStatus.type} 
            sx={{ mb: 3 }}
            onClose={() => setRegistrationStatus(null)}
          >
            {registrationStatus.message}
          </Alert>
        )}

        <Box sx={styles.infoSection}>
          <Typography variant="body1" gutterBottom>
            <strong>Thông tin về chương trình học ngành 2:</strong>
          </Typography>
          <Typography variant="body2" component="ul">
            <li>Sinh viên đăng ký học ngành 2 phải đáp ứng các yêu cầu tối thiểu về điểm trung bình tích lũy và số tín chỉ đã hoàn thành.</li>
            <li>Thời gian đào tạo có thể kéo dài hơn chương trình chính thông thường.</li>
            <li>Sinh viên sẽ phải hoàn thành thêm khoảng 30-50 tín chỉ tùy thuộc vào ngành học thứ hai.</li>
            <li>Học phí được tính riêng cho các môn học thuộc ngành thứ hai.</li>
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={styles.stepper}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Đăng ký hoàn tất!
            </Typography>
            <Typography variant="body1" paragraph>
              Yêu cầu đăng ký ngành học thứ hai của bạn đã được ghi nhận. Vui lòng kiểm tra email để nhận thông tin cập nhật về quá trình xét duyệt.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleReset}>Đăng ký mới</Button>
            </Box>
          </Box>
        ) : (
          <Box>
            {getStepContent(activeStep)}
            
            <Box sx={styles.buttonGroup}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Quay lại
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                disabled={
                  (activeStep === 0 && !selectedMajor) || 
                  (activeStep === 1 && !reason) ||
                  submitting
                }
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  activeStep === steps.length - 1 ? 'Xác nhận' : 'Tiếp theo'
                )}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default SecondMajor; 
