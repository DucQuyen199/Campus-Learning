import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowBack } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '100px', md: '150px' },
            fontWeight: 700,
            color: 'primary.main',
            lineHeight: 1.1,
            mb: 2,
          }}
        >
          404
        </Typography>
        
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 600,
            mb: 2,
          }}
        >
          Không tìm thấy trang
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: '500px' }}
        >
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          Vui lòng kiểm tra lại đường dẫn hoặc quay lại trang chủ.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ minWidth: '180px' }}
          >
            Trang chủ
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ minWidth: '180px' }}
          >
            Quay lại
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFound; 