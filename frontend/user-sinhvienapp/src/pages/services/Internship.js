/*-----------------------------------------------------------------
* File: Internship.js
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
import { internshipService } from '../../services/internshipService';

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

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        if (!currentUser) return;
        const data = await internshipService.getInternships(currentUser.UserID);
        setInternships(data);
      } catch (err) {
        console.error('Error loading internships:', err);
        setInternships([]);
      }
    };
    fetchInternships();
  }, [currentUser]);

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
                      <TableRow key={internship.InternshipID}>
                        <TableCell>{internship.CompanyName}</TableCell>
                        <TableCell>{internship.Position}</TableCell>
                        <TableCell>{internship.DurationMonths || '-'} tháng</TableCell>
                        <TableCell>{new Date(internship.StartDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(internship.EndDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={internship.Status}
                            color={internship.Status === 'Completed' ? 'success' : (internship.Status==='Ongoing'?'warning':'primary')} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{internship.Supervisor || '-'}</TableCell>
                        <TableCell>{internship.WeeklyHours || '-'}</TableCell>
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
