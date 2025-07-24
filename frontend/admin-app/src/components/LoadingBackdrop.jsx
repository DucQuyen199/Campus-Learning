/*-----------------------------------------------------------------
* File: LoadingBackdrop.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
