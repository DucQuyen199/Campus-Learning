import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Row, Col, Card, Typography, Tag, Button, Tabs, Table, Image,
  Descriptions, Avatar, Space, Divider, Statistic, Modal, message,
  List, Tooltip, Empty, Badge, Spin
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, 
  QuestionCircleOutlined, FileTextOutlined, UserOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  TeamOutlined, CalendarOutlined, InfoCircleOutlined,
  SettingOutlined, ReloadOutlined, BookOutlined,
  CodeOutlined, TrophyOutlined, FileSearchOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { getExamById, getExamQuestions, getExamParticipants } from '../../api/exams';
import MainCard from '../../components/MainCard';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState('1');

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await getExamById(id);
      console.log('Exam details:', response);
      
      if (!response) {
        message.error('Không thể tải thông tin bài thi');
        setLoading(false);
        return;
      }
      
      setExam(response);
      
      // Tải câu hỏi của bài thi
      try {
        const questionsData = await getExamQuestions(id);
        if (questionsData && Array.isArray(questionsData)) {
          setQuestions(questionsData);
          console.log(`Đã tải ${questionsData.length} câu hỏi của bài thi`);
        } else {
          console.log('Không có dữ liệu câu hỏi từ API');
          setQuestions([]);
        }
      } catch (qError) {
        console.error('Error fetching questions:', qError);
        message.warning('Không thể tải câu hỏi cho bài thi');
        setQuestions([]);
      }

      // Tải danh sách người tham gia bài thi
      try {
        const participantsData = await getExamParticipants(id);
        if (participantsData && participantsData.participants && Array.isArray(participantsData.participants)) {
          // Nhóm kết quả theo UserID để tổ chức dữ liệu
          const participants = participantsData.participants;
          
          // Sắp xếp theo UserID và AttemptNumber nếu có
          participants.sort((a, b) => {
            // Sắp xếp đầu tiên theo UserID
            if (a.UserID !== b.UserID) {
              return a.UserID - b.UserID;
            }
            // Nếu cùng UserID, sắp xếp theo số lần thử (mới nhất lên trên)
            return b.AttemptNumber - a.AttemptNumber;
          });
          
          setParticipants(participants);
          console.log(`Đã tải ${participants.length} người tham gia bài thi`);
        } else {
          console.log('Không có dữ liệu người tham gia từ API');
          setParticipants([]);
        }
      } catch (pError) {
        console.error('Error fetching participants:', pError);
        message.warning('Không thể tải danh sách người tham gia');
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching exam details:', error);
      message.error('Không thể tải thông tin bài thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'N/A';
    }
  };

  const getDifficultyTag = (difficulty) => {
    const difficultyMap = {
      'beginner': { color: 'success', text: 'Cơ bản' },
      'intermediate': { color: 'warning', text: 'Trung cấp' },
      'advanced': { color: 'error', text: 'Nâng cao' },
      'expert': { color: 'purple', text: 'Chuyên gia' }
    };
    
    return (
      <Tag color={difficultyMap[difficulty?.toLowerCase()]?.color || 'default'}>
        {difficultyMap[difficulty?.toLowerCase()]?.text || difficulty}
      </Tag>
    );
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'upcoming': { color: 'processing', text: 'Sắp diễn ra' },
      'ongoing': { color: 'success', text: 'Đang diễn ra' },
      'completed': { color: 'default', text: 'Đã kết thúc' },
      'cancelled': { color: 'error', text: 'Đã hủy' }
    };
    
    return (
      <Tag color={statusMap[status?.toLowerCase()]?.color || 'default'}>
        {statusMap[status?.toLowerCase()]?.text || status}
      </Tag>
    );
  };

  const getExamTypeTag = (type) => {
    const typeMap = {
      'multiple_choice': { color: 'blue', text: 'Trắc nghiệm', icon: <QuestionCircleOutlined /> },
      'essay': { color: 'cyan', text: 'Tự luận', icon: <FileTextOutlined /> },
      'coding': { color: 'volcano', text: 'Lập trình', icon: <CodeOutlined /> },
      'mixed': { color: 'geekblue', text: 'Hỗn hợp', icon: <FileSearchOutlined /> }
    };
    
    return (
      <Tag color={typeMap[type?.toLowerCase()]?.color || 'default'} icon={typeMap[type?.toLowerCase()]?.icon}>
        {typeMap[type?.toLowerCase()]?.text || type}
      </Tag>
    );
  };

  const getParticipantStatusBadge = (status) => {
    const statusMap = {
      'registered': { status: 'default', text: 'Đã đăng ký' },
      'in_progress': { status: 'processing', text: 'Đang làm bài' },
      'completed': { status: 'success', text: 'Đã hoàn thành' },
      'reviewed': { status: 'warning', text: 'Đã chấm bài' }
    };
    
    return (
      <Badge 
        status={statusMap[status?.toLowerCase()]?.status || 'default'} 
        text={statusMap[status?.toLowerCase()]?.text || status} 
      />
    );
  };

  const handleDeleteExam = () => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa bài thi này?',
      content: 'Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        message.success('Đã xóa bài thi');
        navigate('/exams');
      }
    });
  };

  const handleUpdateStatus = (newStatus) => {
    // Thực hiện API call để cập nhật trạng thái
    message.success(`Đã cập nhật trạng thái thành: ${newStatus}`);
    setExam({...exam, Status: newStatus});
  };

  const questionColumns = [
    {
      title: '#',
      dataIndex: 'QuestionID',
      key: 'index',
      width: '5%',
      render: (text, record, index) => index + 1
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'QuestionText',
      key: 'content',
      render: (text, record) => text || record.Content
    },
    {
      title: 'Loại',
      dataIndex: 'Type',
      key: 'type',
      width: '15%',
      render: (text) => getExamTypeTag(text)
    },
    {
      title: 'Điểm',
      dataIndex: 'Points',
      key: 'points',
      width: '10%',
      align: 'center',
      render: (points) => <Tag color="blue">{points}</Tag>
    }
  ];

  const participantColumns = [
    {
      title: '#',
      key: 'index',
      width: '5%',
      render: (text, record, index) => index + 1
    },
    {
      title: 'Học viên',
      key: 'user',
      render: (record) => (
        <Space>
          <Avatar src={record.Image} icon={<UserOutlined />}>
            {record.FullName?.charAt(0)}
          </Avatar>
          <div>
            <div>{record.FullName}</div>
            <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>{record.Email}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Lần thi',
      key: 'attempt',
      width: '10%',
      render: (record) => (
        record.TotalAttempts > 1 ? 
          <Tag color="blue">{`Lần ${record.AttemptNumber}/${record.TotalAttempts}`}</Tag> : 
          'Lần đầu'
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: '15%',
      render: (record) => getParticipantStatusBadge(record.Status)
    },
    {
      title: 'Bắt đầu',
      dataIndex: 'StartedAt',
      key: 'startedAt',
      width: '15%',
      render: (date) => date ? formatDateTime(date) : 'Chưa bắt đầu'
    },
    {
      title: 'Hoàn thành',
      dataIndex: 'CompletedAt',
      key: 'completedAt',
      width: '15%',
      render: (date) => date ? formatDateTime(date) : 'Chưa hoàn thành'
    },
    {
      title: 'Thời gian làm',
      key: 'timeSpent',
      width: '12%',
      render: (record) => (
        record.TimeSpent ? 
          `${record.TimeSpent} phút` : 
          (record.CompletedAt && record.StartedAt ? 
            `${Math.round((new Date(record.CompletedAt) - new Date(record.StartedAt)) / 60000)} phút` : 
            'N/A')
      )
    },
    {
      title: 'Điểm',
      key: 'score',
      width: '10%',
      align: 'center',
      render: (record) => (
        record.Score !== null && record.Score !== undefined ? (
          <Tag color={record.Score >= (exam.PassingScore || 60) ? 'success' : 'error'}>
            {`${record.Score}/${exam.TotalPoints || 100}`}
          </Tag>
        ) : 'Chưa có'
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '10%',
      align: 'center',
      render: (record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate(`/exams/participants/${record.ParticipantID}/answers`)}
        >
          Chi tiết
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <MainCard title="Chi tiết bài thi">
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      </MainCard>
    );
  }

  if (!exam) {
    return (
      <MainCard title="Chi tiết bài thi">
        <Empty 
          description="Không tìm thấy bài thi"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/exams')}>
            Quay lại danh sách
          </Button>
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
            onClick={() => navigate('/exams')}
          />
          Chi tiết bài thi
        </Space>
      }
      extra={
        <Space>
          <Link to={`/exams/edit/${id}`}>
            <Button type="primary" icon={<EditOutlined />}>
              Chỉnh sửa
            </Button>
          </Link>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteExam}
          >
            Xóa
          </Button>
        </Space>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Title level={3}>{exam.Title}</Title>
              <Space wrap>
                {getStatusTag(exam.Status)}
                {getExamTypeTag(exam.Type)}
                {getDifficultyTag(exam.Difficulty)}
                <Tag icon={<ClockCircleOutlined />}>{exam.Duration} phút</Tag>
              </Space>
            </div>
            
            <Divider />
            
            {exam.Description && (
              <Paragraph>{exam.Description}</Paragraph>
            )}
            
            <Divider />
            
            <Descriptions title="Thông tin chi tiết" column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Loại bài thi">{getExamTypeTag(exam.Type)}</Descriptions.Item>
              <Descriptions.Item label="Thời gian làm bài">{exam.Duration} phút</Descriptions.Item>
              <Descriptions.Item label="Tổng điểm">{exam.TotalPoints || 100}</Descriptions.Item>
              <Descriptions.Item label="Điểm đạt">{exam.PassingScore || 60}</Descriptions.Item>
              <Descriptions.Item label="Số câu hỏi">{questions.length || exam.QuestionCount || 0}</Descriptions.Item>
              <Descriptions.Item label="Độ khó">{getDifficultyTag(exam.Difficulty)}</Descriptions.Item>
              <Descriptions.Item label="Khóa học">{exam.CourseTitle || 'Chưa gán khóa học'}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{getStatusTag(exam.Status)}</Descriptions.Item>
              <Descriptions.Item label="Bắt đầu">{formatDateTime(exam.StartTime)}</Descriptions.Item>
              <Descriptions.Item label="Kết thúc">{formatDateTime(exam.EndTime)}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{exam.CreatorName || 'N/A'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Row gutter={[0, 24]}>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Số lượng câu hỏi"
                  value={questions.length || exam.QuestionCount || 0}
                  prefix={<QuestionCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Điểm tối đa"
                  value={exam.TotalPoints || 100}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Thời gian làm bài"
                  value={exam.Duration}
                  suffix="phút"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Số người tham gia"
                  value={participants.length}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card title="Cài đặt bài thi">
                <List size="small">
                  <List.Item>
                    <List.Item.Meta
                      title="Xáo trộn câu hỏi"
                      description={exam.ShuffleQuestions ? 'Bật' : 'Tắt'}
                    />
                    {exam.ShuffleQuestions ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="Cho phép xem lại"
                      description={exam.AllowReview ? 'Bật' : 'Tắt'}
                    />
                    {exam.AllowReview ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  </List.Item>
                </List>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="Thay đổi trạng thái">
                <Space wrap style={{ marginBottom: 8 }}>
                  <Button 
                    type={exam.Status === 'upcoming' ? 'primary' : 'default'} 
                    onClick={() => handleUpdateStatus('upcoming')}
                  >
                    Sắp diễn ra
                  </Button>
                  <Button 
                    type={exam.Status === 'ongoing' ? 'primary' : 'default'}
                    onClick={() => handleUpdateStatus('ongoing')}
                    style={{ backgroundColor: exam.Status === 'ongoing' ? '#52c41a' : undefined, borderColor: exam.Status === 'ongoing' ? '#52c41a' : undefined }}
                  >
                    Đang diễn ra
                  </Button>
                  <Button 
                    type={exam.Status === 'completed' ? 'primary' : 'default'}
                    onClick={() => handleUpdateStatus('completed')}
                  >
                    Đã kết thúc
                  </Button>
                  <Button 
                    danger
                    type={exam.Status === 'cancelled' ? 'primary' : 'default'}
                    onClick={() => handleUpdateStatus('cancelled')}
                  >
                    Hủy
                  </Button>
                </Space>
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
              type="card"
            >
              <TabPane tab={<span><QuestionCircleOutlined /> Câu hỏi</span>} key="1">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4}>Danh sách câu hỏi ({questions.length})</Title>
                  <Link to={`/exams/edit/${id}`}>
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />}
                    >
                      Thêm câu hỏi
                    </Button>
                  </Link>
                </div>
                
                <Table
                  columns={questionColumns}
                  dataSource={questions}
                  rowKey={(record) => record.QuestionID}
                  pagination={false}
                  locale={{
                    emptyText: (
                      <Empty 
                        description="Chưa có câu hỏi nào" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )
                  }}
                />
              </TabPane>
              
              <TabPane tab={<span><FileTextOutlined /> Hướng dẫn làm bài</span>} key="2">
                <Title level={4}>Hướng dẫn làm bài</Title>
                
                {exam.Instructions ? (
                  <Card>
                    <div dangerouslySetInnerHTML={{ __html: exam.Instructions }} />
                  </Card>
                ) : (
                  <Empty 
                    description="Chưa có hướng dẫn làm bài" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Link to={`/exams/edit/${id}`}>
                      <Button type="primary">Thêm hướng dẫn</Button>
                    </Link>
                  </Empty>
                )}
              </TabPane>
              
              <TabPane tab={<span><TeamOutlined /> Người tham gia</span>} key="3">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4}>Danh sách người tham gia ({participants.length})</Title>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={fetchExamDetails}
                    loading={loading}
                  >
                    Làm mới
                  </Button>
                </div>
                
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Tổng điểm"
                        value={exam.TotalPoints || 100}
                        suffix="điểm"
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Điểm đạt"
                        value={exam.PassingScore || 60}
                        suffix="điểm"
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Cho phép thi lại"
                        value={exam.AllowRetakes ? `Có${exam.MaxRetakes ? ` (${exam.MaxRetakes + 1} lần)` : ''}` : 'Không'}
                      />
                    </Col>
                  </Row>
                </Card>
                
                <Table
                  columns={participantColumns}
                  dataSource={participants}
                  rowKey={(record) => record.ParticipantID}
                  pagination={false}
                  loading={loading}
                  locale={{
                    emptyText: (
                      <Empty 
                        description="Chưa có người tham gia nào" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )
                  }}
                />
              </TabPane>
              
              {exam.Type === 'coding' && (
                <TabPane tab={<span><CodeOutlined /> Testcases</span>} key="4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4}>Danh sách testcases</Title>
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/exams/${id}/testcases/create`)}
                    >
                      Thêm testcase
                    </Button>
                  </div>
                  
                  <Table
                    columns={[
                      { title: '#', dataIndex: 'index', key: 'index', width: '5%', render: (text, record, index) => index + 1 },
                      { title: 'Input', dataIndex: 'Input', key: 'input', render: text => <pre style={{ margin: 0 }}>{text}</pre> },
                      { title: 'Expected Output', dataIndex: 'ExpectedOutput', key: 'output', render: text => <pre style={{ margin: 0 }}>{text}</pre> },
                      { 
                        title: 'Visibility', 
                        dataIndex: 'IsVisible', 
                        key: 'visibility', 
                        width: '15%',
                        render: isVisible => <Tag color={isVisible ? 'success' : 'default'}>{isVisible ? 'Visible' : 'Hidden'}</Tag>
                      }
                    ]}
                    dataSource={exam.testcases || []}
                    rowKey={(record, index) => record.id || index}
                    pagination={false}
                    locale={{
                      emptyText: (
                        <Empty 
                          description="Chưa có testcase nào" 
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )
                    }}
                  />
                </TabPane>
              )}
            </Tabs>
          </Card>
        </Col>
      </Row>
    </MainCard>
  );
};

export default ExamDetailPage; 