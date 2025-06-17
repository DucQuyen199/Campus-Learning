import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, Input, Button, DatePicker, InputNumber, 
  Select, Upload, message, Card, Space, Divider,
  Row, Col, Typography
} from 'antd';
import { 
  ArrowLeftOutlined, UploadOutlined, 
  SaveOutlined, CloseOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { competitionsAPI } from '../../api/competitions';
import { usersAPI } from '../../api/index';
import MainCard from '../../components/MainCard';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CompetitionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [coverImageURL, setCoverImageURL] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  useEffect(() => {
    fetchInstructors();
    if (id) {
      setIsEditMode(true);
      fetchCompetitionData(id);
    }
  }, [id]);
  
  const fetchInstructors = async () => {
    try {
      const response = await usersAPI.getUsers();
      setInstructors(response.users || []);
    } catch (error) {
      message.error('Không thể tải danh sách người hướng dẫn');
    }
  };
  
  const fetchCompetitionData = async (competitionId) => {
    setLoading(true);
    try {
      const response = await competitionsAPI.getCompetition(competitionId);
      const competition = response.competition;
      
      if (competition) {
        setThumbnailUrl(competition.ThumbnailUrl);
        setCoverImageURL(competition.CoverImageURL);
        
        form.setFieldsValue({
          title: competition.Title,
          description: competition.Description,
          dateRange: [
            moment(competition.StartTime),
            moment(competition.EndTime)
          ],
          duration: competition.Duration,
          difficulty: competition.Difficulty,
          status: competition.Status,
          maxParticipants: competition.MaxParticipants,
          prizePool: competition.PrizePool,
          organizedBy: competition.OrganizedBy
        });
      }
    } catch (error) {
      message.error('Không thể tải thông tin cuộc thi');
      navigate('/competitions');
    } finally {
      setLoading(false);
    }
  };
  
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const [startTime, endTime] = values.dateRange;
      const now = moment();
      
      // Determine the appropriate initial status based on dates
      let initialStatus = values.status;
      if (!initialStatus || initialStatus === 'draft') {
        // If startTime is in the future, set to 'upcoming'
        // If startTime is now or in the past but before endTime, set to 'ongoing'
        // Otherwise keep as draft
        if (startTime.isBefore(now) && now.isBefore(endTime)) {
          initialStatus = 'ongoing';
        } else if (startTime.isAfter(now)) {
          initialStatus = 'upcoming';
        } else {
          initialStatus = 'draft';
        }
      }
      
      const competitionData = {
        title: values.title,
        description: values.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: values.duration,
        difficulty: values.difficulty,
        status: initialStatus,
        maxParticipants: values.maxParticipants,
        prizePool: values.prizePool,
        organizedBy: values.organizedBy,
        thumbnailUrl,
        coverImageURL
      };
      
      if (isEditMode) {
        await competitionsAPI.updateCompetition(id, competitionData);
        message.success('Cập nhật cuộc thi thành công');
      } else {
        const result = await competitionsAPI.createCompetition(competitionData);
        message.success('Tạo cuộc thi thành công');
        // Navigate to the newly created competition
        if (result.competitionId) {
          navigate(`/competitions/${result.competitionId}`);
          return;
        }
      }
      
      navigate('/competitions');
    } catch (error) {
      message.error(isEditMode ? 'Không thể cập nhật cuộc thi' : 'Không thể tạo cuộc thi');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleThumbnailChange = (info) => {
    if (info.file.status === 'done') {
      setThumbnailUrl(info.file.response.url);
      message.success(`${info.file.name} tải lên thành công`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} tải lên thất bại`);
    }
  };
  
  const handleCoverImageChange = (info) => {
    if (info.file.status === 'done') {
      setCoverImageURL(info.file.response.url);
      message.success(`${info.file.name} tải lên thành công`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} tải lên thất bại`);
    }
  };
  
  const difficultyOptions = [
    { value: 'Dễ', label: 'Dễ' },
    { value: 'Trung bình', label: 'Trung bình' },
    { value: 'Khó', label: 'Khó' }
  ];
  
  const statusOptions = [
    { value: 'draft', label: 'Bản nháp' },
    { value: 'upcoming', label: 'Sắp diễn ra' },
    { value: 'ongoing', label: 'Đang diễn ra' },
    { value: 'completed', label: 'Đã kết thúc' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];
  
  return (
    <MainCard
      title={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/competitions')}
          />
          {isEditMode ? 'Chỉnh sửa cuộc thi' : 'Thêm cuộc thi mới'}
        </Space>
      }
    >
      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            difficulty: 'Trung bình',
            status: 'draft',
            maxParticipants: 100,
            prizePool: 0
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Title level={4}>Thông tin cơ bản</Title>
              
              <Form.Item
                name="title"
                label="Tiêu đề cuộc thi"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập tiêu đề cuộc thi'
                  }
                ]}
              >
                <Input placeholder="Nhập tiêu đề cuộc thi" />
              </Form.Item>
              
              <Form.Item
                name="description"
                label="Mô tả"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập mô tả cuộc thi'
                  }
                ]}
              >
                <TextArea
                  placeholder="Nhập mô tả chi tiết về cuộc thi"
                  autoSize={{ minRows: 4, maxRows: 8 }}
                />
              </Form.Item>
              
              <Form.Item
                name="dateRange"
                label="Thời gian bắt đầu và kết thúc"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn thời gian bắt đầu và kết thúc'
                  },
                  {
                    validator: (_, value) => {
                      if (!value || !value[0] || !value[1]) return Promise.resolve();
                      
                      const [startTime, endTime] = value;
                      if (endTime.isBefore(startTime)) {
                        return Promise.reject(new Error('Thời gian kết thúc phải sau thời gian bắt đầu'));
                      }
                      
                      const duration = endTime.diff(startTime, 'minutes');
                      if (duration < 5) {
                        return Promise.reject(new Error('Cuộc thi phải kéo dài ít nhất 5 phút'));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <RangePicker
                  showTime
                  format="DD/MM/YYYY HH:mm:ss"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="duration"
                    label="Thời gian làm bài (phút)"
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng nhập thời gian làm bài'
                      }
                    ]}
                  >
                    <InputNumber min={1} max={10000} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    name="difficulty"
                    label="Độ khó"
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng chọn độ khó'
                      }
                    ]}
                  >
                    <Select>
                      {difficultyOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng chọn trạng thái'
                      }
                    ]}
                  >
                    <Select>
                      {statusOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            
            <Col xs={24} md={8}>
              <Title level={4}>Cài đặt bổ sung</Title>
              
              <Form.Item
                name="maxParticipants"
                label="Số lượng người tham gia tối đa"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập số lượng người tối đa'
                  }
                ]}
              >
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="prizePool"
                label="Giải thưởng (VNĐ)"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập giá trị giải thưởng'
                  }
                ]}
              >
                <InputNumber
                  min={0}
                  step={100000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\₫\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                name="organizedBy"
                label="Người tổ chức"
              >
                <Select
                  showSearch
                  placeholder="Chọn người tổ chức"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {instructors.map((instructor) => (
                    <Option key={instructor.UserID} value={instructor.UserID}>
                      {instructor.FullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                label="Ảnh thu nhỏ"
                name="thumbnailUrl"
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) {
                    return e;
                  }
                  return e && e.fileList;
                }}
              >
                <Upload
                  name="thumbnail"
                  listType="picture"
                  maxCount={1}
                  onChange={handleThumbnailChange}
                  action="/api/upload"
                >
                  <Button icon={<UploadOutlined />}>Tải lên ảnh thu nhỏ</Button>
                </Upload>
              </Form.Item>
              
              <Form.Item
                label="Ảnh bìa"
                name="coverImageURL"
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) {
                    return e;
                  }
                  return e && e.fileList;
                }}
              >
                <Upload
                  name="cover"
                  listType="picture"
                  maxCount={1}
                  onChange={handleCoverImageChange}
                  action="/api/upload"
                >
                  <Button icon={<UploadOutlined />}>Tải lên ảnh bìa</Button>
                </Upload>
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
                {isEditMode ? 'Cập nhật' : 'Tạo cuộc thi'}
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => navigate('/competitions')}
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

export default CompetitionForm;