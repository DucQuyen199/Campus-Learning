import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Popconfirm, message, Empty, Typography, Spin } from 'antd';
import { DeleteOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { getEventSchedule, deleteEventSchedule } from '../../api/events';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Ánh xạ loại hoạt động sang màu sắc
const typeColors = {
  main_event: 'blue',
  registration: 'cyan',
  opening: 'green',
  break: 'orange',
  workshop: 'purple',
  networking: 'magenta',
  presentation: 'volcano',
  competition: 'red',
  judging: 'gold',
  awards: 'lime',
  closing: 'geekblue',
  other: 'default'
};

// Ánh xạ loại hoạt động sang tên tiếng Việt
const typeLabels = {
  main_event: 'Sự kiện chính',
  registration: 'Đăng ký',
  opening: 'Khai mạc',
  break: 'Giải lao',
  workshop: 'Workshop',
  networking: 'Giao lưu',
  presentation: 'Thuyết trình',
  competition: 'Thi đấu',
  judging: 'Chấm điểm',
  awards: 'Trao giải',
  closing: 'Bế mạc',
  other: 'Khác'
};

const EventScheduleList = ({ eventId, refresh }) => {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tải danh sách lịch trình
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await getEventSchedule(eventId);
      if (response.data && Array.isArray(response.data)) {
        // Sắp xếp theo thời gian bắt đầu
        const sortedItems = response.data.sort((a, b) => 
          new Date(a.StartTime) - new Date(b.StartTime)
        );
        setScheduleItems(sortedItems);
      } else {
        setScheduleItems([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch trình:', error);
      message.error('Không thể tải danh sách lịch trình');
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu khi component được mount hoặc khi eventId thay đổi
  useEffect(() => {
    if (eventId) {
      fetchSchedule();
    }
  }, [eventId, refresh]);

  // Xử lý xóa lịch trình
  const handleDelete = async (scheduleId) => {
    try {
      await deleteEventSchedule(eventId, scheduleId);
      message.success('Xóa lịch trình thành công');
      fetchSchedule();
    } catch (error) {
      console.error('Lỗi khi xóa lịch trình:', error);
      message.error('Không thể xóa lịch trình');
    }
  };

  // Định dạng thời gian hiển thị
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    return dayjs(dateTimeStr).format('DD/MM/YYYY HH:mm');
  };

  // Cấu hình cột cho bảng
  const columns = [
    {
      title: 'Hoạt động',
      dataIndex: 'ActivityName',
      key: 'activityName',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.Description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.Description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'Type',
      key: 'type',
      render: (type) => (
        <Tag color={typeColors[type] || 'default'}>
          {typeLabels[type] || type}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <ClockCircleOutlined />
            <Text>Bắt đầu: {formatDateTime(record.StartTime)}</Text>
          </Space>
          <Space>
            <ClockCircleOutlined />
            <Text>Kết thúc: {formatDateTime(record.EndTime)}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'Location',
      key: 'location',
      render: (location) => (
        <Space>
          <EnvironmentOutlined />
          <Text>{location || 'Chưa xác định'}</Text>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa lịch trình này?"
            onConfirm={() => handleDelete(record.ScheduleID)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (scheduleItems.length === 0) {
    return (
      <Empty
        description="Chưa có lịch trình nào được thêm"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={scheduleItems}
      rowKey="ScheduleID"
      pagination={false}
    />
  );
};

export default EventScheduleList; 