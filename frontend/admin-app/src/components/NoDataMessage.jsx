import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, useTheme } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

const NoDataMessage = ({ message, subMessage, icon, height }) => {
  const theme = useTheme();
  const Icon = icon || InboxOutlined;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 5,
        minHeight: height || 200,
        color: theme.palette.text.secondary
      }}
    >
      <Icon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 1 }} />
      <Typography variant="h6" gutterBottom>
        {message || 'Không có dữ liệu'}
      </Typography>
      {subMessage && (
        <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: 400 }}>
          {subMessage}
        </Typography>
      )}
    </Box>
  );
};

NoDataMessage.propTypes = {
  message: PropTypes.string,
  subMessage: PropTypes.string,
  icon: PropTypes.elementType,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default NoDataMessage; 