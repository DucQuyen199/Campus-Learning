import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Box,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Internship = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [internships, setInternships] = useState([]);

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
      marginBottom: theme.spacing(2)
    },
    tableContainer: {
      marginTop: theme.spacing(3)
    }
  };

  // Sample internship data
  const sampleInternships = [
    {
      id: 1,
      company: 'FPT Software',
      position: 'Software Engineer Intern',
      duration: '3 months',
      startDate: '01/06/2023',
      endDate: '31/08/2023',
      status: 'Completed',
      supervisor: 'Nguyễn Văn A',
      credits: 3
    },
    {
      id: 2,
      company: 'Viettel',
      position: 'IT Support Intern',
      duration: '2 months',
      startDate: '01/07/2023',
      endDate: '31/08/2023',
      status: 'In Progress',
      supervisor: 'Trần Thị B',
      credits: 2
    }
  ];

  useEffect(() => {
    // In a real app, this would fetch data from an API
    setInternships(sampleInternships);
  }, []);

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Thực tập
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Quản lý thông tin thực tập của sinh viên
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            {internships.length > 0 ? (
              <TableContainer component={Paper} sx={styles.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Công ty</TableCell>
                      <TableCell>Vị trí</TableCell>
                      <TableCell>Thời gian</TableCell>
                      <TableCell>Ngày bắt đầu</TableCell>
                      <TableCell>Ngày kết thúc</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Người hướng dẫn</TableCell>
                      <TableCell>Tín chỉ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {internships.map((internship) => (
                      <TableRow key={internship.id}>
                        <TableCell>{internship.company}</TableCell>
                        <TableCell>{internship.position}</TableCell>
                        <TableCell>{internship.duration}</TableCell>
                        <TableCell>{internship.startDate}</TableCell>
                        <TableCell>{internship.endDate}</TableCell>
                        <TableCell>
                          <Chip 
                            label={internship.status} 
                            color={internship.status === 'Completed' ? 'success' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{internship.supervisor}</TableCell>
                        <TableCell>{internship.credits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="body1" align="center">
                    Không có thông tin thực tập.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default Internship; 