import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Download as DownloadIcon, 
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  School as SchoolIcon,
  AccountBalanceWallet as WalletIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { tuitionService, academicService } from '../../services/api';

const TuitionStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('2023-2024');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statisticsData, setStatisticsData] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Fetch available programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await academicService.getAllPrograms();
        if (response && response.data) {
          setPrograms(response.data);
        }
      } catch (error) {
        console.error('Không thể tải danh sách chương trình học:', error);
      }
    };
    fetchPrograms();
  }, []);

  // Fetch available semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await academicService.getAllSemesters();
        if (response && response.data) {
          setSemesters(response.data);
          
          // Extract unique academic years
          const years = [...new Set(response.data.map(sem => sem.AcademicYear))];
          setAcademicYears(years);
          
          // Set default year to current year if available
          if (years.length > 0) {
            setYearFilter(years[0]);
          }
        }
      } catch (error) {
        console.error('Không thể tải danh sách học kỳ:', error);
      }
    };
    fetchSemesters();
  }, []);

  // Fetch statistics when filters change
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fixed: correctly pass semesterId parameter
        const { statistics } = await tuitionService.getTuitionStatistics(semesterFilter);
        setStatisticsData(statistics);
      } catch (error) {
        console.error('Không thể tải thống kê học phí:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [semesterFilter]);

  // Filter semesters based on selected academic year
  const filteredSemesters = semesters.filter(
    sem => !yearFilter || sem.AcademicYear === yearFilter
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleExport = () => {
    console.log('Đang xuất thống kê...');
    // Implement export functionality
  };

  const handlePrint = () => {
    console.log('Đang in thống kê...');
    // Implement print functionality
  };

  const handleSemesterChange = (event) => {
    setSemesterFilter(event.target.value);
  };

  const handleProgramChange = (event) => {
    setProgramFilter(event.target.value);
    // Note: Currently the backend doesn't support filtering by program
    // This would need to be implemented server-side
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!statisticsData) return null;
  // Handle static (data.summary) or dynamic (overview) response shapes
  const raw = statisticsData;
  // Summary data
  const summary = raw.overview || raw.summary || (raw.data && raw.data.summary) || {};
  const totalAmount = summary.TotalAmount ?? summary.totalTuition ?? 0;
  const collectedAmount = summary.TotalPaid ?? summary.collectedAmount ?? 0;
  const outstandingAmount = summary.TotalUnpaid ?? summary.outstandingAmount ?? 0;
  const paymentRate = summary.paymentRate ?? (totalAmount > 0 ? ((collectedAmount / totalAmount) * 100).toFixed(1) : 0);
  // Payment methods
  const pieData = (raw.paymentMethods || (raw.data && raw.data.paymentMethods) || []).map(item => ({
    name: item.PaymentMethod || item.name,
    value: item.TotalAmount ?? item.value
  }));
  // Timeline data
  const lineData = (raw.timeline || (raw.data && raw.data.monthlyCollection) || []).map(item => ({
    month: item.month || item.Month,
    amount: item.amount ?? item.TotalAmount
  }));
  
  // Program breakdown - filter by selected program if applicable
  let barData = (raw.programs || (raw.data && raw.data.programBreakdown) || []).map(item => ({
    program: item.program || item.ProgramName,
    students: item.students ?? item.InvoiceCount,
    totalAmount: item.totalAmount ?? item.TotalAmount,
    collected: item.collected ?? item.PaidAmount,
    rate: item.rate ?? item.Rate ?? (item.totalAmount > 0 ? ((item.collected / item.totalAmount) * 100).toFixed(1) : 0)
  }));
  
  // Filter program data if a specific program is selected
  if (programFilter) {
    barData = barData.filter(item => item.program === programFilter);
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Thống Kê Học Phí
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Xuất báo cáo
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            In
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Năm học</InputLabel>
              <Select
                value={yearFilter}
                label="Năm học"
                onChange={(e) => setYearFilter(e.target.value)}
              >
                {academicYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={semesterFilter}
                label="Học kỳ"
                onChange={handleSemesterChange}
              >
                <MenuItem value="">Tất cả học kỳ</MenuItem>
                {filteredSemesters.map(sem => (
                  <MenuItem key={sem.SemesterID} value={sem.SemesterID}>
                    {sem.SemesterName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Chương trình</InputLabel>
              <Select
                value={programFilter}
                label="Chương trình"
                onChange={handleProgramChange}
              >
                <MenuItem value="">Tất cả chương trình</MenuItem>
                {programs.map(program => (
                  <MenuItem key={program.ProgramID} value={program.ProgramName}>
                    {program.ProgramName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Tổng học phí', value: totalAmount, icon: <AttachMoneyIcon color="primary" /> },
          { label: 'Đã thu', value: collectedAmount, icon: <WalletIcon color="success" /> },
          { label: 'Còn lại', value: outstandingAmount, icon: <CreditCardIcon color="error" /> },
          { label: 'Tỉ lệ thu', value: `${paymentRate}%`, icon: <TrendingUpIcon color="primary" /> }
        ].map(({ label, value, icon }, idx) => (
          <Grid key={idx} item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                      {label}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {label === 'Tỉ lệ thu' ? value : formatCurrency(value)}
                    </Typography>
                  </Box>
                  {icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Xu Hướng Thu Học Phí Theo Tháng
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={lineData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('vi-VN', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1
                    }).format(value)
                  }
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), "Số tiền"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Số tiền thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Phương Thức Thanh Toán
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Thống Kê Theo Chương Trình
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 3 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={barData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="program" />
                  <YAxis 
                    tickFormatter={(value) => 
                      new Intl.NumberFormat('vi-VN', {
                        notation: 'compact',
                        compactDisplay: 'short',
                        maximumFractionDigits: 1
                      }).format(value)
                    }
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), "Số tiền"]}
                  />
                  <Legend />
                  <Bar dataKey="totalAmount" name="Tổng học phí" fill="#8884d8" />
                  <Bar dataKey="collected" name="Đã thu" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Chương trình</TableCell>
                    <TableCell align="right">Sinh viên</TableCell>
                    <TableCell align="right">Tổng học phí</TableCell>
                    <TableCell align="right">Đã thu</TableCell>
                    <TableCell align="right">Còn lại</TableCell>
                    <TableCell align="right">Tỷ lệ thu</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {barData.length > 0 ? (
                    barData.map((row) => (
                      <TableRow key={row.program}>
                        <TableCell component="th" scope="row">
                          {row.program}
                        </TableCell>
                        <TableCell align="right">{row.students}</TableCell>
                        <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.collected)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.totalAmount - row.collected)}</TableCell>
                        <TableCell align="right">{row.rate}%</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">Không có dữ liệu</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TuitionStatistics; 