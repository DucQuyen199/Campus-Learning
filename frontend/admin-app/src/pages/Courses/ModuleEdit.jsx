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

const ModuleEdit = () => {
  const { id, moduleId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Fetch module data when component mounts
  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        // This API endpoint needs to be implemented
        const response = await coursesAPI.getModule(id, moduleId);
        
        form.setFieldsValue({
          title: response.module.Title,
          description: response.module.Description,
          orderIndex: response.module.OrderIndex,
          duration: response.module.Duration,
          // Add other fields as needed
        });
      } catch (error) {
        message.error('Không thể tải thông tin module');
        navigate(`/courses/${id}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModule();
  }, [id, moduleId, form, navigate]);
  
  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      
      const moduleData = {
        Title: values.title,
        Description: values.description,
        OrderIndex: values.orderIndex,
        Duration: values.duration,
        // Add other fields as needed
      };
      
      await coursesAPI.updateModule(id, moduleId, moduleData);
      
      message.success('Cập nhật module thành công');
      navigate(`/courses/${id}/modules/${moduleId}`);
    } catch (error) {
      message.error('Không thể cập nhật module');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <MainCard title="Chỉnh sửa module">
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
            onClick={() => navigate(`/courses/${id}/modules/${moduleId}`)}
          />
          Chỉnh sửa module
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
                    Lưu thay đổi
                  </Button>
                  <Button 
                    onClick={() => navigate(`/courses/${id}/modules/${moduleId}`)}
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

export default ModuleEdit; 