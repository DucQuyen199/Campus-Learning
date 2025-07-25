/*-----------------------------------------------------------------
* File: AddEventSchedulePage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Card, Button, Space } from 'antd';
import MainCard from '../../components/MainCard';
import AddEventSchedule from './AddEventSchedule';

const AddEventSchedulePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Xử lý khi thêm lịch trình thành công
  const handleScheduleAdded = () => {
    navigate(`/events/${id}`);
  };

  return (
    <MainCard
      title={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/events/${id}`)}
          />
          Thêm lịch trình mới
        </Space>
      }
    >
      <Card>
        <AddEventSchedule 
          eventId={id} 
          onSuccess={handleScheduleAdded}
        />
      </Card>
    </MainCard>
  );
};

export default AddEventSchedulePage; 
