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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Print, GetApp, ExpandMore } from '@mui/icons-material';

// Sample conduct score data
const conductData = {
  studentId: '12345678',
  name: 'Nguyen Van A',
  major: 'Computer Science',
  faculty: 'Faculty of Information Technology',
  enrollmentYear: '2020',
  overallScore: 85,
  semesters: ['HK1-2023-2024', 'HK2-2022-2023', 'HK1-2022-2023', 'HK2-2021-2022', 'HK1-2021-2022', 'HK2-2020-2021', 'HK1-2020-2021'],
  scores: {
    'HK1-2023-2024': {
      totalScore: 90,
      classification: 'Xuất sắc',
      details: [
        { id: 1, category: 'Ý thức học tập', maxScore: 30, score: 28, notes: 'Điểm trung bình học kỳ: 3.7/4.0' },
        { id: 2, category: 'Ý thức và kết quả chấp hành nội quy, quy chế', maxScore: 25, score: 23, notes: 'Không vi phạm nội quy' },
        { id: 3, category: 'Ý thức và kết quả tham gia các hoạt động chính trị, xã hội', maxScore: 20, score: 18, notes: 'Tham gia 2 hoạt động tình nguyện' },
        { id: 4, category: 'Ý thức công dân trong quan hệ cộng đồng', maxScore: 15, score: 13, notes: 'Tham gia đầy đủ các hoạt động cộng đồng' },
        { id: 5, category: 'Ý thức và kết quả tham gia công tác phụ trách lớp, đoàn thể', maxScore: 10, score: 8, notes: 'Hỗ trợ công tác lớp' }
      ]
    },
    'HK2-2022-2023': {
      totalScore: 85,
      classification: 'Tốt',
      details: [
        { id: 1, category: 'Ý thức học tập', maxScore: 30, score: 25, notes: 'Điểm trung bình học kỳ: 3.5/4.0' },
        { id: 2, category: 'Ý thức và kết quả chấp hành nội quy, quy chế', maxScore: 25, score: 22, notes: 'Không vi phạm nội quy' },
        { id: 3, category: 'Ý thức và kết quả tham gia các hoạt động chính trị, xã hội', maxScore: 20, score: 17, notes: 'Tham gia 1 hoạt động tình nguyện' },
        { id: 4, category: 'Ý thức công dân trong quan hệ cộng đồng', maxScore: 15, score: 13, notes: 'Tham gia đầy đủ các hoạt động cộng đồng' },
        { id: 5, category: 'Ý thức và kết quả tham gia công tác phụ trách lớp, đoàn thể', maxScore: 10, score: 8, notes: 'Hỗ trợ công tác lớp' }
      ]
    },
    'HK1-2022-2023': {
      totalScore: 83,
      classification: 'Tốt',
      details: [
        { id: 1, category: 'Ý thức học tập', maxScore: 30, score: 25, notes: 'Điểm trung bình học kỳ: 3.4/4.0' },
        { id: 2, category: 'Ý thức và kết quả chấp hành nội quy, quy chế', maxScore: 25, score: 21, notes: 'Không vi phạm nội quy' },
        { id: 3, category: 'Ý thức và kết quả tham gia các hoạt động chính trị, xã hội', maxScore: 20, score: 16, notes: 'Tham gia 1 hoạt động tình nguyện' },
        { id: 4, category: 'Ý thức công dân trong quan hệ cộng đồng', maxScore: 15, score: 13, notes: 'Tham gia đầy đủ các hoạt động cộng đồng' },
        { id: 5, category: 'Ý thức và kết quả tham gia công tác phụ trách lớp, đoàn thể', maxScore: 10, score: 8, notes: 'Hỗ trợ công tác lớp' }
      ]
    }
  }
};

const getClassificationColor = (classification) => {
  switch (classification) {
    case 'Xuất sắc':
      return '#4caf50';
    case 'Tốt':
      return '#2196f3';
    case 'Khá':
      return '#ff9800';
    case 'Trung bình':
      return '#ff5722';
    case 'Yếu':
      return '#f44336';
    default:
      return '#757575';
  }
};

const ConductScore = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [currentScore, setCurrentScore] = useState(null);

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
    summaryCard: {
      marginBottom: theme.spacing(3)
    },
    accordion: {
      marginBottom: theme.spacing(2)
    },
    scoreChip: {
      display: 'inline-block',
      padding: theme.spacing(0.5, 1.5),
      borderRadius: theme.spacing(2),
      fontWeight: 'bold',
      color: theme.palette.common.white,
      backgroundColor: theme.palette.primary.main
    }
  };

  useEffect(() => {
    // Set default semester to the first one (current semester)
    if (conductData.semesters.length > 0) {
      const currentSemester = conductData.semesters[0];
      setSelectedSemester(currentSemester);
      setCurrentScore(conductData.scores[currentSemester]);
    }
  }, []);

  const handleSemesterChange = (event) => {
    const semester = event.target.value;
    setSelectedSemester(semester);
    setCurrentScore(conductData.scores[semester]);
  };

  const handlePrint = () => {
    // This would print the conduct score in a real application
    window.print();
  };

  const handleDownload = () => {
    // This would download a PDF of the conduct score in a real application
    alert('Downloading conduct score as PDF...');
  };

  const getScoringCriteria = () => {
    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Tiêu chí đánh giá điểm rèn luyện
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Xếp loại</TableCell>
                <TableCell>Điểm</TableCell>
                <TableCell>Mô tả</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Xuất sắc</TableCell>
                <TableCell>90 - 100</TableCell>
                <TableCell>Sinh viên có thành tích xuất sắc trong học tập và rèn luyện</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tốt</TableCell>
                <TableCell>80 - 89</TableCell>
                <TableCell>Sinh viên có thành tích tốt trong học tập và rèn luyện</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Khá</TableCell>
                <TableCell>70 - 79</TableCell>
                <TableCell>Sinh viên có thành tích khá trong học tập và rèn luyện</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Trung bình</TableCell>
                <TableCell>60 - 69</TableCell>
                <TableCell>Sinh viên có thành tích trung bình trong học tập và rèn luyện</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Yếu</TableCell>
                <TableCell>50 - 59</TableCell>
                <TableCell>Sinh viên cần cải thiện trong học tập và rèn luyện</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Kém</TableCell>
                <TableCell>Dưới 50</TableCell>
                <TableCell>Sinh viên có kết quả không đạt yêu cầu, cần nỗ lực cải thiện</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Điểm rèn luyện
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem điểm rèn luyện và chi tiết các tiêu chí đánh giá
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Card sx={styles.summaryCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thông tin sinh viên
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Mã SV:</strong> {conductData.studentId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Họ tên:</strong> {conductData.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Ngành:</strong> {conductData.major}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Khoa/Viện:</strong> {conductData.faculty}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Năm nhập học:</strong> {conductData.enrollmentYear}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Điểm rèn luyện trung bình:</strong> {conductData.overallScore}/100
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <FormControl sx={styles.formControl}>
          <InputLabel>Học kỳ</InputLabel>
          <Select
            value={selectedSemester}
            onChange={handleSemesterChange}
            label="Học kỳ"
          >
            {conductData.semesters.map((semester) => (
              <MenuItem key={semester} value={semester}>
                {semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {currentScore && (
          <>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6">
                      Điểm rèn luyện học kỳ {selectedSemester}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Typography variant="h4" sx={{ mr: 2 }}>
                        {currentScore.totalScore}/100
                      </Typography>
                      <Box sx={{ 
                        ...styles.scoreChip, 
                        backgroundColor: getClassificationColor(currentScore.classification)
                      }}>
                        {currentScore.classification}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tiêu chí</TableCell>
                    <TableCell align="center">Điểm tối đa</TableCell>
                    <TableCell align="center">Điểm đạt</TableCell>
                    <TableCell>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentScore.details.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="center">{item.maxScore}</TableCell>
                      <TableCell align="center">{item.score}</TableCell>
                      <TableCell>{item.notes}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography variant="subtitle1">
                        <strong>Tổng điểm</strong>
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle1">
                        <strong>{currentScore.totalScore}</strong>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle1">
                        <strong>Xếp loại: {currentScore.classification}</strong>
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={styles.buttonGroup}>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={handlePrint}
              >
                In điểm rèn luyện
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
        )}

        <Accordion sx={styles.accordion}>
          <AccordionSummary
            expandIcon={<ExpandMore />}
          >
            <Typography variant="subtitle1">Thông tin về đánh giá điểm rèn luyện</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {getScoringCriteria()}
          </AccordionDetails>
        </Accordion>
      </Paper>
    </div>
  );
};

export default ConductScore; 