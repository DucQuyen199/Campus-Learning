/*-----------------------------------------------------------------
* File: ExamsPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, Table, Space, Button, Dropdown, Modal, 
  Tag, Typography, Input, message, Tooltip, Divider,
  Row, Col, Statistic, DatePicker, Select
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, MoreOutlined, SearchOutlined,
  FilterOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, FileTextOutlined, CheckCircleOutlined,
  BookOutlined, CodeOutlined, SolutionOutlined, TrophyOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { getAllExams, deleteExam } from '../../api/exams';
import MainCard from '../../components/MainCard';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ExamsPage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredExams, setFilteredExams] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    multipleChoice: 0,
    essay: 0,
    coding: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0
  });
  
  useEffect(() => {
    fetchExams();
  }, []);
  
  useEffect(() => {
    if (exams.length > 0) {
      applyFilters();
      calculateStats();
    }
  }, [searchText, exams, typeFilter, statusFilter, dateRange]);
  
  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await getAllExams();
      
      if (response && response.exams) {
        const formattedExams = response.exams.map(exam => ({
          ExamID: exam.ExamID,
          Title: exam.Title,
          Description: exam.Description,
          Type: exam.Type?.toLowerCase() || 'multiple_choice',
          Duration: exam.Duration,
          TotalPoints: exam.TotalPoints || 100,
          PassingScore: exam.PassingScore || 60,
          StartTime: exam.StartTime ? new Date(exam.StartTime) : null,
          EndTime: exam.EndTime ? new Date(exam.EndTime) : null,
          Instructions: exam.Instructions,
          Status: exam.Status?.toLowerCase() || 'upcoming',
          CourseID: exam.CourseID,
          CourseTitle: exam.CourseTitle || 'Chưa gán khóa học',
          QuestionCount: exam.QuestionCount || 0,
          CreatorName: exam.CreatorName,
          Difficulty: exam.Difficulty || 'intermediate'
        }));
        
        setExams(formattedExams);
        setFilteredExams(formattedExams);
      } else {
        setExams([]);
        setFilteredExams([]);
      }
    } catch (error) {
      message.error('Không thể tải danh sách bài thi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!exams.length) return;

    const newStats = {
      total: exams.length,
      multipleChoice: exams.filter(exam => exam.Type === 'multiple_choice').length,
      essay: exams.filter(exam => exam.Type === 'essay').length,
      coding: exams.filter(exam => exam.Type === 'coding').length,
      upcoming: exams.filter(exam => exam.Status === 'upcoming').length,
      ongoing: exams.filter(exam => exam.Status === 'ongoing').length,
      completed: exams.filter(exam => exam.Status === 'completed').length
    };
    
    setStats(newStats);
  };

  const applyFilters = () => {
    const filtered = exams.filter(exam => {
      // Search text filter
      const matchesSearch = 
        exam.Title.toLowerCase().includes(searchText.toLowerCase()) ||
        (exam.Description && exam.Description.toLowerCase().includes(searchText.toLowerCase())) ||
        (exam.CourseTitle && exam.CourseTitle.toLowerCase().includes(searchText.toLowerCase()));
      
      // Type filter
      const matchesType = typeFilter === 'all' || exam.Type === typeFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || exam.Status === statusFilter;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange && dateRange[0] && dateRange[1] && exam.StartTime) {
        const startDate = dateRange[0].startOf('day').toDate();
        const endDate = dateRange[1].endOf('day').toDate();
        matchesDateRange = exam.StartTime >= startDate && exam.StartTime <= endDate;
      }
      
      return matchesSearch && matchesType && matchesStatus && matchesDateRange;
    });
    
    setFilteredExams(filtered);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      // Implement API call to update exam status
      // await updateExamStatus(id, status);
      message.success('Cập nhật trạng thái thành công');
      fetchExams();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const showDeleteConfirm = (id, title) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa bài thi này?',
      icon: <ExclamationCircleOutlined />,
      content: `Bài thi "${title}" sẽ bị xóa vĩnh viễn.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteExam(id);
          message.success('Xóa bài thi thành công');
          fetchExams();
        } catch (error) {
          message.error('Không thể xóa bài thi');
        }
      },
    });
  };

  const getTypeTag = (type) => {
    const typeMap = {
      'multiple_choice': { color: 'blue', text: 'Trắc nghiệm', icon: <SolutionOutlined /> },
      'essay': { color: 'purple', text: 'Tự luận', icon: <BookOutlined /> },
      'coding': { color: 'green', text: 'Lập trình', icon: <CodeOutlined /> },
      'mixed': { color: 'orange', text: 'Hỗn hợp', icon: <FileTextOutlined /> },
    };
    
    return (
      <Tag color={typeMap[type]?.color || 'default'} icon={typeMap[type]?.icon}>
        {typeMap[type]?.text || type}
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
      <Tag color={statusMap[status]?.color || 'default'}>
        {statusMap[status]?.text || status}
      </Tag>
    );
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'N/A';
    }
  };

  const getActionMenu = (exam) => {
    const statusOptions = [
      { key: 'upcoming', label: 'Sắp diễn ra' },
      { key: 'ongoing', label: 'Đang diễn ra' },
      { key: 'completed', label: 'Đã kết thúc' },
      { key: 'cancelled', label: 'Đã hủy' },
    ];
    
    let examDetailUrl = `/exams/${exam.ExamID}`;
    if (exam.Type === 'multiple_choice') {
      examDetailUrl = `/exams/multiple-choice/${exam.ExamID}`;
    } else if (exam.Type === 'essay') {
      examDetailUrl = `/exams/essay/${exam.ExamID}`;
    } else if (exam.Type === 'coding') {
      examDetailUrl = `/exams/coding/${exam.ExamID}`;
    }
    
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
            .filter(option => option.key !== exam.Status)
            .map(option => ({
              key: `status_${option.key}`,
              label: option.label,
            })),
        },
      ],
      onClick: ({ key }) => {
        if (key === 'view') {
          navigate(examDetailUrl);
        } else if (key === 'edit') {
          navigate(`/exams/edit/${exam.ExamID}`);
        } else if (key === 'delete') {
          showDeleteConfirm(exam.ExamID, exam.Title);
        } else if (key.startsWith('status_')) {
          const newStatus = key.replace('status_', '');
          handleUpdateStatus(exam.ExamID, newStatus);
        }
      },
    };
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'Title',
      key: 'title',
      render: (text, record) => {
        let examDetailUrl = `/exams/${record.ExamID}`;
        if (record.Type === 'multiple_choice') {
          examDetailUrl = `/exams/multiple-choice/${record.ExamID}`;
        } else if (record.Type === 'essay') {
          examDetailUrl = `/exams/essay/${record.ExamID}`;
        } else if (record.Type === 'coding') {
          examDetailUrl = `/exams/coding/${record.ExamID}`;
        }
        
        return (
          <Link to={examDetailUrl}>
            <Text strong>{text}</Text>
            {record.Description && (
              <Text type="secondary" style={{ display: 'block' }}>
                {record.Description.length > 50 
                  ? `${record.Description.substring(0, 50)}...` 
                  : record.Description}
              </Text>
            )}
          </Link>
        );
      },
    },
    {
      title: 'Loại bài thi',
      dataIndex: 'Type',
      key: 'type',
      render: (text) => getTypeTag(text),
      filters: [
        { text: 'Trắc nghiệm', value: 'multiple_choice' },
        { text: 'Tự luận', value: 'essay' },
        { text: 'Lập trình', value: 'coding' },
        { text: 'Hỗn hợp', value: 'mixed' },
      ],
      onFilter: (value, record) => record.Type === value,
    },
    {
      title: 'Độ khó',
      dataIndex: 'Difficulty',
      key: 'difficulty',
      render: (text) => getDifficultyTag(text),
      filters: [
        { text: 'Cơ bản', value: 'beginner' },
        { text: 'Trung cấp', value: 'intermediate' },
        { text: 'Nâng cao', value: 'advanced' },
        { text: 'Chuyên gia', value: 'expert' },
      ],
      onFilter: (value, record) => record.Difficulty === value,
    },
    {
      title: 'Thời gian làm bài',
      dataIndex: 'Duration',
      key: 'duration',
      render: (text) => (
        <Space>
          <ClockCircleOutlined />
          {text} phút
        </Space>
      ),
      sorter: (a, b) => a.Duration - b.Duration,
    },
    {
      title: 'Thời gian bắt đầu',
      key: 'startTime',
      render: (_, record) => formatDateTime(record.StartTime),
      sorter: (a, b) => new Date(a.StartTime) - new Date(b.StartTime),
    },
    {
      title: 'Số câu hỏi',
      dataIndex: 'QuestionCount',
      key: 'questionCount',
      render: (text) => (
        <Space>
          <FileTextOutlined />
          {text || 0}
        </Space>
      ),
      sorter: (a, b) => (a.QuestionCount || 0) - (b.QuestionCount || 0),
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
      onFilter: (value, record) => record.Status === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <MainCard title="Quản lý bài thi">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Statistic 
              title="Tổng số bài thi" 
              value={stats.total} 
              prefix={<FileTextOutlined />} 
            />
          </Col>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Statistic 
              title="Trắc nghiệm" 
              value={stats.multipleChoice} 
              prefix={<SolutionOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Statistic 
              title="Tự luận" 
              value={stats.essay} 
              prefix={<BookOutlined />} 
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Statistic 
              title="Lập trình" 
              value={stats.coding} 
              prefix={<CodeOutlined />} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Statistic 
              title="Sắp diễn ra" 
              value={stats.upcoming} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Statistic 
              title="Đang diễn ra" 
              value={stats.ongoing} 
              prefix={<TrophyOutlined />} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>

        <Divider />

        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Tìm kiếm bài thi"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Loại bài thi"
              value={typeFilter}
              onChange={setTypeFilter}
            >
              <Option value="all">Tất cả loại bài thi</Option>
              <Option value="multiple_choice">Trắc nghiệm</Option>
              <Option value="essay">Tự luận</Option>
              <Option value="coding">Lập trình</Option>
              <Option value="mixed">Hỗn hợp</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="upcoming">Sắp diễn ra</Option>
              <Option value="ongoing">Đang diễn ra</Option>
              <Option value="completed">Đã kết thúc</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker 
              style={{ width: '100%' }} 
              onChange={setDateRange}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>
          <Col xs={24} md={8} lg={6} style={{ marginTop: { xs: 16, md: 0 } }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/exams/create')}
            >
              Tạo bài thi mới
            </Button>
          </Col>
        </Row>

        <Card>
          <Table
            columns={columns}
            dataSource={filteredExams}
            rowKey="ExamID"
            loading={loading}
            pagination={{
              position: ['bottomRight'],
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bài thi`,
            }}
          />
        </Card>
      </Space>
    </MainCard>
  );
};

export default ExamsPage; 
