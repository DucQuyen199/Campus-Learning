import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, Table, Space, Button, Dropdown, Modal, 
  Tag, Typography, Input, message, Tooltip, Divider
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, MoreOutlined, SearchOutlined,
  FilterOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { competitionsAPI } from '../../api/competitions';
import MainCard from '../../components/MainCard';

const { Title, Text } = Typography;
const { confirm } = Modal;

const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  
  useEffect(() => {
    fetchCompetitions();
  }, []);
  
  useEffect(() => {
    if (competitions.length > 0) {
      handleSearch(searchText);
    }
  }, [searchText, competitions]);
  
  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const response = await competitionsAPI.getCompetitions();
      setCompetitions(response.competitions || []);
      setFilteredCompetitions(response.competitions || []);
    } catch (error) {
      message.error('Không thể tải danh sách cuộc thi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = competitions.filter(
      (competition) =>
        competition.Title.toLowerCase().includes(value.toLowerCase()) ||
        competition.Description.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCompetitions(filtered);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await competitionsAPI.updateCompetitionStatus(id, status);
      message.success('Cập nhật trạng thái thành công');
      fetchCompetitions();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const showDeleteConfirm = (id, title) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa cuộc thi này?',
      icon: <ExclamationCircleOutlined />,
      content: `Cuộc thi "${title}" sẽ bị xóa vĩnh viễn.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await competitionsAPI.deleteCompetition(id);
          message.success('Xóa cuộc thi thành công');
          fetchCompetitions();
        } catch (error) {
          message.error('Không thể xóa cuộc thi');
        }
      },
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: 'default', text: 'Bản nháp' },
      upcoming: { color: 'processing', text: 'Sắp diễn ra' },
      ongoing: { color: 'success', text: 'Đang diễn ra' },
      completed: { color: 'warning', text: 'Đã kết thúc' },
      cancelled: { color: 'error', text: 'Đã hủy' },
    };
    
    return (
      <Tag color={statusMap[status]?.color || 'default'}>
        {statusMap[status]?.text || status}
      </Tag>
    );
  };

  const getDifficultyTag = (difficulty) => {
    const difficultyMap = {
      'Dễ': { color: 'success', text: 'Dễ' },
      'Trung bình': { color: 'warning', text: 'Trung bình' },
      'Khó': { color: 'error', text: 'Khó' },
    };
    
    return (
      <Tag color={difficultyMap[difficulty]?.color || 'default'}>
        {difficultyMap[difficulty]?.text || difficulty}
      </Tag>
    );
  };

  const getActionMenu = (competition) => {
    const statusOptions = [
      { key: 'draft', label: 'Bản nháp' },
      { key: 'upcoming', label: 'Sắp diễn ra' },
      { key: 'ongoing', label: 'Đang diễn ra' },
      { key: 'completed', label: 'Đã kết thúc' },
      { key: 'cancelled', label: 'Đã hủy' },
    ];
    
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
          children: statusOptions
            .filter(option => option.key !== competition.Status)
            .map(option => ({
              key: `status_${option.key}`,
              label: option.label,
            })),
        },
      ],
      onClick: ({ key }) => {
        if (key === 'view') {
          // Navigate to view detail
        } else if (key === 'edit') {
          // Navigate to edit
        } else if (key === 'delete') {
          showDeleteConfirm(competition.CompetitionID, competition.Title);
        } else if (key.startsWith('status_')) {
          const newStatus = key.replace('status_', '');
          handleUpdateStatus(competition.CompetitionID, newStatus);
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
        <Link to={`/competitions/${record.CompetitionID}`}>
          <Text strong>{text}</Text>
        </Link>
      ),
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'StartTime',
      key: 'startTime',
      render: (text) => new Date(text).toLocaleString('vi-VN'),
    },
    {
      title: 'Thời gian kết thúc',
      dataIndex: 'EndTime',
      key: 'endTime',
      render: (text) => new Date(text).toLocaleString('vi-VN'),
    },
    {
      title: 'Độ khó',
      dataIndex: 'Difficulty',
      key: 'difficulty',
      render: (text) => getDifficultyTag(text),
    },
    {
      title: 'Số lượng',
      key: 'participants',
      render: (_, record) => (
        <Tooltip title={`${record.CurrentParticipants}/${record.MaxParticipants} người tham gia`}>
          <Text>{record.CurrentParticipants}/{record.MaxParticipants}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'status',
      render: (text) => getStatusTag(text),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/competitions/${record.CompetitionID}`}>
            <Button icon={<EyeOutlined />} size="small" />
          </Link>
          <Link to={`/competitions/edit/${record.CompetitionID}`}>
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
    <MainCard title="Quản lý cuộc thi">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Tìm kiếm cuộc thi..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Link to="/competitions/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm cuộc thi
          </Button>
        </Link>
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCompetitions}
          rowKey="CompetitionID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} cuộc thi`,
          }}
        />
      </Card>
    </MainCard>
  );
};

export default CompetitionsPage;
