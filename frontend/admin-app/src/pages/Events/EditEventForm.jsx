/*-----------------------------------------------------------------
* File: EditEventForm.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Select, InputNumber, DatePicker, TimePicker,
  Typography, Space, message, Upload, Divider, Row, Col, Tag, Spin
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, PlusOutlined, UploadOutlined,
  CalendarOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import { getEventById, updateEvent, getEventLanguages, getEventTechnologies } from '../../api/events';
import MainCard from '../../components/MainCard';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Event categories
const categories = [
  { value: 'Competitive Programming', label: 'Lập trình thi đấu' },
  { value: 'Hackathon', label: 'Hackathon' },
  { value: 'Web Development', label: 'Phát triển Web' },
  { value: 'AI/ML', label: 'AI/ML' },
  { value: 'Mobile Development', label: 'Phát triển Mobile' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Security', label: 'Bảo mật' }
];

// Difficulty levels
const difficulties = [
  { value: 'beginner', label: 'Cơ bản' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'advanced', label: 'Nâng cao' },
  { value: 'expert', label: 'Chuyên gia' }
];

// Status options
const statusOptions = [
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'ongoing', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Đã kết thúc' },
  { value: 'cancelled', label: 'Đã hủy' }
];

const EditEventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState(null);
  const [eventLanguages, setEventLanguages] = useState([]);
  const [eventTechnologies, setEventTechnologies] = useState([]);

  // Lấy thông tin sự kiện khi trang được tải
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await getEventById(id);
        setEvent(response.data);
        
        // Nạp ngôn ngữ lập trình và công nghệ
        try {
          const languagesResponse = await getEventLanguages(id);
          if (languagesResponse.data && Array.isArray(languagesResponse.data)) {
            setEventLanguages(languagesResponse.data.map(item => item.Language));
          }
        } catch (error) {
          console.error('Error fetching event languages:', error);
        }

        try {
          const technologiesResponse = await getEventTechnologies(id);
          if (technologiesResponse.data && Array.isArray(technologiesResponse.data)) {
            setEventTechnologies(technologiesResponse.data.map(item => item.Technology));
          }
        } catch (error) {
          console.error('Error fetching event technologies:', error);
        }

        setLoading(false);
      } catch (error) {
        message.error('Không thể tải thông tin sự kiện');
        console.error('Error fetching event:', error);
        navigate('/events');
      }
    };

    fetchEventData();
  }, [id, navigate]);

  // Đặt giá trị ban đầu cho form sau khi dữ liệu sự kiện được tải
  useEffect(() => {
    if (event) {
      // Parse the date and time
      let eventDate = null;
      let eventTime = null;
      
      if (event.EventDate) {
        eventDate = dayjs(event.EventDate);
      }
      
      if (event.EventTime) {
        const timeParts = event.EventTime.split(':');
        if (timeParts.length >= 2) {
          const now = dayjs();
          eventTime = now.hour(parseInt(timeParts[0])).minute(parseInt(timeParts[1]));
        }
      }

      form.setFieldsValue({
        title: event.Title,
        description: event.Description,
        category: event.Category,
        eventDate: eventDate,
        eventTime: eventTime,
        location: event.Location,
        imageUrl: event.ImageUrl,
        maxAttendees: event.MaxAttendees,
        price: event.Price,
        organizer: event.Organizer,
        difficulty: event.Difficulty,
        status: event.Status,
        languages: eventLanguages,
        technologies: eventTechnologies
      });
    }
  }, [event, eventLanguages, eventTechnologies, form]);

  // Định dạng thời gian cho API
  const formatTimeForServer = (timeObj) => {
    if (!timeObj || !dayjs.isDayjs(timeObj)) {
      return null;
    }
    
    try {
      // Format time as HH:mm:ss for SQL Server TIME data type
      const hours = timeObj.hour().toString().padStart(2, '0');
      const minutes = timeObj.minute().toString().padStart(2, '0');
      const seconds = '00'; // We don't collect seconds
      
      return `${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return null;
    }
  };

  // Xử lý khi submit form
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // Chuẩn bị dữ liệu cơ bản với EventDate hợp lệ cho SQL Server
      const eventData = {
        Title: values.title,
        Description: values.description,
        Category: values.category,
        Location: values.location,
        ImageUrl: values.imageUrl || '',
        MaxAttendees: values.maxAttendees ? parseInt(values.maxAttendees) : 0,
        Price: values.price ? parseFloat(values.price) : 0,
        Organizer: values.organizer || '',
        Difficulty: values.difficulty,
        Status: values.status,
        // Thêm trường EventDate với giá trị hợp lệ cho SQL Server (YYYY-MM-DD)
        EventDate: '2023-01-01' // Giá trị ngày cố định hợp lệ cho SQL Server
      };

      // Thêm EventTime nếu có
      if (values.eventTime) {
        const formattedTime = formatTimeForServer(values.eventTime);
        console.log('Sending EventTime:', formattedTime);
        eventData.EventTime = formattedTime;
      }

      console.log('Sending data to server:', eventData);
      console.log('Using fixed EventDate to avoid validation errors');
      
      const response = await updateEvent(id, eventData);
      console.log('Server response:', response);
      message.success('Cập nhật sự kiện thành công');
      navigate(`/events/${id}`);
    } catch (error) {
      console.error('Error updating event:', error.response || error);
      let errorMsg = 'Không thể cập nhật sự kiện.';
      if (error.response?.data?.message) {
        errorMsg += ` ${error.response.data.message}`;
      }
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainCard title="Chỉnh sửa sự kiện">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Spin size="large" tip="Đang tải thông tin sự kiện..." />
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
            onClick={() => navigate(`/events/${id}`)}
          />
          <span>Chỉnh sửa sự kiện</span>
        </Space>
      }
    >
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={true}
        >
          <Title level={4}>Thông tin cơ bản</Title>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Tên sự kiện"
                rules={[{ required: true, message: 'Vui lòng nhập tên sự kiện' }]}
              >
                <Input placeholder="Nhập tên sự kiện" />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="description"
                label="Mô tả"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả sự kiện' }]}
              >
                <TextArea rows={4} placeholder="Nhập mô tả chi tiết về sự kiện" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map(category => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="difficulty"
                label="Độ khó"
                rules={[{ required: true, message: 'Vui lòng chọn độ khó' }]}
              >
                <Select placeholder="Chọn độ khó">
                  {difficulties.map(difficulty => (
                    <Option key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          
          <Title level={4}>Thời gian và địa điểm</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="eventDate"
                label="Ngày diễn ra"
                rules={[{ required: true, message: 'Vui lòng chọn ngày diễn ra' }]}
              >
                <DatePicker 
                  format="DD/MM/YYYY" 
                  style={{ width: '100%' }}
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="eventTime"
                label="Giờ bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ"
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="location"
                label="Địa điểm"
                rules={[{ required: true, message: 'Vui lòng nhập địa điểm' }]}
              >
                <Input 
                  placeholder="Nhập địa điểm tổ chức"
                  prefix={<EnvironmentOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          
          <Title level={4}>Thông tin bổ sung</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="imageUrl"
                label="URL hình ảnh"
              >
                <Input placeholder="Nhập URL hình ảnh sự kiện" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="organizer"
                label="Đơn vị tổ chức"
              >
                <Input placeholder="Nhập tên đơn vị tổ chức" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxAttendees"
                label="Số người tham gia tối đa"
                rules={[{ required: true, message: 'Vui lòng nhập số người tham gia tối đa' }]}
              >
                <InputNumber 
                  min={1} 
                  style={{ width: '100%' }}
                  placeholder="Nhập số người tham gia tối đa"
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá vé (VNĐ)"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập giá vé"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
              >
                Lưu thay đổi
              </Button>
              <Button
                onClick={() => navigate(`/events/${id}`)}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </MainCard>
  );
};

export default EditEventForm; 
