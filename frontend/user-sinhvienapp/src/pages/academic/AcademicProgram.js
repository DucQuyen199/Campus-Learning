import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Skeleton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Fade,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ExpandMore, 
  School, 
  Info as InfoIcon,
  Timer as TimerIcon,
  MenuBook as MenuBookIcon,
  Architecture as ArchitectureIcon,
  Verified as VerifiedIcon,
  AdminPanelSettings as AdminIcon,
  LocalLibrary as LibraryIcon,
  AutoGraph as AutoGraphIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { academicService } from '../../services/api';

const AcademicProgram = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [program, setProgram] = useState(null);
  const [programStructure, setProgramStructure] = useState([]);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Styles matching other pages
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    titleSection: {
      marginBottom: theme.spacing(3)
    },
    tableContainer: {
      marginTop: theme.spacing(3)
    },
    chip: {
      margin: theme.spacing(0.5)
    },
    infoSection: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.default
    }
  };
  
  useEffect(() => {
    const fetchAcademicProgram = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser || !currentUser.UserID) {
          setError('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }
        
        const programData = await academicService.getProgram(currentUser.UserID);
        setProgram(Array.isArray(programData) ? programData[0] : programData);
        
        // We would fetch program structure here if the API supports it
        // For now we'll use empty array until API endpoint is available
        // const structureData = await academicService.getProgramStructure(currentUser.UserID);
        // setProgramStructure(structureData);
      } catch (err) {
        console.error('Error fetching academic program:', err);
        setError('Không thể tải thông tin chương trình học. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAcademicProgram();
  }, [currentUser]);
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 4, maxWidth: '100%', px: { xs: 2, sm: 4 } }}>
        <Alert severity="error" 
          sx={{ 
            borderRadius: 2, 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Chương trình đào tạo
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Thông tin chi tiết về chương trình học và cấu trúc chương trình
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>
        
        {program ? (
          <Fade in timeout={800}>
            <Box>
              <Box sx={styles.infoSection}>
                <Typography variant="body1" gutterBottom>
                  <strong>Thông tin chương trình đào tạo:</strong>
                </Typography>
                <Typography variant="body2" component="ul">
                  <li>Tên chương trình: {program.ProgramName || 'Chưa cập nhật'}</li>
                  <li>Mã chương trình: {program.ProgramCode || 'Chưa cập nhật'}</li>
                  <li>Khoa/Viện: {program.Faculty || 'Chưa cập nhật'}</li>
                  <li>Tổng số tín chỉ: {program.TotalCredits ? `${program.TotalCredits} tín chỉ` : 'Chưa cập nhật'}</li>
                </Typography>
              </Box>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={styles.paper} elevation={0} variant="outlined">
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1.5,
                        color: 'text.primary' 
                      }}
                    >
                      <InfoIcon color="primary" />
                      Thông tin chung
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row" width="40%">Mã chương trình</TableCell>
                            <TableCell align="right">{program.ProgramCode || 'Chưa cập nhật'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Khoa/Viện</TableCell>
                            <TableCell align="right">{program.Faculty || 'Chưa cập nhật'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Bộ môn</TableCell>
                            <TableCell align="right">{program.Department || 'Chưa cập nhật'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Bằng cấp</TableCell>
                            <TableCell align="right">{program.DegreeName || 'Chưa cập nhật'}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={styles.paper} elevation={0} variant="outlined">
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1.5,
                        color: 'text.primary' 
                      }}
                    >
                      <TimerIcon color="primary" />
                      Thời gian và tín chỉ
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row" width="40%">Tổng số tín chỉ</TableCell>
                            <TableCell align="right">{program.TotalCredits ? `${program.TotalCredits} tín chỉ` : 'Chưa cập nhật'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Thời gian đào tạo</TableCell>
                            <TableCell align="right">{program.ProgramDuration ? `${program.ProgramDuration} năm` : '4 năm'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Loại chương trình</TableCell>
                            <TableCell align="right">{program.ProgramType || 'Chính quy'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Năm nhập học</TableCell>
                            <TableCell align="right">{program.EntryYear || 'Chưa cập nhật'}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
              
              <Paper sx={styles.paper} elevation={0} variant="outlined">
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1.5,
                    color: theme.palette.primary.main 
                  }}
                >
                  <MenuBookIcon color="primary" />
                  Mô tả chương trình
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body1" paragraph color="text.secondary" sx={{ textAlign: 'justify', p: 2 }}>
                  {program.Description || 'Chưa có thông tin mô tả cho chương trình đào tạo này.'}
                </Typography>
              </Paper>
              
              <Paper sx={styles.paper} elevation={0} variant="outlined">
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1.5,
                    color: theme.palette.primary.main
                  }}
                >
                  <ArchitectureIcon color="primary" />
                  Cấu trúc chương trình
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {programStructure && programStructure.length > 0 ? (
                  programStructure.map((category, index) => (
                    <ProgramStructureAccordion 
                      key={index}
                      title={category.title}
                      subjects={category.subjects}
                      defaultExpanded={index === 0}
                    />
                  ))
                ) : (
                  <>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontStyle: 'italic', p: 2 }}>
                      Chưa có dữ liệu chi tiết về cấu trúc chương trình. Vui lòng liên hệ phòng đào tạo để biết thêm chi tiết.
                    </Typography>
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiAlert-icon': { alignItems: 'center' } 
                      }}
                    >
                      Dữ liệu cấu trúc chương trình đang được cập nhật. Vui lòng quay lại sau.
                    </Alert>
                  </>
                )}
              </Paper>
            </Box>
          </Fade>
        ) : (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
          >
            Không tìm thấy thông tin chương trình đào tạo. Vui lòng liên hệ phòng đào tạo để được hỗ trợ.
          </Alert>
        )}
      </Paper>
    </div>
  );
};

// Component for each program info item in the list
const ProgramInfoItem = ({ label, value, isLast = false }) => {
  return (
    <ListItem 
      disablePadding 
      disableGutters
      sx={{ 
        mb: isLast ? 0 : 1.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}
    >
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'text.secondary',
          fontWeight: 500,
          mb: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        <AutoGraphIcon sx={{ fontSize: 14 }} />
        {label}
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          fontWeight: 500,
          pl: 2
        }}
      >
        {value}
      </Typography>
    </ListItem>
  );
};

// Component for each category in the program structure
const ProgramStructureAccordion = ({ title, subjects, defaultExpanded = false }) => {
  const theme = useTheme();
  
  return (
    <Accordion 
      defaultExpanded={defaultExpanded}
      sx={{ 
        mb: 2, 
        overflow: 'hidden',
        '&:before': { display: 'none' },
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 2,
        '& .MuiAccordionSummary-root': {
          borderRadius: theme => defaultExpanded ? '8px 8px 0 0' : 2,
          transition: 'all 0.3s ease'
        }
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMore />}
        sx={{ 
          backgroundColor: 'rgba(0,0,0,0.02)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.03)'
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <LibraryIcon color="primary" fontSize="small" />
          <Typography fontWeight={500}>{title}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Mã môn học</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Tên môn học</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="right">Số tín chỉ</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects && subjects.length > 0 ? (
                subjects.map((subject, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell align="right">{subject.credits}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={subject.isRequired ? "Bắt buộc" : "Tự chọn"} 
                        color={subject.isRequired ? "primary" : "secondary"}
                        sx={{ 
                          fontWeight: 500,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Xem chi tiết môn học">
                        <IconButton size="small" color="primary">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có dữ liệu môn học cho khối kiến thức này
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => {
  const theme = useTheme();
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3)
    }
  };
  
  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={500} height={30} sx={{ mb: 3 }} />
        <Divider sx={{ mb: 3 }} />
        
        <Skeleton variant="rounded" height={80} sx={{ mb: 4 }} />
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={200} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={200} />
          </Grid>
        </Grid>
        
        <Skeleton variant="rounded" height={150} sx={{ mb: 4 }} />
        
        <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={60} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={200} />
      </Paper>
    </div>
  );
};

export default AcademicProgram; 