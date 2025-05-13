import React, { useState } from 'react';
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
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Sample majors
const availableMajors = [
  { id: 1, code: 'CS', name: 'Computer Science', faculty: 'Faculty of Information Technology' },
  { id: 2, code: 'BA', name: 'Business Administration', faculty: 'Faculty of Business' },
  { id: 3, code: 'FIN', name: 'Finance', faculty: 'Faculty of Economics' },
  { id: 4, code: 'ME', name: 'Mechanical Engineering', faculty: 'Faculty of Engineering' },
  { id: 5, code: 'ENG', name: 'English Studies', faculty: 'Faculty of Foreign Languages' }
];

const steps = ['Chọn ngành học', 'Thông tin bổ sung', 'Xác nhận'];

const SecondMajor = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [reason, setReason] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [currentGPA, setCurrentGPA] = useState('3.2'); // This would come from API
  
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
    }
  };

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
  };

  const handleMajorChange = (event) => {
    setSelectedMajor(event.target.value);
  };

  const handleReasonChange = (event) => {
    setReason(event.target.value);
  };

  const handleSubmit = () => {
    // This would send the registration to an API
    setRegistrationStatus({
      type: 'success',
      message: 'Đăng ký học ngành 2 thành công. Yêu cầu của bạn đang được xử lý.'
    });
    setActiveStep(steps.length);
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
                  <MenuItem key={major.id} value={major.id}>
                    {major.name} ({major.code})
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
                      {selectedMajor ? availableMajors.find(m => m.id === selectedMajor)?.name : 'Chưa chọn'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">
                      Khoa/Viện
                    </Typography>
                    <Typography variant="body1">
                      {selectedMajor ? availableMajors.find(m => m.id === selectedMajor)?.faculty : 'Chưa chọn'}
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
                disabled={(activeStep === 0 && !selectedMajor) || (activeStep === 1 && !reason)}
              >
                {activeStep === steps.length - 1 ? 'Xác nhận' : 'Tiếp theo'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default SecondMajor; 