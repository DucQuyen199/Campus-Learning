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
  BookOutlined, UserOutlined
} from '@ant-design/icons';
import { coursesAPI } from '../../api/courses';
import MainCard from '../../components/MainCard';

const { Title, Text } = Typography;
const { confirm } = Modal;

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  
  useEffect(() => {
    fetchCourses();
  }, []);
  
  useEffect(() => {
    if (courses.length > 0) {
      handleSearch(searchText);
    }
  }, [searchText, courses]);
  
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await coursesAPI.getCourses();
      setCourses(response.courses || []);
      setFilteredCourses(response.courses || []);
    } catch (error) {
      message.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = courses.filter(
      (course) =>
        course.Title.toLowerCase().includes(value.toLowerCase()) ||
        course.Description.toLowerCase().includes(value.toLowerCase()) ||
        course.Category.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  const handleUpdatePublishStatus = async (id, isPublished) => {
    try {
      await coursesAPI.updateCourse(id, { IsPublished: isPublished });
      message.success('Cập nhật trạng thái thành công');
      fetchCourses();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const showDeleteConfirm = (id, title) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa khóa học này?',
      icon: <ExclamationCircleOutlined />,
      content: `Khóa học "${title}" sẽ bị xóa vĩnh viễn.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await coursesAPI.deleteCourse(id);
          message.success('Xóa khóa học thành công');
          fetchCourses();
        } catch (error) {
          message.error('Không thể xóa khóa học');
        }
      },
    });
  };

  const getLevelTag = (level) => {
    const levelMap = {
      'Beginner': { color: 'success', text: 'Cơ bản' },
      'Intermediate': { color: 'warning', text: 'Trung cấp' },
      'Advanced': { color: 'error', text: 'Nâng cao' },
    };
    
    return (
      <Tag color={levelMap[level]?.color || 'default'}>
        {levelMap[level]?.text || level}
      </Tag>
    );
  };

  const getPublishStatusTag = (isPublished) => {
    return isPublished ? 
      <Tag color="success">Đã xuất bản</Tag> : 
      <Tag color="default">Bản nháp</Tag>;
  };

  const getActionMenu = (course) => {
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
          key: course.IsPublished ? 'unpublish' : 'publish',
          label: course.IsPublished ? 'Hủy xuất bản' : 'Xuất bản',
          icon: <FilterOutlined />,
        },
      ],
      onClick: ({ key }) => {
        if (key === 'view') {
          // Navigate to view detail is handled by Link
        } else if (key === 'edit') {
          // Navigate to edit is handled by Link
        } else if (key === 'delete') {
          showDeleteConfirm(course.CourseID, course.Title);
        } else if (key === 'publish') {
          handleUpdatePublishStatus(course.CourseID, true);
        } else if (key === 'unpublish') {
          handleUpdatePublishStatus(course.CourseID, false);
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
        <Link to={`/courses/${record.CourseID}`}>
          <Text strong>{text}</Text>
        </Link>
      ),
    },
    {
      title: 'Người hướng dẫn',
      dataIndex: 'InstructorName',
      key: 'instructor',
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'Category',
      key: 'category',
      render: (text) => (
        <Tag icon={<BookOutlined />} color="blue">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Cấp độ',
      dataIndex: 'Level',
      key: 'level',
      render: (text) => getLevelTag(text),
    },
    {
      title: 'Giá',
      dataIndex: 'Price',
      key: 'price',
      render: (text) => text > 0 ? `${text.toLocaleString('vi-VN')} VNĐ` : 'Miễn phí',
    },
    {
      title: 'Số học viên',
      dataIndex: 'EnrollmentCount',
      key: 'enrollments',
      render: (text) => text || 0,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'IsPublished',
      key: 'status',
      render: (text) => getPublishStatusTag(text),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/courses/${record.CourseID}`}>
            <Button icon={<EyeOutlined />} size="small" />
          </Link>
          <Link to={`/courses/edit/${record.CourseID}`}>
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
    <MainCard title="Quản lý khóa học">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Tìm kiếm khóa học..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Link to="/courses/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm khóa học
          </Button>
        </Link>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredCourses}
        rowKey="CourseID"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} khóa học`,
        }}
      />
    </MainCard>
  );
};

export default CoursesPage;
