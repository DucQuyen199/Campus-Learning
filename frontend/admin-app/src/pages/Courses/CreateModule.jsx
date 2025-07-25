/*-----------------------------------------------------------------
* File: CreateModule.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, Input, Button, Card, Typography, Divider, message, 
  InputNumber, Space, Upload, Switch, Spin, Row, Col
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined
} from '@ant-design/icons';
import { coursesAPI } from '../../api/courses';
import MainCard from '../../components/MainCard';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateModule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [modules, setModules] = useState([]);
  
  // Fetch existing modules to determine next order index
  useEffect(() => {
    const fetchCourseModules = async () => {
      try {
        setLoading(true);
        // This gets the course data including modules
        const response = await coursesAPI.getCourse(id);
        setModules(response.modules || []);
        
        // Set default order index to be after the last module
        const nextOrderIndex = response.modules.length > 0 
          ? Math.max(...response.modules.map(m => m.OrderIndex || 0)) + 1 
          : 0;
          
        form.setFieldsValue({
          orderIndex: nextOrderIndex
        });
      } catch (error) {
        message.error('Không thể tải thông tin khóa học');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseModules();
  }, [id, form]);
  
  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      
      const moduleData = {
        Title: values.title,
        Description: values.description,
        OrderIndex: values.orderIndex,
        Duration: values.duration,
      };
      
      const response = await coursesAPI.createModule(id, moduleData);
      
      message.success('Tạo module mới thành công');
      
      // Navigate to the newly created module
      navigate(`/courses/${id}/modules/${response.ModuleID}`);
    } catch (error) {
      message.error('Không thể tạo module mới');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <MainCard title="Tạo module mới">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Đang tải..." />
        </div>
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
          Tạo module mới
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          orderIndex: 0,
          duration: 0,
        }}
      >
        <Row gutter={[24, 0]}>
          <Col xs={24}>
            <Card>
              <Title level={4}>Thông tin cơ bản</Title>
              <Divider />
              
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    name="title"
                    label="Tiêu đề"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề module' }]}
                  >
                    <Input placeholder="Nhập tiêu đề module" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả module' }]}
                  >
                    <TextArea rows={4} placeholder="Nhập mô tả module" />
                  </Form.Item>
                </Col>
                
                <Col xs={12}>
                  <Form.Item
                    name="orderIndex"
                    label="Thứ tự"
                    rules={[{ required: true, message: 'Vui lòng nhập thứ tự module' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col xs={12}>
                  <Form.Item
                    name="duration"
                    label="Thời lượng (phút)"
                    rules={[{ required: true, message: 'Vui lòng nhập thời lượng module' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={saving}
                  >
                    Tạo module
                  </Button>
                  <Button 
                    onClick={() => navigate(`/courses/${id}`)}
                  >
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </MainCard>
  );
};

export default CreateModule; 
