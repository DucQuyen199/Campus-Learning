/*-----------------------------------------------------------------
* File: TeacherEvaluation.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Rating,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Sample evaluation data
const sampleClasses = [
  {
    id: 1,
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    teacherName: 'Dr. John Smith',
    semester: 'HK1-2023-2024'
  },
  {
    id: 2,
    courseCode: 'MATH201',
    courseName: 'Calculus II',
    teacherName: 'Dr. Jane Doe',
    semester: 'HK1-2023-2024'
  },
  {
    id: 3,
    courseCode: 'PHY102',
    courseName: 'Physics for Engineers',
    teacherName: 'Dr. Robert Johnson',
    semester: 'HK2-2022-2023'
  }
];

const sampleSubmittedEvaluations = [
  {
    id: 1,
    courseCode: 'ENG101',
    courseName: 'English for Academic Purposes',
    teacherName: 'Prof. Sarah Williams',
    semester: 'HK2-2022-2023',
    submittedDate: '15/11/2023',
    overallScore: 4.5
  },
  {
    id: 2,
    courseCode: 'CS205',
    courseName: 'Database Systems',
    teacherName: 'Dr. Michael Brown',
    semester: 'HK2-2022-2023',
    submittedDate: '10/11/2023',
    overallScore: 4.0
  }
];

const TeacherEvaluation = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [classesToEvaluate, setClassesToEvaluate] = useState(sampleClasses);
  const [submittedEvaluations, setSubmittedEvaluations] = useState(sampleSubmittedEvaluations);
  const [selectedClass, setSelectedClass] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evaluationData, setEvaluationData] = useState({
    teachingScore: 0,
    contentScore: 0,
    attitudeScore: 0,
    comments: '',
    isAnonymous: true
  });

  // Styles using theme directly instead of makeStyles
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      height: '100vh', // Full viewport height
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      margin: 0,
      overflow: 'auto'
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3),
      width: '100%',
      flex: '1 1 auto',
      overflow: 'auto'
    },
    titleSection: {
      marginBottom: theme.spacing(3)
    },
    formControl: {
      marginBottom: theme.spacing(2)
    },
    tableContainer: {
      marginTop: theme.spacing(3),
      width: '100%',
      overflow: 'auto'
    },
    ratingContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: theme.spacing(2)
    },
    ratingLabel: {
      minWidth: 180,
      marginRight: theme.spacing(2)
    }
  };

  const handleOpenDialog = (classItem) => {
    setSelectedClass(classItem);
    setDialogOpen(true);
    
    // Reset form
    setEvaluationData({
      teachingScore: 0,
      contentScore: 0,
      attitudeScore: 0,
      comments: '',
      isAnonymous: true
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedClass(null);
  };

  const handleRatingChange = (field, value) => {
    setEvaluationData({
      ...evaluationData,
      [field]: value
    });
  };

  const handleCommentsChange = (event) => {
    setEvaluationData({
      ...evaluationData,
      comments: event.target.value
    });
  };

  const handleAnonymousChange = (event) => {
    setEvaluationData({
      ...evaluationData,
      isAnonymous: event.target.checked
    });
  };

  const handleSubmitEvaluation = () => {
    // This would send the evaluation data to the server in a real application
    console.log('Submitting evaluation:', { classId: selectedClass.id, ...evaluationData });
    
    // Close dialog
    setDialogOpen(false);
    
    // Update UI to show the evaluation as submitted
    setClassesToEvaluate(classesToEvaluate.filter(c => c.id !== selectedClass.id));
    
    // Add to submitted evaluations
    const newEvaluation = {
      id: Date.now(), // Just a temporary ID
      courseCode: selectedClass.courseCode,
      courseName: selectedClass.courseName,
      teacherName: selectedClass.teacherName,
      semester: selectedClass.semester,
      submittedDate: new Date().toLocaleDateString('vi-VN'),
      overallScore: (evaluationData.teachingScore + evaluationData.contentScore + evaluationData.attitudeScore) / 3
    };
    
    setSubmittedEvaluations([newEvaluation, ...submittedEvaluations]);
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Đánh giá giảng viên
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Đánh giá giảng viên giảng dạy các môn học bạn đã học
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lớp học chưa đánh giá
            </Typography>
            
            {classesToEvaluate.length > 0 ? (
              <TableContainer component={Paper} sx={styles.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã môn học</TableCell>
                      <TableCell>Tên môn học</TableCell>
                      <TableCell>Giảng viên</TableCell>
                      <TableCell>Học kỳ</TableCell>
                      <TableCell align="center">Đánh giá</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classesToEvaluate.map((classItem) => (
                      <TableRow key={classItem.id}>
                        <TableCell>{classItem.courseCode}</TableCell>
                        <TableCell>{classItem.courseName}</TableCell>
                        <TableCell>{classItem.teacherName}</TableCell>
                        <TableCell>{classItem.semester}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleOpenDialog(classItem)}
                          >
                            Đánh giá
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" align="center" sx={{ py: 3 }}>
                Không có lớp học nào cần đánh giá.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Đánh giá đã gửi
            </Typography>
            
            {submittedEvaluations.length > 0 ? (
              <TableContainer component={Paper} sx={styles.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã môn học</TableCell>
                      <TableCell>Tên môn học</TableCell>
                      <TableCell>Giảng viên</TableCell>
                      <TableCell>Học kỳ</TableCell>
                      <TableCell>Ngày đánh giá</TableCell>
                      <TableCell>Điểm trung bình</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submittedEvaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>{evaluation.courseCode}</TableCell>
                        <TableCell>{evaluation.courseName}</TableCell>
                        <TableCell>{evaluation.teacherName}</TableCell>
                        <TableCell>{evaluation.semester}</TableCell>
                        <TableCell>{evaluation.submittedDate}</TableCell>
                        <TableCell>
                          <Rating
                            value={evaluation.overallScore}
                            precision={0.5}
                            readOnly
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" align="center" sx={{ py: 3 }}>
                Bạn chưa gửi đánh giá giảng viên nào.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedClass && (
          <>
            <DialogTitle>
              Đánh giá giảng viên: {selectedClass.teacherName}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Môn học: {selectedClass.courseCode} - {selectedClass.courseName}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Học kỳ: {selectedClass.semester}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={styles.ratingContainer}>
                  <Typography variant="body1" sx={styles.ratingLabel}>
                    Phương pháp giảng dạy:
                  </Typography>
                  <Rating
                    name="teaching-score"
                    value={evaluationData.teachingScore}
                    onChange={(e, newValue) => handleRatingChange('teachingScore', newValue)}
                    size="large"
                  />
                </Box>
                
                <Box sx={styles.ratingContainer}>
                  <Typography variant="body1" sx={styles.ratingLabel}>
                    Nội dung môn học:
                  </Typography>
                  <Rating
                    name="content-score"
                    value={evaluationData.contentScore}
                    onChange={(e, newValue) => handleRatingChange('contentScore', newValue)}
                    size="large"
                  />
                </Box>
                
                <Box sx={styles.ratingContainer}>
                  <Typography variant="body1" sx={styles.ratingLabel}>
                    Thái độ giảng dạy:
                  </Typography>
                  <Rating
                    name="attitude-score"
                    value={evaluationData.attitudeScore}
                    onChange={(e, newValue) => handleRatingChange('attitudeScore', newValue)}
                    size="large"
                  />
                </Box>
                
                <TextField
                  label="Nhận xét và góp ý"
                  multiline
                  rows={4}
                  value={evaluationData.comments}
                  onChange={handleCommentsChange}
                  fullWidth
                  sx={{ mt: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={evaluationData.isAnonymous}
                      onChange={handleAnonymousChange}
                      color="primary"
                    />
                  }
                  label="Gửi ẩn danh"
                  sx={{ mt: 2 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Hủy</Button>
              <Button
                onClick={handleSubmitEvaluation}
                variant="contained"
                color="primary"
                disabled={!evaluationData.teachingScore || !evaluationData.contentScore || !evaluationData.attitudeScore}
              >
                Gửi đánh giá
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default TeacherEvaluation; 
