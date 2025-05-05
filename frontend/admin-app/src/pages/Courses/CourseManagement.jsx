import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI } from '../../api';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { isAuthenticated } = useAuth();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        throw new Error('Bạn cần đăng nhập để xem thông tin khóa học');
      }
      
      // Use coursesAPI instead of direct api call
      const response = await coursesAPI.getCourses();
      
      if (response.data?.courses) {
        setCourses(response.data.courses);
      } else {
        console.warn('Unexpected response format:', response);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error.message || 'Không thể tải danh sách khóa học');
      showNotification('Lỗi khi tải danh sách khóa học', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [isAuthenticated]);

  const handleEdit = (courseId) => {
    navigate(`/courses/edit/${courseId}`);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
      try {
        await coursesAPI.deleteCourse(courseId);
        showNotification('Xóa khóa học thành công', 'success');
        fetchCourses();
      } catch (error) {
        showNotification('Lỗi khi xóa khóa học', 'error');
      }
    }
  };

  const handleRefresh = () => {
    fetchCourses();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quản lý khóa học</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={{ mr: 2 }}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/courses/create')}
          >
            Tạo khóa học
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell>Cấp độ</TableCell>
                <TableCell>Giá</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length > 0 ? (
                courses.map((course) => (
                  <TableRow key={course.CourseID}>
                    <TableCell>{course.Title}</TableCell>
                    <TableCell>{course.Category}</TableCell>
                    <TableCell>{course.Level}</TableCell>
                    <TableCell>{course.Price ? `${course.Price} VND` : 'Miễn phí'}</TableCell>
                    <TableCell>{course.Status || (course.IsPublished ? 'Đã xuất bản' : 'Bản nháp')}</TableCell>
                    <TableCell>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => handleEdit(course.CourseID)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton onClick={() => handleDelete(course.CourseID)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không có khóa học nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CourseManagement; 