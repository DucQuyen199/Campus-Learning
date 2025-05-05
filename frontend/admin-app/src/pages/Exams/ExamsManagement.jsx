import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getAllExams } from '../../api/exams';

const ExamsManagement = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await getAllExams(queryParams.toString());
      
      // Transform data để khớp với cấu trúc DataGrid
      const transformedExams = response.exams.map(exam => ({
        ...exam,
        id: exam.ExamID, // Đảm bảo có trường id cho DataGrid
        Title: exam.Title,
        Type: exam.Type.toLowerCase(),
        Status: exam.Status.toLowerCase(),
        startTime: exam.StartTime || exam.startTime,
        Duration: exam.Duration,
        QuestionCount: exam.QuestionCount || 0,
        ParticipantCount: exam.ParticipantCount || 0,
        CourseTitle: exam.CourseTitle || 'Không có khóa học'
      }));

      setExams(transformedExams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Không thể tải danh sách bài thi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [filters]);

  const columns = [
    { 
      field: 'Title', 
      headerName: 'Tiêu đề', 
      width: 250,
      flex: 1 
    },
    { 
      field: 'Type', 
      headerName: 'Loại bài thi', 
      width: 150,
      renderCell: (params) => {
        const typeMap = {
          'multiple_choice': 'Trắc nghiệm',
          'essay': 'Tự luận',
          'coding': 'Lập trình',
          'mixed': 'Hỗn hợp'
        };
        return typeMap[params.value] || params.value;
      }
    },
    { 
      field: 'Status', 
      headerName: 'Trạng thái', 
      width: 130,
      renderCell: (params) => {
        const statusMap = {
          'upcoming': 'Sắp diễn ra',
          'ongoing': 'Đang diễn ra',
          'completed': 'Đã kết thúc',
          'cancelled': 'Đã hủy'
        };
        return statusMap[params.value] || params.value;
      }
    },
    { 
      field: 'startTime', 
      headerName: 'Thời gian bắt đầu', 
      width: 180,
      renderCell: (params) => {
        try {
          return new Date(params.value).toLocaleString('vi-VN');
        } catch (e) {
          return 'Không xác định';
        }
      }
    },
    { 
      field: 'Duration', 
      headerName: 'Thời gian làm bài', 
      width: 150,
      renderCell: (params) => `${params.value || 0} phút`
    },
    { 
      field: 'QuestionCount', 
      headerName: 'Số câu hỏi', 
      width: 120,
      renderCell: (params) => params.value || 0
    },
    { 
      field: 'ParticipantCount', 
      headerName: 'Số người tham gia', 
      width: 150,
      renderCell: (params) => params.value || 0
    },
    { 
      field: 'CourseTitle', 
      headerName: 'Khóa học', 
      width: 200,
      renderCell: (params) => params.value || 'Không có khóa học'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý bài thi
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Loại bài thi</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="multiple_choice">Trắc nghiệm</MenuItem>
                  <MenuItem value="essay">Tự luận</MenuItem>
                  <MenuItem value="coding">Lập trình</MenuItem>
                  <MenuItem value="mixed">Hỗn hợp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="upcoming">Sắp diễn ra</MenuItem>
                  <MenuItem value="ongoing">Đang diễn ra</MenuItem>
                  <MenuItem value="completed">Đã kết thúc</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tìm kiếm"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setFilters({ type: '', status: '', search: '' })}
              >
                Đặt lại
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <DataGrid
        rows={exams}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        autoHeight
        loading={loading}
        getRowId={(row) => row.id || row.ExamID}
        disableSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell': {
            whiteSpace: 'normal',
            lineHeight: 'normal',
            padding: '8px'
          }
        }}
      />
    </Box>
  );
};

export default ExamsManagement; 