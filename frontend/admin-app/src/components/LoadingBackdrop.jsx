import React from 'react';
import PropTypes from 'prop-types';
import { Backdrop, CircularProgress } from '@mui/material';

const LoadingBackdrop = ({ open, color = 'primary' }) => {
  return (
    <Backdrop
      sx={{
        color: (theme) => theme.palette[color].main,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backdropFilter: 'blur(2px)'
      }}
      open={open}
    >
      <CircularProgress color={color} />
    </Backdrop>
  );
};

LoadingBackdrop.propTypes = {
  open: PropTypes.bool.isRequired,
  color: PropTypes.string
};

export default LoadingBackdrop; 