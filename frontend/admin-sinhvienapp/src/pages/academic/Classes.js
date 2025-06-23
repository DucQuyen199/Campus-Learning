import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
} from '@mui/material';
import { classesService } from '../../services/api';

function Classes() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classesService.getAllClasses();
      if (response.success) {
        setClasses(response.data);
      } else {
        setError(response.message || 'Lỗi khi tải lớp học');
      }
    } catch (err) {
      console.error('Fetch classes error', err);
      setError(err.message || 'Lỗi khi tải lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Quản lý lớp học</Typography>
        {/* Placeholder for future add class feature */}
        <Button variant="contained" disabled>
          Thêm lớp (sắp có)
        </Button>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã lớp</TableCell>
                <TableCell>Môn học</TableCell>
                <TableCell>Học kỳ</TableCell>
                <TableCell>Giảng viên</TableCell>
                <TableCell>Sĩ số</TableCell>
                <TableCell>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.ClassID} hover>
                  <TableCell>{cls.ClassCode}</TableCell>
                  <TableCell>{cls.SubjectName}</TableCell>
                  <TableCell>{cls.SemesterName}</TableCell>
                  <TableCell>{cls.TeacherName || '-'}</TableCell>
                  <TableCell>{cls.EnrolledStudents}/{cls.MaxStudents || '-'}</TableCell>
                  <TableCell>{cls.Status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default Classes; 