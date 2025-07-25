/*-----------------------------------------------------------------
* File: ModuleDetail.jsx
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
  List, Tooltip
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, 
  UserOutlined, EyeOutlined, BookOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, FileTextOutlined, LineChartOutlined,
  TeamOutlined, CalendarOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { coursesAPI } from '../../api/courses';
import MainCard from '../../components/MainCard';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const ModuleDetail = () => {
  const { id, moduleId } = useParams();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchModuleData();
  }, [moduleId]);
  
  const fetchModuleData = async () => {
    setLoading(true);
    try {
      // This API endpoint needs to be implemented
      // Mock implementation for now
      const response = await coursesAPI.getModule(id, moduleId);
      setModule(response.module);
      setLessons(response.lessons || []);
    } catch (error) {
      message.error('Không thể tải thông tin module');
      navigate(`/courses/${id}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteLesson = (lessonId) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa bài học này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await coursesAPI.deleteLesson(id, moduleId, lessonId);
          message.success('Xóa bài học thành công');
          fetchModuleData();
        } catch (error) {
          message.error('Không thể xóa bài học');
        }
      },
    });
  };
  
  const lessonColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'Title',
      key: 'title',
      render: (text, record) => (
        <Link to={`/courses/${id}/modules/${moduleId}/lessons/${record.LessonID}`}>
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
      title: 'Loại',
      dataIndex: 'Type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          'Video': { color: 'blue', text: 'Video' },
          'Quiz': { color: 'green', text: 'Bài kiểm tra' },
          'Text': { color: 'orange', text: 'Bài đọc' },
        };
        
        return (
          <Tag color={typeMap[type]?.color || 'default'}>
            {typeMap[type]?.text || type}
          </Tag>
        );
      }
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
              onClick={() => navigate(`/courses/${id}/modules/${moduleId}/lessons/${record.LessonID}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => navigate(`/courses/${id}/modules/${moduleId}/lessons/${record.LessonID}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteLesson(record.LessonID)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  if (loading || !module) {
    return (
      <MainCard title="Chi tiết module">
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
            onClick={() => navigate(`/courses/${id}`)}
          />
          Chi tiết module
        </Space>
      }
      extra={
        <Space>
          <Link to={`/courses/${id}/modules/${moduleId}/edit`}>
            <Button type="primary" icon={<EditOutlined />}>
              Chỉnh sửa
            </Button>
          </Link>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
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
                    navigate(`/courses/${id}`);
                  } catch (error) {
                    message.error('Không thể xóa module');
                  }
                },
              });
            }}
          >
            Xóa
          </Button>
        </Space>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <Title level={3}>{module.Title}</Title>
                <Tag icon={<BookOutlined />} color="blue">
                  Module {module.OrderIndex + 1}
                </Tag>
              </div>
            </div>
            
            <Divider />
            
            <Paragraph>{module.Description}</Paragraph>
            
            <Divider />
            
            <Descriptions title="Thông tin chi tiết" column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Thứ tự">
                {module.OrderIndex + 1}
              </Descriptions.Item>
              <Descriptions.Item label="Thời lượng">
                {module.Duration ? `${module.Duration} phút` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Số bài học">
                {lessons.length}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {module.CreatedAt ? new Date(module.CreatedAt).toLocaleDateString('vi-VN') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {module.UpdatedAt ? new Date(module.UpdatedAt).toLocaleDateString('vi-VN') : 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[0, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4}>Danh sách bài học ({lessons.length})</Title>
              <Button 
                type="primary" 
                icon={<FileTextOutlined />}
                onClick={() => navigate(`/courses/${id}/modules/${moduleId}/lessons/create`)}
              >
                Thêm bài học
              </Button>
            </div>
            
            <Table
              columns={lessonColumns}
              dataSource={lessons}
              rowKey="LessonID"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </MainCard>
  );
};

export default ModuleDetail; 
