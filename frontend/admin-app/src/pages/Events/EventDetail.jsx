import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Typography, Tag, Button, Tabs, Table, Image,
  Descriptions, Avatar, Space, Divider, Statistic, Modal, message,
  List, Tooltip
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, 
  UserOutlined, EyeOutlined, CalendarOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, TrophyOutlined, LineChartOutlined,
  TeamOutlined, EnvironmentOutlined, TagOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { 
  getEventById, 
  getEventParticipants, 
  getEventPrizes, 
  getEventSchedule, 
  deleteEvent, 
  updateEventStatus 
} from '../../api/events';
import MainCard from '../../components/MainCard';
import EventSchedule from './EventSchedule';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  
  useEffect(() => {
    fetchEventData();
  }, [id]);
  
  const fetchEventData = async () => {
    setLoading(true);
    try {
      const response = await getEventById(id);
      setEvent(response.data);

      try {
        const participantsResponse = await getEventParticipants(id);
        setParticipants(participantsResponse.data || []);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }

      try {
        const prizesResponse = await getEventPrizes(id);
        setPrizes(prizesResponse.data || []);
      } catch (error) {
        console.error('Error fetching prizes:', error);
      }

      try {
        const scheduleResponse = await getEventSchedule(id);
        setSchedule(scheduleResponse.data || []);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    } catch (error) {
      message.error('Không thể tải thông tin sự kiện');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteEvent = () => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa sự kiện này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteEvent(id);
          message.success('Xóa sự kiện thành công');
          navigate('/events');
        } catch (error) {
          message.error('Không thể xóa sự kiện');
        }
      },
    });
  };
  
  const handleUpdateStatus = async (status) => {
    try {
      await updateEventStatus(id, status);
      message.success('Cập nhật trạng thái thành công');
      fetchEventData();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };
  
  const getCategoryTag = (category) => {
    const categoryMap = {
      'Competitive Programming': { color: 'blue', text: 'Lập trình thi đấu' },
      'Hackathon': { color: 'green', text: 'Hackathon' },
      'Web Development': { color: 'purple', text: 'Phát triển Web' },
      'AI/ML': { color: 'orange', text: 'AI/ML' },
      'Mobile Development': { color: 'cyan', text: 'Phát triển Mobile' },
      'DevOps': { color: 'gold', text: 'DevOps' },
      'Security': { color: 'red', text: 'Bảo mật' }
    };
    
    return (
      <Tag color={categoryMap[category]?.color || 'default'}>
        {categoryMap[category]?.text || category}
      </Tag>
    );
  };
  
  const getDifficultyTag = (difficulty) => {
    const difficultyMap = {
      'beginner': { color: 'success', text: 'Cơ bản' },
      'intermediate': { color: 'warning', text: 'Trung cấp' },
      'advanced': { color: 'error', text: 'Nâng cao' },
      'expert': { color: 'volcano', text: 'Chuyên gia' }
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
      'completed': { color: 'warning', text: 'Đã kết thúc' },
      'cancelled': { color: 'error', text: 'Đã hủy' },
    };
    
    return (
      <Tag color={statusMap[status?.toLowerCase()]?.color || 'default'}>
        {statusMap[status?.toLowerCase()]?.text || status}
      </Tag>
    );
  };
  
  const formatDateTime = (date, time) => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      
      if (time) {
        const [hours, minutes] = time.split(':');
        dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      }
      
      return format(dateObj, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'N/A';
    }
  };
  
  const scheduleColumns = [
    {
      title: 'Tên hoạt động',
      dataIndex: 'ActivityName',
      key: 'activity',
    },
    {
      title: 'Bắt đầu',
      dataIndex: 'StartTime',
      key: 'startTime',
      render: (text) => formatDateTime(text, null),
    },
    {
      title: 'Kết thúc',
      dataIndex: 'EndTime',
      key: 'endTime',
      render: (text) => formatDateTime(text, null),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'Location',
      key: 'location',
    },
    {
      title: 'Loại',
      dataIndex: 'Type',
      key: 'type',
      render: (text) => {
        const typeMap = {
          'main_event': { color: 'blue', text: 'Sự kiện chính' },
          'workshop': { color: 'purple', text: 'Workshop' },
          'networking': { color: 'green', text: 'Giao lưu' },
          'break': { color: 'default', text: 'Giải lao' },
          'other': { color: 'default', text: 'Khác' }
        };
        
        return (
          <Tag color={typeMap[text]?.color || 'default'}>
            {typeMap[text]?.text || text}
          </Tag>
        );
      }
    }
  ];
  
  const prizesColumns = [
    {
      title: 'Thứ hạng',
      dataIndex: 'Rank',
      key: 'rank',
      render: (text) => {
        const rankLabels = {
          1: 'Nhất',
          2: 'Nhì',
          3: 'Ba'
        };
        return rankLabels[text] || `Hạng ${text}`;
      }
    },
    {
      title: 'Giá trị giải thưởng',
      dataIndex: 'PrizeAmount',
      key: 'amount',
      render: (text) => `${text.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Mô tả',
      dataIndex: 'Description',
      key: 'description',
    }
  ];
  
  const participantColumns = [
    {
      title: 'Họ tên',
      key: 'fullName',
      render: (_, record) => (
        <Space>
          <Avatar src={record.ProfilePicture} icon={<UserOutlined />} />
          <Text>{record.FullName}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'email',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'status',
      render: (text) => {
        const statusMap = {
          'registered': { color: 'default', text: 'Đã đăng ký' },
          'confirmed': { color: 'processing', text: 'Đã xác nhận' },
          'attended': { color: 'success', text: 'Đã tham gia' },
          'cancelled': { color: 'error', text: 'Đã hủy' },
        };
        
        return (
          <Tag color={statusMap[text?.toLowerCase()]?.color || 'default'}>
            {statusMap[text?.toLowerCase()]?.text || text}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái tham gia',
      dataIndex: 'AttendanceStatus',
      key: 'attendanceStatus',
      render: (text) => {
        const statusMap = {
          'pending': { color: 'default', text: 'Chưa điểm danh' },
          'present': { color: 'success', text: 'Có mặt' },
          'absent': { color: 'error', text: 'Vắng mặt' },
        };
        
        return text ? (
          <Tag color={statusMap[text?.toLowerCase()]?.color || 'default'}>
            {statusMap[text?.toLowerCase()]?.text || text}
          </Tag>
        ) : <Tag color="default">Chưa điểm danh</Tag>;
      },
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'RegistrationDate',
      key: 'registrationDate',
      render: (text) => text ? format(new Date(text), 'dd/MM/yyyy') : 'N/A',
    },
  ];
  
  if (loading || !event) {
    return (
      <MainCard title="Chi tiết sự kiện">
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
            onClick={() => navigate('/events')}
          />
          Chi tiết sự kiện
        </Space>
      }
      extra={
        <Space>
          <Link to={`/events/${id}/edit`}>
            <Button type="primary" icon={<EditOutlined />}>
              Chỉnh sửa
            </Button>
          </Link>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteEvent}
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
                <Title level={3}>{event.Title}</Title>
                <Space wrap>
                  {getStatusTag(event.Status)}
                  {getCategoryTag(event.Category)}
                  {getDifficultyTag(event.Difficulty)}
                </Space>
              </div>
              <div>
                <Image
                  width={180}
                  src={event.ImageUrl || 'https://via.placeholder.com/300x180?text=No+Image'}
                  fallback="https://via.placeholder.com/300x180?text=Image+Not+Found"
                  style={{ borderRadius: 8 }}
                />
              </div>
            </div>
            
            <Divider />
            
            <Paragraph>{event.Description}</Paragraph>
            
            <Divider />
            
            <Descriptions title="Thông tin chi tiết" column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Ngày diễn ra">
                {formatDateTime(event.EventDate, event.EventTime)}
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm">
                {event.Location}
              </Descriptions.Item>
              <Descriptions.Item label="Người tổ chức">
                {event.Organizer || event.CreatorName}
              </Descriptions.Item>
              <Descriptions.Item label="Danh mục">
                {getCategoryTag(event.Category)}
              </Descriptions.Item>
              <Descriptions.Item label="Độ khó">
                {getDifficultyTag(event.Difficulty)}
              </Descriptions.Item>
              <Descriptions.Item label="Giá vé">
                {event.Price > 0 ? `${Number(event.Price).toLocaleString('vi-VN')} VNĐ` : 'Miễn phí'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(event.CreatedAt).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusTag(event.Status)}
              </Descriptions.Item>
              {event.programmingLanguages?.length > 0 && (
                <Descriptions.Item label="Ngôn ngữ lập trình">
                  <Space wrap>
                    {event.programmingLanguages.map((lang, index) => (
                      <Tag key={index} color="blue">{lang}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              {event.technologies?.length > 0 && (
                <Descriptions.Item label="Công nghệ">
                  <Space wrap>
                    {event.technologies.map((tech, index) => (
                      <Tag key={index} color="green">{tech}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Row gutter={[0, 24]}>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Số người tham gia"
                  value={event.CurrentAttendees || 0}
                  suffix={`/${event.MaxAttendees || 'không giới hạn'}`}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Giải thưởng"
                  value={prizes.reduce((total, prize) => total + Number(prize.PrizeAmount), 0).toLocaleString('vi-VN')}
                  suffix="VNĐ"
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Title level={5}>Thay đổi trạng thái</Title>
                  <Space wrap>
                    <Button 
                      type={event.Status === 'upcoming' ? 'primary' : 'default'} 
                      onClick={() => handleUpdateStatus('upcoming')}
                    >
                      Sắp diễn ra
                    </Button>
                    <Button 
                      type={event.Status === 'ongoing' ? 'primary' : 'default'} 
                      onClick={() => handleUpdateStatus('ongoing')}
                    >
                      Đang diễn ra
                    </Button>
                    <Button 
                      type={event.Status === 'completed' ? 'primary' : 'default'} 
                      onClick={() => handleUpdateStatus('completed')}
                    >
                      Đã kết thúc
                    </Button>
                    <Button 
                      type={event.Status === 'cancelled' ? 'primary' : 'default'} 
                      danger 
                      onClick={() => handleUpdateStatus('cancelled')}
                    >
                      Hủy
                    </Button>
                  </Space>
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
              items={[
                {
                  key: '1',
                  label: 'Lịch trình',
                  children: (
                    <EventSchedule eventId={id} eventTitle={event.Title} />
                  )
                },
                {
                  key: '2',
                  label: 'Giải thưởng',
                  children: (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={4}>Giải thưởng ({prizes.length})</Title>
                        <Button 
                          type="primary" 
                          icon={<TrophyOutlined />}
                          onClick={() => navigate(`/events/${id}/prizes/create`)}
                        >
                          Thêm giải thưởng
                        </Button>
                      </div>
                      
                      <Table
                        columns={prizesColumns}
                        dataSource={prizes}
                        rowKey="PrizeID"
                        pagination={false}
                      />
                    </>
                  )
                },
                {
                  key: '3',
                  label: 'Người tham gia',
                  children: (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={4}>Người tham gia ({participants.length})</Title>
                      </div>
                      
                      <Table
                        columns={participantColumns}
                        dataSource={participants}
                        rowKey="ParticipantID"
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                        }}
                      />
                    </>
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

export default EventDetail; 