/*-----------------------------------------------------------------
* File: EventSchedule.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EventScheduleList from './EventScheduleList';

const { Title } = Typography;

const EventSchedule = ({ eventId, eventTitle }) => {
  const [refreshList, setRefreshList] = useState(0);
  const navigate = useNavigate();

  // Xử lý khi nhấn nút thêm lịch trình
  const handleAddNewSchedule = () => {
    navigate(`/events/${eventId}/schedule/create`);
  };

  return (
    <Card title={
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <CalendarOutlined style={{ marginRight: 8 }} />
        <span>Lịch trình sự kiện {eventTitle ? `- ${eventTitle}` : ''}</span>
      </div>
    }>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>Danh sách lịch trình</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddNewSchedule}
        >
          Thêm lịch trình mới
        </Button>
      </div>
      
      <EventScheduleList 
        eventId={eventId} 
        refresh={refreshList}
      />
    </Card>
  );
};

export default EventSchedule; 
