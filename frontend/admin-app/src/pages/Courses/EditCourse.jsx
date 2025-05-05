import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  Stack
} from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  ExpandMore as ExpandMoreIcon, 
  ArrowUpward as ArrowUpwardIcon, 
  ArrowDownward as ArrowDownwardIcon, 
  CloudUpload as CloudUploadIcon, 
  VideoLibrary as VideoLibraryIcon, 
  Code as CodeIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import api from '../../services/api';

const levelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

const languageOptions = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' }
];

const categoryOptions = [
  { value: 'programming', label: 'Lập trình' },
  { value: 'web-development', label: 'Phát triển web' },
  { value: 'mobile-development', label: 'Phát triển di động' },
  { value: 'data-science', label: 'Khoa học dữ liệu' },
  { value: 'machine-learning', label: 'Machine Learning' },
  { value: 'network-security', label: 'Bảo mật mạng' },
  { value: 'devops', label: 'DevOps' }
];

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [validationData, setValidationData] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    category: '',
    language: 'vi',
    duration: '',
    capacity: '',
    price: '',
    requirements: '',
    objectives: '',
    syllabus: '',
    imageUrl: '',
    videoUrl: ''
  });

  const [moduleData, setModuleData] = useState({
    title: '',
    description: '',
    orderIndex: 0,
    duration: 0
  });

  const [modules, setModules] = useState([]);

  const [uploading, setUploading] = useState({
    courseImage: false,
    courseVideo: false,
    moduleImage: false,
    moduleVideo: false,
    lessonVideo: false,
    testKey: false
  });

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/courses/${courseId}`);
        setCourseData(response.data);
        
        // Fetch course modules
        const modulesResponse = await api.get(`/courses/${courseId}/modules`);
        setModules(modulesResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching course data');
        showNotification('Failed to load course data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, showNotification]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  const handleModuleChange = (e) => {
    const { name, value } = e.target;
    setModuleData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/courses/${courseId}`, courseData);
      showNotification('Course updated successfully', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating course');
      showNotification('Failed to update course', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModuleDialog = (module = null) => {
    if (module) {
      setModuleData(module);
      setSelectedModule(module);
    } else {
      setModuleData({
        title: '',
        description: '',
        orderIndex: modules.length,
        duration: 0
      });
      setSelectedModule(null);
    }
    setDialogOpen(true);
  };

  const closeModuleDialog = () => {
    setDialogOpen(false);
    setModuleData({
      title: '',
      description: '',
      orderIndex: 0,
      duration: 0
    });
  };

  const handleModuleSubmit = async () => {
    try {
      if (selectedModule) {
        // Update existing module
        await api.put(`/courses/${courseId}/modules/${selectedModule.ModuleID}`, moduleData);
        showNotification('Module updated successfully', 'success');
      } else {
        // Create new module
        await api.post(`/courses/${courseId}/modules`, moduleData);
        showNotification('Module created successfully', 'success');
      }
      
      // Refresh modules list
      const modulesResponse = await api.get(`/courses/${courseId}/modules`);
      setModules(modulesResponse.data);
      closeModuleDialog();
    } catch (err) {
      showNotification('Error saving module', 'error');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        await api.delete(`/courses/${courseId}/modules/${moduleId}`);
        
        // Update modules list
        setModules(modules.filter(m => m.ModuleID !== moduleId));
        showNotification('Module deleted successfully', 'success');
      } catch (err) {
        showNotification('Error deleting module', 'error');
      }
    }
  };

  const handleAddModule = () => {
    openModuleDialog();
  };

  const handleMoveModuleUp = (index) => {
    // Implement the logic to move a module up
  };

  const handleMoveModuleDown = (index) => {
    // Implement the logic to move a module down
  };

  const handleEditModule = (module) => {
    openModuleDialog(module);
  };

  const handleAddLesson = (moduleId) => {
    // Implement the logic to add a lesson to a module
  };

  const handleEditLesson = (lesson, moduleId) => {
    // Implement the logic to edit a lesson
  };

  const handleDeleteLesson = (lessonId) => {
    // Implement the logic to delete a lesson
  };

  // Xử lý upload hình ảnh khóa học
  const handleCourseImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Chỉ chấp nhận các file hình ảnh: JPG, PNG, GIF, WEBP', 'error');
      return;
    }

    try {
      setUploading({ ...uploading, courseImage: true });
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post(`/courses/${courseId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCourseData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
      showNotification('Upload hình ảnh khóa học thành công', 'success');
    } catch (error) {
      console.error('Error uploading course image:', error);
      showNotification('Lỗi khi upload hình ảnh', 'error');
    } finally {
      setUploading({ ...uploading, courseImage: false });
    }
  };

  // Xử lý upload video khóa học
  const handleCourseVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Chỉ chấp nhận các file video: MP4, WEBM, MOV, AVI', 'error');
      return;
    }

    try {
      setUploading({ ...uploading, courseVideo: true });
      
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await api.post(`/courses/${courseId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCourseData(prev => ({ ...prev, videoUrl: response.data.videoUrl }));
      showNotification('Upload video khóa học thành công', 'success');
    } catch (error) {
      console.error('Error uploading course video:', error);
      showNotification('Lỗi khi upload video', 'error');
    } finally {
      setUploading({ ...uploading, courseVideo: false });
    }
  };

  // Xử lý upload hình ảnh module
  const handleModuleImageUpload = async (e, moduleId) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Chỉ chấp nhận các file hình ảnh: JPG, PNG, GIF, WEBP', 'error');
      return;
    }

    try {
      setUploading({ ...uploading, moduleImage: true });
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post(`/courses/${courseId}/modules/${moduleId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Cập nhật lại danh sách modules
      const updatedModules = modules.map(module => 
        module.ModuleID === moduleId 
          ? { ...module, ImageUrl: response.data.imageUrl } 
          : module
      );
      setModules(updatedModules);
      
      showNotification('Upload hình ảnh module thành công', 'success');
    } catch (error) {
      console.error('Error uploading module image:', error);
      showNotification('Lỗi khi upload hình ảnh module', 'error');
    } finally {
      setUploading({ ...uploading, moduleImage: false });
    }
  };

  // Xử lý upload video module
  const handleModuleVideoUpload = async (e, moduleId) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Chỉ chấp nhận các file video: MP4, WEBM, MOV, AVI', 'error');
      return;
    }

    try {
      setUploading({ ...uploading, moduleVideo: true });
      
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await api.post(`/courses/${courseId}/modules/${moduleId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Cập nhật lại danh sách modules
      const updatedModules = modules.map(module => 
        module.ModuleID === moduleId 
          ? { ...module, VideoUrl: response.data.videoUrl } 
          : module
      );
      setModules(updatedModules);
      
      showNotification('Upload video module thành công', 'success');
    } catch (error) {
      console.error('Error uploading module video:', error);
      showNotification('Lỗi khi upload video module', 'error');
    } finally {
      setUploading({ ...uploading, moduleVideo: false });
    }
  };

  // Xử lý upload video bài học
  const handleLessonVideoUpload = async (e, moduleId, lessonId) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Chỉ chấp nhận các file video: MP4, WEBM, MOV, AVI', 'error');
      return;
    }

    try {
      setUploading({ ...uploading, lessonVideo: true });
      
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await api.post(
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/video`, 
        formData, 
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      // Cập nhật lại danh sách lessons trong module
      const updatedModules = modules.map(module => {
        if (module.ModuleID === moduleId) {
          const updatedLessons = module.lessons.map(lesson => 
            lesson.LessonID === lessonId 
              ? { ...lesson, VideoUrl: response.data.videoUrl, Type: 'video' } 
              : lesson
          );
          return { ...module, lessons: updatedLessons };
        }
        return module;
      });
      
      setModules(updatedModules);
      showNotification('Upload video bài học thành công', 'success');
    } catch (error) {
      console.error('Error uploading lesson video:', error);
      showNotification('Lỗi khi upload video bài học', 'error');
    } finally {
      setUploading({ ...uploading, lessonVideo: false });
    }
  };

  // Xử lý upload file test key
  const handleTestKeyUpload = async (e, moduleId, lessonId) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading({ ...uploading, testKey: true });
      
      const formData = new FormData();
      formData.append('testkey', file);
      
      const response = await api.post(
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/testkey`, 
        formData, 
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      // Cập nhật lại danh sách lessons trong module
      const updatedModules = modules.map(module => {
        if (module.ModuleID === moduleId) {
          const updatedLessons = module.lessons.map(lesson => 
            lesson.LessonID === lessonId 
              ? { ...lesson, Type: 'coding' } 
              : lesson
          );
          return { ...module, lessons: updatedLessons };
        }
        return module;
      });
      
      setModules(updatedModules);
      showNotification('Upload file test thành công', 'success');
    } catch (error) {
      console.error('Error uploading test key:', error);
      showNotification('Lỗi khi upload file test', 'error');
    } finally {
      setUploading({ ...uploading, testKey: false });
    }
  };

  // Validate course content (check for missing videos, testkeys, etc.)
  const validateCourse = async () => {
    try {
      setValidationLoading(true);
      const response = await api.get(`/courses/${courseId}/validation`);
      setValidationData(response.data);
      
      if (response.data.isValid) {
        showNotification('Khóa học đã sẵn sàng để đăng tải', 'success');
      } else {
        showNotification('Khóa học còn thiếu nội dung', 'warning');
      }
    } catch (error) {
      console.error('Error validating course:', error);
      showNotification('Lỗi khi kiểm tra nội dung khóa học', 'error');
    } finally {
      setValidationLoading(false);
    }
  };

  // Đánh dấu bài học là bài xem thử (preview)
  const handleTogglePreviewLesson = async (lessonId, currentPreviewStatus) => {
    try {
      await api.put(`/courses/lessons/${lessonId}/preview`, {
        isPreview: !currentPreviewStatus
      });
      
      // Cập nhật UI
      const updatedModules = modules.map(module => {
        const updatedLessons = module.lessons ? module.lessons.map(lesson => 
          lesson.LessonID === lessonId 
            ? { ...lesson, IsPreview: !currentPreviewStatus } 
            : lesson
        ) : [];
        
        return {
          ...module,
          lessons: updatedLessons
        };
      });
      
      setModules(updatedModules);
      
      showNotification(
        !currentPreviewStatus 
          ? 'Đã đánh dấu bài học là bài xem thử' 
          : 'Đã xóa bài học khỏi danh sách xem thử', 
        'success'
      );
    } catch (error) {
      console.error('Error updating lesson preview status:', error);
      showNotification('Lỗi khi cập nhật trạng thái xem thử cho bài học', 'error');
    }
  };

  // Publish course
  const handlePublishCourse = async () => {
    if (!validationData || !validationData.isValid) {
      validateCourse();
      return;
    }
    
    try {
      setLoading(true);
      await api.post(`/courses/${courseId}/publish`);
      
      setCourseData(prev => ({
        ...prev,
        IsPublished: true,
        Status: 'published',
        PublishedAt: new Date()
      }));
      
      showNotification('Khóa học đã được đăng tải thành công', 'success');
    } catch (error) {
      console.error('Error publishing course:', error);
      
      if (error.response && error.response.status === 400) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Lỗi khi đăng tải khóa học', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Preview course
  const handlePreviewCourse = () => {
    setPreviewDialogOpen(true);
    // Redirect đến trang preview trong iframe
    // URL sẽ là: /courses/${courseId}/preview
  };

  // Close preview dialog
  const handleClosePreviewDialog = () => {
    setPreviewDialogOpen(false);
  };

  const getMissingContentForModule = (moduleId) => {
    if (!validationData) return [];
    
    return validationData.details.lessonsWithMissingContent.filter(
      item => item.moduleId === moduleId
    );
  };

  const getMissingContentForLesson = (lessonId) => {
    if (!validationData) return null;
    
    return validationData.details.lessonsWithMissingContent.find(
      item => item.lessonId === lessonId
    );
  };

  if (loading && !courseData.title) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/dashboard" color="inherit">
          Dashboard
        </MuiLink>
        <MuiLink component={Link} to="/courses" color="inherit">
          Courses
        </MuiLink>
        <Typography color="text.primary">Edit Course</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Edit Course: {courseData.title}</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PreviewIcon />}
            onClick={handlePreviewCourse}
          >
            Xem thử
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<VisibilityIcon />}
            onClick={validateCourse}
            disabled={validationLoading}
          >
            {validationLoading ? <CircularProgress size={24} /> : 'Kiểm tra nội dung'}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handlePublishCourse}
            disabled={loading || (validationData && !validationData.isValid)}
          >
            {loading ? <CircularProgress size={24} /> : 'Đăng tải'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {validationData && !validationData.isValid && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Khóa học không thể đăng tải vì còn thiếu:</Typography>
          <ul>
            {!validationData.details.courseHasVideo && (
              <li>Video giới thiệu khóa học</li>
            )}
            {!validationData.details.courseHasImage && (
              <li>Hình ảnh đại diện khóa học</li>
            )}
            {!validationData.details.hasSufficientModules && (
              <li>Các module có nội dung</li>
            )}
            {validationData.details.lessonsWithMissingContent.filter(item => item.issue === 'Missing video').length > 0 && (
              <li>Video cho {validationData.details.lessonsWithMissingContent.filter(item => item.issue === 'Missing video').length} bài học</li>
            )}
            {validationData.details.lessonsWithMissingContent.filter(item => item.issue === 'Coding lesson missing test cases').length > 0 && (
              <li>File testkey cho {validationData.details.lessonsWithMissingContent.filter(item => item.issue === 'Coding lesson missing test cases').length} bài tập coding</li>
            )}
          </ul>
        </Alert>
      )}
      
      {validationData && validationData.isValid && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Khóa học đã sẵn sàng để đăng tải!
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Basic Information" />
          <Tab label="Modules" />
          <Tab label="Media" />
          <Tab label="Preview" icon={<Badge color="info" badgeContent={modules.reduce((count, module) => count + (module.lessons ? module.lessons.filter(l => l.IsPreview).length : 0), 0)} showZero><PreviewIcon /></Badge>} iconPosition="end" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Title"
                    name="title"
                    value={courseData.title || ''}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={courseData.description || ''}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Level</InputLabel>
                    <Select
                      name="level"
                      value={courseData.level || 'beginner'}
                      onChange={handleChange}
                      label="Level"
                    >
                      {levelOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={courseData.category || ''}
                      onChange={handleChange}
                      label="Category"
                    >
                      {categoryOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      name="language"
                      value={courseData.language || 'vi'}
                      onChange={handleChange}
                      label="Language"
                    >
                      {languageOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Duration (hours)"
                    name="duration"
                    type="number"
                    value={courseData.duration || ''}
                    onChange={handleChange}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Capacity"
                    name="capacity"
                    type="number"
                    value={courseData.capacity || ''}
                    onChange={handleChange}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Price"
                    name="price"
                    type="number"
                    value={courseData.price || ''}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Requirements"
                    name="requirements"
                    value={courseData.requirements || ''}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Objectives"
                    name="objectives"
                    value={courseData.objectives || ''}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Syllabus"
                    name="syllabus"
                    value={courseData.syllabus || ''}
                    onChange={handleChange}
                    multiline
                    rows={4}
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    sx={{ mr: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    component={Link}
                    to="/courses"
                  >
                    Cancel
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}

          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Nội dung khóa học</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={handleAddModule}
                >
                  Thêm module
                </Button>
              </Box>
              
              {modules.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Khóa học này chưa có module nào. Hãy tạo module đầu tiên để bắt đầu xây dựng nội dung.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddModule}
                  >
                    Tạo module đầu tiên
                  </Button>
                </Paper>
              ) : (
                <Box sx={{ mb: 4 }}>
                  <List>
                    {modules.map((module, index) => (
                      <Accordion key={module.ModuleID || index} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Typography sx={{ width: '5%', flexShrink: 0, fontWeight: 'bold' }}>
                              {index + 1}
                            </Typography>
                            <Typography sx={{ width: '60%' }}>
                              {module.Title}
                              {validationData && getMissingContentForModule(module.ModuleID).length > 0 && (
                                <Tooltip title={`Module còn ${getMissingContentForModule(module.ModuleID).length} bài thiếu nội dung`}>
                                  <WarningIcon fontSize="small" color="warning" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Typography>
                            <Box sx={{ ml: 'auto', display: 'flex' }}>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveModuleUp(index);
                                }}
                                disabled={index === 0}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveModuleDown(index);
                                }}
                                disabled={index === modules.length - 1}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditModule(module);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteModule(module.ModuleID);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {module.Description}
                            </Typography>
                          </Box>
                          
                          {/* Thêm phần upload media cho module */}
                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<CloudUploadIcon />}
                              disabled={uploading.moduleImage}
                            >
                              {uploading.moduleImage ? (
                                <CircularProgress size={24} />
                              ) : (
                                'Upload hình ảnh'
                              )}
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => handleModuleImageUpload(e, module.ModuleID)}
                              />
                            </Button>
                            
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<VideoLibraryIcon />}
                              disabled={uploading.moduleVideo}
                            >
                              {uploading.moduleVideo ? (
                                <CircularProgress size={24} />
                              ) : (
                                'Upload video'
                              )}
                              <input
                                type="file"
                                hidden
                                accept="video/*"
                                onChange={(e) => handleModuleVideoUpload(e, module.ModuleID)}
                              />
                            </Button>
                          </Box>
                          
                          {/* Hiển thị media đã upload */}
                          {(module.ImageUrl || module.VideoUrl) && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Media đã tải lên:
                              </Typography>
                              <Grid container spacing={2}>
                                {module.ImageUrl && (
                                  <Grid item xs={12} sm={6} md={4}>
                                    <img 
                                      src={module.ImageUrl} 
                                      alt={module.Title} 
                                      style={{ width: '100%', borderRadius: 4 }}
                                    />
                                    <Typography variant="caption">Hình ảnh module</Typography>
                                  </Grid>
                                )}
                                {module.VideoUrl && (
                                  <Grid item xs={12} sm={6} md={4}>
                                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                                      <iframe
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 4 }}
                                        src={module.VideoUrl}
                                        title={module.Title}
                                        frameBorder="0"
                                        allowFullScreen
                                      />
                                    </Box>
                                    <Typography variant="caption">Video module</Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          )}
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1">Bài học</Typography>
                            <Button 
                              size="small" 
                              startIcon={<AddIcon />}
                              onClick={() => handleAddLesson(module.ModuleID)}
                            >
                              Thêm bài học
                            </Button>
                          </Box>
                          
                          {module.lessons && module.lessons.length > 0 ? (
                            <List>
                              {module.lessons.map((lesson, lessonIndex) => {
                                const missingContent = getMissingContentForLesson(lesson.LessonID);
                                return (
                                  <Card key={lesson.LessonID || lessonIndex} variant="outlined" sx={{ mb: 1, border: missingContent ? '1px solid #f44336' : undefined }}>
                                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                          <Typography variant="body2" sx={{ width: '30px', fontWeight: 'bold' }}>
                                            {lessonIndex + 1}.
                                          </Typography>
                                          <Typography variant="body2">
                                            {lesson.Title}
                                          </Typography>
                                          {lesson.Type && (
                                            <Chip 
                                              label={lesson.Type} 
                                              size="small" 
                                              sx={{ ml: 1 }}
                                              color={
                                                lesson.Type === 'video' ? 'primary' : 
                                                lesson.Type === 'quiz' ? 'secondary' : 
                                                lesson.Type === 'coding' ? 'success' :
                                                'default'
                                              }
                                            />
                                          )}
                                          {lesson.IsPreview && (
                                            <Chip 
                                              label="Preview" 
                                              size="small" 
                                              color="info"
                                              sx={{ ml: 1 }}
                                            />
                                          )}
                                          {missingContent && (
                                            <Tooltip title={missingContent.issue}>
                                              <Chip 
                                                icon={<WarningIcon />} 
                                                label="Thiếu nội dung" 
                                                size="small" 
                                                color="error"
                                                sx={{ ml: 1 }}
                                              />
                                            </Tooltip>
                                          )}
                                        </Box>
                                        
                                        {/* Thêm phần upload cho bài học */}
                                        <Box sx={{ display: 'flex', mr: 1 }}>
                                          <IconButton 
                                            component="label" 
                                            color="primary" 
                                            size="small"
                                            disabled={uploading.lessonVideo}
                                          >
                                            {uploading.lessonVideo ? (
                                              <CircularProgress size={20} />
                                            ) : (
                                              <VideoLibraryIcon fontSize="small" color={!lesson.VideoUrl ? "error" : undefined} />
                                            )}
                                            <input
                                              type="file"
                                              hidden
                                              accept="video/*"
                                              onChange={(e) => handleLessonVideoUpload(e, module.ModuleID, lesson.LessonID)}
                                            />
                                          </IconButton>
                                          
                                          {/* Hiển thị icon lỗi nếu là bài coding nhưng chưa có testkey */}
                                          <IconButton 
                                            component="label" 
                                            color="success" 
                                            size="small"
                                            disabled={uploading.testKey}
                                          >
                                            {uploading.testKey ? (
                                              <CircularProgress size={20} />
                                            ) : (
                                              <CodeIcon 
                                                fontSize="small" 
                                                color={(lesson.Type === 'coding' && missingContent && missingContent.issue.includes('test cases')) ? "error" : undefined} 
                                              />
                                            )}
                                            <input
                                              type="file"
                                              hidden
                                              onChange={(e) => handleTestKeyUpload(e, module.ModuleID, lesson.LessonID)}
                                            />
                                          </IconButton>
                                          
                                          {/* Thêm nút toggle preview */}
                                          <Tooltip title={lesson.IsPreview ? "Xóa khỏi danh sách xem thử" : "Thêm vào danh sách xem thử"}>
                                            <IconButton
                                              size="small"
                                              color={lesson.IsPreview ? "info" : "default"}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleTogglePreviewLesson(lesson.LessonID, lesson.IsPreview);
                                              }}
                                              disabled={missingContent !== null}
                                            >
                                              <PreviewIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                        
                                        <Box>
                                          <IconButton size="small" onClick={() => handleEditLesson(lesson, module.ModuleID)}>
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton size="small" color="error" onClick={() => handleDeleteLesson(lesson.LessonID)}>
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                      
                                      {/* Hiển thị video nếu có */}
                                      {lesson.VideoUrl && (
                                        <Box sx={{ mt: 1 }}>
                                          <Box sx={{ position: 'relative', paddingTop: '56.25%', maxWidth: '300px' }}>
                                            <iframe
                                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 4 }}
                                              src={lesson.VideoUrl}
                                              title={lesson.Title}
                                              frameBorder="0"
                                              allowFullScreen
                                            />
                                          </Box>
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </List>
                          ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Chưa có bài học nào trong module này
                              </Typography>
                              <Button 
                                size="small" 
                                sx={{ mt: 1 }}
                                onClick={() => handleAddLesson(module.ModuleID)}
                              >
                                Thêm bài học đầu tiên
                              </Button>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Hình ảnh & Video khóa học
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Hình ảnh khóa học
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        disabled={uploading.courseImage}
                        fullWidth
                      >
                        {uploading.courseImage ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Upload hình ảnh đại diện'
                        )}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleCourseImageUpload}
                        />
                      </Button>
                    </Box>
                    
                    {courseData.imageUrl && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <img 
                          src={courseData.imageUrl} 
                          alt={courseData.title} 
                          style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 8 }}
                        />
                      </Box>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Video giới thiệu khóa học
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<VideoLibraryIcon />}
                        disabled={uploading.courseVideo}
                        fullWidth
                      >
                        {uploading.courseVideo ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Upload video giới thiệu'
                        )}
                        <input
                          type="file"
                          hidden
                          accept="video/*"
                          onChange={handleCourseVideoUpload}
                        />
                      </Button>
                    </Box>
                    
                    {courseData.videoUrl && (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                          <iframe
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 8 }}
                            src={courseData.videoUrl}
                            title={courseData.title}
                            frameBorder="0"
                            allowFullScreen
                          />
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Bài học xem thử (Preview)
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Đánh dấu các bài học cho phép xem thử để học viên có thể xem trước khi đăng ký khóa học.
                Mỗi module nên có ít nhất một bài học xem thử.
              </Alert>
              
              <Box sx={{ mb: 3 }}>
                {modules.map((module, moduleIndex) => (
                  <Accordion key={module.ModuleID || moduleIndex} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {moduleIndex + 1}. {module.Title}
                        {module.lessons && (
                          <Chip 
                            label={`${module.lessons.filter(l => l.IsPreview).length} / ${module.lessons.length} bài xem thử`} 
                            size="small" 
                            color={module.lessons.some(l => l.IsPreview) ? "success" : "default"}
                            sx={{ ml: 2 }}
                          />
                        )}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List sx={{ width: '100%' }}>
                        {module.lessons && module.lessons.map((lesson, lessonIndex) => {
                          const missingContent = getMissingContentForLesson(lesson.LessonID);
                          return (
                            <ListItem 
                              key={lesson.LessonID || lessonIndex}
                              secondaryAction={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {missingContent ? (
                                    <Tooltip title={`Thiếu: ${missingContent.issue}`}>
                                      <ErrorIcon color="error" />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title="Bài học đầy đủ nội dung">
                                      <CheckCircleIcon color="success" />
                                    </Tooltip>
                                  )}
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={lesson.IsPreview === true}
                                        onChange={() => handleTogglePreviewLesson(lesson.LessonID, lesson.IsPreview)}
                                        disabled={!!missingContent}
                                      />
                                    }
                                    label="Xem thử"
                                  />
                                </Stack>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body1">
                                      {lessonIndex + 1}. {lesson.Title}
                                    </Typography>
                                    {lesson.Type && (
                                      <Chip 
                                        label={lesson.Type} 
                                        size="small" 
                                        sx={{ ml: 1 }}
                                        color={
                                          lesson.Type === 'video' ? 'primary' : 
                                          lesson.Type === 'quiz' ? 'secondary' :
                                          lesson.Type === 'coding' ? 'success' :
                                          'default'
                                        }
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  missingContent ? (
                                    <Typography variant="caption" color="error">
                                      {missingContent.issue}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      {lesson.IsPreview ? 'Học viên có thể xem thử bài học này' : 'Chỉ học viên đã đăng ký mới xem được'}
                                    </Typography>
                                  )
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Module Dialog */}
      <Dialog open={dialogOpen} onClose={closeModuleDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={moduleData.title}
                onChange={handleModuleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={moduleData.description}
                onChange={handleModuleChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Order"
                name="orderIndex"
                type="number"
                value={moduleData.orderIndex}
                onChange={handleModuleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (hours)"
                name="duration"
                type="number"
                value={moduleData.duration}
                onChange={handleModuleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModuleDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleModuleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={handleClosePreviewDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Xem thử khóa học</Typography>
            <Button onClick={handleClosePreviewDialog}>Đóng</Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '80vh' }}>
          <iframe 
            src={`/courses/${courseId}/preview`} 
            style={{ border: 'none', width: '100%', height: '100%' }}
            title="Course Preview"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EditCourse; 