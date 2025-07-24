/*-----------------------------------------------------------------
* File: Feedback.js
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
  Box,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Close } from '@mui/icons-material';
import axios from 'axios';

// Sample feedback categories
const feedbackCategories = [
  { id: 1, name: 'Cơ sở vật chất' },
  { id: 2, name: 'Chương trình đào tạo' },
  { id: 3, name: 'Dịch vụ sinh viên' },
  { id: 4, name: 'Hoạt động ngoại khóa' },
  { id: 5, name: 'Khác' }
];

// Sample feedback history
const feedbackHistory = [
  {
    id: 1,
    title: 'Về điều kiện phòng học',
    category: 'Cơ sở vật chất',
    content: 'Phòng học A301 thường xuyên bị hỏng điều hòa, gây khó khăn trong việc học tập.',
    date: '10/11/2023',
    status: 'Answered',
    response: 'Cảm ơn bạn đã phản ánh. Chúng tôi đã ghi nhận và sẽ sửa chữa điều hòa trong tuần này.'
  },
  {
    id: 2,
    title: 'Đề xuất thêm hoạt động ngoại khóa',
    category: 'Hoạt động ngoại khóa',
    content: 'Tôi muốn đề xuất tổ chức thêm các hoạt động thể thao cho sinh viên vào cuối tuần.',
    date: '05/10/2023',
    status: 'Pending',
    response: null
  },
  {
    id: 3,
    title: 'Góp ý về thời khóa biểu',
    category: 'Chương trình đào tạo',
    content: 'Thời khóa biểu hiện tại có quá nhiều thời gian trống giữa các tiết học, gây lãng phí thời gian.',
    date: '20/09/2023',
    status: 'Answered',
    response: 'Cảm ơn góp ý của bạn. Chúng tôi sẽ xem xét điều chỉnh trong học kỳ tới.'
  }
];

const Feedback = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [feedbackCategories, setFeedbackCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    feedback: null
  });

  // Styles using theme directly instead of makeStyles
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
      marginBottom: theme.spacing(3)
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: theme.spacing(3)
    },
    historySection: {
      marginTop: theme.spacing(4)
    }
  };

  // Fetch feedback categories and departments
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/feedback/metadata`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setFeedbackCategories(response.data.types);
          setDepartments(response.data.departments);
        }
      } catch (error) {
        console.error('Error fetching feedback metadata:', error);
      }
    };
    
    fetchMetadata();
  }, []);

  // Fetch feedback history
  useEffect(() => {
    const fetchFeedbackHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/feedback/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setHistory(response.data.feedback || []);
        }
      } catch (error) {
        console.error('Error fetching feedback history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };
    
    fetchFeedbackHistory();
  }, []);

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };
  
  const handleDepartmentChange = (event) => {
    setDepartment(event.target.value);
  };

  const handleContentChange = (event) => {
    setContent(event.target.value);
  };
  
  const handleAnonymousChange = (event) => {
    setIsAnonymous(event.target.checked);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!title || !category || !content || !department) {
      setSubmitStatus({
        type: 'error',
        message: 'Vui lòng điền đầy đủ thông tin.'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/feedback`, {
        title,
        content,
        type: category,
        department,
        isAnonymous
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Reset form
        setTitle('');
        setCategory('');
        setContent('');
        setDepartment('');
        setIsAnonymous(false);

        // Show success message
        setSubmitStatus({
          type: 'success',
          message: response.data.message || 'Góp ý của bạn đã được gửi thành công!'
        });

        // Refresh feedback history
        fetchUpdatedHistory();
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.data.message || 'Có lỗi xảy ra khi gửi ý kiến.'
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi ý kiến.'
      });
    } finally {
      setLoading(false);
      
      // Clear status after a delay
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }
  };
  
  const fetchUpdatedHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feedback/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setHistory(response.data.feedback || []);
      }
    } catch (error) {
      console.error('Error refreshing feedback history:', error);
    }
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'Submitted':
        return <Chip label="Đã gửi" color="primary" size="small" />;
      case 'Processing':
        return <Chip label="Đang xử lý" color="warning" size="small" />;
      case 'Responded':
        return <Chip label="Đã trả lời" color="success" size="small" />;
      case 'Resolved':
        return <Chip label="Đã giải quyết" color="success" size="small" />;
      case 'Rejected':
        return <Chip label="Từ chối" color="error" size="small" />;
      default:
        return <Chip label="Đang xử lý" color="warning" size="small" />;
    }
  };
  
  const handleViewDetails = (feedback) => {
    setDetailDialog({
      open: true,
      feedback
    });
  };
  
  const handleCloseDetails = () => {
    setDetailDialog({
      open: false,
      feedback: null
    });
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Gửi ý kiến
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Gửi góp ý, phản ánh hoặc đề xuất của bạn đến nhà trường
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {submitStatus && (
          <Alert 
            severity={submitStatus.type} 
            sx={{ mb: 3 }}
            onClose={() => setSubmitStatus(null)}
          >
            {submitStatus.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Tiêu đề"
              value={title}
              onChange={handleTitleChange}
              fullWidth
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={styles.formControl} required>
              <InputLabel>Loại góp ý</InputLabel>
              <Select
                value={category}
                onChange={handleCategoryChange}
                label="Loại góp ý"
                disabled={loading}
              >
                {feedbackCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={styles.formControl} required>
              <InputLabel>Phòng ban</InputLabel>
              <Select
                value={department}
                onChange={handleDepartmentChange}
                label="Phòng ban"
                disabled={loading}
              >
                {departments.map((dept, index) => (
                  <MenuItem key={index} value={dept.name}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Nội dung"
              value={content}
              onChange={handleContentChange}
              multiline
              rows={6}
              fullWidth
              required
              disabled={loading}
              placeholder="Mô tả chi tiết ý kiến, phản ánh hoặc đề xuất của bạn..."
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={isAnonymous} 
                  onChange={handleAnonymousChange}
                  disabled={loading}
                />
              }
              label="Gửi ẩn danh (không hiển thị thông tin cá nhân của bạn)"
            />
          </Grid>
        </Grid>

        <Box sx={styles.buttonGroup}>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi ý kiến'}
          </Button>
        </Box>
      </Paper>

      <Box sx={styles.historySection}>
        <Typography variant="h5" gutterBottom>
          Lịch sử phản hồi
        </Typography>

        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
            <CircularProgress />
          </Box>
        ) : history.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Phòng ban</TableCell>
                  <TableCell>Ngày gửi</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Chi tiết</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>{feedback.title}</TableCell>
                    <TableCell>
                      {feedbackCategories.find(cat => cat.id === feedback.category)?.name || feedback.category}
                    </TableCell>
                    <TableCell>{feedback.department}</TableCell>
                    <TableCell>{feedback.date}</TableCell>
                    <TableCell>{getStatusChip(feedback.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(feedback)}
                      >
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center">
                Bạn chưa gửi ý kiến nào.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
      
      {/* Feedback Detail Dialog */}
      <Dialog 
        open={detailDialog.open} 
        onClose={handleCloseDetails}
        fullWidth
        maxWidth="md"
      >
        {detailDialog.feedback && (
          <>
            <DialogTitle>
              Chi tiết góp ý
              <IconButton
                aria-label="close"
                onClick={handleCloseDetails}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{detailDialog.feedback.title}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Gửi vào: {detailDialog.feedback.date}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Loại góp ý:</Typography>
                  <Typography variant="body2">
                    {feedbackCategories.find(cat => cat.id === detailDialog.feedback.category)?.name || detailDialog.feedback.category}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Phòng ban:</Typography>
                  <Typography variant="body2">{detailDialog.feedback.department}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Trạng thái:</Typography>
                  <Box sx={{ mt: 1 }}>
                    {getStatusChip(detailDialog.feedback.status)}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Nội dung:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body2">{detailDialog.feedback.content}</Typography>
                  </Paper>
                </Grid>
                
                {detailDialog.feedback.response && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Phản hồi:</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: '#e8f5e9' }}>
                      <Typography variant="body2">{detailDialog.feedback.response}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default Feedback; 
