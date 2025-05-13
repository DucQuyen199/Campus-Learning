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
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Send } from '@mui/icons-material';

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
  const [content, setContent] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [history, setHistory] = useState([]);

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

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setHistory(feedbackHistory);
  }, []);

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const handleContentChange = (event) => {
    setContent(event.target.value);
  };

  const handleSubmit = () => {
    // Validate form
    if (!title || !category || !content) {
      setSubmitStatus({
        type: 'error',
        message: 'Vui lòng điền đầy đủ thông tin.'
      });
      return;
    }

    // In a real application, this would send data to an API
    // Add new feedback to history
    const newFeedback = {
      id: history.length + 1,
      title,
      category: feedbackCategories.find(c => c.id === category)?.name || '',
      content,
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'Pending',
      response: null
    };

    setHistory([newFeedback, ...history]);

    // Reset form
    setTitle('');
    setCategory('');
    setContent('');

    // Show success message
    setSubmitStatus({
      type: 'success',
      message: 'Góp ý của bạn đã được gửi thành công!'
    });

    // Clear status after a delay
    setTimeout(() => {
      setSubmitStatus(null);
    }, 3000);
  };

  const getStatusChip = (status) => {
    if (status === 'Answered') {
      return <Chip label="Đã trả lời" color="success" size="small" />;
    } else {
      return <Chip label="Đang xử lý" color="warning" size="small" />;
    }
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
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth sx={styles.formControl}>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={category}
                onChange={handleCategoryChange}
                label="Danh mục"
                required
              >
                {feedbackCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
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
              placeholder="Mô tả chi tiết ý kiến, phản ánh hoặc đề xuất của bạn..."
            />
          </Grid>
        </Grid>

        <Box sx={styles.buttonGroup}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Send />}
            onClick={handleSubmit}
          >
            Gửi ý kiến
          </Button>
        </Box>
      </Paper>

      <Box sx={styles.historySection}>
        <Typography variant="h5" gutterBottom>
          Lịch sử phản hồi
        </Typography>

        {history.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Danh mục</TableCell>
                  <TableCell>Ngày gửi</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Chi tiết</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((feedback) => (
                  <React.Fragment key={feedback.id}>
                    <TableRow>
                      <TableCell>{feedback.title}</TableCell>
                      <TableCell>{feedback.category}</TableCell>
                      <TableCell>{feedback.date}</TableCell>
                      <TableCell>{getStatusChip(feedback.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            // In a real app, this would open a modal with details
                            alert(`Content: ${feedback.content}\nResponse: ${feedback.response || 'No response yet'}`);
                          }}
                        >
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
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
    </div>
  );
};

export default Feedback; 