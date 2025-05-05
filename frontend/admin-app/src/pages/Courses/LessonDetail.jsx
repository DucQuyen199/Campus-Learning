import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Typography, Tag, Button, Tabs, 
  Descriptions, Space, Divider, Spin, message, Modal
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, 
  PlayCircleOutlined, FileTextOutlined, QuestionCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { coursesAPI } from '../../api/courses';
import MainCard from '../../components/MainCard';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const LessonDetail = () => {
  const { id, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);
  
  const fetchLessonData = async () => {
    setLoading(true);
    try {
      const lessonData = await coursesAPI.getLesson(id, moduleId, lessonId);
      setLesson(lessonData);
    } catch (error) {
      message.error('Không thể tải thông tin bài học');
      navigate(`/courses/${id}/modules/${moduleId}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteLesson = () => {
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
          navigate(`/courses/${id}/modules/${moduleId}`);
        } catch (error) {
          message.error('Không thể xóa bài học');
        }
      },
    });
  };
  
  const getLessonTypeTag = (type) => {
    const typeMap = {
      'Video': { color: 'blue', icon: <PlayCircleOutlined /> },
      'Text': { color: 'green', icon: <FileTextOutlined /> },
      'Quiz': { color: 'orange', icon: <QuestionCircleOutlined /> },
    };
    
    return (
      <Tag color={typeMap[type]?.color || 'default'} icon={typeMap[type]?.icon}>
        {type}
      </Tag>
    );
  };
  
  const renderLessonContent = () => {
    if (!lesson) return null;
    
    switch (lesson.Type) {
      case 'Video':
        return (
          <div style={{ marginTop: 16 }}>
            <div className="video-container" style={{ position: 'relative', paddingTop: '56.25%', marginBottom: 16 }}>
              <ReactPlayer
                url={lesson.VideoUrl}
                width="100%"
                height="100%"
                controls
                style={{ position: 'absolute', top: 0, left: 0 }}
              />
            </div>
            {lesson.Content && (
              <Card title="Mô tả video">
                <ReactMarkdown>{lesson.Content}</ReactMarkdown>
              </Card>
            )}
          </div>
        );
      
      case 'Text':
        return (
          <Card title="Nội dung" style={{ marginTop: 16 }}>
            <ReactMarkdown>{lesson.Content}</ReactMarkdown>
          </Card>
        );
      
      case 'Quiz':
        return (
          <Card title="Bài kiểm tra" style={{ marginTop: 16 }}>
            <div>
              <ReactMarkdown>{lesson.Content}</ReactMarkdown>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <Text>Chức năng hiển thị chi tiết bài kiểm tra đang phát triển</Text>
              </div>
            </div>
          </Card>
        );
        
      default:
        return (
          <Card style={{ marginTop: 16 }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{lesson.Content}</div>
          </Card>
        );
    }
  };
  
  if (loading || !lesson) {
    return (
      <MainCard title="Chi tiết bài học">
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
          Chi tiết bài học
        </Space>
      }
      extra={
        <Space>
          <Link to={`/courses/${id}/modules/${moduleId}/lessons/${lessonId}/edit`}>
            <Button type="primary" icon={<EditOutlined />}>
              Chỉnh sửa
            </Button>
          </Link>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteLesson}
          >
            Xóa
          </Button>
        </Space>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card>
            <Title level={3}>{lesson.Title}</Title>
            <Space>
              {getLessonTypeTag(lesson.Type)}
              {lesson.IsPreview && <Tag color="purple">Xem trước</Tag>}
            </Space>
            
            <Divider />
            
            <Paragraph>{lesson.Description}</Paragraph>
            
            <Divider />
            
            <Descriptions title="Thông tin chi tiết" column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Loại bài học">
                {lesson.Type}
              </Descriptions.Item>
              <Descriptions.Item label="Thứ tự">
                {lesson.OrderIndex}
              </Descriptions.Item>
              <Descriptions.Item label="Thời lượng">
                {lesson.Duration ? `${lesson.Duration} phút` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Cho xem trước">
                {lesson.IsPreview ? 'Có' : 'Không'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(lesson.CreatedAt).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              {lesson.UpdatedAt && (
                <Descriptions.Item label="Cập nhật lần cuối">
                  {new Date(lesson.UpdatedAt).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {renderLessonContent()}
          </Card>
        </Col>
      </Row>
    </MainCard>
  );
};

export default LessonDetail; 