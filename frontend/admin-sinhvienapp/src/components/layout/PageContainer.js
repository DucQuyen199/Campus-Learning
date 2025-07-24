/*-----------------------------------------------------------------
* File: PageContainer.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { Box, Paper, Typography, Breadcrumbs, Link, Divider, useTheme, alpha } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Enhanced PageContainer with breadcrumbs, title and better styling
 * @param {Object} props Component props
 * @param {ReactNode} props.children Content to render inside the container
 * @param {boolean} props.fullHeight Whether the container should take full height
 * @param {boolean} props.noPadding Whether the container should have padding
 * @param {string} props.title Optional page title
 * @param {Array} props.breadcrumbs Optional breadcrumbs array [{name, path}]
 * @param {boolean} props.paper Whether to wrap content in a Paper component
 * @param {ReactNode} props.headerContent Optional custom header content
 * @param {Object} props.paperProps Additional props for Paper component
 */
const PageContainer = ({ 
  children, 
  fullHeight = true, // Default to full height
  noPadding = false, 
  title = null,
  breadcrumbs = null,
  paper = false, // Không cần paper vì đã nằm trong form thống nhất
  headerContent = null,
  paperProps = {}
}) => {
  const theme = useTheme();

  const containerStyles = {
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    height: fullHeight ? '100%' : 'auto',
    minHeight: fullHeight ? '100%' : 'auto',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  };

  const contentStyles = {
    p: noPadding ? 0 : { xs: 2, md: 3 },
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  };

  // Render breadcrumbs if provided
  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    
    return (
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 1 }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return isLast ? (
            <Typography key={index} color="text.primary" fontWeight={500}>
              {crumb.name}
            </Typography>
          ) : (
            <Link 
              key={index}
              component={RouterLink} 
              to={crumb.path}
              underline="hover"
              color="inherit"
            >
              {crumb.name}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  // Render header section with title, breadcrumbs, and optional content
  const renderHeader = () => {
    if (!title && !breadcrumbs && !headerContent) return null;
    
    return (
      <Box sx={{ mb: noPadding ? 0 : 2 }}>
        {renderBreadcrumbs()}
        
        {title && (
          <Typography variant="h5" component="h1" fontWeight={600} sx={{ mb: 1 }}>
            {title}
          </Typography>
        )}
        
        {headerContent}
        
        {(title || headerContent) && <Divider sx={{ mt: 2 }} />}
      </Box>
    );
  };

  // Nội dung đã nằm trong form thống nhất, không cần paper bọc lại
  return (
    <Box sx={{...containerStyles, ...contentStyles}}>
      {renderHeader()}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Box>
  );
};

export default PageContainer; 
