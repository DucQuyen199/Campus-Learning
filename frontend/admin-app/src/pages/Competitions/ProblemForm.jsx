import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, InputNumber, Select, Button, Card, Typography,
  Space, Divider, message, Row, Col, Upload, Spin
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined,
  CodeOutlined, FileTextOutlined, ReloadOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import MainCard from '../../components/MainCard';
import { competitionsAPI } from '../../api/competitions';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Debug flag - set to true to see debug information
const DEBUG = false;

const ProblemForm = () => {
  const navigate = useNavigate();
  const { id: competitionId, problemId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [initialValues, setInitialValues] = useState({
    Title: '',
    Description: '',
    Difficulty: 'Trung bình',
    Points: 100,
    TimeLimit: 1,
    MemoryLimit: 256,
    InputFormat: '',
    OutputFormat: '',
    Constraints: '',
    SampleInput: '',
    SampleOutput: '',
    Explanation: '',
    Tags: '',
    StarterCode: '',
    Instructions: '',
    ImageURL: ''
  });

  const isEditMode = !!problemId;

  useEffect(() => {
    if (isEditMode) {
      fetchProblemData();
    } else {
      // Reset form when creating a new problem
      form.resetFields();
    }
  }, [competitionId, problemId, form]);

  const fetchProblemData = async () => {
    try {
      setDataLoading(true);
      const response = await competitionsAPI.getProblem(competitionId, problemId);
      
      if (DEBUG) {
        console.log('Problem API response:', response);
      }
      
      if (response && response.problem) {
        const problem = response.problem;
        setCurrentProblem(problem);
        
        if (DEBUG) {
          console.log('Problem data loaded:', problem);
        }
        
        // Create new object with all fields from the problem
        const formData = {
          Title: problem.Title || '',
          Description: problem.Description || '',
          Difficulty: problem.Difficulty || 'Trung bình',
          Points: problem.Points || 100,
          TimeLimit: problem.TimeLimit || 1,
          MemoryLimit: problem.MemoryLimit || 256,
          InputFormat: problem.InputFormat || '',
          OutputFormat: problem.OutputFormat || '',
          Constraints: problem.Constraints || '',
          SampleInput: problem.SampleInput || '',
          SampleOutput: problem.SampleOutput || '',
          Explanation: problem.Explanation || '',
          Tags: problem.Tags || '',
          StarterCode: problem.StarterCode || '',
          Instructions: problem.Instructions || '',
          ImageURL: problem.ImageURL || ''
        };
        
        setInitialValues(formData);
        
        // Set form values after a small delay to ensure the form is ready
        setTimeout(() => {
          form.setFieldsValue(formData);
          
          if (DEBUG) {
            console.log('Form values set:', formData);
            console.log('Current form values:', form.getFieldsValue());
          }
        }, 100);
      } else {
        message.error('Không tìm thấy thông tin bài tập');
        if (DEBUG) {
          console.error('Problem data missing in response:', response);
        }
        navigate(`/competitions/${competitionId}`);
      }
    } catch (error) {
      console.error('Error fetching problem data:', error);
      message.error('Không thể tải thông tin bài tập');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEditMode) {
        await competitionsAPI.updateProblem(competitionId, problemId, values);
        message.success('Cập nhật bài tập thành công');
      } else {
        await competitionsAPI.createProblem(competitionId, values);
        message.success('Tạo bài tập mới thành công');
      }
      navigate(`/competitions/${competitionId}`);
    } catch (error) {
      console.error('Form submission error:', error);
      message.error(isEditMode ? 'Cập nhật bài tập thất bại' : 'Tạo bài tập mới thất bại');
    } finally {
      setLoading(false);
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  const uploadProps = {
    name: 'image',
    action: `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002'}/api/upload`,
    headers: {
      authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('admin_token')}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        const imageUrl = info.file.response.url || info.file.response.data?.url;
        message.success(`${info.file.name} tải lên thành công`);
        form.setFieldsValue({ 
          ImageURL: imageUrl 
        });
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} tải lên thất bại`);
      }
    },
  };

  if (isEditMode && dataLoading) {
    return (
      <MainCard
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/competitions/${competitionId}`)}
            />
            Đang tải thông tin bài tập
          </Space>
        }
      >
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>Đang tải thông tin bài tập...</p>
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
            onClick={() => navigate(`/competitions/${competitionId}`)}
          />
          {isEditMode ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}
        </Space>
      }
      extra={
        <Space>
          {isEditMode && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchProblemData}
              loading={dataLoading}
            >
              Tải lại
            </Button>
          )}
          <Button onClick={togglePreview}>
            {previewMode ? 'Chỉnh sửa' : 'Xem trước'}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={() => form.submit()}
          >
            Lưu
          </Button>
        </Space>
      }
    >
      {previewMode ? (
        <Card>
          <Title level={3}>{form.getFieldValue('Title')}</Title>
          <Space wrap style={{ marginBottom: 16 }}>
            <Text type="secondary">Độ khó: {form.getFieldValue('Difficulty')}</Text>
            <Text type="secondary">Điểm: {form.getFieldValue('Points')}</Text>
            <Text type="secondary">Thời gian: {form.getFieldValue('TimeLimit')} giây</Text>
            <Text type="secondary">Bộ nhớ: {form.getFieldValue('MemoryLimit')} MB</Text>
          </Space>

          <Divider orientation="left">Mô tả</Divider>
          <ReactMarkdown>{form.getFieldValue('Description')}</ReactMarkdown>

          <Divider orientation="left">Định dạng đầu vào</Divider>
          <ReactMarkdown>{form.getFieldValue('InputFormat')}</ReactMarkdown>

          <Divider orientation="left">Định dạng đầu ra</Divider>
          <ReactMarkdown>{form.getFieldValue('OutputFormat')}</ReactMarkdown>

          <Divider orientation="left">Ràng buộc</Divider>
          <ReactMarkdown>{form.getFieldValue('Constraints')}</ReactMarkdown>

          <Divider orientation="left">Ví dụ</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Đầu vào" bordered>
                <pre>{form.getFieldValue('SampleInput')}</pre>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Đầu ra" bordered>
                <pre>{form.getFieldValue('SampleOutput')}</pre>
              </Card>
            </Col>
          </Row>

          {form.getFieldValue('Explanation') && (
            <>
              <Divider orientation="left">Giải thích</Divider>
              <ReactMarkdown>{form.getFieldValue('Explanation')}</ReactMarkdown>
            </>
          )}

          {form.getFieldValue('StarterCode') && (
            <>
              <Divider orientation="left">Mã khởi tạo</Divider>
              <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
                {form.getFieldValue('StarterCode')}
              </pre>
            </>
          )}
        </Card>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleSubmit}
          onValuesChange={(changedValues, allValues) => {
            // console.log('Form values changed:', changedValues, allValues);
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Card title="Thông tin bài tập" style={{ marginBottom: 16 }}>
                <Form.Item
                  name="Title"
                  label="Tiêu đề"
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bài tập' }]}
                >
                  <Input placeholder="Nhập tiêu đề bài tập" />
                </Form.Item>

                <Form.Item
                  name="Description"
                  label="Mô tả"
                  rules={[{ required: true, message: 'Vui lòng nhập mô tả bài tập' }]}
                >
                  <TextArea
                    placeholder="Nhập mô tả bài tập (hỗ trợ Markdown)"
                    autoSize={{ minRows: 4, maxRows: 8 }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="Difficulty"
                      label="Độ khó"
                      rules={[{ required: true, message: 'Vui lòng chọn độ khó' }]}
                    >
                      <Select placeholder="Chọn độ khó">
                        <Option value="Dễ">Dễ</Option>
                        <Option value="Trung bình">Trung bình</Option>
                        <Option value="Khó">Khó</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="Points"
                      label="Điểm"
                      rules={[{ required: true, message: 'Vui lòng nhập điểm' }]}
                    >
                      <InputNumber
                        min={1}
                        max={1000}
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="Tags"
                      label="Thẻ"
                    >
                      <Input placeholder="Nhập thẻ (phân cách bằng dấu phẩy)" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="TimeLimit"
                      label="Giới hạn thời gian (giây)"
                      rules={[{ required: true, message: 'Vui lòng nhập giới hạn thời gian' }]}
                    >
                      <InputNumber
                        min={0.1}
                        max={10}
                        step={0.1}
                        style={{ width: '100%' }}
                        placeholder="Nhập giới hạn thời gian"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="MemoryLimit"
                      label="Giới hạn bộ nhớ (MB)"
                      rules={[{ required: true, message: 'Vui lòng nhập giới hạn bộ nhớ' }]}
                    >
                      <InputNumber
                        min={16}
                        max={1024}
                        style={{ width: '100%' }}
                        placeholder="Nhập giới hạn bộ nhớ"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="InputFormat"
                  label="Định dạng đầu vào"
                  rules={[{ required: true, message: 'Vui lòng nhập định dạng đầu vào' }]}
                >
                  <TextArea
                    placeholder="Nhập định dạng đầu vào (hỗ trợ Markdown)"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>

                <Form.Item
                  name="OutputFormat"
                  label="Định dạng đầu ra"
                  rules={[{ required: true, message: 'Vui lòng nhập định dạng đầu ra' }]}
                >
                  <TextArea
                    placeholder="Nhập định dạng đầu ra (hỗ trợ Markdown)"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>

                <Form.Item
                  name="Constraints"
                  label="Ràng buộc"
                  rules={[{ required: true, message: 'Vui lòng nhập ràng buộc' }]}
                >
                  <TextArea
                    placeholder="Nhập ràng buộc (hỗ trợ Markdown)"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>
              </Card>

              <Card title="Ví dụ" style={{ marginBottom: 16 }}>
                <Form.Item
                  name="SampleInput"
                  label="Đầu vào mẫu"
                  rules={[{ required: true, message: 'Vui lòng nhập đầu vào mẫu' }]}
                >
                  <TextArea
                    placeholder="Nhập đầu vào mẫu"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>

                <Form.Item
                  name="SampleOutput"
                  label="Đầu ra mẫu"
                  rules={[{ required: true, message: 'Vui lòng nhập đầu ra mẫu' }]}
                >
                  <TextArea
                    placeholder="Nhập đầu ra mẫu"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>

                <Form.Item
                  name="Explanation"
                  label="Giải thích"
                >
                  <TextArea
                    placeholder="Nhập giải thích cho ví dụ (hỗ trợ Markdown)"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title="Hình ảnh" style={{ marginBottom: 16 }}>
                <Form.Item
                  name="ImageURL"
                  label="URL hình ảnh"
                >
                  <Input placeholder="Nhập URL hình ảnh" />
                </Form.Item>

                {form.getFieldValue('ImageURL') && (
                  <div style={{ marginBottom: 16, textAlign: 'center' }}>
                    <img 
                      src={form.getFieldValue('ImageURL')} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        marginBottom: 8,
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                        padding: 4
                      }} 
                    />
                    <div>
                      <Button 
                        size="small" 
                        danger
                        onClick={() => form.setFieldsValue({ ImageURL: '' })}
                      >
                        Xóa ảnh
                      </Button>
                    </div>
                  </div>
                )}

                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>Tải lên hình ảnh</Button>
                </Upload>
              </Card>

              <Card title="Mã nguồn" style={{ marginBottom: 16 }}>
                <Form.Item
                  name="StarterCode"
                  label="Mã khởi tạo"
                >
                  <TextArea
                    placeholder="Nhập mã khởi tạo cho bài tập"
                    autoSize={{ minRows: 5, maxRows: 10 }}
                  />
                </Form.Item>

                <Form.Item
                  name="Instructions"
                  label="Hướng dẫn"
                >
                  <TextArea
                    placeholder="Nhập hướng dẫn cho bài tập (hỗ trợ Markdown)"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      )}
    </MainCard>
  );
};

export default ProblemForm; 