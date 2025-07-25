/*-----------------------------------------------------------------
* File: UserManagement.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Space, Button, Dropdown, Modal, 
  Tag, Typography, Input, message, Tooltip, Divider,
  Row, Col, Statistic, Select, Form, Avatar,
  Tabs, Switch, Menu, Radio, Segmented, Empty, Spin,
  Alert
} from 'antd';
import {
  UserAddOutlined, EditOutlined, LockOutlined, 
  EyeOutlined, MoreOutlined, SearchOutlined,
  FilterOutlined, ExclamationCircleOutlined,
  TeamOutlined, UserOutlined, ReloadOutlined,
  DownloadOutlined, CheckOutlined, CloseOutlined,
  UnlockOutlined, MailOutlined, IdcardOutlined,
  CalendarOutlined, SafetyCertificateOutlined,
  AppstoreOutlined, BarsOutlined, ExportOutlined,
  KeyOutlined, CopyOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import api from '../../services/api';
import { usersAPI } from '../../api';
import MainCard from '../../components/MainCard';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;

const UserManagement = () => {
  // State for users data
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    locked: 0,
    admins: 0
  });
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    table: false,
    exporting: false
  });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  
  // Detail and action states
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [lockDuration, setLockDuration] = useState(24);
  const [lockReason, setLockReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [editUserForm] = Form.useForm();
  
  // Password reset state
  const [passwordResetModalVisible, setPasswordResetModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false);
  
  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Apply filters when data or search/filters change
  useEffect(() => {
    if (users.length > 0) {
      handleFiltering();
    }
  }, [searchText, filterStatus, filterRole, filterSchool, activeTab, users]);
  
  const fetchUsers = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, table: true }));
      const response = await usersAPI.getUsers();
      
      // Ensure consistent data format
      const userData = Array.isArray(response.data) ? response.data : 
                       response.data?.users ? response.data.users : [];
      
      console.log('Users API response:', response);
      setUsers(userData);
      setFilteredUsers(userData);
      
      // Calculate stats
      const totalUsers = userData.length;
      const activeUsers = userData.filter(user => user.AccountStatus === 'ACTIVE').length;
      const lockedUsers = userData.filter(user => user.AccountStatus === 'LOCKED').length;
      const adminUsers = userData.filter(user => user.Role === 'ADMIN').length;
      
      setStats({
        total: totalUsers,
        active: activeUsers,
        locked: lockedUsers,
        admins: adminUsers
      });
    } catch (err) {
      console.error('Failed to fetch users:', err);
      message.error('Không thể tải danh sách người dùng');
      
      // Hiển thị dữ liệu mẫu khi API lỗi
      const mockUsers = [
        {
          UserID: 1,
          Username: 'admin',
          Email: 'admin@CampusLearning.edu.vn',
          FullName: 'Quản trị viên',
          Role: 'ADMIN',
          AccountStatus: 'ACTIVE',
          CreatedAt: new Date().toISOString(),
          LastLoginAt: new Date().toISOString()
        },
        {
          UserID: 2,
          Username: 'teacher1',
          Email: 'teacher1@CampusLearning.edu.vn',
          FullName: 'Giáo viên 1',
          Role: 'TEACHER',
          AccountStatus: 'ACTIVE',
          CreatedAt: new Date().toISOString(),
          LastLoginAt: new Date().toISOString()
        },
        {
          UserID: 3,
          Username: 'student1',
          Email: 'student1@CampusLearning.edu.vn',
          FullName: 'Học sinh 1',
          Role: 'STUDENT',
          AccountStatus: 'ACTIVE',
          CreatedAt: new Date().toISOString(),
          LastLoginAt: null
        }
      ];
      
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setStats({
        total: mockUsers.length,
        active: mockUsers.filter(user => user.AccountStatus === 'ACTIVE').length,
        locked: 0,
        admins: mockUsers.filter(user => user.Role === 'ADMIN').length
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, table: false }));
    }
  };
  
  // Handle combined filtering
  const handleFiltering = () => {
    if (!Array.isArray(users) || users.length === 0) {
      setFilteredUsers([]);
      return;
    }
    
    let filtered = [...users];
    
    // Apply tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(user => user.AccountStatus === 'ACTIVE');
    } else if (activeTab === 'locked') {
      filtered = filtered.filter(user => user.AccountStatus === 'LOCKED');
    } else if (activeTab === 'admin') {
      filtered = filtered.filter(user => user.Role === 'ADMIN');
    }
    
    // Apply search text filter
    if (searchText) {
      filtered = filtered.filter(
        (user) =>
          (user.Username && user.Username.toLowerCase().includes(searchText.toLowerCase())) ||
          (user.Email && user.Email.toLowerCase().includes(searchText.toLowerCase())) ||
          (user.FullName && user.FullName.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.AccountStatus === filterStatus);
    }
    
    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.Role === filterRole);
    }
    
    // Apply school filter
    if (filterSchool !== 'all') {
      filtered = filtered.filter(user => user.School === filterSchool);
    }
    
    setFilteredUsers(filtered);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setFilterStatus('all');
    setFilterRole('all');
    setFilterSchool('all');
    setActiveTab('all');
  };
  
  // Show user details
  const showUserDetails = (user) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };
  
  // Open lock dialog
  const openLockDialog = (user) => {
    setSelectedUser(user);
    setLockDialogOpen(true);
  };
  
  // Close lock dialog
  const closeLockDialog = () => {
    setLockDialogOpen(false);
    setLockDuration(24);
    setLockReason('');
  };
  
  // Open role dialog
  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.Role);
    setRoleDialogOpen(true);
  };
  
  // Close role dialog
  const closeRoleDialog = () => {
    setRoleDialogOpen(false);
  };
  
  // Edit user functionality
  const openEditUserModal = (user) => {
    setSelectedUser(user);
    editUserForm.setFieldsValue({
      fullName: user.FullName,
      email: user.Email,
      school: user.School,
      bio: user.Bio
    });
    setEditUserModalVisible(true);
  };
  
  const closeEditUserModal = () => {
    setEditUserModalVisible(false);
    editUserForm.resetFields();
  };
  
  const handleUpdateUser = async () => {
    try {
      const values = await editUserForm.validateFields();
      await usersAPI.updateUser(selectedUser.UserID, values);
      
      // Update local state for immediate UI feedback
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.UserID === selectedUser.UserID
            ? { ...user, FullName: values.fullName, Email: values.email, School: values.school, Bio: values.bio }
            : user
        )
      );
      
      message.success('Cập nhật thông tin người dùng thành công');
      closeEditUserModal();
      
      // Also update the selected user for detail modal
      setSelectedUser(prev => ({
        ...prev,
        FullName: values.fullName,
        Email: values.email,
        School: values.school,
        Bio: values.bio
      }));
    } catch (err) {
      console.error('Failed to update user:', err);
      message.error('Không thể cập nhật thông tin người dùng');
    }
  };
  
  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      // Sử dụng đúng endpoint API để cập nhật vai trò
      await usersAPI.updateUserRole(selectedUser.UserID, newRole);
      
      // Update local state for immediate UI feedback
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.UserID === selectedUser.UserID
            ? { ...user, Role: newRole }
            : user
        )
      );
      
      message.success('Cập nhật vai trò người dùng thành công');
      closeRoleDialog();
    } catch (err) {
      console.error('Failed to update user role:', err);
      message.error('Không thể cập nhật vai trò người dùng: ' + (err.response?.data?.message || err.message));
      
      // Vẫn cập nhật UI nếu API response cho thấy việc cập nhật đã thành công
      if (err.response?.data?.success) {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.UserID === selectedUser.UserID
              ? { ...user, Role: newRole }
              : user
          )
        );
        closeRoleDialog();
      }
    }
  };
  
  // Handle lock user
  const handleLockUser = async () => {
    if (!selectedUser) return;
    
    try {
      await usersAPI.lockUser(selectedUser.UserID, lockDuration);
      
      // Update local state for immediate UI feedback
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.UserID === selectedUser.UserID
            ? { ...user, AccountStatus: 'LOCKED' }
            : user
        )
      );
      
      message.success('Khóa tài khoản người dùng thành công');
      closeLockDialog();
    } catch (err) {
      console.error('Failed to lock user:', err);
      message.error('Không thể khóa tài khoản người dùng');
    }
  };
  
  // Handle unlock user
  const handleUnlockUser = async (user) => {
    try {
      await usersAPI.unlockUser(user.UserID);
      
      // Update local state for immediate UI feedback
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.UserID === user.UserID
            ? { ...u, AccountStatus: 'ACTIVE' }
            : u
        )
      );
      
      message.success('Mở khóa tài khoản người dùng thành công');
    } catch (err) {
      console.error('Failed to unlock user:', err);
      message.error('Không thể mở khóa tài khoản người dùng');
    }
  };
  
  // Export users
  const handleExportUsers = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, exporting: true }));
      message.loading({ content: 'Đang xuất dữ liệu người dùng...', key: 'exportUsers' });
      
      // Format the CSV data with BOM for UTF-8
      // Adding BOM (Byte Order Mark) to ensure proper UTF-8 encoding
      let csvContent = '\uFEFF';
      csvContent += 'ID,Username,Email,Full Name,School,Role,Status,Created Date,Last Login\n';
      
      // Add user data rows
      filteredUsers.forEach(user => {
        const userDataRow = [
          user.UserID || '',
          user.Username || '',
          user.Email || '',
          user.FullName || '',
          user.School || '',
          user.Role || '',
          user.AccountStatus || '',
          user.CreatedAt ? formatDate(user.CreatedAt) : '',
          user.LastLoginAt ? formatDate(user.LastLoginAt) : 'Chưa đăng nhập'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        
        csvContent += userDataRow + '\n';
      });
      
      // Create a blob with the CSV data using UTF-8 encoding
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success({ content: 'Xuất danh sách người dùng thành công', key: 'exportUsers' });
    } catch (error) {
      console.error('Failed to export users:', error);
      message.error({ 
        content: 'Không thể xuất danh sách người dùng', 
        key: 'exportUsers' 
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, exporting: false }));
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
  
  // Helper functions for rendering
  const getRoleTag = (role) => {
    const roleColors = {
      'ADMIN': 'red',
      'TEACHER': 'blue',
      'STUDENT': 'default'
    };
    
    return (
      <Tag color={roleColors[role] || 'default'}>
        {role || 'Chưa xác định'}
      </Tag>
    );
  };
  
  const getStatusTag = (status) => {
    const statusColors = {
      'ACTIVE': 'success',
      'LOCKED': 'error',
      'INACTIVE': 'warning'
    };
    
    const statusText = {
      'ACTIVE': 'Hoạt động',
      'LOCKED': 'Bị khóa',
      'INACTIVE': 'Không hoạt động'
    };
    
    return (
      <Tag color={statusColors[status] || 'default'}>
        {statusText[status] || status || 'Chưa xác định'}
      </Tag>
    );
  };
  
  // Open password reset modal
  const openPasswordResetModal = (user) => {
    setSelectedUser(user);
    setPasswordResetModalVisible(true);
    setNewPassword('');
  };
  
  // Close password reset modal
  const closePasswordResetModal = () => {
    setPasswordResetModalVisible(false);
    setNewPassword('');
  };
  
  // Handle password reset
  const handlePasswordReset = async () => {
    if (!selectedUser) return;
    
    try {
      setIsPasswordResetLoading(true);
      const response = await usersAPI.resetPassword(selectedUser.UserID);
      
      if (response.data && response.data.newPassword) {
        setNewPassword(response.data.newPassword);
        message.success('Đặt lại mật khẩu thành công');
      } else {
        message.warning('Không nhận được mật khẩu mới từ máy chủ');
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
      message.error('Không thể đặt lại mật khẩu người dùng');
    } finally {
      setIsPasswordResetLoading(false);
    }
  };
  
  // Copy password to clipboard
  const copyPasswordToClipboard = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword)
        .then(() => {
          message.success('Đã sao chép mật khẩu vào clipboard');
        })
        .catch(() => {
          message.error('Không thể sao chép mật khẩu');
        });
    }
  };
  
  // Generate actions dropdown menu
  const getActionMenu = (user) => {
    const items = [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />
      },
      {
        key: 'changeRole',
        label: 'Thay đổi vai trò',
        icon: <SafetyCertificateOutlined />
      },
      {
        key: 'resetPassword',
        label: 'Đặt lại mật khẩu',
        icon: <KeyOutlined />,
        danger: true
      }
    ];
    
    // Add lock/unlock action based on current status
    if (user.AccountStatus === 'LOCKED') {
      items.push({
        key: 'unlock',
        label: 'Mở khóa tài khoản',
        icon: <UnlockOutlined />
      });
    } else {
      items.push({
        key: 'lock',
        label: 'Khóa tài khoản',
        icon: <LockOutlined />,
        disabled: user.Role === 'ADMIN'
      });
    }
    
    return {
      items,
      onClick: ({ key }) => {
        if (key === 'view') {
          showUserDetails(user);
        } else if (key === 'changeRole') {
          openRoleDialog(user);
        } else if (key === 'lock') {
          openLockDialog(user);
        } else if (key === 'unlock') {
          handleUnlockUser(user);
        } else if (key === 'resetPassword') {
          openPasswordResetModal(user);
        }
      }
    };
  };

  // Confirm delete modal
  const showDeleteConfirm = (user) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa người dùng này?',
      icon: <ExclamationCircleOutlined />,
      content: `Người dùng: ${user.FullName || user.Username}`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk() {
        message.success('Đã xóa người dùng thành công');
      }
    });
  };
  
  // Table columns configuration
  const columns = [
    {
      title: 'ID',
      dataIndex: 'UserID',
      key: 'id',
      width: 70
    },
    {
      title: 'Tên người dùng',
      key: 'user',
      render: (_, user) => (
        <Space>
          <Avatar 
            style={{ 
              backgroundColor: 
                user.Role === 'ADMIN' ? '#f5222d' : 
                user.Role === 'TEACHER' ? '#1890ff' : '#d9d9d9'
            }}
          >
            {user.FullName ? user.FullName[0] : user.Username ? user.Username[0] : 'U'}
          </Avatar>
          <div>
            <Text strong style={{ cursor: 'pointer' }} onClick={() => showUserDetails(user)}>
              {user.FullName || user.Username || 'Người dùng'}
            </Text>
            <div>
              <Text type="secondary">{user.Email || 'Không có email'}</Text>
            </div>
            {user.School && (
              <div>
                <Text type="secondary"><IdcardOutlined /> {user.School}</Text>
              </div>
            )}
          </div>
        </Space>
      )
    },
    {
      title: 'Trường học',
      dataIndex: 'School',
      key: 'school',
      render: (school) => school || 'Không có',
      sorter: (a, b) => {
        if (!a.School) return 1;
        if (!b.School) return -1;
        return a.School.localeCompare(b.School);
      },
    },
    {
      title: 'Vai trò',
      dataIndex: 'Role',
      key: 'role',
      render: (role) => getRoleTag(role),
      filters: [
        {
          text: 'Admin',
          value: 'ADMIN',
        },
        {
          text: 'Giáo viên',
          value: 'TEACHER',
        },
        {
          text: 'Học sinh',
          value: 'STUDENT',
        },
      ],
      onFilter: (value, record) => record.Role === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'AccountStatus',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        {
          text: 'Hoạt động',
          value: 'ACTIVE',
        },
        {
          text: 'Bị khóa',
          value: 'LOCKED',
        },
        {
          text: 'Không hoạt động',
          value: 'INACTIVE',
        },
      ],
      onFilter: (value, record) => record.AccountStatus === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'CreatedAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt),
    },
    {
      title: 'Lần cuối đăng nhập',
      dataIndex: 'LastLoginAt',
      key: 'lastLogin',
      render: (date) => date ? formatDate(date) : 'Chưa đăng nhập',
      sorter: (a, b) => {
        if (!a.LastLoginAt) return 1;
        if (!b.LastLoginAt) return -1;
        return new Date(a.LastLoginAt) - new Date(b.LastLoginAt);
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, user) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => showUserDetails(user)}
          />
          {user.AccountStatus === 'LOCKED' ? (
            <Button 
              icon={<UnlockOutlined />} 
              size="small"
              type="primary"
              onClick={() => handleUnlockUser(user)}
            />
          ) : (
            <Button 
              icon={<LockOutlined />} 
              size="small"
              danger
              disabled={user.Role === 'ADMIN'}
              onClick={() => openLockDialog(user)}
            />
          )}
          <Dropdown menu={getActionMenu(user)}>
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      )
    }
  ];
  
  // Tab change handler
  const handleTabChange = (key) => {
    setActiveTab(key);
  };
  
  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <TeamOutlined /> Tất cả
        </span>
      ),
    },
    {
      key: 'active',
      label: (
        <span>
          <CheckOutlined /> Hoạt động
        </span>
      ),
    },
    {
      key: 'locked',
      label: (
        <span>
          <LockOutlined /> Bị khóa
        </span>
      ),
    },
    {
      key: 'admin',
      label: (
        <span>
          <SafetyCertificateOutlined /> Admin
        </span>
      ),
    }
  ];

  // Render user card for grid view
  const renderUserCard = (user) => (
    <Card 
      hoverable 
      style={{ marginBottom: 16 }}
      actions={[
        <Tooltip title="Xem chi tiết">
          <EyeOutlined key="view" onClick={() => showUserDetails(user)} />
        </Tooltip>,
        <Tooltip title="Đặt lại mật khẩu">
          <KeyOutlined key="resetPassword" onClick={() => openPasswordResetModal(user)} />
        </Tooltip>,
        user.AccountStatus === 'LOCKED' ? (
          <Tooltip title="Mở khóa tài khoản">
            <UnlockOutlined key="unlock" onClick={() => handleUnlockUser(user)} />
          </Tooltip>
        ) : (
          <Tooltip title="Khóa tài khoản">
            <LockOutlined 
              key="lock" 
              onClick={() => openLockDialog(user)}
              style={{ color: user.Role === 'ADMIN' ? '#d9d9d9' : '' }}
            />
          </Tooltip>
        ),
        <Tooltip title="Thay đổi vai trò">
          <SafetyCertificateOutlined key="role" onClick={() => openRoleDialog(user)} />
        </Tooltip>
      ]}
    >
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Avatar 
          size={64}
          style={{ 
            backgroundColor: 
              user.Role === 'ADMIN' ? '#f5222d' : 
              user.Role === 'TEACHER' ? '#1890ff' : '#d9d9d9'
          }}
        >
          {user.FullName ? user.FullName[0] : user.Username ? user.Username[0] : 'U'}
        </Avatar>
        <div style={{ marginTop: 8 }}>
          <Text strong>{user.FullName || user.Username || 'Người dùng'}</Text>
        </div>
        <div style={{ marginTop: 4 }}>
          <Text type="secondary">{user.Email || 'Không có email'}</Text>
        </div>
        {user.School && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary"><IdcardOutlined /> {user.School}</Text>
          </div>
        )}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text type="secondary">Vai trò:</Text>
        {getRoleTag(user.Role)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text type="secondary">Trạng thái:</Text>
        {getStatusTag(user.AccountStatus)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Text type="secondary">Tham gia:</Text>
        <Text>{formatDate(user.CreatedAt).split(' ')[0]}</Text>
      </div>
    </Card>
  );
  
  // Get unique schools for filter
  const getUniqueSchools = () => {
    const schools = users
      .map(user => user.School)
      .filter(school => school) // Remove null/undefined values
      .filter((school, index, self) => self.indexOf(school) === index) // Get unique values
      .sort();
    
    return schools;
  };
  
  return (
    <MainCard 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TeamOutlined style={{ marginRight: 8, fontSize: '20px' }} />
          <span>Quản lý người dùng</span>
        </div>
      }
      extra={
        <Space>
          <Button 
            icon={<ExportOutlined />}
            onClick={handleExportUsers}
            loading={loadingStates.exporting}
          >
            Xuất danh sách
            </Button>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
          >
            Thêm người dùng
          </Button>
        </Space>
      }
    >
      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="hover-shadow">
            <Statistic
              title="Tổng người dùng"
              value={stats.total}
              prefix={<TeamOutlined />}
              suffix={
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  Người dùng
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="hover-shadow">
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
              suffix={
                <Tag color="success" style={{ marginLeft: 8 }}>
                  Hoạt động
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="hover-shadow">
            <Statistic
              title="Bị khóa"
              value={stats.locked}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<LockOutlined />}
              suffix={
                <Tag color="error" style={{ marginLeft: 8 }}>
                  Bị khóa
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="hover-shadow">
            <Statistic
              title="Admin"
              value={stats.admins}
              valueStyle={{ color: '#faad14' }}
              prefix={<SafetyCertificateOutlined />}
              suffix={
                <Tag color="warning" style={{ marginLeft: 8 }}>
                  Admin
                </Tag>
              }
            />
          </Card>
        </Col>
      </Row>
      
      {/* Tabs */}
      <Card 
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '12px 24px' }}
        bordered={false}
        className="hover-shadow"
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      </Card>
      
      {/* Filters Row */}
      <Card 
        style={{ marginBottom: 16 }} 
        bodyStyle={{ padding: 16 }}
        bordered={false}
        className="hover-shadow"
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={8} lg={7} style={{ marginBottom: { xs: 16, md: 0 } }}>
            <Input
              placeholder="Tìm kiếm người dùng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Trạng thái"
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="ACTIVE">Đang hoạt động</Option>
              <Option value="LOCKED">Bị khóa</Option>
              <Option value="INACTIVE">Không hoạt động</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Vai trò"
              value={filterRole}
              onChange={(value) => setFilterRole(value)}
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="ADMIN">Admin</Option>
              <Option value="TEACHER">Giáo viên</Option>
              <Option value="STUDENT">Học sinh</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Trường học"
              value={filterSchool}
              onChange={(value) => setFilterSchool(value)}
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">Tất cả trường</Option>
              {getUniqueSchools().map(school => (
                <Option key={school} value={school}>{school}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={4} lg={7} style={{ textAlign: 'right', marginTop: { xs: 16, md: 0 } }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loadingStates.table}
                title="Làm mới dữ liệu"
              />
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    value: 'table',
                    icon: <BarsOutlined />,
                    label: 'Bảng'
                  },
                  {
                    value: 'grid',
                    icon: <AppstoreOutlined />,
                    label: 'Lưới'
                  }
                ]}
              />
              <Button
                icon={<FilterOutlined />}
                onClick={resetFilters}
                title="Đặt lại bộ lọc"
              >
                Đặt lại
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
      
      {/* Users Data */}
      {loadingStates.table ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : viewMode === 'table' ? (
        <Card bordered={false} className="hover-shadow">
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="UserID"
            loading={loadingStates.table}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} người dùng`,
            }}
            locale={{
              emptyText: (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không có người dùng nào"
                />
              )
            }}
          />
        </Card>
      ) : (
        <Row gutter={16}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
              <Col xs={24} sm={12} md={8} lg={6} key={user.UserID}>
                {renderUserCard(user)}
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Card bordered={false} style={{ textAlign: 'center', padding: '30px 0' }} className="hover-shadow">
                <Empty 
                  description="Không tìm thấy người dùng nào"
                />
                <Button 
                  style={{ marginTop: 16 }}
                  onClick={resetFilters}
                >
                  Đặt lại bộ lọc
                </Button>
              </Card>
            </Col>
          )}
        </Row>
      )}
      
      {/* User Detail Modal */}
      <Modal
        title="Chi tiết người dùng"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          selectedUser && (
            <Button
              key="resetPassword"
              icon={<KeyOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                openPasswordResetModal(selectedUser);
              }}
            >
              Đặt lại mật khẩu
            </Button>
          ),
          selectedUser && selectedUser.AccountStatus === 'LOCKED' ? (
            <Button
              key="unlock"
              type="primary"
              onClick={() => {
                handleUnlockUser(selectedUser);
                setDetailModalVisible(false);
              }}
            >
              Mở khóa tài khoản
            </Button>
          ) : selectedUser && selectedUser.Role !== 'ADMIN' && (
            <Button
              key="lock"
              danger
              onClick={() => {
                setDetailModalVisible(false);
                openLockDialog(selectedUser);
              }}
            >
              Khóa tài khoản
            </Button>
          )
        ]}
        width={700}
      >
        {selectedUser ? (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24} style={{ textAlign: 'center', marginBottom: 20 }}>
                      <Avatar 
                  size={80}
                  style={{ 
                          backgroundColor: 
                      selectedUser.Role === 'ADMIN' ? '#f5222d' : 
                      selectedUser.Role === 'TEACHER' ? '#1890ff' : '#d9d9d9'
                        }}
                      >
                  {selectedUser.FullName ? selectedUser.FullName[0] : selectedUser.Username ? selectedUser.Username[0] : 'U'}
                      </Avatar>
                <div style={{ marginTop: 8 }}>
                  <Title level={4}>{selectedUser.FullName || selectedUser.Username || 'Người dùng'}</Title>
                  <Space>
                    {getRoleTag(selectedUser.Role)}
                    {getStatusTag(selectedUser.AccountStatus)}
                  </Space>
                </div>
              </Col>
              
              <Col span={12}>
                <Title level={5}>Thông tin người dùng</Title>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Username:</Text>
                  <div>
                    <Text strong>{selectedUser.Username || 'Không có'}</Text>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Email:</Text>
                  <div>
                    <Text strong>{selectedUser.Email || 'Không có'}</Text>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Họ và tên:</Text>
                  <div>
                    <Text strong>{selectedUser.FullName || 'Không có'}</Text>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Trường học:</Text>
                  <div>
                    <Text strong>{selectedUser.School || 'Không có'}</Text>
                  </div>
                </div>
              </Col>
              
              <Col span={12}>
                <Title level={5}>Lịch sử và trạng thái</Title>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Ngày tạo tài khoản:</Text>
                  <div>
                    <Text strong>{formatDate(selectedUser.CreatedAt) || 'Không xác định'}</Text>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Lần cuối đăng nhập:</Text>
                  <div>
                    <Text strong>{selectedUser.LastLoginAt ? formatDate(selectedUser.LastLoginAt) : 'Chưa đăng nhập'}</Text>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Trạng thái tài khoản:</Text>
                  <div>
                    {getStatusTag(selectedUser.AccountStatus)}
                  </div>
                </div>
              </Col>
              
              <Col span={24}>
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                    icon={<EditOutlined />}
                        onClick={() => {
                      setDetailModalVisible(false);
                      openEditUserModal(selectedUser);
                        }}
                      >
                    Chỉnh sửa thông tin
                      </Button>
                      <Button 
                    icon={<SafetyCertificateOutlined />}
                        onClick={() => {
                      setDetailModalVisible(false);
                      openRoleDialog(selectedUser);
                        }}
                      >
                    Thay đổi vai trò
                      </Button>
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="secondary">Không có dữ liệu người dùng</Text>
          </div>
        )}
      </Modal>
      
      {/* Lock User Modal */}
      <Modal
        title="Khóa tài khoản người dùng"
        open={lockDialogOpen}
        onCancel={closeLockDialog}
        onOk={handleLockUser}
        okButtonProps={{ danger: true }}
        okText="Khóa tài khoản"
      >
        {selectedUser && (
          <Form layout="vertical">
            <div style={{ marginBottom: 16 }}>
              <Text>
                Bạn đang khóa tài khoản của: <Text strong>{selectedUser.FullName || selectedUser.Username}</Text>
              </Text>
            </div>
            
            <Form.Item label="Thời hạn khóa">
              <Select
                value={lockDuration}
                onChange={(value) => setLockDuration(value)}
                style={{ width: '100%' }}
              >
                <Option value={1}>1 giờ</Option>
                <Option value={24}>1 ngày</Option>
                <Option value={24 * 3}>3 ngày</Option>
                <Option value={24 * 7}>1 tuần</Option>
                <Option value={24 * 30}>1 tháng</Option>
                <Option value={0}>Vĩnh viễn</Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="Lý do khóa tài khoản">
              <Input.TextArea 
                rows={4}
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
                placeholder="Nhập lý do khóa tài khoản..."
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* Change Role Modal */}
      <Modal
        title="Thay đổi vai trò người dùng"
        open={roleDialogOpen}
        onCancel={closeRoleDialog}
        onOk={handleRoleChange}
        okText="Lưu thay đổi"
      >
        {selectedUser && (
          <Form layout="vertical">
            <div style={{ marginBottom: 16 }}>
              <Text>
                Thay đổi vai trò cho: <Text strong>{selectedUser.FullName || selectedUser.Username}</Text>
              </Text>
            </div>
            
            <Form.Item label="Vai trò">
            <Select
              value={newRole}
                onChange={(value) => setNewRole(value)}
                style={{ width: '100%' }}
              >
                <Option value="STUDENT">Học sinh</Option>
                <Option value="TEACHER">Giáo viên</Option>
                <Option value="ADMIN">Admin</Option>
            </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* Edit User Modal */}
      <Modal
        title="Chỉnh sửa thông tin người dùng"
        open={editUserModalVisible}
        onCancel={closeEditUserModal}
        onOk={handleUpdateUser}
        okText="Lưu thay đổi"
      >
        {selectedUser && (
          <Form form={editUserForm} layout="vertical">
            <Form.Item 
              label="Họ và tên" 
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
            
            <Form.Item 
              label="Email" 
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>
            
            <Form.Item 
              label="Trường học" 
              name="school"
            >
              <Input placeholder="Nhập tên trường học" />
            </Form.Item>
            
            <Form.Item 
              label="Giới thiệu" 
              name="bio"
            >
              <Input.TextArea rows={4} placeholder="Nhập thông tin giới thiệu" />
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* Password Reset Modal */}
      <Modal
        title="Đặt lại mật khẩu người dùng"
        open={passwordResetModalVisible}
        onCancel={closePasswordResetModal}
        footer={[
          <Button key="close" onClick={closePasswordResetModal}>
            Đóng
          </Button>,
          !newPassword && (
            <Button 
              key="reset" 
              type="primary" 
              danger 
              onClick={handlePasswordReset}
              loading={isPasswordResetLoading}
            >
              Đặt lại mật khẩu
            </Button>
          )
        ]}
      >
        {selectedUser && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text>
                Bạn đang đặt lại mật khẩu cho tài khoản: <Text strong>{selectedUser.FullName || selectedUser.Username}</Text>
              </Text>
            </div>
            
            {!newPassword ? (
              <div style={{ marginTop: 24 }}>
                <Alert
                  message="Cảnh báo"
                  description="Thao tác này sẽ tạo một mật khẩu mới và xóa mật khẩu cũ. Người dùng sẽ cần sử dụng mật khẩu mới để đăng nhập."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </div>
            ) : (
              <div style={{ marginTop: 24 }}>
                <Alert
                  message="Mật khẩu mới đã được tạo"
                  description="Hãy sao chép và chia sẻ mật khẩu này với người dùng. Mật khẩu sẽ không được hiển thị lại sau khi đóng hộp thoại này."
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <div style={{ 
                  padding: '12px 16px',
                  background: '#f5f5f5',
                  borderRadius: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 16 
                }}>
                  <Text copyable={false} strong>{newPassword}</Text>
                  <Button 
                    icon={<CopyOutlined />}
                    onClick={copyPasswordToClipboard}
                    type="primary"
                  >
                    Sao chép
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      <style jsx global>{`
        .hover-shadow {
          transition: all 0.3s;
        }
        .hover-shadow:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </MainCard>
  );
};

export default UserManagement;
