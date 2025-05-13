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
  Chip,
  Card,
  CardContent,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { EmojiEvents, Report } from '@mui/icons-material';

// Sample awards and discipline data
const awardsData = [
  {
    id: 1,
    type: 'award',
    title: 'Học bổng khuyến khích học tập loại Xuất sắc',
    semester: 'HK1-2022-2023',
    date: '15/01/2023',
    description: 'Học bổng dành cho sinh viên có điểm trung bình học kỳ từ 3.60 đến 4.00 và điểm rèn luyện từ 90 trở lên.',
    amount: '5,000,000 VNĐ'
  },
  {
    id: 2,
    type: 'award',
    title: 'Học bổng khuyến khích học tập loại Giỏi',
    semester: 'HK2-2021-2022',
    date: '15/08/2022',
    description: 'Học bổng dành cho sinh viên có điểm trung bình học kỳ từ 3.20 đến 3.59 và điểm rèn luyện từ 80 trở lên.',
    amount: '4,000,000 VNĐ'
  },
  {
    id: 3,
    type: 'award',
    title: 'Giải Nhì cuộc thi Lập trình sinh viên',
    semester: 'HK2-2021-2022',
    date: '20/05/2022',
    description: 'Giải thưởng dành cho đội đạt giải Nhì trong cuộc thi Lập trình sinh viên cấp trường.',
    amount: '3,000,000 VNĐ'
  },
  {
    id: 4,
    type: 'discipline',
    title: 'Cảnh cáo học vụ',
    semester: 'HK1-2020-2021',
    date: '10/01/2021',
    description: 'Cảnh cáo do điểm trung bình học kỳ dưới 1.0.',
    amount: 'N/A'
  }
];

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Awards = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [awards, setAwards] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

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
    tableContainer: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    summaryCard: {
      marginBottom: theme.spacing(3)
    },
    tabs: {
      marginBottom: theme.spacing(2)
    },
    icon: {
      marginRight: theme.spacing(1),
      verticalAlign: 'middle'
    }
  };

  useEffect(() => {
    // Filter awards and disciplines
    setAwards(awardsData.filter(item => item.type === 'award'));
    setDisciplines(awardsData.filter(item => item.type === 'discipline'));
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Khen thưởng và kỷ luật
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem danh sách khen thưởng, học bổng và kỷ luật
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Card sx={styles.summaryCard}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <EmojiEvents color="primary" sx={styles.icon} />
                  <Typography variant="h6">
                    Tổng số khen thưởng: {awards.length}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <Report color="error" sx={styles.icon} />
                  <Typography variant="h6">
                    Tổng số kỷ luật: {disciplines.length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Tabs value={tabValue} onChange={handleTabChange} sx={styles.tabs}>
          <Tab label="Khen thưởng & Học bổng" />
          <Tab label="Kỷ luật" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {awards.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên khen thưởng</TableCell>
                    <TableCell>Học kỳ</TableCell>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Giá trị</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {awards.map((award) => (
                    <TableRow key={award.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <EmojiEvents color="primary" style={{ marginRight: 8 }} />
                          {award.title}
                        </Box>
                      </TableCell>
                      <TableCell>{award.semester}</TableCell>
                      <TableCell>{award.date}</TableCell>
                      <TableCell>{award.description}</TableCell>
                      <TableCell>{award.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                Không có khen thưởng nào được ghi nhận.
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {disciplines.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Hình thức kỷ luật</TableCell>
                    <TableCell>Học kỳ</TableCell>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Lý do</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disciplines.map((discipline) => (
                    <TableRow key={discipline.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Report color="error" style={{ marginRight: 8 }} />
                          {discipline.title}
                        </Box>
                      </TableCell>
                      <TableCell>{discipline.semester}</TableCell>
                      <TableCell>{discipline.date}</TableCell>
                      <TableCell>{discipline.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                Không có kỷ luật nào được ghi nhận.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      <Paper sx={styles.paper}>
        <Typography variant="h6" gutterBottom>
          Quy định về khen thưởng và kỷ luật
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Khen thưởng:
        </Typography>
        <Typography variant="body2" paragraph>
          1. Học bổng khuyến khích học tập được xét dựa trên kết quả học tập và rèn luyện mỗi học kỳ.
        </Typography>
        <Typography variant="body2" paragraph>
          2. Sinh viên có thành tích xuất sắc trong nghiên cứu khoa học, hoạt động ngoại khóa sẽ được xét khen thưởng.
        </Typography>
        <Typography variant="body2" paragraph>
          3. Khen thưởng được ghi nhận vào hồ sơ sinh viên và có thể kèm theo phần thưởng vật chất.
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Kỷ luật:
        </Typography>
        <Typography variant="body2" paragraph>
          1. Sinh viên vi phạm quy chế, nội quy của trường sẽ bị xử lý kỷ luật tùy theo mức độ vi phạm.
        </Typography>
        <Typography variant="body2" paragraph>
          2. Các hình thức kỷ luật bao gồm: khiển trách, cảnh cáo, đình chỉ học tập và buộc thôi học.
        </Typography>
        <Typography variant="body2" paragraph>
          3. Kỷ luật được ghi nhận vào hồ sơ sinh viên và có thể ảnh hưởng đến việc xét học bổng, tốt nghiệp.
        </Typography>
      </Paper>
    </div>
  );
};

export default Awards; 