/*-----------------------------------------------------------------
* File: CourseDetail.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Typography, Tag, Button, Tabs, Table, Image,
  Descriptions, Avatar, Space, Divider, Statistic, Modal, message,
  List, Tooltip, Empty, Badge
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, 
  UserOutlined, EyeOutlined, BookOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, FileTextOutlined, LineChartOutlined,
  TeamOutlined, CalendarOutlined, CheckCircleOutlined, 
  MailOutlined, PhoneOutlined, SearchOutlined
} from '@ant-design/icons';
import { coursesAPI } from '../../api/courses';
import MainCard from '../../components/MainCard';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  useEffect(() => {
    fetchCourseData();
  }, [id]);
  
  useEffect(() => {
    if (activeTab === '2') {
      fetchEnrolledStudents();
    }
  }, [activeTab, id]);
  
  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const response = await coursesAPI.getCourse(id);
      setCourse(response.course);
      setModules(response.modules || []);
    } catch (error) {
      message.error('Không thể tải thông tin khóa học');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEnrolledStudents = async (page = 1, pageSize = 10) => {
    setEnrollmentsLoading(true);
    try {
      const response = await coursesAPI.getEnrolledStudents(id, page, pageSize);
      
      if (response.message && response.message.includes('not found')) {
        message.warning('Bảng dữ liệu đăng ký khóa học chưa được thiết lập trong cơ sở dữ liệu.');
        setEnrolledStudents([]);
      } else {
        setEnrolledStudents(response.enrollments || []);
        setPagination({
          current: response.pagination.currentPage,
          pageSize: response.pagination.itemsPerPage,
          total: response.pagination.totalItems
        });
      }
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      
      // Check if it's a 404 or 500 error specifically
      if (error.response) {
        if (error.response.status === 404) {
          message.warning('API đang trong quá trình phát triển. Hệ thống hiện chưa có dữ liệu học viên.');
        } else if (error.response.status === 500) {
          message.error('Lỗi server khi tải danh sách học viên. Vui lòng thử lại sau.');
        } else {
          message.error('Không thể tải danh sách học viên');
        }
      } else {
        message.error('Không thể tải danh sách học viên');
      }
      
      // Reset state to empty to avoid UI issues
      setEnrolledStudents([]);
      setPagination({
        current: 1,
        pageSize: 10,
        total: 0
      });
    } finally {
      setEnrollmentsLoading(false);
    }
  };
  
  const handleDeleteCourse = () => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa khóa học này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await coursesAPI.deleteCourse(id);
          message.success('Xóa khóa học thành công');
          navigate('/courses');
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
  
  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: 'default', text: 'Bản nháp' },
      published: { color: 'success', text: 'Đã xuất bản' },
      archived: { color: 'warning', text: 'Đã lưu trữ' },
    };
    
    return (
      <Tag color={statusMap[status]?.color || 'default'}>
        {statusMap[status]?.text || status}
      </Tag>
    );
  };
  
  const moduleColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'Title',
      key: 'title',
      render: (text, record) => (
        <Link to={`/courses/${id}/modules/${record.ModuleID}`}>
          <Text strong>{text}</Text>
        </Link>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'OrderIndex',
      key: 'orderIndex',
      sorter: (a, b) => a.OrderIndex - b.OrderIndex,
    },
    {
      title: 'Số bài học',
      dataIndex: 'LessonCount',
      key: 'lessonCount',
      render: (text) => text || 0,
    },
    {
      title: 'Thời lượng',
      dataIndex: 'Duration',
      key: 'duration',
      render: (text) => text ? `${text} phút` : 'N/A',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => navigate(`/courses/${id}/modules/${record.ModuleID}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => navigate(`/courses/${id}/modules/${record.ModuleID}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteModule(record.ModuleID)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  const handleDeleteModule = (moduleId) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa module này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await coursesAPI.deleteModule(id, moduleId);
          message.success('Xóa module thành công');
          fetchCourseData();
        } catch (error) {
          message.error('Không thể xóa module');
        }
      },
    });
  };
  
  const studentColumns = [
    {
      title: 'Học viên',
      dataIndex: 'User',
      key: 'user',
      render: (user) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={user?.AvatarUrl} />
          <span>{user?.FullName || 'Không có tên'}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'User',
      key: 'email',
      render: (user) => (
        <Space>
          <MailOutlined />
          {user?.Email || 'N/A'}
        </Space>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'User',
      key: 'phone',
      render: (user) => (
        <Space>
          <PhoneOutlined />
          {user?.Phone || 'N/A'}
        </Space>
      ),
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'EnrollmentDate',
      key: 'enrollmentDate',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) => new Date(a.EnrollmentDate) - new Date(b.EnrollmentDate),
    },
    {
      title: 'Tiến độ',
      dataIndex: 'Progress',
      key: 'progress',
      render: (progress) => `${progress || 0}%`,
      sorter: (a, b) => (a.Progress || 0) - (b.Progress || 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = 'Không xác định';
        
        switch(status) {
          case 'active':
            color = 'success';
            text = 'Đang học';
            break;
          case 'completed':
            color = 'blue';
            text = 'Đã hoàn thành';
            break;
          case 'inactive':
            color = 'warning';
            text = 'Không hoạt động';
            break;
          default:
            break;
        }
        
        return <Badge status={color} text={text} />;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  const handleTableChange = (pagination) => {
    fetchEnrolledStudents(pagination.current, pagination.pageSize);
  };
  
  if (loading || !course) {
    return (
      <MainCard title="Chi tiết khóa học">
        <Card loading={true} />
      </MainCard>
    );
  }
  
  return (
    <MainCard
      title={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/courses')}
          />
          Chi tiết khóa học
        </Space>
      }
      extra={
        <Space>
          <Link to={`/courses/edit/${id}`}>
            <Button type="primary" icon={<EditOutlined />}>
              Chỉnh sửa
            </Button>
          </Link>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteCourse}
          >
            Xóa
          </Button>
        </Space>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <Title level={3}>{course.Title}</Title>
                <Space wrap>
                  {getStatusTag(course.IsPublished ? 'published' : 'draft')}
                  {getLevelTag(course.Level)}
                  <Tag icon={<BookOutlined />} color="blue">
                    {course.Category}
                  </Tag>
                </Space>
              </div>
              <div>
                <Image
                  width={180}
                  src={course.ImageUrl || 'https://via.placeholder.com/300x180?text=No+Image'}
                  fallback="https://via.placeholder.com/300x180?text=Image+Not+Found"
                  style={{ borderRadius: 8 }}
                />
              </div>
            </div>
            
            <Divider />
            
            <Paragraph>{course.Description}</Paragraph>
            
            <Divider />
            
            <Descriptions title="Thông tin chi tiết" column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Người hướng dẫn">
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  {course.InstructorName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Cấp độ">
                {getLevelTag(course.Level)}
              </Descriptions.Item>
              <Descriptions.Item label="Danh mục">
                {course.Category}
              </Descriptions.Item>
              <Descriptions.Item label="Giá">
                {course.Price > 0 ? `${course.Price.toLocaleString('vi-VN')} VNĐ` : 'Miễn phí'}
              </Descriptions.Item>
              <Descriptions.Item label="Số học viên">
                {course.EnrollmentCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(course.CreatedAt).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {new Date(course.UpdatedAt).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái xuất bản">
                {getStatusTag(course.IsPublished ? 'published' : 'draft')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Row gutter={[0, 24]}>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Số lượng học viên"
                  value={course.EnrollmentCount || 0}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Số lượng module"
                  value={modules.length}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Tổng thời lượng"
                  value={modules.reduce((total, module) => total + (module.Duration || 0), 0)}
                  suffix="phút"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Đánh giá trung bình"
                  value={course.AverageRating || 0}
                  precision={1}
                  suffix="/5"
                  prefix={<LineChartOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      
      <Row gutter={[0, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card>
            <Tabs 
              defaultActiveKey="1" 
              onChange={(key) => setActiveTab(key)}
              items={[
                {
                  key: '1',
                  label: 'Danh sách module',
                  children: (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={4}>Modules ({modules.length})</Title>
                        <Button 
                          type="primary" 
                          icon={<FileTextOutlined />}
                          onClick={() => navigate(`/courses/${id}/modules/create`)}
                        >
                          Thêm module
                        </Button>
                      </div>
                      
                      <Table
                        columns={moduleColumns}
                        dataSource={modules}
                        rowKey="ModuleID"
                        pagination={false}
                      />
                    </>
                  )
                },
                {
                  key: '2',
                  label: 'Học viên đã đăng ký',
                  children: (
                    <Card>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={4}>Học viên đã đăng ký ({enrolledStudents.length})</Title>
                        <Space>
                          <Button icon={<SearchOutlined />}>
                            Tìm kiếm
                          </Button>
                        </Space>
                      </div>

                      <Table
                        columns={studentColumns}
                        dataSource={enrolledStudents}
                        rowKey={(record) => record.EnrollmentID || record.UserID}
                        loading={enrollmentsLoading}
                        pagination={pagination}
                        onChange={handleTableChange}
                        locale={{
                          emptyText: (
                            <Empty 
                              description="Chưa có học viên nào đăng ký khóa học này" 
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                          )
                        }}
                      />
                    </Card>
                  )
                },
                {
                  key: '3',
                  label: 'Đánh giá & Phản hồi',
                  children: (
                    <Card>
                      {/* Ratings and feedback component will go here */}
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Text>Đang phát triển tính năng này...</Text>
                      </div>
                    </Card>
                  )
                },
                {
                  key: '4',
                  label: 'Phân tích & Thống kê',
                  children: (
                    <Card>
                      {/* Analytics component will go here */}
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Text>Đang phát triển tính năng này...</Text>
                      </div>
                    </Card>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </MainCard>
  );
};

export default CourseDetail; 
