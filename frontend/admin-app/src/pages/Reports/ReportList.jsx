/*-----------------------------------------------------------------
* File: ReportList.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  DeleteOutline,
  FlagOutlined,
  SearchOutlined,
  FilterListOutlined,
  RefreshOutlined,
  VisibilityOutlined,
  CheckCircleOutlineOutlined,
  CancelOutlined,
  FileDownloadOutlined,
  ArticleOutlined
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReportDetailsDialog from './ReportDetailsDialog';
import { useNotification } from '../../contexts/NotificationContext';
import * as reportsAPI from '../../api/reports';

const statusColors = {
  pending: 'warning',
  processing: 'info',
  resolved: 'success',
  rejected: 'error',
  deleted: 'default'
};

const ReportList = () => {
  const theme = useTheme();
  const { showNotification } = useNotification();
  
  // State
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [postError, setPostError] = useState(null);

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getReports({
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      });
      
      setReports(response.data.reports);
      setTotalItems(response.data.totalItems);
    } catch (error) {
      showNotification(error.message || 'Không thể tải danh sách báo cáo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage, filters, fetchReports]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // View report details
  const handleViewDetails = async (reportId) => {
    setLoading(true);
    try {
      const response = await reportsAPI.getReportById(reportId);
      setSelectedReport(response.data);
      setDetailsDialogOpen(true);
    } catch (error) {
      showNotification(error.message || 'Không thể tải chi tiết báo cáo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the reported post content
  const handleViewPost = async (reportId) => {
    setPostDialogOpen(true);
    setLoadingPost(true);
    setPostError(null);
    try {
      const response = await reportsAPI.getReportedContent(reportId);
      setCurrentPost(response.data.post);
    } catch (error) {
      console.error('Error loading reported post:', error);
      setPostError('Không thể tải nội dung bài viết');
    } finally {
      setLoadingPost(false);
    }
  };

  const closePostDialog = () => {
    setPostDialogOpen(false);
    setCurrentPost(null);
    setPostError(null);
  };

  // Open action dialog
  const handleOpenActionDialog = (report, type) => {
    setSelectedReport(report);
    setActionType(type);
    setActionReason('');
    setActionDialogOpen(true);
  };

  // Handle action confirmation
  const handleConfirmAction = async () => {
    if (!selectedReport || !actionType) return;
    
    setLoading(true);
    try {
      switch (actionType) {
        case 'approve':
          await reportsAPI.updateReportStatus(selectedReport.id, {
            status: 'resolved',
            notes: actionReason || 'Báo cáo đã được xác nhận và xử lý'
          });
          showNotification('Báo cáo đã được chấp thuận', 'success');
          break;
        
        case 'reject':
          await reportsAPI.updateReportStatus(selectedReport.id, {
            status: 'rejected',
            notes: actionReason || 'Báo cáo đã bị từ chối'
          });
          showNotification('Báo cáo đã bị từ chối', 'info');
          break;
        
        case 'delete':
          await reportsAPI.deleteReport(selectedReport.id);
          showNotification('Báo cáo đã được xóa', 'success');
          break;
        
        case 'delete-content':
          await reportsAPI.deleteReportedContent(selectedReport.id, { reason: actionReason });
          showNotification('Nội dung báo cáo đã được xóa', 'success');
          break;
        
        case 'flag-content':
          await reportsAPI.flagReportedContent(selectedReport.id, { reason: actionReason });
          showNotification('Nội dung báo cáo đã được gắn cờ vi phạm', 'success');
          break;
        
        default:
          throw new Error('Hành động không hợp lệ');
      }
      
      fetchReports();
    } catch (error) {
      showNotification(error.message || 'Không thể thực hiện hành động', 'error');
    } finally {
      setLoading(false);
      setActionDialogOpen(false);
    }
  };

  // Export reports
  const handleExportReports = async () => {
    setLoading(true);
    try {
      await reportsAPI.exportReportsAsCsv({
        status: filters.status,
        category: filters.category,
        search: filters.search
      });
      showNotification('Xuất báo cáo thành công', 'success');
    } catch (error) {
      showNotification(error.message || 'Không thể xuất báo cáo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      status: '',
      category: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setFilterDialogOpen(false);
  };

  // Apply new filters
  const handleApplyFilters = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setFilterDialogOpen(false);
  };

  // Format time ago
  const getFormattedTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Quản lý báo cáo</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FileDownloadOutlined />}
            onClick={handleExportReports}
          >
            Xuất CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterListOutlined />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Lọc
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={fetchReports}
          >
            Làm mới
          </Button>
        </Stack>
      </Box>

      <Box component={Paper} sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex' }}>
          <TextField
            variant="outlined"
            placeholder="Tìm kiếm báo cáo..."
            size="small"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            sx={{ flexGrow: 1, mr: 1 }}
            InputProps={{
              startAdornment: <SearchOutlined sx={{ mr: 1, color: theme.palette.grey[500] }} />
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setPage(0);
                fetchReports();
              }
            }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-select-label">Trạng thái</InputLabel>
            <Select
              labelId="status-select-label"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Trạng thái"
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="pending">Đang chờ</MenuItem>
              <MenuItem value="processing">Đang xử lý</MenuItem>
              <MenuItem value="resolved">Đã giải quyết</MenuItem>
              <MenuItem value="rejected">Đã từ chối</MenuItem>
              <MenuItem value="deleted">Đã xóa</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : reports.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">Không có báo cáo nào được tìm thấy</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Người báo cáo</TableCell>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      hover
                      key={report.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>#{report.id}</TableCell>
                      <TableCell>{report.reporterName || 'Ẩn danh'}</TableCell>
                      <TableCell>{report.category}</TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 200 }}>
                          {report.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            report.status === 'pending'
                              ? 'Đang chờ'
                              : report.status === 'processing'
                              ? 'Đang xử lý'
                              : report.status === 'resolved'
                              ? 'Đã giải quyết'
                              : report.status === 'rejected'
                              ? 'Đã từ chối'
                              : 'Đã xóa'
                          }
                          size="small"
                          color={statusColors[report.status]}
                        />
                      </TableCell>
                      <TableCell>{getFormattedTime(report.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(report.id)}
                            >
                              <VisibilityOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xem bài viết">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewPost(report.id)}
                            >
                              <ArticleOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {report.status === 'pending' && (
                            <>
                              <Tooltip title="Chấp thuận">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenActionDialog(report, 'approve')}
                                >
                                  <CheckCircleOutlineOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Từ chối">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenActionDialog(report, 'reject')}
                                >
                                  <CancelOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {report.targetType === 'CONTENT' && (
                                <Tooltip title="Xóa nội dung">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleOpenActionDialog(report, 'delete-content')}
                                  >
                                    <DeleteOutline fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalItems}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Box>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Lọc báo cáo</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={filters.status}
                label="Trạng thái"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="pending">Đang xử lý</MenuItem>
                <MenuItem value="resolved">Đã giải quyết</MenuItem>
                <MenuItem value="rejected">Đã từ chối</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>Loại báo cáo</InputLabel>
              <Select
                value={filters.category}
                label="Loại báo cáo"
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="USER">Người dùng</MenuItem>
                <MenuItem value="CONTENT">Nội dung</MenuItem>
                <MenuItem value="COMMENT">Bình luận</MenuItem>
                <MenuItem value="COURSE">Khóa học</MenuItem>
                <MenuItem value="OTHER">Khác</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>Sắp xếp theo</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sắp xếp theo"
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <MenuItem value="createdAt">Ngày tạo</MenuItem>
                <MenuItem value="status">Trạng thái</MenuItem>
                <MenuItem value="category">Loại báo cáo</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>Thứ tự</InputLabel>
              <Select
                value={filters.sortOrder}
                label="Thứ tự"
                onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
              >
                <MenuItem value="asc">Tăng dần</MenuItem>
                <MenuItem value="desc">Giảm dần</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters}>Đặt lại</Button>
          <Button 
            variant="contained" 
            onClick={() => setFilterDialogOpen(false)}
          >
            Áp dụng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'approve' && 'Chấp thuận báo cáo'}
          {actionType === 'reject' && 'Từ chối báo cáo'}
          {actionType === 'delete' && 'Xóa báo cáo'}
          {actionType === 'delete-content' && 'Xóa nội dung vi phạm'}
          {actionType === 'flag-content' && 'Gắn cờ nội dung vi phạm'}
        </DialogTitle>
        <DialogContent dividers>
          {actionType !== 'delete' && (
            <TextField
              autoFocus
              margin="dense"
              label="Lý do"
              fullWidth
              multiline
              rows={4}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={
                actionType === 'approve' 
                  ? 'Nhập ghi chú xử lý (không bắt buộc)'
                  : actionType === 'reject'
                  ? 'Nhập lý do từ chối (không bắt buộc)'
                  : 'Nhập lý do (không bắt buộc)'
              }
            />
          )}
          {actionType === 'delete' && (
            <Typography>
              Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            color={actionType === 'reject' || actionType === 'delete' ? 'error' : 'primary'}
            onClick={handleConfirmAction}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      {selectedReport && (
        <ReportDetailsDialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          report={selectedReport}
          onAction={(actionType) => {
            setDetailsDialogOpen(false);
            handleOpenActionDialog(selectedReport, actionType);
          }}
        />
      )}

      {/* Dialog for viewing reported post */}
      <Dialog open={postDialogOpen} onClose={closePostDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nội dung bài viết</DialogTitle>
        <DialogContent dividers>
          {loadingPost ? (
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 2 }}>Đang tải bài viết...</Typography>
            </Box>
          ) : postError ? (
            <Typography color="error" sx={{ p: 2 }}>{postError}</Typography>
          ) : currentPost ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1">{currentPost.content}</Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePostDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ReportList; 
