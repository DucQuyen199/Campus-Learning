import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  useTheme
} from '@mui/material';
import MainCard from 'components/MainCard';
import { getReportStats } from 'api/reports';
import { useSnackbar } from 'notistack';
import LoadingBackdrop from 'components/LoadingBackdrop';
import NoDataMessage from 'components/NoDataMessage';
import { RefreshOutlined } from '@mui/icons-material';

const ReportDashboard = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    processingReports: 0,
    resolvedReports: 0,
    rejectedReports: 0,
    categoryStats: [],
    lastWeekReports: []
  });

  // Fetch report stats
  const fetchReportStats = async () => {
    setLoading(true);
    try {
      const response = await getReportStats();
      setStats(response.data);
    } catch (error) {
      enqueueSnackbar(error.message || 'Không thể tải thống kê báo cáo', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReportStats();
  }, []);

  return (
    <MainCard 
      title="Tổng quan báo cáo" 
      secondary={
        <Button
          variant="outlined"
          startIcon={<RefreshOutlined />}
          onClick={fetchReportStats}
        >
          Làm mới
        </Button>
      }
    >
      <Grid container spacing={3}>
        {/* Statistics cards */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ bgcolor: theme.palette.primary.light }}>
            <CardContent>
              <Typography variant="h6" color="primary.dark">Tổng số báo cáo</Typography>
              <Typography variant="h3" color="primary.dark" sx={{ mt: 1 }}>
                {stats.totalReports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ bgcolor: theme.palette.warning.light }}>
            <CardContent>
              <Typography variant="h6" color="warning.dark">Báo cáo chờ xử lý</Typography>
              <Typography variant="h3" color="warning.dark" sx={{ mt: 1 }}>
                {stats.pendingReports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ bgcolor: theme.palette.success.light }}>
            <CardContent>
              <Typography variant="h6" color="success.dark">Báo cáo đã giải quyết</Typography>
              <Typography variant="h3" color="success.dark" sx={{ mt: 1 }}>
                {stats.resolvedReports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ bgcolor: theme.palette.error.light }}>
            <CardContent>
              <Typography variant="h6" color="error.dark">Báo cáo bị từ chối</Typography>
              <Typography variant="h3" color="error.dark" sx={{ mt: 1 }}>
                {stats.rejectedReports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Category stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Phân loại báo cáo" />
            <Divider />
            <CardContent>
              {stats.categoryStats && stats.categoryStats.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  {stats.categoryStats.map((category, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        {category.category || 'Chưa phân loại'}: {category.count}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5,
                          height: 10,
                          borderRadius: 5,
                          bgcolor: theme.palette.grey[200],
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            bgcolor: theme.palette.primary.main,
                            width: `${(category.count / stats.totalReports) * 100}%`
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <NoDataMessage message="Không có dữ liệu" subMessage="Chưa có phân loại báo cáo" />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Status distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Phân bố trạng thái báo cáo" />
            <Divider />
            <CardContent>
              {stats.totalReports > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card variant="outlined" sx={{ 
                        bgcolor: theme.palette.warning.light, 
                        p: 2, 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Typography variant="h3" color="warning.dark">
                          {stats.pendingReports}
                        </Typography>
                        <Typography variant="body2" color="warning.dark">
                          Đang chờ
                        </Typography>
                        <Typography variant="caption" color="warning.dark">
                          {Math.round((stats.pendingReports / stats.totalReports) * 100)}%
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined" sx={{ 
                        bgcolor: theme.palette.info.light, 
                        p: 2, 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Typography variant="h3" color="info.dark">
                          {stats.processingReports}
                        </Typography>
                        <Typography variant="body2" color="info.dark">
                          Đang xử lý
                        </Typography>
                        <Typography variant="caption" color="info.dark">
                          {Math.round((stats.processingReports / stats.totalReports) * 100)}%
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined" sx={{ 
                        bgcolor: theme.palette.success.light, 
                        p: 2, 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Typography variant="h3" color="success.dark">
                          {stats.resolvedReports}
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          Đã giải quyết
                        </Typography>
                        <Typography variant="caption" color="success.dark">
                          {Math.round((stats.resolvedReports / stats.totalReports) * 100)}%
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined" sx={{ 
                        bgcolor: theme.palette.error.light, 
                        p: 2, 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Typography variant="h3" color="error.dark">
                          {stats.rejectedReports}
                        </Typography>
                        <Typography variant="body2" color="error.dark">
                          Đã từ chối
                        </Typography>
                        <Typography variant="caption" color="error.dark">
                          {Math.round((stats.rejectedReports / stats.totalReports) * 100)}%
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <NoDataMessage message="Không có dữ liệu" subMessage="Chưa có báo cáo nào trong hệ thống" />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent reports */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Báo cáo gần đây" />
            <Divider />
            <CardContent>
              {stats.lastWeekReports && stats.lastWeekReports.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Grid container spacing={2}>
                    {stats.lastWeekReports.map((item, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>{item.date}</Typography>
                          <Typography variant="h3">{item.count}</Typography>
                          <Typography variant="body2" color="textSecondary">báo cáo mới</Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <NoDataMessage message="Không có dữ liệu" subMessage="Chưa có báo cáo nào trong 7 ngày qua" />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading Overlay */}
      <LoadingBackdrop open={loading} />
    </MainCard>
  );
};

export default ReportDashboard; 