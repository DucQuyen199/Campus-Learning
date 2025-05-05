import React from 'react';
import { Card, Typography } from 'antd';
import PropTypes from 'prop-types';

const { Title } = Typography;

const MainCard = ({ children, title, extra }) => {
  return (
    <Card
      className="main-card"
      title={title && <Title level={4}>{title}</Title>}
      extra={extra}
      style={{ marginBottom: 24, borderRadius: 8 }}
      styles={{ body: { padding: 24 } }}
    >
      {children}
    </Card>
  );
};

MainCard.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  extra: PropTypes.node
};

export default MainCard; 