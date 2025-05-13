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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Print, GetApp } from '@mui/icons-material';

// Sample exam schedule data
const examData = {
  semesters: ['HK1-2023-2024', 'HK2-2022-2023', 'HK1-2022-2023'],
  schedule: {
    'HK1-2023-2024': [
      {
        id: 1,
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        examDate: '10/12/2023',
        examTime: '09:00 - 11:00',
        examRoom: 'A301',
        examType: 'Final',
        seatNumber: '15'
      },
      {
        id: 2,
        courseCode: 'MATH201',
        courseName: 'Calculus II',
        examDate: '12/12/2023',
        examTime: '13:00 - 15:00',
        examRoom: 'B205',
        examType: 'Final',
        seatNumber: '22'
      },
      {
        id: 3,
        courseCode: 'PHY102',
        courseName: 'Physics for Engineers',
        examDate: '15/12/2023',
        examTime: '09:00 - 11:00',
        examRoom: 'C105',
        examType: 'Final',
        seatNumber: '8'
      }
    ],
    'HK2-2022-2023': [
      {
        id: 4,
        courseCode: 'CS201',
        courseName: 'Data Structures and Algorithms',
        examDate: '20/05/2023',
        examTime: '09:00 - 11:00',
        examRoom: 'A201',
        examType: 'Final',
        seatNumber: '12'
      },
      {
        id: 5,
        courseCode: 'CS231',
        courseName: 'Database Systems',
        examDate: '22/05/2023',
        examTime: '13:00 - 15:00',
        examRoom: 'A305',
        examType: 'Final',
        seatNumber: '5'
      }
    ],
    'HK1-2022-2023': [
      {
        id: 6,
        courseCode: 'ENG101',
        courseName: 'English for Academic Purposes',
        examDate: '10/12/2022',
        examTime: '09:00 - 11:00',
        examRoom: 'D101',
        examType: 'Final',
        seatNumber: '20'
      }
    ]
  }
};

const ExamSchedule = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [currentExams, setCurrentExams] = useState([]);

  // Styles using theme directly instead of makeStyles
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
    formControl: {
      minWidth: 200,
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(3)
    },
    tableContainer: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(2),
      marginTop: theme.spacing(2)
    },
    infoCard: {
      marginBottom: theme.spacing(3)
    }
  };

  useEffect(() => {
    // Set default semester to the first one (current semester)
    if (examData.semesters.length > 0) {
      const currentSemester = examData.semesters[0];
      setSelectedSemester(currentSemester);
      setCurrentExams(examData.schedule[currentSemester] || []);
    }
  }, []);

  const handleSemesterChange = (event) => {
    const semester = event.target.value;
    setSelectedSemester(semester);
    setCurrentExams(examData.schedule[semester] || []);
  };

  const handlePrint = () => {
    // This would print the schedule in a real application
    window.print();
  };

  const handleDownload = () => {
    // This would download a PDF of the schedule in a real application
    alert('Downloading exam schedule as PDF...');
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Lịch thi
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem lịch thi của các kỳ thi hiện tại và trước đây
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <FormControl sx={styles.formControl}>
          <InputLabel>Học kỳ</InputLabel>
          <Select
            value={selectedSemester}
            onChange={handleSemesterChange}
            label="Học kỳ"
          >
            {examData.semesters.map((semester) => (
              <MenuItem key={semester} value={semester}>
                {semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Card sx={styles.infoCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thông tin kỳ thi {selectedSemester}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Thời gian thi:</strong> 05/12/2023 - 20/12/2023
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Số môn thi:</strong> {currentExams.length}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="error">
                  <strong>Lưu ý:</strong> Sinh viên cần có mặt tại phòng thi trước giờ thi ít nhất 15 phút và mang theo thẻ sinh viên.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {currentExams.length > 0 ? (
          <>
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã môn học</TableCell>
                    <TableCell>Tên môn học</TableCell>
                    <TableCell>Ngày thi</TableCell>
                    <TableCell>Giờ thi</TableCell>
                    <TableCell>Phòng thi</TableCell>
                    <TableCell>Loại thi</TableCell>
                    <TableCell>Số báo danh</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>{exam.courseCode}</TableCell>
                      <TableCell>{exam.courseName}</TableCell>
                      <TableCell>{exam.examDate}</TableCell>
                      <TableCell>{exam.examTime}</TableCell>
                      <TableCell>{exam.examRoom}</TableCell>
                      <TableCell>{exam.examType}</TableCell>
                      <TableCell>{exam.seatNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={styles.buttonGroup}>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={handlePrint}
              >
                In lịch thi
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleDownload}
              >
                Tải PDF
              </Button>
            </Box>
          </>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center">
                Không có lịch thi cho học kỳ này.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Paper>
    </div>
  );
};

export default ExamSchedule; 