import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Typography, Tag, Button, Tabs, Table, Image,
  Descriptions, Avatar, Space, Divider, Statistic, Modal, message,
  List, Tooltip, Select, Popconfirm, Dropdown, Menu
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, EyeOutlined, CodeOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, TrophyOutlined, LineChartOutlined,
  TeamOutlined, CalendarOutlined, CheckOutlined, MoreOutlined,
  PlusOutlined, DownOutlined
} from '@ant-design/icons';
import { competitionsAPI } from '../../api/competitions';
import MainCard from '../../components/MainCard';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;
const { Option } = Select;

const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [problems, setProblems] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(null);

  useEffect(() => {
    fetchCompetitionData();
  }, [id]);

  const fetchCompetitionData = async () => {
    setLoading(true);
    try {
      // Fetch competition details
      const response = await competitionsAPI.getCompetition(id);
      setCompetition(response.competition);
      setProblems(response.problems || []);

      // Fetch leaderboard data
      try {
        const leaderboardResponse = await competitionsAPI.getCompetitionLeaderboard(id);

        if (leaderboardResponse && leaderboardResponse.success) {
          // Sort participants by score (descending) and completion time (ascending)
          const sortedParticipants = (leaderboardResponse.data || [])
            .sort((a, b) => {
              // First sort by score (descending)
              if (b.Score !== a.Score) return b.Score - a.Score;

              // If scores are equal, sort by completion time (ascending)
              if (a.CompletionTime && b.CompletionTime) {
                return a.CompletionTime - b.CompletionTime;
              }

              // If no completion time, sort by completed problems count
              const aCompleted = Array.isArray(a.CompletedProblems) ? a.CompletedProblems.length : 0;
              const bCompleted = Array.isArray(b.CompletedProblems) ? b.CompletedProblems.length : 0;

              return bCompleted - aCompleted;
            });

          setParticipants(sortedParticipants);
          console.log('Leaderboard data loaded:', sortedParticipants);
        } else {
          // Fallback to participants from the main API response
          setParticipants(response.participants || []);
        }
      } catch (leaderboardError) {
        console.error('Error fetching leaderboard:', leaderboardError);
        // Fallback to participants from the main API response
        setParticipants(response.participants || []);
      }
    } catch (error) {
      console.error('Error fetching competition data:', error);
      message.error('Không thể tải thông tin cuộc thi');
      navigate('/competitions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompetition = () => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa cuộc thi này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await competitionsAPI.deleteCompetition(id);
          message.success('Xóa cuộc thi thành công');
          navigate('/competitions');
        } catch (error) {
          message.error('Không thể xóa cuộc thi');
        }
      },
    });
  };

  const handleUpdateStatus = async (status) => {
    setStatusLoading(true);
    try {
      await competitionsAPI.updateCompetitionStatus(id, status);
      message.success(`Trạng thái cuộc thi đã được cập nhật thành ${getStatusTag(status).text}`);
      // Update local state to reflect the change
      setCompetition({
        ...competition,
        Status: status
      });
    } catch (error) {
      message.error('Không thể cập nhật trạng thái cuộc thi');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteProblem = (problemId) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa bài tập này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await competitionsAPI.deleteProblem(id, problemId);
          message.success('Xóa bài tập thành công');
          // Refresh the problems list
          fetchCompetitionData();
        } catch (error) {
          message.error('Không thể xóa bài tập');
        }
      },
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: 'default', text: 'Bản nháp' },
      upcoming: { color: 'processing', text: 'Sắp diễn ra' },
      ongoing: { color: 'success', text: 'Đang diễn ra' },
      completed: { color: 'warning', text: 'Đã kết thúc' },
      cancelled: { color: 'error', text: 'Đã hủy' },
    };

    return {
      tag: (
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || status}
        </Tag>
      ),
      text: statusMap[status]?.text || status
    };
  };

  const getDifficultyTag = (difficulty) => {
    const difficultyMap = {
      'Dễ': { color: 'success', text: 'Dễ' },
      'Trung bình': { color: 'warning', text: 'Trung bình' },
      'Khó': { color: 'error', text: 'Khó' },
    };

    return (
      <Tag color={difficultyMap[difficulty]?.color || 'default'}>
        {difficultyMap[difficulty]?.text || difficulty}
      </Tag>
    );
  };

  const statusOptions = [
    { value: 'draft', label: 'Bản nháp' },
    { value: 'upcoming', label: 'Sắp diễn ra' },
    { value: 'ongoing', label: 'Đang diễn ra' },
    { value: 'completed', label: 'Đã kết thúc' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];

  const problemColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'Title',
      key: 'title',
      render: (text, record) => (
        <Link to={`/competitions/${id}/problems/${record.ProblemID}`}>
          <Text strong>{text}</Text>
        </Link>
      ),
    },
    {
      title: 'Độ khó',
      dataIndex: 'Difficulty',
      key: 'difficulty',
      render: (text) => getDifficultyTag(text),
    },
    {
      title: 'Điểm',
      dataIndex: 'Points',
      key: 'points',
    },
    {
      title: 'Giới hạn thời gian',
      dataIndex: 'TimeLimit',
      key: 'timeLimit',
      render: (text) => `${text} giây`,
    },
    {
      title: 'Giới hạn bộ nhớ',
      dataIndex: 'MemoryLimit',
      key: 'memoryLimit',
      render: (text) => `${text} MB`,
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
              onClick={() => navigate(`/competitions/${id}/problems/${record.ProblemID}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/competitions/${id}/problems/${record.ProblemID}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDeleteProblem(record.ProblemID)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const participantColumns = [
    {
      title: 'Xếp hạng',
      key: 'rank',
      width: 80,
      render: (text, record, index) => {
        // Rank medals for top 3
        if (index === 0) return <Tag color="gold" style={{fontWeight: 'bold'}}>🥇 1</Tag>;
        if (index === 1) return <Tag color="silver" style={{fontWeight: 'bold'}}>🥈 2</Tag>;
        if (index === 2) return <Tag color="orange" style={{fontWeight: 'bold'}}>🥉 3</Tag>;
        return <Tag>{index + 1}</Tag>;
      },
    },
    {
      title: 'Họ tên',
      key: 'fullName',
      render: (text, record) => (
        <Space>
          <Avatar src={record.Avatar || record.Image} icon={<UserOutlined />} />
          <Text>{record.FullName || record.Username}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'email',
    },
    {
      title: 'Điểm số',
      dataIndex: 'Score',
      key: 'score',
      sorter: (a, b) => b.Score - a.Score, // Sort descending by default
      defaultSortOrder: 'descend',
      render: (score) => (
        <Text strong style={{ color: '#1890ff' }}>
          {score || 0}
        </Text>
      ),
    },
    {
      title: 'Bài giải đúng',
      dataIndex: 'CompletedProblems',
      key: 'problemsSolved',
      render: (completedProblems, record) => {
        const count = Array.isArray(completedProblems)
          ? completedProblems.length
          : (record.TotalProblemsSolved || 0);

        return (
          <Space>
            <CheckOutlined style={{ color: '#52c41a' }} />
            <Text>{count}/{problems.length}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Thời gian hoàn thành',
      key: 'completionTime',
      render: (text, record) => {
        // Calculate completion time in minutes if available
        if (record.StartTime && record.EndTime) {
          const start = new Date(record.StartTime);
          const end = new Date(record.EndTime);
          const diffMinutes = Math.round((end - start) / (1000 * 60));

          return (
            <Space>
              <ClockCircleOutlined />
              <Text>{diffMinutes} phút</Text>
            </Space>
          );
        }

        return 'N/A';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'status',
      render: (text) => {
        const statusMap = {
          registered: { color: 'default', text: 'Đã đăng ký' },
          active: { color: 'processing', text: 'Đang tham gia' },
          completed: { color: 'success', text: 'Đã hoàn thành' },
          disqualified: { color: 'error', text: 'Bị loại' },
        };

        return (
          <Tag color={statusMap[text]?.color || 'default'}>
            {statusMap[text]?.text || text}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="view" icon={<EyeOutlined />}>
                Xem chi tiết
              </Menu.Item>
              <Menu.Item key="disqualify" icon={<DeleteOutlined />} danger>
                Loại khỏi cuộc thi
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      )
    }
  ];

  if (loading || !competition) {
    return (
      <MainCard title="Chi tiết cuộc thi">
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
            onClick={() => navigate('/competitions')}
          />
          Chi tiết cuộc thi
        </Space>
      }
      extra={
        <Space>
          <Popconfirm
            title="Chọn trạng thái"
            icon={<ExclamationCircleOutlined />}
            okText="Cập nhật"
            cancelText="Hủy"
            trigger="click"
            onConfirm={() => {}}
            content={
              <Select
                style={{ width: 200 }}
                defaultValue={competition.Status}
                onChange={handleUpdateStatus}
                loading={statusLoading}
              >
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            }
          >
            <Button type="primary" ghost style={{ marginRight: 8 }}>
              {getStatusTag(competition.Status).text} <DownOutlined />
            </Button>
          </Popconfirm>
          <Link to={`/competitions/edit/${id}`}>
            <Button type="primary" icon={<EditOutlined />}>
              Chỉnh sửa
            </Button>
          </Link>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteCompetition}
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
                <Title level={3}>{competition.Title}</Title>
                <Space wrap>
                  {getStatusTag(competition.Status).tag}
                  {getDifficultyTag(competition.Difficulty)}
                  <Tag icon={<TrophyOutlined />} color="gold">
                    Giải thưởng: {competition.PrizePool.toLocaleString('vi-VN')} VNĐ
                  </Tag>
                </Space>
              </div>
              {competition.CoverImageURL && (
                <Image
                  src={competition.CoverImageURL}
                  alt={competition.Title}
                  width={80}
                  height={80}
                  style={{ borderRadius: '8px' }}
                  fallback="https://via.placeholder.com/80"
                />
              )}
            </div>

            <Paragraph
              style={{
                textAlign: 'justify',
                fontSize: '14px',
                marginBottom: 24,
              }}
            >
              {competition.Description}
            </Paragraph>

            <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
              <Descriptions.Item label="Thời gian bắt đầu">
                <Space>
                  <CalendarOutlined />
                  {new Date(competition.StartTime).toLocaleString('vi-VN')}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Thời gian kết thúc">
                <Space>
                  <CalendarOutlined />
                  {new Date(competition.EndTime).toLocaleString('vi-VN')}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Thời gian làm bài">
                <Space>
                  <ClockCircleOutlined />
                  {competition.Duration} phút
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Người tổ chức">
                <Space>
                  <UserOutlined />
                  {competition.OrganizerName || 'Admin'}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Người tham gia"
                  value={competition.CurrentParticipants}
                  suffix={`/ ${competition.MaxParticipants}`}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card>
                <Statistic
                  title="Số bài tập"
                  value={problems.length}
                  prefix={<CodeOutlined />}
                />
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Thống kê">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Điểm trung bình"
                      value={
                        participants.length > 0
                          ? (
                              participants.reduce((acc, p) => acc + p.Score, 0) /
                              participants.length
                            ).toFixed(1)
                          : 0
                      }
                      prefix={<LineChartOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Bài giải đúng"
                      value={
                        participants.length > 0
                          ? participants.reduce(
                              (acc, p) => acc + p.TotalProblemsSolved,
                              0
                            )
                          : 0
                      }
                      prefix={<CodeOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Divider />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Bài tập" key="1">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Link to={`/competitions/${id}/problems/create`}>
              <Button type="primary" icon={<PlusOutlined />}>
                Thêm bài tập
              </Button>
            </Link>
          </div>

          <Table
            columns={problemColumns}
            dataSource={problems}
            rowKey="ProblemID"
            pagination={{ pageSize: 5 }}
          />
        </TabPane>

        <TabPane tab="Người tham gia" key="2">
          <Table
            columns={participantColumns}
            dataSource={participants}
            rowKey="ParticipantID"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>
    </MainCard>
  );
};

export default CompetitionDetail;