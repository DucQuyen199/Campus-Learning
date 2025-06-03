import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Paper,
  Link,
  Stack,
  Breadcrumbs,
} from '@mui/material';
import {
  ArrowBack,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Person,
  School,
// eslint-disable-next-line no-unused-vars
  CalendarMonth,
  Info,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { academicService } from '../../../services/api';

const AcademicWarningDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [openResolveDialog, setOpenResolveDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState(null);

  // Fetch warning details
  useEffect(() => {
    const fetchWarningDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await academicService.getAcademicWarningById(id);
        setWarning(data.warning || null);
      } catch (error) {
        setError('Không thể tải thông tin cảnh báo. Vui lòng thử lại sau.');
        console.error('Failed to fetch warning details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWarningDetails();
    }
  }, [id]);

  // Dialog handlers
  const handleOpenResolveDialog = () => {
    setOpenResolveDialog(true);
  };

  const handleCloseResolveDialog = () => {
    setOpenResolveDialog(false);
    setResolution('');
    setResolutionError(null);
  };

  // Resolve warning
  const handleResolveWarning = async () => {
    if (!resolution.trim()) {
      setResolutionError('Vui lòng nhập thông tin giải quyết');
      return;
    }

    setResolving(true);
    setResolutionError(null);
    try {
      await academicService.resolveAcademicWarning(id, { resolution });
      
      // Refresh warning data after resolution
      const data = await academicService.getAcademicWarningById(id);
      setWarning(data.warning || null);
      
      handleCloseResolveDialog();
    } catch (error) {
      setResolutionError('Không thể giải quyết cảnh báo. Vui lòng thử lại sau.');
      console.error('Failed to resolve warning:', error);
    } finally {
      setResolving(false);
    }
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Đang cảnh báo" color="error" size="small" icon={<WarningIcon />} />;
      case 'resolved':
        return <Chip label="Đã giải quyết" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'expired':
        return <Chip label="Hết hạn" color="default" size="small" />;
      default:
        return <Chip label="Không xác định" color="default" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/academic/warnings')}
        >
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  if (!warning) {
    return (
      <Box sx={{ my: 3 }}>
        <Alert severity="warning">Không tìm thấy thông tin cảnh báo học tập</Alert>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/academic/warnings')}
        >
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

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
        <Typography color="text.primary">Chi tiết cảnh báo</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Chi tiết cảnh báo học tập
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ID: {warning.id} | Trạng thái: {getStatusChip(warning.status)}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/academic/warnings')}
            sx={{ mr: 1 }}
          >
            Quay lại
          </Button>
          {warning.status === 'active' && (
            <>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/academic/warnings/${id}/edit`)}
                sx={{ mr: 1 }}
              >
                Chỉnh sửa
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={handleOpenResolveDialog}
              >
                Giải quyết
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Student Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} /> Thông tin sinh viên
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Mã sinh viên</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{warning.studentCode}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Họ tên</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{warning.studentName}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Lớp</Typography>
                  <Typography variant="body1">{warning.className}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{warning.studentEmail}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Điện thoại</Typography>
                  <Typography variant="body1">{warning.studentPhone || '--'}</Typography>
                </Box>
                
                <Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(`/students/${warning.studentId}`)}
                  >
                    Xem hồ sơ sinh viên
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Academic Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <School sx={{ mr: 1 }} /> Thông tin học tập
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Chương trình đào tạo</Typography>
                  <Typography variant="body1">{warning.programName}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Khoa/Bộ môn</Typography>
                  <Typography variant="body1">{warning.facultyName}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Học kỳ</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{warning.semesterName}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Điểm trung bình học kỳ</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{warning.semesterGPA || '--'}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Điểm trung bình tích lũy</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{warning.cumulativeGPA || '--'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Warning Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1 }} /> Thông tin cảnh báo
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Loại cảnh báo</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{warning.warningType}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(warning.status)}</Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Ngày tạo</Typography>
                  <Typography variant="body1">{new Date(warning.createdAt).toLocaleDateString('vi-VN')}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Tạo bởi</Typography>
                  <Typography variant="body1">{warning.createdBy}</Typography>
                </Box>
                
                {warning.resolvedAt && (
                  <>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Ngày giải quyết</Typography>
                      <Typography variant="body1">{new Date(warning.resolvedAt).toLocaleDateString('vi-VN')}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Giải quyết bởi</Typography>
                      <Typography variant="body1">{warning.resolvedBy}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reason & Detail */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1 }} /> Lý do và chi tiết
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Lý do cảnh báo</Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}
                >
                  <Typography variant="body1">{warning.reason}</Typography>
                </Paper>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>Mô tả chi tiết</Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}
                >
                  <Typography variant="body1">{warning.details || 'Không có mô tả chi tiết'}</Typography>
                </Paper>
              </Box>
              
              {warning.status === 'resolved' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Thông tin giải quyết</Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ p: 2, backgroundColor: 'rgba(76,175,80,0.05)', borderRadius: 2, borderColor: 'success.light' }}
                  >
                    <Typography variant="body1">{warning.resolution}</Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Resolve Dialog */}
      <Dialog open={openResolveDialog} onClose={handleCloseResolveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Giải quyết cảnh báo học tập</DialogTitle>
        <DialogContent>
          {resolutionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resolutionError}
            </Alert>
          )}
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Vui lòng nhập thông tin về cách giải quyết cảnh báo này.
          </Typography>
          
          <TextField
            autoFocus
            label="Thông tin giải quyết"
            multiline
            rows={4}
            fullWidth
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            error={!!resolutionError}
            disabled={resolving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResolveDialog} disabled={resolving}>
            Hủy
          </Button>
          <Button 
            onClick={handleResolveWarning} 
            variant="contained" 
            color="primary"
            disabled={resolving}
            startIcon={resolving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {resolving ? 'Đang xử lý...' : 'Xác nhận giải quyết'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicWarningDetail;