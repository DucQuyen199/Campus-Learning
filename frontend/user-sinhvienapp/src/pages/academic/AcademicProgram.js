import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Chip
} from '@mui/material';
import { ExpandMore, School } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { academicService } from '../../services/api';

const AcademicProgram = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [program, setProgram] = useState(null);
  
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
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Chương trình đào tạo
      </Typography>
      
      {program ? (
        <>
          <Paper elevation={3} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h5" gutterBottom>
              <School sx={{ mr: 1, verticalAlign: 'middle' }} />
              {program.ProgramName}
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Mã chương trình" 
                      secondary={program.ProgramCode || 'Chưa cập nhật'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Khoa/Viện" 
                      secondary={program.Faculty || 'Chưa cập nhật'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Bộ môn" 
                      secondary={program.Department || 'Chưa cập nhật'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Bằng cấp" 
                      secondary={program.DegreeName || 'Chưa cập nhật'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Tổng số tín chỉ" 
                      secondary={program.TotalCredits || 'Chưa cập nhật'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Thời gian đào tạo" 
                      secondary={`${program.ProgramDuration || '4'} năm`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Loại chương trình" 
                      secondary={program.ProgramType || 'Chính quy'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Năm nhập học" 
                      secondary={program.EntryYear || 'Chưa cập nhật'} 
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Mô tả chương trình
            </Typography>
            <Typography variant="body1" paragraph>
              {program.Description || 'Chưa có thông tin mô tả cho chương trình đào tạo này.'}
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Cấu trúc chương trình
            </Typography>
            
            {/* Placeholder for program structure */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Khối kiến thức đại cương</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>STT</TableCell>
                        <TableCell>Mã môn học</TableCell>
                        <TableCell>Tên môn học</TableCell>
                        <TableCell align="right">Số tín chỉ</TableCell>
                        <TableCell>Loại</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Example rows */}
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell>CS101</TableCell>
                        <TableCell>Nhập môn Khoa học máy tính</TableCell>
                        <TableCell align="right">3</TableCell>
                        <TableCell><Chip size="small" label="Bắt buộc" color="primary" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2</TableCell>
                        <TableCell>MATH101</TableCell>
                        <TableCell>Giải tích 1</TableCell>
                        <TableCell align="right">4</TableCell>
                        <TableCell><Chip size="small" label="Bắt buộc" color="primary" /></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Khối kiến thức cơ sở ngành</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>STT</TableCell>
                        <TableCell>Mã môn học</TableCell>
                        <TableCell>Tên môn học</TableCell>
                        <TableCell align="right">Số tín chỉ</TableCell>
                        <TableCell>Loại</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Example rows */}
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell>CS201</TableCell>
                        <TableCell>Cấu trúc dữ liệu và giải thuật</TableCell>
                        <TableCell align="right">4</TableCell>
                        <TableCell><Chip size="small" label="Bắt buộc" color="primary" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2</TableCell>
                        <TableCell>CS202</TableCell>
                        <TableCell>Cơ sở dữ liệu</TableCell>
                        <TableCell align="right">3</TableCell>
                        <TableCell><Chip size="small" label="Bắt buộc" color="primary" /></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Khối kiến thức chuyên ngành</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>STT</TableCell>
                        <TableCell>Mã môn học</TableCell>
                        <TableCell>Tên môn học</TableCell>
                        <TableCell align="right">Số tín chỉ</TableCell>
                        <TableCell>Loại</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Example rows */}
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell>CS301</TableCell>
                        <TableCell>Trí tuệ nhân tạo</TableCell>
                        <TableCell align="right">3</TableCell>
                        <TableCell><Chip size="small" label="Bắt buộc" color="primary" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2</TableCell>
                        <TableCell>CS302</TableCell>
                        <TableCell>Phát triển ứng dụng web</TableCell>
                        <TableCell align="right">3</TableCell>
                        <TableCell><Chip size="small" label="Tự chọn" color="secondary" /></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </>
      ) : (
        <Alert severity="info">
          Không tìm thấy thông tin chương trình đào tạo. Vui lòng liên hệ phòng đào tạo để được hỗ trợ.
        </Alert>
      )}
    </Container>
  );
};

export default AcademicProgram; 