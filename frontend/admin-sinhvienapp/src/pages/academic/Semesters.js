import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { academicService } from '../../services/api';

const Semesters = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [filteredSemesters, setFilteredSemesters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await academicService.getAllSemesters();
      console.log('Semesters API response:', response);
      
      if (response.success) {
        // Map the response data to our component's expected format
        // Based on the Semesters table schema in datasinhvien.sql
        const semestersData = response.data ? response.data.map(semester => ({
          id: semester.SemesterID,
          code: semester.SemesterCode,
          name: semester.SemesterName,
          academicYear: semester.AcademicYear,
          startDate: new Date(semester.StartDate).toLocaleDateString('vi-VN'),
          endDate: new Date(semester.EndDate).toLocaleDateString('vi-VN'),
          registrationStartDate: semester.RegistrationStartDate ? 
            new Date(semester.RegistrationStartDate).toLocaleDateString('vi-VN') : 'N/A',
          registrationEndDate: semester.RegistrationEndDate ? 
            new Date(semester.RegistrationEndDate).toLocaleDateString('vi-VN') : 'N/A',
          status: semester.Status || 'Upcoming',
          isActive: semester.IsCurrent === true || semester.IsCurrent === 1,
          // Statistics fields may not be available in the response
          numberOfSubjects: 'N/A',
          numberOfStudents: 'N/A'
        })) : [];
        
        setSemesters(semestersData);
        setFilteredSemesters(semestersData);
      } else {
        throw new Error(response.message || 'Không thể tải danh sách học kỳ');
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
      setError('Không thể tải danh sách học kỳ. Vui lòng thử lại sau.');
      setSemesters([]);
      setFilteredSemesters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = semesters.filter(semester => 
        semester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        semester.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        semester.academicYear.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSemesters(filtered);
    } else {
      setFilteredSemesters(semesters);
    }
  }, [searchTerm, semesters]);

  const handleDeleteClick = (semester) => {
    setSelectedSemester(semester);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteDialogOpen(false);
      
      // Call API to delete the semester
      const response = await academicService.deleteSemester(selectedSemester.id);
      
      if (response && response.success) {
        // Update local state on success
    const updatedSemesters = semesters.filter(
      semester => semester.id !== selectedSemester.id
    );
    setSemesters(updatedSemesters);
        setFilteredSemesters(
          filteredSemesters.filter(semester => semester.id !== selectedSemester.id)
        );
        
        setError({
          message: 'Xóa học kỳ thành công',
          severity: 'success'
        });
      } else {
        throw new Error(response?.message || 'Không thể xóa học kỳ');
      }
    } catch (error) {
      console.error('Error deleting semester:', error);
      setError({
        message: error.message || 'Không thể xóa học kỳ. Vui lòng thử lại sau.',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Đã kết thúc':
        return 'success';
      case 'In Progress':
      case 'Ongoing':
      case 'Đang diễn ra':
        return 'primary';
      case 'Planned':
      case 'Upcoming':
      case 'Sắp tới':
        return 'warning';
      case 'Cancelled':
      case 'Đã hủy':
        return 'error';
      default:
        return 'default';
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'Completed':
        return 'Đã kết thúc';
      case 'In Progress':
      case 'Ongoing':
        return 'Đang diễn ra';
      case 'Planned':
      case 'Upcoming':
        return 'Sắp tới';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Quản lý học kỳ
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          label="Tìm kiếm học kỳ"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '300px' }}
          InputProps={{
            endAdornment: <SearchIcon color="action" />,
          }}
        />
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/academic/semesters/add"
        >
          Thêm học kỳ mới
        </Button>
      </Box>

      {error && (
        <Alert 
          severity={error.severity || "error"} 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error.message || error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã học kỳ</TableCell>
              <TableCell>Tên học kỳ</TableCell>
              <TableCell>Năm học</TableCell>
              <TableCell>Ngày bắt đầu</TableCell>
              <TableCell>Ngày kết thúc</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Đang diễn ra</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredSemesters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Không tìm thấy học kỳ nào
                </TableCell>
              </TableRow>
            ) : (
              filteredSemesters.map((semester) => (
                <TableRow key={semester.id}>
                  <TableCell>{semester.code}</TableCell>
                  <TableCell>{semester.name}</TableCell>
                  <TableCell>{semester.academicYear}</TableCell>
                  <TableCell>{semester.startDate}</TableCell>
                  <TableCell>{semester.endDate}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={translateStatus(semester.status)} 
                      color={getStatusColor(semester.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={semester.isActive ? 'Có' : 'Không'} 
                      color={semester.isActive ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem chi tiết">
                      <IconButton 
                        size="small" 
                        component={Link} 
                        to={`/academic/semesters/${semester.id}`}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton 
                        size="small" 
                        component={Link} 
                        to={`/academic/semesters/${semester.id}/edit`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton 
                        size="small"
                        onClick={() => handleDeleteClick(semester)}
                        disabled={semester.status === 'In Progress' || 
                                 semester.status === 'Ongoing' || 
                                 semester.status === 'Đang diễn ra'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Xóa học kỳ</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa học kỳ "{selectedSemester?.name}"? 
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Semesters; 