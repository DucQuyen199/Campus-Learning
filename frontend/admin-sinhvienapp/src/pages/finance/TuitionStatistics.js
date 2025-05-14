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

const TuitionStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('2023-2024');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [statisticsData, setStatisticsData] = useState(null);

  // Mock data
  const mockStatisticsData = {
    summary: {
      totalTuition: 25680000000,
      collectedAmount: 22450000000,
      outstandingAmount: 3230000000,
      paymentRate: 87.4,
      students: 680,
      averageTuition: 37764705.88
    },
    paymentMethods: [
      { name: 'Bank Transfer', value: 65 },
      { name: 'Cash', value: 20 },
      { name: 'Credit Card', value: 15 }
    ],
    monthlyCollection: [
      { month: 'Jan', amount: 8500000000 },
      { month: 'Feb', amount: 5200000000 },
      { month: 'Mar', amount: 3100000000 },
      { month: 'Apr', amount: 2900000000 },
      { month: 'May', amount: 2750000000 },
    ],
    programBreakdown: [
      { program: 'Computer Science', students: 220, totalAmount: 8800000000, collected: 7950000000, rate: 90.3 },
      { program: 'Business Administration', students: 180, totalAmount: 6480000000, collected: 5500000000, rate: 84.9 },
      { program: 'Electrical Engineering', students: 150, totalAmount: 6750000000, collected: 5800000000, rate: 85.9 },
      { program: 'Medicine', students: 80, totalAmount: 3200000000, collected: 2900000000, rate: 90.6 },
      { program: 'Other Programs', students: 50, totalAmount: 450000000, collected: 300000000, rate: 66.7 }
    ]
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStatisticsData(mockStatisticsData);
      setLoading(false);
    }, 800);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleExport = () => {
    console.log('Exporting statistics...');
    // Implement export functionality
  };

  const handlePrint = () => {
    console.log('Printing statistics...');
    // Implement print functionality
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tuition Statistics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={yearFilter}
                label="Academic Year"
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <MenuItem value="2022-2023">2022-2023</MenuItem>
                <MenuItem value="2023-2024">2023-2024</MenuItem>
                <MenuItem value="2024-2025">2024-2025</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                value={semesterFilter}
                label="Semester"
                onChange={(e) => setSemesterFilter(e.target.value)}
              >
                <MenuItem value="All">All Semesters</MenuItem>
                <MenuItem value="Fall 2023">Fall 2023</MenuItem>
                <MenuItem value="Spring 2024">Spring 2024</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Program</InputLabel>
              <Select
                value={programFilter}
                label="Program"
                onChange={(e) => setProgramFilter(e.target.value)}
              >
                <MenuItem value="All">All Programs</MenuItem>
                <MenuItem value="Computer Science">Computer Science</MenuItem>
                <MenuItem value="Business Administration">Business Administration</MenuItem>
                <MenuItem value="Electrical Engineering">Electrical Engineering</MenuItem>
                <MenuItem value="Medicine">Medicine</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                    Total Tuition
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(statisticsData.summary.totalTuition)}
                  </Typography>
                </Box>
                <AttachMoneyIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                    Collected Amount
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(statisticsData.summary.collectedAmount)}
                  </Typography>
                </Box>
                <WalletIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                    Outstanding Amount
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(statisticsData.summary.outstandingAmount)}
                  </Typography>
                </Box>
                <CreditCardIcon color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                    Payment Rate
                  </Typography>
                  <Typography variant="h5" component="div">
                    {statisticsData.summary.paymentRate}%
                  </Typography>
                </Box>
                <TrendingUpIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Monthly Collection Trend
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={statisticsData.monthlyCollection}
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
                  formatter={(value) => [formatCurrency(value), "Amount"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Collection Amount"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Payment Methods
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statisticsData.paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statisticsData.paymentMethods.map((entry, index) => (
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
              Program Breakdown
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 3 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={statisticsData.programBreakdown}
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
                    formatter={(value) => [formatCurrency(value), "Amount"]}
                  />
                  <Legend />
                  <Bar dataKey="totalAmount" name="Total Amount" fill="#8884d8" />
                  <Bar dataKey="collected" name="Collected Amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Program</TableCell>
                    <TableCell align="right">Students</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="right">Collected</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell align="right">Payment Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statisticsData.programBreakdown.map((row) => (
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
                  ))}
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