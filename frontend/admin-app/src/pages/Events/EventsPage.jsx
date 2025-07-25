/*-----------------------------------------------------------------
* File: EventsPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, Table, Space, Button, Dropdown, Modal, 
  Tag, Typography, Input, message, Tooltip, Divider
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, MoreOutlined, SearchOutlined,
  FilterOutlined, ExclamationCircleOutlined,
  CalendarOutlined, EnvironmentOutlined, UserOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { getAllEvents, deleteEvent, updateEventStatus } from '../../api/events';
import MainCard from '../../components/MainCard';

const { Title, Text } = Typography;
const { confirm } = Modal;

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  useEffect(() => {
    if (events.length > 0) {
      handleSearch(searchText);
    }
  }, [searchText, events]);
  
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await getAllEvents();
      setEvents(response.data || []);
      setFilteredEvents(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = events.filter(
      (event) =>
        event.Title?.toLowerCase().includes(value.toLowerCase()) ||
        event.Description?.toLowerCase().includes(value.toLowerCase()) ||
        event.Category?.toLowerCase().includes(value.toLowerCase()) ||
        event.Location?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredEvents(filtered);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateEventStatus(id, status);
      message.success('Cập nhật trạng thái thành công');
      fetchEvents();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const showDeleteConfirm = (id, title) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa sự kiện này?',
      icon: <ExclamationCircleOutlined />,
      content: `Sự kiện "${title}" sẽ bị xóa vĩnh viễn.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteEvent(id);
          message.success('Xóa sự kiện thành công');
          fetchEvents();
        } catch (error) {
          message.error('Không thể xóa sự kiện');
        }
      },
    });
  };

  const getCategoryTag = (category) => {
    const categoryMap = {
      'Competitive Programming': { color: 'blue', text: 'Lập trình thi đấu' },
      'Hackathon': { color: 'green', text: 'Hackathon' },
      'Web Development': { color: 'purple', text: 'Phát triển Web' },
      'AI/ML': { color: 'orange', text: 'AI/ML' },
      'Mobile Development': { color: 'cyan', text: 'Phát triển Mobile' },
      'DevOps': { color: 'gold', text: 'DevOps' },
      'Security': { color: 'red', text: 'Bảo mật' }
    };
    
    return (
      <Tag color={categoryMap[category]?.color || 'default'}>
        {categoryMap[category]?.text || category}
      </Tag>
    );
  };

  const getDifficultyTag = (difficulty) => {
    const difficultyMap = {
      'beginner': { color: 'success', text: 'Cơ bản' },
      'intermediate': { color: 'warning', text: 'Trung cấp' },
      'advanced': { color: 'error', text: 'Nâng cao' },
      'expert': { color: 'volcano', text: 'Chuyên gia' }
    };
    
    return (
      <Tag color={difficultyMap[difficulty?.toLowerCase()]?.color || 'default'}>
        {difficultyMap[difficulty?.toLowerCase()]?.text || difficulty}
      </Tag>
    );
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'upcoming': { color: 'processing', text: 'Sắp diễn ra' },
      'ongoing': { color: 'success', text: 'Đang diễn ra' },
      'completed': { color: 'warning', text: 'Đã kết thúc' },
      'cancelled': { color: 'error', text: 'Đã hủy' },
    };
    
    return (
      <Tag color={statusMap[status?.toLowerCase()]?.color || 'default'}>
        {statusMap[status?.toLowerCase()]?.text || status}
      </Tag>
    );
  };

  const formatDateTime = (date, time) => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      
      if (time) {
        const [hours, minutes] = time.split(':');
        dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      }
      
      return format(dateObj, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'N/A';
    }
  };

  const getActionMenu = (event) => {
    return {
      items: [
        {
          key: 'view',
          label: 'Xem chi tiết',
          icon: <EyeOutlined />,
        },
        {
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: <EditOutlined />,
        },
        {
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined />,
          danger: true,
        },
        {
          type: 'divider',
        },
        {
          key: 'status',
          label: 'Cập nhật trạng thái',
          icon: <FilterOutlined />,
          children: [
            {
              key: 'status_upcoming',
              label: 'Sắp diễn ra',
              disabled: event.Status === 'upcoming',
            },
            {
              key: 'status_ongoing',
              label: 'Đang diễn ra',
              disabled: event.Status === 'ongoing',
            },
            {
              key: 'status_completed',
              label: 'Đã kết thúc',
              disabled: event.Status === 'completed',
            },
            {
              key: 'status_cancelled',
              label: 'Đã hủy',
              disabled: event.Status === 'cancelled',
            },
          ],
        },
      ],
      onClick: ({ key }) => {
        if (key === 'view') {
          // Navigate to view detail is handled by Link
        } else if (key === 'edit') {
          // Navigate to edit is handled by Link
        } else if (key === 'delete') {
          showDeleteConfirm(event.EventID, event.Title);
        } else if (key.startsWith('status_')) {
          const newStatus = key.replace('status_', '');
          handleUpdateStatus(event.EventID, newStatus);
        }
      },
    };
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'Title',
      key: 'title',
      render: (text, record) => (
        <Link to={`/events/${record.EventID}`}>
          <Text strong>{text}</Text>
        </Link>
      ),
    },
    {
      title: 'Ngày diễn ra',
      key: 'eventDate',
      render: (_, record) => formatDateTime(record.EventDate, record.EventTime),
      sorter: (a, b) => new Date(a.EventDate) - new Date(b.EventDate),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'Location',
      key: 'location',
      render: (text) => (
        <Tooltip title={text}>
          <Space>
            <EnvironmentOutlined />
            {text.length > 20 ? `${text.substring(0, 20)}...` : text}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'Category',
      key: 'category',
      render: (text) => getCategoryTag(text),
      filters: [
        { text: 'Lập trình thi đấu', value: 'Competitive Programming' },
        { text: 'Hackathon', value: 'Hackathon' },
        { text: 'Phát triển Web', value: 'Web Development' },
        { text: 'AI/ML', value: 'AI/ML' },
        { text: 'Phát triển Mobile', value: 'Mobile Development' },
        { text: 'DevOps', value: 'DevOps' },
        { text: 'Bảo mật', value: 'Security' },
      ],
      onFilter: (value, record) => record.Category === value,
    },
    {
      title: 'Người tham gia',
      key: 'participants',
      render: (_, record) => `${record.CurrentAttendees || 0}/${record.MaxAttendees || '∞'}`,
      sorter: (a, b) => (a.CurrentAttendees || 0) - (b.CurrentAttendees || 0),
    },
    {
      title: 'Giá vé',
      dataIndex: 'Price',
      key: 'price',
      render: (text) => Number(text) > 0 ? `${Number(text).toLocaleString('vi-VN')} VNĐ` : 'Miễn phí',
      sorter: (a, b) => Number(a.Price) - Number(b.Price),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'status',
      render: (text) => getStatusTag(text),
      filters: [
        { text: 'Sắp diễn ra', value: 'upcoming' },
        { text: 'Đang diễn ra', value: 'ongoing' },
        { text: 'Đã kết thúc', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.Status?.toLowerCase() === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/events/${record.EventID}`}>
            <Button icon={<EyeOutlined />} size="small" />
          </Link>
          <Link to={`/events/edit/${record.EventID}`}>
            <Button icon={<EditOutlined />} size="small" />
          </Link>
          <Dropdown menu={getActionMenu(record)}>
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <MainCard title="Quản lý sự kiện">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Tìm kiếm sự kiện..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Link to="/events/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Tạo sự kiện mới
          </Button>
        </Link>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredEvents}
        rowKey="EventID"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} sự kiện`,
        }}
      />
    </MainCard>
  );
};

export default EventsPage; 
