import React, { useState, useEffect } from 'react';
import {
  Card, Table, Space, Button, Dropdown, Modal, 
  Tag, Typography, Input, message, Tooltip, Divider,
  Row, Col, Statistic, Select, Form, DatePicker
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, MoreOutlined, SearchOutlined,
  FilterOutlined, ExclamationCircleOutlined,
  BookOutlined, UserOutlined, FlagOutlined,
  ReloadOutlined, DownloadOutlined, CheckOutlined,
  CloseOutlined, CommentOutlined, ProjectOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import * as reportsAPI from '../../api/reports';
import MainCard from '../../components/MainCard';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data for reports when API fails
const mockReportsData = [
  {
    id: 1,
    title: 'Người dùng đăng bài không phù hợp',
    content: 'Người dùng này đã đăng một bài viết có nội dung không phù hợp với tiêu chuẩn cộng đồng.',
    category: 'USER',
    reporterName: 'Nguyễn Văn A',
    reporterID: 101,
    targetID: 201,
    targetType: 'USER',
    createdAt: '2023-05-15T08:30:00Z',
    status: 'PENDING',
    resolvedAt: null,
    notes: null
  },
  {
    id: 2,
    title: 'Nội dung khóa học không chính xác',
    content: 'Khóa học này chứa thông tin kỹ thuật không chính xác về React.',
    category: 'COURSE',
    reporterName: 'Trần Thị B',
    reporterID: 102,
    targetID: 301,
    targetType: 'COURSE',
    createdAt: '2023-05-10T14:20:00Z',
    status: 'RESOLVED',
    resolvedAt: '2023-05-12T09:15:00Z',
    notes: 'Đã cập nhật nội dung khóa học với thông tin chính xác.'
  },
  {
    id: 3,
    title: 'Bình luận xúc phạm',
    content: 'Người dùng đã bình luận với ngôn từ xúc phạm trên bài đăng của tôi.',
    category: 'COMMENT',
    reporterName: 'Lê Văn C',
    reporterID: 103,
    targetID: 401,
    targetType: 'COMMENT',
    createdAt: '2023-05-14T18:45:00Z',
    status: 'REJECTED',
    resolvedAt: '2023-05-15T10:30:00Z',
    notes: 'Bình luận không vi phạm quy định cộng đồng.'
  },
  {
    id: 4,
    title: 'Sự kiện thiếu thông tin',
    content: 'Sự kiện này không cung cấp đủ thông tin về địa điểm và thời gian.',
    category: 'EVENT',
    reporterName: 'Phạm Thị D',
    reporterID: 104,
    targetID: 501,
    targetType: 'EVENT',
    createdAt: '2023-05-16T09:10:00Z',
    status: 'PENDING',
    resolvedAt: null,
    notes: null
  },
  {
    id: 5,
    title: 'Bài viết chứa thông tin sai lệch',
    content: 'Bài viết này chứa thông tin sai lệch về công nghệ AI hiện tại.',
    category: 'CONTENT',
    reporterName: 'Hoàng Văn E',
    reporterID: 105,
    targetID: 601,
    targetType: 'POST',
    createdAt: '2023-05-17T11:20:00Z',
    status: 'PENDING',
    resolvedAt: null,
    notes: null
  }
];

// Mock stats for when API fails
const mockStats = {
  total: 42,
  pending: 15,
  resolved: 20,
  rejected: 7,
  change: 12.5,
  changeType: 'increase'
};

// Report statuses with colors
const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    case 'REJECTED':
      return 'error';
    default:
      return 'default';
  }
};

// Report category icons
const getCategoryIcon = (category) => {
  switch (category) {
    case 'USER':
      return <UserOutlined />;
    case 'CONTENT':
      return <FlagOutlined />;
    case 'COURSE':
      return <BookOutlined />;
    case 'EVENT':
      return <CalendarOutlined />;
    case 'COMMENT':
      return <CommentOutlined />;
    default:
      return <FlagOutlined />;
  }
};

const ReportsPage = () => {
  // State for reports data
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    rejected: 0,
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Detail and action states
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  
  // Load reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);
  
  // Apply filters when data or search/filters change
  useEffect(() => {
    if (reports.length > 0) {
      handleFiltering();
    }
  }, [searchText, filterStatus, filterCategory, reports]);
  
  // Fetch reports data from API
  const fetchReports = async () => {
    setLoading(true);
    try {
      // Get reports
      const reportsResponse = await reportsAPI.getReports({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      // Ensure we're handling the response correctly - API might return different structure
      let reportData = [];
      if (reportsResponse && reportsResponse.data) {
        // Handle various API response formats
        reportData = Array.isArray(reportsResponse.data) 
          ? reportsResponse.data 
          : Array.isArray(reportsResponse.data.items) 
            ? reportsResponse.data.items 
            : Array.isArray(reportsResponse.data.reports) 
              ? reportsResponse.data.reports 
              : reportsResponse.data.data || [];
            
        // Normalize data to ensure all required fields are present
        reportData = reportData.map(report => ({
          id: report.id || report.reportId || report.ReportID || 0,
          title: report.title || report.Title || report.subject || report.Subject || 'Báo cáo không tiêu đề',
          content: report.content || report.Content || report.description || report.Description || '',
          category: report.category || report.Category || report.type || report.Type || 'CONTENT',
          reporterName: report.reporterName || report.ReporterName || report.userName || report.UserName || 'Người dùng ẩn danh',
          reporterID: report.reporterID || report.ReporterID || report.userId || report.UserID || 0,
          targetID: report.targetID || report.TargetID || report.targetId || 0,
          targetType: report.targetType || report.TargetType || report.objectType || 'CONTENT',
          createdAt: report.createdAt || report.CreatedAt || report.createTime || new Date().toISOString(),
          status: report.status || report.Status || 'PENDING',
          resolvedAt: report.resolvedAt || report.ResolvedAt || report.resolveTime || null,
          notes: report.notes || report.Notes || report.adminNotes || null
        }));
      }
      
      console.log('Normalized report data:', reportData);
      setReports(reportData);
      setFilteredReports(reportData);
      
      // Get statistics
          const statsResponse = await reportsAPI.getReportStats();
      // Handle various stats response formats
      let statsData = {};
          if (statsResponse && statsResponse.data) {
        if (typeof statsResponse.data === 'object') {
          statsData = {
            total: statsResponse.data.total || statsResponse.data.totalReports || 0,
            pending: statsResponse.data.pending || statsResponse.data.pendingReports || 0,
            resolved: statsResponse.data.resolved || statsResponse.data.resolvedReports || 0,
            rejected: statsResponse.data.rejected || statsResponse.data.rejectedReports || 0
          };
        }
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Không thể tải danh sách báo cáo');
      // Use mock data if API fails
      setReports(mockReportsData);
      setFilteredReports(mockReportsData);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  // Handle combined filtering
  const handleFiltering = () => {
    if (!Array.isArray(reports) || reports.length === 0) {
      setFilteredReports([]);
      return;
    }
    
    let filtered = [...reports];
    
    // Apply search text filter
    if (searchText) {
      filtered = filtered.filter(
        (report) =>
          (report.title && report.title.toLowerCase().includes(searchText.toLowerCase())) ||
          (report.content && report.content.toLowerCase().includes(searchText.toLowerCase())) ||
          (report.reporterName && report.reporterName.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(report => report.category === filterCategory);
    }
    
    setFilteredReports(filtered);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setFilterStatus('all');
    setFilterCategory('all');
  };
  
  // Show report details
  const showReportDetails = (report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  // Show status update modal
  const showStatusModal = (report, status) => {
    setSelectedReport(report);
    setNewStatus(status);
    setStatusNotes('');
    setStatusModalVisible(true);
  };

  // Show delete confirmation modal
  const showDeleteModal = (report) => {
    setSelectedReport(report);
    setDeleteModalVisible(true);
  };
  
  // Update report status
  const handleUpdateStatus = async () => {
    try {
      // Handle different API parameter formats
      const params = {
        id: selectedReport.id,
        status: newStatus,
        notes: statusNotes
      };
      
      // Try different API request formats if needed
      try {
        await reportsAPI.updateReportStatus(selectedReport.id, {
          status: newStatus,
          notes: statusNotes
        });
      } catch (firstError) {
        console.log('First update format failed, trying alternative:', firstError);
        
        // Alternative format: some APIs expect different parameter structure
        await reportsAPI.updateReportStatus(selectedReport.id, newStatus, statusNotes);
      }
      
      message.success('Cập nhật trạng thái báo cáo thành công');
      setStatusModalVisible(false);
      
      // Update local state for immediate UI feedback
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === selectedReport.id
            ? {
            ...report,
            status: newStatus,
            notes: statusNotes,
                resolvedAt: newStatus !== 'PENDING' ? new Date().toISOString() : report.resolvedAt
              }
            : report
        )
      );
      
      // Refresh data from server after a short delay
      setTimeout(() => {
        fetchReports();
      }, 500);
    } catch (error) {
      console.error('Error updating report status:', error);
      message.error('Không thể cập nhật trạng thái báo cáo');
    }
  };

  // Delete report with better error handling
  const handleDeleteReport = async () => {
    try {
      await reportsAPI.deleteReport(selectedReport.id);
      message.success('Xóa báo cáo thành công');
      setDeleteModalVisible(false);
      
      // Update local state first for immediate UI feedback
      setReports(prevReports => prevReports.filter(report => report.id !== selectedReport.id));
      setFilteredReports(prevReports => prevReports.filter(report => report.id !== selectedReport.id));
      
      // Then refresh data from server after a short delay
      setTimeout(() => {
        fetchReports();
      }, 500);
    } catch (error) {
      console.error('Error deleting report:', error);
      message.error('Không thể xóa báo cáo');
    }
  };

  // Export reports
  const handleExportReports = async () => {
    try {
      await reportsAPI.exportReportsAsCsv();
      message.success('Xuất báo cáo thành công');
      } catch (error) {
      message.error('Không thể xuất báo cáo');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };
  
  // Generate actions dropdown menu
  const getActionMenu = (report) => {
    const items = [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />
      }
    ];
    
    // Add status actions for pending reports
    if (report.status === 'PENDING') {
      items.push(
        {
          key: 'resolve',
          label: 'Đánh dấu đã xử lý',
          icon: <CheckOutlined />
        },
        {
          key: 'reject',
          label: 'Từ chối',
          icon: <CloseOutlined />
        }
      );
    }
    
    // Add delete action
    items.push(
      {
        type: 'divider'
      },
      {
        key: 'delete',
        label: 'Xóa báo cáo',
        icon: <DeleteOutlined />,
        danger: true
      }
    );
    
    return {
      items,
      onClick: ({ key }) => {
        if (key === 'view') {
          showReportDetails(report);
        } else if (key === 'resolve') {
          showStatusModal(report, 'RESOLVED');
        } else if (key === 'reject') {
          showStatusModal(report, 'REJECTED');
        } else if (key === 'delete') {
          showDeleteModal(report);
        }
      }
    };
  };
  
  // Table columns configuration with safe rendering
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id) => id || '-'
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => showReportDetails(record)}>
          <Text strong>{text || 'Không có tiêu đề'}</Text>
        </a>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (text) => (
        <Tag icon={getCategoryIcon(text)} color="blue">
          {text || 'Khác'}
        </Tag>
      )
    },
    {
      title: 'Người báo cáo',
      dataIndex: 'reporterName',
      key: 'reporter',
      render: (text) => (
        <Space>
          <UserOutlined />
          {text || 'Người dùng ẩn danh'}
        </Space>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => formatDate(text)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        const statusMap = {
          'PENDING': 'Đang xử lý',
          'RESOLVED': 'Đã xử lý',
          'REJECTED': 'Từ chối'
  };

  return (
          <Tag color={getStatusColor(text)}>
            {statusMap[text] || text || 'Không xác định'}
          </Tag>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
          <Button
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => showReportDetails(record)}
            />
          </Tooltip>
          <Dropdown menu={getActionMenu(record)}>
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      )
    }
  ];
  
  return (
    <MainCard title="Quản lý báo cáo">
      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng báo cáo"
              value={stats.total}
              prefix={<FlagOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã xử lý"
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Từ chối"
              value={stats.rejected}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Filters Row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input
            placeholder="Tìm kiếm báo cáo..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={5}>
              <Select
            style={{ width: '100%' }}
            placeholder="Trạng thái"
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="PENDING">Đang xử lý</Option>
            <Option value="RESOLVED">Đã xử lý</Option>
            <Option value="REJECTED">Từ chối</Option>
              </Select>
        </Col>
        <Col span={5}>
              <Select
            style={{ width: '100%' }}
            placeholder="Danh mục"
            value={filterCategory}
            onChange={(value) => setFilterCategory(value)}
          >
            <Option value="all">Tất cả danh mục</Option>
            <Option value="USER">Người dùng</Option>
            <Option value="CONTENT">Nội dung</Option>
            <Option value="COURSE">Khóa học</Option>
            <Option value="EVENT">Sự kiện</Option>
            <Option value="COMMENT">Bình luận</Option>
              </Select>
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
                            <Button
            icon={<ReloadOutlined />} 
            onClick={resetFilters}
            style={{ marginRight: 8 }}
          >
            Đặt lại
                            </Button>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleExportReports}
          >
            Xuất báo cáo
          </Button>
        </Col>
      </Row>
      
      {/* Reports Table */}
      <Table
        columns={columns}
        dataSource={Array.isArray(filteredReports) ? filteredReports : []}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} báo cáo`,
        }}
      />
      
      {/* Detail Modal with improved error handling */}
      <Modal
        title="Chi tiết báo cáo"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          selectedReport && selectedReport.status === 'PENDING' && (
                  <Button
              key="resolve"
              type="primary"
                    onClick={() => {
                setDetailModalVisible(false);
                showStatusModal(selectedReport, 'RESOLVED');
                    }}
                  >
                    Đánh dấu đã xử lý
                  </Button>
          ),
          selectedReport && selectedReport.status === 'PENDING' && (
                  <Button
              key="reject"
              danger
                    onClick={() => {
                setDetailModalVisible(false);
                showStatusModal(selectedReport, 'REJECTED');
                    }}
                  >
                    Từ chối
                  </Button>
          )
        ]}
        width={700}
      >
        {selectedReport ? (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Tag color={getStatusColor(selectedReport.status)}>
                  {selectedReport.status === 'PENDING' ? 'Đang xử lý' : 
                   selectedReport.status === 'RESOLVED' ? 'Đã xử lý' : 'Từ chối'}
                </Tag>
                <Tag icon={getCategoryIcon(selectedReport.category)} color="blue">
                  {selectedReport.category || 'Khác'}
                </Tag>
              </Col>
              <Col span={24}>
                <Title level={5}>Tiêu đề</Title>
                <Text>{selectedReport.title || 'Không có tiêu đề'}</Text>
              </Col>
              <Col span={24}>
                <Title level={5}>Nội dung báo cáo</Title>
                <Text>{selectedReport.content || 'Không có nội dung'}</Text>
              </Col>
              <Col span={12}>
                <Title level={5}>Người báo cáo</Title>
                <Text>{selectedReport.reporterName || 'Người dùng ẩn danh'}</Text>
              </Col>
              <Col span={12}>
                <Title level={5}>Ngày báo cáo</Title>
                <Text>{formatDate(selectedReport.createdAt) || 'Không xác định'}</Text>
              </Col>
              
              {selectedReport.status !== 'PENDING' && (
                <>
                  <Col span={24}>
                    <Divider />
                    <Title level={5}>Ghi chú xử lý</Title>
                    <Text>{selectedReport.notes || 'Không có ghi chú'}</Text>
                  </Col>
                  <Col span={12}>
                    <Title level={5}>Ngày xử lý</Title>
                    <Text>{formatDate(selectedReport.resolvedAt) || 'Không xác định'}</Text>
                  </Col>
                </>
              )}
            </Row>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="secondary">Không có dữ liệu báo cáo</Text>
          </div>
        )}
      </Modal>
      
      {/* Status Update Modal */}
      <Modal
        title={newStatus === 'RESOLVED' ? 'Xác nhận xử lý báo cáo' : 'Xác nhận từ chối báo cáo'}
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={handleUpdateStatus}
        okButtonProps={{ 
          style: { 
            backgroundColor: newStatus === 'RESOLVED' ? '#52c41a' : '#ff4d4f', 
            borderColor: newStatus === 'RESOLVED' ? '#52c41a' : '#ff4d4f' 
          } 
        }}
        okText="Xác nhận"
      >
        <Form layout="vertical">
          <Form.Item 
            label="Ghi chú xử lý"
            extra={newStatus === 'RESOLVED' ? 
              'Mô tả cách bạn đã xử lý báo cáo này' : 
              'Cung cấp lý do từ chối báo cáo này'}
          >
            <Input.TextArea 
            rows={4}
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
              placeholder={newStatus === 'RESOLVED' ? 
                'Ví dụ: Đã xóa nội dung vi phạm và cảnh cáo người dùng...' : 
                'Ví dụ: Báo cáo không đủ thông tin để xác minh...'}
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa báo cáo"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={handleDeleteReport}
        okButtonProps={{ danger: true }}
        okText="Xóa"
      >
        <p>Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác.</p>
      </Modal>
    </MainCard>
  );
};

export default ReportsPage; 