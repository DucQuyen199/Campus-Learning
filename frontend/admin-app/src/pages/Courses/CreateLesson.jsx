import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, Input, Button, Card, Typography, Divider, message, 
  Radio, InputNumber, Switch, Upload, Space, Select, Spin, Row, Col
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined, VideoCameraOutlined
} from '@ant-design/icons';
import { coursesAPI } from '../../api/courses';
import MainCard from '../../components/MainCard';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateLesson = () => {
  const { id, moduleId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [lessonType, setLessonType] = useState('Text');
  const [content, setContent] = useState('');
  const [lessons, setLessons] = useState([]);
  
  // Fetch existing lessons to determine next order index
  useEffect(() => {
    const fetchModuleLessons = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getModule(id, moduleId);
        setLessons(response.lessons || []);
        
        // Set default order index to be after the last lesson
        const nextOrderIndex = response.lessons.length > 0 
          ? Math.max(...response.lessons.map(l => l.OrderIndex || 0)) + 1 
          : 0;
          
        form.setFieldsValue({
          orderIndex: nextOrderIndex,
          type: 'Text',
          duration: 0,
          isPreview: false
        });
      } catch (error) {
        message.error('Không thể tải thông tin module');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModuleLessons();
  }, [id, moduleId, form]);
  
  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      
      const lessonData = {
        title: values.title,
        description: values.description,
        type: values.type,
        content: lessonType === 'Text' ? content : values.content,
        orderIndex: values.orderIndex,
        duration: values.duration,
        isPreview: values.isPreview,
        videoUrl: values.videoUrl
      };
      
      const response = await coursesAPI.createLesson(id, moduleId, lessonData);
      
      message.success('Tạo bài học mới thành công');
      
      // Navigate to the newly created lesson
      navigate(`/courses/${id}/modules/${moduleId}/lessons/${response.LessonID}`);
    } catch (error) {
      message.error('Không thể tạo bài học mới');
    } finally {
      setSaving(false);
    }
  };
  
  const handleTypeChange = (e) => {
    setLessonType(e.target.value);
  };
  
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
  };
  
  if (loading) {
    return (
      <MainCard title="Tạo bài học mới">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
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
          Tạo bài học mới
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'Text',
          orderIndex: 0,
          duration: 0,
          isPreview: false
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
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bài học' }]}
                  >
                    <Input placeholder="Nhập tiêu đề bài học" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả bài học' }]}
                  >
                    <TextArea rows={3} placeholder="Nhập mô tả bài học" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} md={12}>
                  <Form.Item
                    name="type"
                    label="Loại bài học"
                    rules={[{ required: true, message: 'Vui lòng chọn loại bài học' }]}
                  >
                    <Radio.Group onChange={handleTypeChange}>
                      <Radio value="Text">Văn bản</Radio>
                      <Radio value="Video">Video</Radio>
                      <Radio value="Quiz">Bài kiểm tra</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                
                <Col xs={12} md={6}>
                  <Form.Item
                    name="orderIndex"
                    label="Thứ tự"
                    rules={[{ required: true, message: 'Vui lòng nhập thứ tự bài học' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col xs={12} md={6}>
                  <Form.Item
                    name="duration"
                    label="Thời lượng (phút)"
                    rules={[{ required: true, message: 'Vui lòng nhập thời lượng bài học' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Form.Item
                    name="isPreview"
                    label="Cho phép xem trước không cần đăng ký"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              {lessonType === 'Video' && (
                <div>
                  <Divider orientation="left">Thông tin video</Divider>
                  <Form.Item
                    name="videoUrl"
                    label="Đường dẫn video (URL)"
                    rules={[{ required: lessonType === 'Video', message: 'Vui lòng nhập đường dẫn video' }]}
                  >
                    <Input 
                      placeholder="Nhập đường dẫn video (YouTube, Vimeo, ...)" 
                      prefix={<VideoCameraOutlined />} 
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="content"
                    label="Ghi chú đi kèm video (không bắt buộc)"
                  >
                    <TextArea rows={4} placeholder="Nhập nội dung bổ sung cho video" />
                  </Form.Item>
                </div>
              )}
              
              {lessonType === 'Text' && (
                <div>
                  <Divider orientation="left">Nội dung bài học</Divider>
                  <Form.Item
                    label="Nội dung bài học"
                    rules={[{ required: lessonType === 'Text', message: 'Vui lòng nhập nội dung bài học' }]}
                  >
                    <ReactQuill 
                      theme="snow" 
                      value={content} 
                      onChange={setContent}
                      modules={modules}
                      style={{ height: '300px', marginBottom: '50px' }}
                    />
                  </Form.Item>
                </div>
              )}
              
              {lessonType === 'Quiz' && (
                <div>
                  <Divider orientation="left">Nội dung bài kiểm tra</Divider>
                  <Form.Item
                    name="content"
                    label="Nội dung bài kiểm tra"
                    rules={[{ required: lessonType === 'Quiz', message: 'Vui lòng nhập nội dung bài kiểm tra' }]}
                  >
                    <TextArea 
                      rows={6} 
                      placeholder="Nhập hướng dẫn, câu hỏi và các thông tin khác cho bài kiểm tra" 
                    />
                  </Form.Item>
                  <div style={{ marginBottom: 16, color: '#1890ff' }}>
                    <Text type="secondary">
                      * Công cụ biên tập bài kiểm tra nâng cao đang được phát triển. Hiện tại bạn có thể nhập nội dung hướng dẫn bài kiểm tra tại đây.
                    </Text>
                  </div>
                </div>
              )}
              
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={saving}
                  >
                    Tạo bài học
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

export default CreateLesson; 