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