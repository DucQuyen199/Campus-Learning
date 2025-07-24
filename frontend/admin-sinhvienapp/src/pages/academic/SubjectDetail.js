/*-----------------------------------------------------------------
* File: SubjectDetail.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, Grid, Paper, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText, Chip, CircularProgress,
  Snackbar, Alert, Table, TableBody, TableRow, TableCell
} from '@mui/material';
import { 
// eslint-disable-next-line no-unused-vars
  School, Edit, ArrowBack, MenuBook, Group, Check, Clear,
  LibraryBooks, Science, Assignment
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { academicService } from '../../services/api';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subject-tabpanel-${index}`}
      aria-labelledby={`subject-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [programsUsingSubject, setProgramsUsingSubject] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      try {
        setLoading(true);
        const response = await academicService.getSubjectById(id);
        
        if (response.success) {
          // Format data for display
          const subjectData = response.data;
          setSubject({
            id: subjectData.SubjectID,
            code: subjectData.SubjectCode,
            name: subjectData.SubjectName,
            credits: subjectData.Credits,
            theoryCredits: subjectData.TheoryCredits,
            practiceCredits: subjectData.PracticeCredits,
            prerequisites: subjectData.Prerequisites,
            description: subjectData.Description,
            department: subjectData.Department,
            faculty: subjectData.Faculty,
            isRequired: subjectData.IsRequired === true || subjectData.IsRequired === 1,
            status: subjectData.IsActive ? 'Active' : 'Inactive',
            createdAt: new Date(subjectData.CreatedAt).toLocaleDateString('vi-VN'),
            updatedAt: new Date(subjectData.UpdatedAt).toLocaleDateString('vi-VN')
          });
          
          // Fetch programs using this subject
          fetchProgramsUsingSubject(id);
        } else {
          throw new Error(response.message || 'Failed to fetch subject details');
        }
      } catch (error) {
        console.error('Error fetching subject details:', error);
        setError('Không thể tải chi tiết môn học. Vui lòng thử lại sau.');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [id]);

  const fetchProgramsUsingSubject = async (subjectId) => {
    try {
      // This is a mock implementation - in a real app, you'd have an API endpoint for this
      // For now, we'll just set an empty array
      setProgramsUsingSubject([]);
      
      // In a real implementation:
      // const response = await academicService.getProgramsUsingSubject(subjectId);
      // if (response.success) {
      //   setProgramsUsingSubject(response.data);
      // }
    } catch (error) {
      console.error('Error fetching programs using subject:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!subject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Không tìm thấy môn học</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/academic/subjects')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách môn học
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/academic/subjects')}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h5" component="h1">
            Chi tiết môn học
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Edit />}
          onClick={() => navigate(`/academic/subjects/edit/${subject.id}`)}
        >
          Chỉnh sửa
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MenuBook sx={{ fontSize: 80, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{subject.name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Mã: {subject.code}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip 
                      label={subject.status} 
                      color={subject.status === 'Active' ? 'success' : 'default'} 
                      size="small" 
                    />
                    <Chip 
                      label={subject.isRequired ? 'Bắt buộc' : 'Tự chọn'} 
                      color={subject.isRequired ? 'primary' : 'default'} 
                      size="small" 
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Khoa phụ trách" 
                    secondary={subject.department || 'Chưa cập nhật'} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Ngành" 
                    secondary={subject.faculty || 'Chưa cập nhật'} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Số tín chỉ" 
                    secondary={subject.credits} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="subject detail tabs">
            <Tab label="Thông tin chung" />
            <Tab label="Chương trình học" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Mô tả môn học
              </Typography>
              <Typography paragraph>
                {subject.description || 'Chưa có mô tả chi tiết cho môn học này.'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Chi tiết môn học
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <School sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="body2">Tổng số tín chỉ</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{subject.credits}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LibraryBooks sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="body2">Tín chỉ lý thuyết</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{subject.theoryCredits || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Science sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="body2">Tín chỉ thực hành</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{subject.practiceCredits || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assignment sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="body2">Môn học tiên quyết</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{subject.prerequisites || 'Không có'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {subject.isRequired ? 
                              <Check sx={{ mr: 1, color: 'success.main', fontSize: 20 }} /> : 
                              <Clear sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                            }
                            <Typography variant="body2">Bắt buộc</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{subject.isRequired ? 'Có' : 'Không'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2">Ngày tạo</Typography>
                        </TableCell>
                        <TableCell>{subject.createdAt}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2">Cập nhật gần nhất</Typography>
                        </TableCell>
                        <TableCell>{subject.updatedAt}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Chương trình học có môn {subject.name}
          </Typography>
          {programsUsingSubject.length > 0 ? (
            <Table size="small">
              <TableBody>
                {programsUsingSubject.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>{program.name}</TableCell>
                    <TableCell>{program.department}</TableCell>
                    <TableCell>
                      <Chip 
                        label={program.isRequired ? 'Bắt buộc' : 'Tự chọn'} 
                        color={program.isRequired ? 'primary' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{`Học kỳ ${program.semester}`}</TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => navigate(`/academic/programs/${program.programId}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography>
              Môn học này chưa được thêm vào chương trình đào tạo nào.
            </Typography>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SubjectDetail; 
