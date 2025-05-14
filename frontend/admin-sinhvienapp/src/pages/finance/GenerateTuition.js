import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const steps = ['Select Parameters', 'Review Students', 'Configure Options', 'Summary & Confirm'];

const GenerateTuition = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    academicYear: '2023-2024',
    semester: 'Spring 2024',
    dueDate: '2024-02-15',
    programs: [],
    applyDiscount: false,
    discountPercentage: 0,
    notifyStudents: true,
    paymentDeadline: 14, // days
    latePaymentFee: 5, // percentage
    includePreviousBalance: true
  });

  // Mock data
  const availablePrograms = [
    'Computer Science',
    'Business Administration',
    'Electrical Engineering',
    'Medicine',
    'Mathematics',
    'Physics'
  ];

  const mockStudents = [
    { id: '2020001', name: 'Nguyen Van A', program: 'Computer Science', currentBalance: 0, tuitionAmount: 8500000 },
    { id: '2020002', name: 'Tran Thi B', program: 'Computer Science', currentBalance: 1500000, tuitionAmount: 8500000 },
    { id: '2020003', name: 'Le Van C', program: 'Business Administration', currentBalance: 0, tuitionAmount: 7800000 },
    { id: '2020004', name: 'Pham Thi D', program: 'Electrical Engineering', currentBalance: 0, tuitionAmount: 8900000 },
    { id: '2020005', name: 'Vo Van E', program: 'Medicine', currentBalance: 3000000, tuitionAmount: 12000000 }
  ];

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle form data changes
  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle program selection
  const handleProgramChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      programs: typeof value === 'string' ? value.split(',') : value,
    });
  };

  // Handle step actions
  const isStepOptional = (step) => {
    return step === 2;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    if (activeStep === 0) {
      // Filter students based on selected programs
      const filtered = mockStudents.filter(student => 
        formData.programs.length === 0 || formData.programs.includes(student.program)
      );
      setFilteredStudents(filtered);
      setSelectedStudents(filtered.map(student => student.id));
      setSelectAll(true);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      academicYear: '2023-2024',
      semester: 'Spring 2024',
      dueDate: '2024-02-15',
      programs: [],
      applyDiscount: false,
      discountPercentage: 0,
      notifyStudents: true,
      paymentDeadline: 14,
      latePaymentFee: 5,
      includePreviousBalance: true
    });
    setSelectedStudents([]);
    setFilteredStudents([]);
    setSelectAll(false);
    setSearchTerm('');
  };

  // Handle student selection
  const handleSelectAllStudents = (event) => {
    if (event.target.checked) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
    setSelectAll(event.target.checked);
  };

  const handleSelectStudent = (studentId) => {
    const selectedIndex = selectedStudents.indexOf(studentId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedStudents, studentId];
    } else {
      newSelected = selectedStudents.filter(id => id !== studentId);
    }

    setSelectedStudents(newSelected);
    setSelectAll(newSelected.length === filteredStudents.length);
  };

  const isStudentSelected = (studentId) => selectedStudents.indexOf(studentId) !== -1;

  // Handle student search
  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    if (searchValue) {
      const filtered = mockStudents.filter(student => 
        (formData.programs.length === 0 || formData.programs.includes(student.program)) &&
        (student.name.toLowerCase().includes(searchValue.toLowerCase()) || 
        student.id.toLowerCase().includes(searchValue.toLowerCase()))
      );
      setFilteredStudents(filtered);
    } else {
      const filtered = mockStudents.filter(student => 
        formData.programs.length === 0 || formData.programs.includes(student.program)
      );
      setFilteredStudents(filtered);
    }
  };

  // Handle tuition generation
  const handleConfirmGeneration = () => {
    setConfirmDialogOpen(true);
  };

  const handleGenerateTuition = () => {
    setConfirmDialogOpen(false);
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccessDialogOpen(true);
    }, 2000);
  };

  const handleSuccessClose = () => {
    setSuccessDialogOpen(false);
    navigate('/finance/tuition');
  };

  // Calculate summary data
  const getSelectedStudentsData = () => {
    return filteredStudents.filter(student => selectedStudents.includes(student.id));
  };

  const calculateTotalAmount = () => {
    const students = getSelectedStudentsData();
    let total = students.reduce((sum, student) => sum + student.tuitionAmount, 0);
    
    if (formData.applyDiscount && formData.discountPercentage > 0) {
      total = total * (1 - formData.discountPercentage / 100);
    }
    
    if (formData.includePreviousBalance) {
      total += students.reduce((sum, student) => sum + student.currentBalance, 0);
    }
    
    return total;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Content for each step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Academic Year"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleFormChange}
                  select
                >
                  <MenuItem value="2022-2023">2022-2023</MenuItem>
                  <MenuItem value="2023-2024">2023-2024</MenuItem>
                  <MenuItem value="2024-2025">2024-2025</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleFormChange}
                  select
                >
                  <MenuItem value="Fall 2023">Fall 2023</MenuItem>
                  <MenuItem value="Spring 2024">Spring 2024</MenuItem>
                  <MenuItem value="Fall 2024">Fall 2024</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="programs-label">Programs</InputLabel>
                  <Select
                    labelId="programs-label"
                    multiple
                    value={formData.programs}
                    onChange={handleProgramChange}
                    input={<OutlinedInput label="Programs" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {availablePrograms.map((program) => (
                      <MenuItem key={program} value={program}>
                        <Checkbox checked={formData.programs.indexOf(program) > -1} />
                        <ListItemText primary={program} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Leave empty to include all programs</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <AlertTitle>Information</AlertTitle>
                Select parameters to determine the students for whom tuition will be generated.
                You can filter by program or include all students.
              </Alert>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Search by name or ID"
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                  }}
                  sx={{ width: 300, mr: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {selectedStudents.length} of {filteredStudents.length} students selected
                </Typography>
              </Box>
              {filteredStudents.length > 0 && (
                <Button 
                  variant="outlined" 
                  onClick={() => handleSelectAllStudents({ target: { checked: !selectAll } })}
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAllStudents}
                        indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                      />
                    </TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell align="right">Current Balance</TableCell>
                    <TableCell align="right">Tuition Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No students match the selected criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = isStudentSelected(student.id);
                      return (
                        <TableRow
                          key={student.id}
                          hover
                          onClick={() => handleSelectStudent(student.id)}
                          role="checkbox"
                          selected={isSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          <TableCell>{student.id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.program}</TableCell>
                          <TableCell align="right">{formatCurrency(student.currentBalance)}</TableCell>
                          <TableCell align="right">{formatCurrency(student.tuitionAmount)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {selectedStudents.length === 0 && filteredStudents.length > 0 && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                Please select at least one student to continue.
              </Alert>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Discount Options
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <FormControl>
                              <InputLabel>Apply Discount</InputLabel>
                              <Select
                                name="applyDiscount"
                                value={formData.applyDiscount}
                                label="Apply Discount"
                                onChange={handleFormChange}
                              >
                                <MenuItem value={true}>Yes</MenuItem>
                                <MenuItem value={false}>No</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              type="number"
                              label="Discount Percentage"
                              name="discountPercentage"
                              value={formData.discountPercentage}
                              onChange={handleFormChange}
                              disabled={!formData.applyDiscount}
                              InputProps={{
                                endAdornment: <Typography variant="body2">%</Typography>,
                              }}
                            />
                          </Grid>
                        </Grid>
                      </FormControl>
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Payment Options
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="number"
                        label="Payment Deadline (days)"
                        name="paymentDeadline"
                        value={formData.paymentDeadline}
                        onChange={handleFormChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="number"
                        label="Late Payment Fee"
                        name="latePaymentFee"
                        value={formData.latePaymentFee}
                        onChange={handleFormChange}
                        InputProps={{
                          endAdornment: <Typography variant="body2">%</Typography>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <FormControl fullWidth>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Additional Options
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Include Previous Balance</InputLabel>
                        <Select
                          name="includePreviousBalance"
                          value={formData.includePreviousBalance}
                          label="Include Previous Balance"
                          onChange={handleFormChange}
                        >
                          <MenuItem value={true}>Yes</MenuItem>
                          <MenuItem value={false}>No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Notify Students</InputLabel>
                        <Select
                          name="notifyStudents"
                          value={formData.notifyStudents}
                          label="Notify Students"
                          onChange={handleFormChange}
                        >
                          <MenuItem value={true}>Yes</MenuItem>
                          <MenuItem value={false}>No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <AlertTitle>Configuration</AlertTitle>
                These settings will apply to all tuition bills being generated.
                You can optionally apply discounts, set payment deadlines, and configure notifications.
              </Alert>
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon sx={{ mr: 1 }} color="primary" /> Summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Academic Year:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.academicYear}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Semester:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.semester}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Due Date:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.dueDate}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Selected Programs:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {formData.programs.length > 0 ? formData.programs.join(', ') : 'All Programs'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Students:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{selectedStudents.length} students</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Discount:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          {formData.applyDiscount ? `${formData.discountPercentage}%` : 'No Discount'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Include Previous Balance:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.includePreviousBalance ? 'Yes' : 'No'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Notify Students:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">{formData.notifyStudents ? 'Yes' : 'No'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <ReceiptIcon sx={{ mr: 1 }} color="primary" /> Financial Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Total Amount: {formatCurrency(calculateTotalAmount())}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This includes tuition for {selectedStudents.length} students
                      {formData.includePreviousBalance ? ', including previous balances' : ''}
                      {formData.applyDiscount ? `, with a ${formData.discountPercentage}% discount applied` : ''}.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Payment Conditions:
                      </Typography>
                      <Typography variant="body2">
                        • Payment Deadline: {formData.paymentDeadline} days after generation
                      </Typography>
                      <Typography variant="body2">
                        • Late Payment Fee: {formData.latePaymentFee}% of the outstanding amount
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                
                <Box sx={{ mt: 3 }}>
                  {selectedStudents.length === 0 ? (
                    <Alert severity="error">
                      <AlertTitle>Error</AlertTitle>
                      No students selected. Please go back and select at least one student.
                    </Alert>
                  ) : (
                    <Alert severity="warning" icon={<WarningIcon />}>
                      <AlertTitle>Important</AlertTitle>
                      You are about to generate tuition bills for {selectedStudents.length} students.
                      This action cannot be undone. Please confirm all details are correct before proceeding.
                    </Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Generate Tuition
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label, index) => {
            const stepProps = {};
            const labelProps = {};
            if (isStepOptional(index)) {
              labelProps.optional = <Typography variant="caption">Optional</Typography>;
            }
            if (isStepSkipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        
        {activeStep === steps.length ? (
          <Box sx={{ mt: 3, mb: 1 }}>
            <Typography sx={{ mt: 2, mb: 1 }}>
              All steps completed - you&apos;re finished
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleReset}>Reset</Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box>
              {getStepContent(activeStep)}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 3 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {isStepOptional(activeStep) && (
                <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
                  Skip
                </Button>
              )}
              {activeStep === steps.length - 1 ? (
                <Button 
                  onClick={handleConfirmGeneration} 
                  variant="contained"
                  disabled={selectedStudents.length === 0 || loading}
                  startIcon={loading ? undefined : <SendIcon />}
                >
                  {loading ? 'Processing...' : 'Generate Tuition'}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  variant="contained"
                  disabled={(activeStep === 1 && selectedStudents.length === 0)}
                  endIcon={<ArrowForwardIcon />}
                >
                  Next
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Tuition Generation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to generate tuition bills for {selectedStudents.length} students 
            with a total amount of {formatCurrency(calculateTotalAmount())}.
            This action cannot be undone. Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateTuition} color="primary" variant="contained" autoFocus>
            Confirm Generation
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={handleSuccessClose}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckIcon color="success" sx={{ mr: 1 }} />
            Tuition Generated Successfully
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tuition bills have been successfully generated for {selectedStudents.length} students.
            {formData.notifyStudents && ' Notification emails have been sent to all students.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessClose} color="primary" variant="contained">
            View Tuition List
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenerateTuition; 