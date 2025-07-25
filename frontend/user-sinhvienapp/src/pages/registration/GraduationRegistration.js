/*-----------------------------------------------------------------
* File: GraduationRegistration.js
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
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Sample graduation data
const graduationRequirements = {
  creditsRequired: 130,
  creditsCompleted: 125,
  gpaRequired: 2.0,
  currentGpa: 3.2,
  compulsoryCoursesRequired: 30,
  compulsoryCoursesCompleted: 30,
  electiveCoursesRequired: 15,
  electiveCoursesCompleted: 12,
  outstandingCourses: [
    { id: 1, code: 'CS401', name: 'Advanced Algorithms', credits: 3, status: 'Not Completed' },
    { id: 2, code: 'CS450', name: 'Machine Learning', credits: 4, status: 'In Progress' }
  ]
};

const steps = ['Kiểm tra điều kiện', 'Thông tin xét tốt nghiệp', 'Xác nhận'];

const GraduationRegistration = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [graduationData, setGraduationData] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    address: ''
  });
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [eligibleForGraduation, setEligibleForGraduation] = useState(false);
  
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
      marginBottom: theme.spacing(2)
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
    }
  };

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setGraduationData(graduationRequirements);
    
    // Check if eligible for graduation
    const eligible = 
      graduationRequirements.creditsCompleted + graduationRequirements.outstandingCourses.reduce(
        (total, course) => total + (course.status === 'In Progress' ? course.credits : 0), 0
      ) >= graduationRequirements.creditsRequired &&
      graduationRequirements.currentGpa >= graduationRequirements.gpaRequired &&
      graduationRequirements.compulsoryCoursesCompleted >= graduationRequirements.compulsoryCoursesRequired &&
      (graduationRequirements.electiveCoursesCompleted + 
        graduationRequirements.outstandingCourses.filter(c => c.status === 'In Progress').length
      ) >= graduationRequirements.electiveCoursesRequired;
    
    setEligibleForGraduation(eligible);
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedTerm('');
    setContactInfo({
      phone: '',
      email: '',
      address: ''
    });
    setConfirmChecked(false);
  };

  const handleTermChange = (event) => {
    setSelectedTerm(event.target.value);
  };

  const handleContactChange = (event) => {
    setContactInfo({
      ...contactInfo,
      [event.target.name]: event.target.value
    });
  };

  const handleConfirmCheck = (event) => {
    setConfirmChecked(event.target.checked);
  };

  const handleSubmit = () => {
    // This would send the registration to an API
    setRegistrationStatus({
      type: 'success',
      message: 'Đăng ký xét tốt nghiệp thành công. Hồ sơ của bạn đang được xét duyệt.'
    });
    setActiveStep(steps.length);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kiểm tra điều kiện xét tốt nghiệp
            </Typography>
            
            {graduationData && (
              <Card sx={styles.card}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Tổng số tín chỉ yêu cầu:</strong> {graduationData.creditsRequired}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Tổng số tín chỉ đã hoàn thành:</strong> {graduationData.creditsCompleted} 
                        {graduationData.creditsCompleted < graduationData.creditsRequired ? 
                          <span style={{ color: 'red' }}> (Chưa đủ)</span> : 
                          <span style={{ color: 'green' }}> (Đạt)</span>}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Điểm trung bình tích lũy tối thiểu:</strong> {graduationData.gpaRequired}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Điểm trung bình tích lũy hiện tại:</strong> {graduationData.currentGpa}
                        {graduationData.currentGpa < graduationData.gpaRequired ? 
                          <span style={{ color: 'red' }}> (Chưa đủ)</span> : 
                          <span style={{ color: 'green' }}> (Đạt)</span>}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Môn học bắt buộc cần hoàn thành:</strong> {graduationData.compulsoryCoursesRequired}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Môn học bắt buộc đã hoàn thành:</strong> {graduationData.compulsoryCoursesCompleted}
                        {graduationData.compulsoryCoursesCompleted < graduationData.compulsoryCoursesRequired ? 
                          <span style={{ color: 'red' }}> (Chưa đủ)</span> : 
                          <span style={{ color: 'green' }}> (Đạt)</span>}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                    Các môn học cần hoàn thành:
                  </Typography>
                  
                  <List dense>
                    {graduationData.outstandingCourses.map((course) => (
                      <ListItem key={course.id}>
                        <ListItemText
                          primary={`${course.code} - ${course.name} (${course.credits} tín chỉ)`}
                          secondary={`Trạng thái: ${course.status === 'In Progress' ? 'Đang học' : 'Chưa hoàn thành'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
            
            {eligibleForGraduation ? (
              <Alert severity="success">
                Bạn đủ điều kiện để đăng ký xét tốt nghiệp. Vui lòng tiếp tục để hoàn thành quá trình đăng ký.
              </Alert>
            ) : (
              <Alert severity="warning">
                Bạn chưa đủ điều kiện để đăng ký xét tốt nghiệp. Vui lòng hoàn thành các yêu cầu còn thiếu.
              </Alert>
            )}
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Thông tin xét tốt nghiệp
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl sx={styles.formControl} fullWidth>
                  <InputLabel>Đợt xét tốt nghiệp</InputLabel>
                  <Select
                    value={selectedTerm}
                    onChange={handleTermChange}
                    label="Đợt xét tốt nghiệp"
                    required
                  >
                    <MenuItem value="2023-06">Đợt tháng 6/2023</MenuItem>
                    <MenuItem value="2023-09">Đợt tháng 9/2023</MenuItem>
                    <MenuItem value="2023-12">Đợt tháng 12/2023</MenuItem>
                    <MenuItem value="2024-03">Đợt tháng 3/2024</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Thông tin liên hệ sau tốt nghiệp
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Số điện thoại"
                  value={contactInfo.phone}
                  onChange={handleContactChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  value={contactInfo.email}
                  onChange={handleContactChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Địa chỉ liên hệ"
                  value={contactInfo.address}
                  onChange={handleContactChange}
                  fullWidth
                  multiline
                  rows={2}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xác nhận thông tin
            </Typography>
            
            <Card sx={styles.card}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Họ và tên:</strong> {currentUser ? currentUser.FullName : 'John Doe'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Mã số sinh viên:</strong> {currentUser ? currentUser.StudentId : '12345678'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Ngành học:</strong> {currentUser ? currentUser.Major : 'Computer Science'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Khoa/Viện:</strong> {currentUser ? currentUser.Faculty : 'Faculty of Information Technology'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Đợt xét tốt nghiệp:</strong> {
                        selectedTerm === '2023-06' ? 'Đợt tháng 6/2023' :
                        selectedTerm === '2023-09' ? 'Đợt tháng 9/2023' :
                        selectedTerm === '2023-12' ? 'Đợt tháng 12/2023' :
                        selectedTerm === '2024-03' ? 'Đợt tháng 3/2024' : ''
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Điểm trung bình tích lũy:</strong> {graduationData ? graduationData.currentGpa : ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      <strong>Thông tin liên hệ:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Số điện thoại: {contactInfo.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Email: {contactInfo.email}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Địa chỉ: {contactInfo.address}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmChecked}
                  onChange={handleConfirmCheck}
                  name="confirm"
                  color="primary"
                />
              }
              label="Tôi xác nhận thông tin trên là chính xác và đủ điều kiện xét tốt nghiệp theo quy định của trường"
            />
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Đăng ký xét tốt nghiệp
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Đăng ký tham gia xét tốt nghiệp cho sinh viên đã đủ điều kiện
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
            <strong>Thông tin quan trọng:</strong>
          </Typography>
          <Typography variant="body2" component="ul">
            <li>Trước khi đăng ký xét tốt nghiệp, sinh viên cần đảm bảo đã hoàn thành đầy đủ các điều kiện theo quy định của trường.</li>
            <li>Thời hạn đăng ký xét tốt nghiệp cho đợt tháng 12/2023: từ 01/11/2023 đến 15/11/2023.</li>
            <li>Điều kiện tốt nghiệp: hoàn thành tất cả các môn học bắt buộc và tự chọn, đủ số tín chỉ tối thiểu, điểm trung bình tích lũy từ 2.0 trở lên.</li>
            <li>Sinh viên cần cập nhật thông tin liên hệ chính xác để nhận thông báo và kết quả xét tốt nghiệp.</li>
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
              Yêu cầu đăng ký xét tốt nghiệp của bạn đã được gửi thành công. Vui lòng theo dõi email để biết kết quả xét duyệt.
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
                  (activeStep === 0 && !eligibleForGraduation) ||
                  (activeStep === 1 && (!selectedTerm || !contactInfo.phone || !contactInfo.email || !contactInfo.address)) ||
                  (activeStep === 2 && !confirmChecked)
                }
              >
                {activeStep === steps.length - 1 ? 'Xác nhận đăng ký' : 'Tiếp theo'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default GraduationRegistration; 
