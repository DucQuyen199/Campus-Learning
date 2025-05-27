import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemText,
  Chip,
  InputAdornment,
  Container
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  ArrowBack,
  Payment,
  Receipt,
  Save,
  AttachMoney,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { tuitionService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import viLocale from 'date-fns/locale/vi';

const paymentMethods = [
  { value: 'Bank Transfer', label: 'Chuyển khoản ngân hàng' },
  { value: 'Cash', label: 'Tiền mặt' },
  { value: 'Credit Card', label: 'Thẻ tín dụng/Ghi nợ' },
  { value: 'Momo', label: 'Ví MoMo' },
  { value: 'ZaloPay', label: 'ZaloPay' },
  { value: 'VNPay', label: 'VNPay' },
];

const ProcessPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [tuition, setTuition] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Fetch tuition details
  useEffect(() => {
    const fetchTuitionDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await tuitionService.getTuitionById(id);
        setTuition(data.tuition || null);
        
        // If tuition is already fully paid, redirect to details page
        if (data.tuition && data.tuition.status === 'paid') {
          setError('Học phí này đã được thanh toán đầy đủ.');
          setTimeout(() => {
            navigate(`/finance/tuition/${id}`);
          }, 2000);
        }
      } catch (error) {
        setError('Không thể tải thông tin học phí. Vui lòng thử lại sau.');
        console.error('Failed to fetch tuition details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTuitionDetails();
    }
  }, [id, navigate]);

  // Fetch payment history - new effect
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!id) return;
      
      setHistoryLoading(true);
      try {
        // Force reload tuitionService if needed (prevents stale imports)
        const tuitionServiceCurrent = require('../../services/api').tuitionService;
        
        // Check if the getPaymentHistory function exists
        if (typeof tuitionServiceCurrent.getPaymentHistory === 'function') {
          try {
            // First try with the updated endpoint
            const response = await tuitionServiceCurrent.getPaymentHistory(id);
            console.log('Payment history response received:', response);
            
            if (response.success && (Array.isArray(response.data) || Array.isArray(response.payments))) {
              const payments = response.data || response.payments || [];
              setPaymentHistory(payments);
            } else {
              console.log('Payment history response format unexpected:', response);
              setPaymentHistory([]);
            }
          } catch (apiError) {
            console.error('API error fetching payment history:', apiError);
            setPaymentHistory([]);
          }
        } else {
          console.warn('getPaymentHistory function not available in tuitionService - this should not happen after the fix');
          setPaymentHistory([]);
        }
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
        setPaymentHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    // Optional: only fetch payment history if needed
    // Make this silent/optional since it's not critical for the payment form
    if (id && !loading && tuition) {
      fetchPaymentHistory().catch(err => {
        console.log('Silently handled payment history error:', err);
        setHistoryLoading(false);
      });
    }
  }, [id, loading, tuition]);

  // Form validation schema
  const validationSchema = Yup.object({
    amount: Yup.number()
      .required('Vui lòng nhập số tiền thanh toán')
      .positive('Số tiền phải lớn hơn 0')
      .max(
        Yup.ref('$maxAmount'),
        'Số tiền không được vượt quá số tiền còn lại'
      ),
    paymentMethod: Yup.string().required('Vui lòng chọn phương thức thanh toán'),
    transactionCode: Yup.string().when('paymentMethod', {
      is: (method) => method && method !== 'Cash',
      then: Yup.string().required('Vui lòng nhập mã giao dịch'),
    }),
    bankReference: Yup.string().when('paymentMethod', {
      is: (method) => method === 'Bank Transfer',
      then: Yup.string(),
    }),
    paymentDate: Yup.date().required('Vui lòng chọn ngày thanh toán'),
    notes: Yup.string().max(500, 'Ghi chú không được vượt quá 500 ký tự'),
  });

  // Formik form
  const formik = useFormik({
    initialValues: {
      amount: tuition?.remainingAmount || 0,
      paymentMethod: '',
      transactionCode: '',
      bankReference: '',
      paymentDate: new Date(),
      notes: '',
    },
    validationSchema,
    validateOnMount: true,
    // Pass the max amount to the validation context
    validationContext: { 
      $maxAmount: tuition?.remainingAmount || 0
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSubmitting(true);
      setSubmitError(null);
      
      try {
        await tuitionService.processPayment(id, values);
        
        // Navigate back to tuition details after successful payment
        navigate(`/finance/tuition/${id}`);
      } catch (error) {
        const errorMsg = error?.response?.data?.message || 'Không thể xử lý thanh toán. Vui lòng thử lại sau.';
        setSubmitError(errorMsg);
        console.error('Failed to process payment:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handle full payment button
  const handleFullPayment = () => {
    if (tuition && tuition.remainingAmount) {
      formik.setFieldValue('amount', tuition.remainingAmount);
    }
  };

  // Go back to details
  const handleGoBack = () => {
    navigate(`/finance/tuition/${id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 3 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            sx={{ mt: 2 }}
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
          >
            Quay lại
          </Button>
        </Box>
      </Container>
    );
  }

  if (!tuition) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 3 }}>
          <Alert severity="warning">Không tìm thấy thông tin học phí</Alert>
          <Button
            sx={{ mt: 2 }}
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
          >
            Quay lại
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
            Dashboard
          </Link>
          <Link component={RouterLink} to="/finance/tuition" underline="hover" color="inherit">
            Quản lý học phí
          </Link>
          <Link component={RouterLink} to={`/finance/tuition/${id}`} underline="hover" color="inherit">
            Chi tiết học phí
          </Link>
          <Typography color="text.primary">Xử lý thanh toán</Typography>
        </Breadcrumbs>
        
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Payment sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" component="h1" fontWeight={600}>
                Xử lý thanh toán học phí
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thanh toán học phí cho sinh viên {tuition.studentName}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            sx={{ 
              fontWeight: 500,
              borderRadius: 2,
              px: 2.5
            }}
          >
            Quay lại
          </Button>
        </Box>
        
        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Tuition Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2, 
              boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)', 
              overflow: 'hidden'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 600, 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Receipt sx={{ mr: 1, color: 'primary.main' }} /> Thông tin học phí
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List disablePadding>
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemText 
                      primary="Mã sinh viên" 
                      secondary={tuition.studentCode}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemText 
                      primary="Tên sinh viên" 
                      secondary={tuition.studentName}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemText 
                      primary="Học kỳ" 
                      secondary={tuition.semesterName}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemText 
                      primary="Tổng học phí" 
                      secondary={formatCurrency(tuition.totalAmount)}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemText 
                      primary="Đã thanh toán" 
                      secondary={formatCurrency(tuition.paidAmount || 0)}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'success.main' }}
                    />
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemText 
                      primary="Còn lại" 
                      secondary={formatCurrency(tuition.remainingAmount || 0)}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', fontWeight: 600 }}
                      secondaryTypographyProps={{ 
                        variant: 'body1',
                        color: 'error.main',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Payment Form */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)', 
              overflow: 'hidden'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 600, 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 2 
                }}>
                  <Payment sx={{ mr: 1, color: 'primary.main' }} /> Thông tin thanh toán
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                {submitError && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {submitError}
                  </Alert>
                )}
                
                <form onSubmit={formik.handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <TextField
                          fullWidth
                          id="amount"
                          name="amount"
                          label="Số tiền thanh toán"
                          value={formik.values.amount}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.amount && Boolean(formik.errors.amount)}
                          helperText={formik.touched.amount && formik.errors.amount}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney />
                              </InputAdornment>
                            ),
                            inputProps: { min: 0, max: tuition.remainingAmount }
                          }}
                          type="number"
                          sx={{ mr: 2 }}
                        />
                        <Button 
                          variant="outlined" 
                          color="primary"
                          onClick={handleFullPayment}
                          sx={{ 
                            whiteSpace: 'nowrap', 
                            fontWeight: 500,
                            borderRadius: 2
                          }}
                        >
                          Thanh toán đủ
                        </Button>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl 
                        fullWidth 
                        error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                      >
                        <InputLabel>Phương thức thanh toán</InputLabel>
                        <Select
                          id="paymentMethod"
                          name="paymentMethod"
                          label="Phương thức thanh toán"
                          value={formik.values.paymentMethod}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        >
                          {paymentMethods.map((method) => (
                            <MenuItem key={method.value} value={method.value}>
                              {method.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {formik.touched.paymentMethod && formik.errors.paymentMethod && (
                          <FormHelperText>{formik.errors.paymentMethod}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={viLocale}>
                        <DateTimePicker
                          label="Ngày thanh toán"
                          value={formik.values.paymentDate}
                          onChange={(value) => formik.setFieldValue('paymentDate', value)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: 'outlined',
                              error: formik.touched.paymentDate && Boolean(formik.errors.paymentDate),
                              helperText: formik.touched.paymentDate && formik.errors.paymentDate,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    
                    <Grid item xs={12} md={formik.values.paymentMethod === 'Bank Transfer' ? 6 : 12}>
                      <TextField
                        fullWidth
                        id="transactionCode"
                        name="transactionCode"
                        label="Mã giao dịch"
                        value={formik.values.transactionCode}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.transactionCode && Boolean(formik.errors.transactionCode)}
                        helperText={formik.touched.transactionCode && formik.errors.transactionCode}
                        disabled={formik.values.paymentMethod === 'Cash'}
                      />
                    </Grid>
                    
                    {formik.values.paymentMethod === 'Bank Transfer' && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          id="bankReference"
                          name="bankReference"
                          label="Ngân hàng"
                          value={formik.values.bankReference}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.bankReference && Boolean(formik.errors.bankReference)}
                          helperText={formik.touched.bankReference && formik.errors.bankReference}
                          placeholder="Tên ngân hàng, chi nhánh, số tài khoản, ..."
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="notes"
                        name="notes"
                        label="Ghi chú"
                        multiline
                        rows={3}
                        value={formik.values.notes}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.notes && Boolean(formik.errors.notes)}
                        helperText={formik.touched.notes && formik.errors.notes}
                        placeholder="Nhập ghi chú về giao dịch thanh toán này (nếu có)"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={handleGoBack}
                          sx={{ 
                            mr: 2,
                            fontWeight: 500,
                            borderRadius: 2,
                            px: 3
                          }}
                          disabled={submitting}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={submitting || !formik.isValid || formik.values.amount <= 0}
                          startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                          sx={{ 
                            fontWeight: 500,
                            borderRadius: 2,
                            px: 3
                          }}
                        >
                          {submitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ProcessPayment; 