/*-----------------------------------------------------------------
* File: CreateCourse.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Alert,
  List,
  CircularProgress,
  Divider,
  Tooltip,
  Chip
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  CloudUpload as CloudUploadIcon,
  VideoLibrary as VideoLibraryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

// Các tùy chọn cho dropdown
const levelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const categoryOptions = [
  { value: 'programming', label: 'Programming' },
  { value: 'web_development', label: 'Web Development' },
  { value: 'mobile_development', label: 'Mobile Development' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'machine_learning', label: 'Machine Learning' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' }
];

const languageOptions = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
];

// Module mẫu
const defaultModules = [
  { 
    title: 'Giới thiệu về khóa học', 
    description: 'Tổng quan và mục tiêu của khóa học',
    videoUrl: '',
    image: null,
    imagePreview: null
  },
  { 
    title: 'Cài đặt và chuẩn bị môi trường', 
    description: 'Hướng dẫn cài đặt các công cụ cần thiết',
    videoUrl: '',
    image: null,
    imagePreview: null
  },
  { 
    title: 'Kiến thức cơ bản', 
    description: 'Các kiến thức nền tảng cần thiết',
    videoUrl: '',
    image: null,
    imagePreview: null
  },
  { 
    title: 'Bài tập thực hành', 
    description: 'Áp dụng kiến thức vào thực tế',
    videoUrl: '',
    image: null,
    imagePreview: null
  },
  { 
    title: 'Tổng kết và đánh giá', 
    description: 'Nhìn lại những gì đã học và hướng phát triển tiếp theo',
    videoUrl: '',
    image: null,
    imagePreview: null
  }
];

// Add a function to generate slug from title
const generateSlug = (text) => {
  if (!text) return 'course-' + Date.now();
  
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/[^\w\-]+/g, '') // Remove non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple dashes with single dash
    .substring(0, 250); // Ensure slug fits in VARCHAR(255)
};

const CreateCourse = () => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    category: 'programming',
    language: 'vi',
    duration: '',
    capacity: '',
    price: '',
    requirements: [],
    objectives: [],
    syllabus: ''
  });
  
  const [modules, setModules] = useState([
    { 
      title: '', 
      description: '',
      videoUrl: '',
      image: null,
      imagePreview: null 
    }
  ]);
  
  const [courseImage, setCourseImage] = useState(null);
  const [courseVideo, setCourseVideo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  
  const [requirementInput, setRequirementInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý thay đổi thông tin module
  const handleModuleChange = (index, field, value) => {
    const updatedModules = [...modules];
    updatedModules[index][field] = value;
    setModules(updatedModules);
  };

  // Thêm module mới
  const handleAddModule = () => {
    setModules([...modules, { 
      title: '', 
      description: '',
      videoUrl: '',
      image: null,
      imagePreview: null 
    }]);
  };

  // Xóa module
  const handleRemoveModule = (index) => {
    const updatedModules = [...modules];
    updatedModules.splice(index, 1);
    setModules(updatedModules);
  };

  // Di chuyển module lên
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updatedModules = [...modules];
    const temp = updatedModules[index];
    updatedModules[index] = updatedModules[index - 1];
    updatedModules[index - 1] = temp;
    setModules(updatedModules);
  };

  // Di chuyển module xuống
  const handleMoveDown = (index) => {
    if (index === modules.length - 1) return;
    const updatedModules = [...modules];
    const temp = updatedModules[index];
    updatedModules[index] = updatedModules[index + 1];
    updatedModules[index + 1] = temp;
    setModules(updatedModules);
  };

  // Sử dụng template module mặc định
  const handleUseDefaultModules = () => {
    setModules([...defaultModules]);
  };
  
  // Xử lý upload hình ảnh khóa học
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('Chỉ chấp nhận file hình ảnh: jpg, png, gif, webp', 'error');
      return;
    }
    
    setCourseImage(file);
    
    // Tạo preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Xóa lỗi nếu có
    setValidationErrors(prev => ({ ...prev, image: false }));
  };
  
  // Xử lý upload video khóa học
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Kiểm tra định dạng file
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('Chỉ chấp nhận file video: mp4, webm, mov, avi', 'error');
      return;
    }
    
    setCourseVideo(file);
    
    // Tạo preview URL
    const videoURL = URL.createObjectURL(file);
    setVideoPreview(videoURL);
    
    // Xóa lỗi nếu có
    setValidationErrors(prev => ({ ...prev, video: false }));
  };
  
  // Thêm yêu cầu khóa học
  const handleAddRequirement = () => {
    if (!requirementInput.trim()) return;
    setCourseData(prev => ({
      ...prev,
      requirements: [...prev.requirements, requirementInput.trim()]
    }));
    setRequirementInput('');
  };
  
  // Xóa yêu cầu khóa học
  const handleRemoveRequirement = (index) => {
    setCourseData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };
  
  // Thêm mục tiêu khóa học
  const handleAddObjective = () => {
    if (!objectiveInput.trim()) return;
    setCourseData(prev => ({
      ...prev,
      objectives: [...prev.objectives, objectiveInput.trim()]
    }));
    setObjectiveInput('');
  };
  
  // Xóa mục tiêu khóa học
  const handleRemoveObjective = (index) => {
    setCourseData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  // Xử lý thay đổi link video cho module
  const handleModuleVideoUrlChange = (index, e) => {
    const updatedModules = [...modules];
    updatedModules[index].videoUrl = e.target.value;
    setModules(updatedModules);
    
    // Xóa lỗi nếu có
    if (e.target.value) {
      const updatedErrors = {...validationErrors};
      delete updatedErrors[`module_${index}_media`];
      setValidationErrors(updatedErrors);
    }
  };
  
  // Xử lý upload hình ảnh cho module
  const handleModuleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('Chỉ chấp nhận file hình ảnh: jpg, png, gif, webp', 'error');
      return;
    }
    
    const updatedModules = [...modules];
    updatedModules[index].image = file;
    
    // Tạo preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updatedModules[index].imagePreview = reader.result;
      setModules([...updatedModules]);
    };
    reader.readAsDataURL(file);
    
    // Xóa lỗi nếu có
    const updatedErrors = {...validationErrors};
    delete updatedErrors[`module_${index}_media`];
    setValidationErrors(updatedErrors);
  };

  // Xác thực dữ liệu
  const validateData = () => {
    const errors = {};
    
    // Kiểm tra thông tin cơ bản
    if (!courseData.title) errors.title = true;
    if (!courseData.description) errors.description = true;
    if (!courseData.duration) errors.duration = true;
    if (!courseData.price) errors.price = true;
    
    // Kiểm tra ảnh và video cho khóa học
    if (!courseImage) errors.image = true;
    if (!courseVideo) errors.video = true;
    
    // Kiểm tra modules
    if (modules.length === 0) {
      errors.modules = 'Khóa học cần ít nhất một module';
    } else {
      // Kiểm tra từng module có tiêu đề không
      const invalidModules = modules.filter(m => !m.title.trim());
      if (invalidModules.length > 0) {
        errors.modules = 'Một số module chưa có tiêu đề';
      }
      
      // Kiểm tra module có ít nhất một loại media (video URL HOẶC hình ảnh)
      const modulesWithoutMedia = modules.filter(m => !m.videoUrl && !m.image);
      if (modulesWithoutMedia.length > 0) {
        if (!errors.modules) {
          errors.modules = 'Một số module chưa có link video bài giảng hoặc hình ảnh';
        }
        
        // Đánh dấu các module thiếu media
        modules.forEach((module, index) => {
          if (!module.videoUrl && !module.image) {
            errors[`module_${index}_media`] = true;
          }
        });
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra dữ liệu
    if (!validateData()) {
      addNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Generate slug from title with timestamp to ensure uniqueness
      const timestamp = new Date().getTime().toString().slice(-6);
      const uniqueSlug = generateSlug(courseData.title) + '-' + timestamp;
      
      // Tạo khóa học
      const formData = {
        ...courseData,
        requirements: courseData.requirements.join('||'),
        objectives: courseData.objectives.join('||'),
        slug: uniqueSlug
      };
      
      console.log('Sending course data with slug:', formData.slug);
      
      const response = await api.post('/courses', formData);
      const courseId = response.data.courseId;
      
      // Upload hình ảnh
      if (courseImage) {
        const imageFormData = new FormData();
        imageFormData.append('image', courseImage);
        await api.post(`/courses/${courseId}/image`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Upload video
      if (courseVideo) {
        const videoFormData = new FormData();
        videoFormData.append('video', courseVideo);
        await api.post(`/courses/${courseId}/video`, videoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Tạo các module cho khóa học
      if (modules.length > 0) {
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          if (module.title) {
            const moduleResponse = await api.post(`/courses/${courseId}/modules`, {
              title: module.title,
              description: module.description,
              orderIndex: i + 1
            });
            
            const moduleId = moduleResponse.data.moduleId;
            
            // Lưu link video cho module nếu có
            if (module.videoUrl) {
              await api.post(`/modules/${moduleId}/video-url`, {
                videoUrl: module.videoUrl
              });
            }
            
            // Upload hình ảnh cho module nếu có
            if (module.image) {
              const imageFormData = new FormData();
              imageFormData.append('image', module.image);
              await api.post(`/modules/${moduleId}/image`, imageFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            }
          }
        }
      }
      
      addNotification('Khóa học đã được tạo thành công', 'success');
      navigate(`/courses/edit/${courseId}`);
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err.response?.data?.message || 'Lỗi khi tạo khóa học');
      addNotification('Không thể tạo khóa học', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/dashboard" color="inherit">
          Dashboard
        </MuiLink>
        <MuiLink component={Link} to="/courses" color="inherit">
          Courses
        </MuiLink>
        <Typography color="text.primary">Create Course</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 3 }}>Tạo khóa học mới</Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          <strong>Lưu ý:</strong> Để đăng tải khóa học, bạn cần đảm bảo các yêu cầu sau:
        </Typography>
        <ul>
          <li>Có hình ảnh đại diện và video giới thiệu khóa học</li>
          <li>Mỗi bài học (lesson) sẽ cần có video bài giảng hoặc hình ảnh riêng biệt</li>
          <li>Các bài tập coding sẽ cần có file testkey đi kèm</li>
          <li>Đánh dấu các bài học cho phép xem thử để học viên có thể xem trước</li>
        </ul>
        <Typography variant="body2">
          Bạn có thể tạo khóa học trước, sau đó thêm các video, hình ảnh và testkey cho từng bài học ở màn hình chỉnh sửa.
        </Typography>
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Thông tin cơ bản</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tên khóa học"
              name="title"
              value={courseData.title}
              onChange={handleChange}
              required
              error={validationErrors.title}
              helperText={validationErrors.title ? "Tên khóa học là bắt buộc" : ""}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả"
              name="description"
              value={courseData.description}
              onChange={handleChange}
              multiline
              rows={4}
              required
              error={validationErrors.description}
              helperText={validationErrors.description ? "Mô tả khóa học là bắt buộc" : ""}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Cấp độ</InputLabel>
              <Select
                name="level"
                value={courseData.level}
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
              <InputLabel>Danh mục</InputLabel>
              <Select
                name="category"
                value={courseData.category}
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
              <InputLabel>Ngôn ngữ</InputLabel>
              <Select
                name="language"
                value={courseData.language}
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
              label="Thời lượng (giờ)"
              name="duration"
              type="number"
              value={courseData.duration}
              onChange={handleChange}
              inputProps={{ min: 1 }}
              required
              error={validationErrors.duration}
              helperText={validationErrors.duration ? "Thời lượng khóa học là bắt buộc" : ""}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Sức chứa"
              name="capacity"
              type="number"
              value={courseData.capacity}
              onChange={handleChange}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Giá khóa học"
              name="price"
              type="number"
              value={courseData.price}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              required
              error={validationErrors.price}
              helperText={validationErrors.price ? "Giá khóa học là bắt buộc" : ""}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Media section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Hình ảnh và Video</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Hình ảnh đại diện và video giới thiệu khóa học là bắt buộc để đăng tải khóa học.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ border: 1, borderColor: validationErrors.image ? 'error.main' : 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Hình ảnh đại diện
                {validationErrors.image && (
                  <Chip 
                    label="Bắt buộc" 
                    size="small" 
                    color="error"
                    icon={<WarningIcon />}
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                >
                  Tải lên hình ảnh
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              </Box>
              
              {imagePreview && (
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 200, 
                    backgroundImage: `url(${imagePreview})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }}
                />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ border: 1, borderColor: validationErrors.video ? 'error.main' : 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Video giới thiệu
                {validationErrors.video && (
                  <Chip 
                    label="Bắt buộc" 
                    size="small" 
                    color="error"
                    icon={<WarningIcon />}
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<VideoLibraryIcon />}
                >
                  Tải lên video
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={handleVideoUpload}
                  />
                </Button>
              </Box>
              
              {videoPreview && (
                <Box sx={{ width: '100%', borderRadius: 1, overflow: 'hidden' }}>
                  <video 
                    src={videoPreview} 
                    controls 
                    style={{ width: '100%', maxHeight: 200 }}
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Requirements and Objectives */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Yêu cầu và Mục tiêu khóa học</Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Yêu cầu</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Những kiến thức, kỹ năng học viên cần có trước khi tham gia khóa học.
            </Typography>
            
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Thêm yêu cầu mới"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                size="small"
              />
              <Button 
                variant="contained" 
                onClick={handleAddRequirement}
                sx={{ ml: 1 }}
              >
                Thêm
              </Button>
            </Box>
            
            <List sx={{ bgcolor: 'background.paper' }}>
              {courseData.requirements.map((req, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {index + 1}. {req}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleRemoveRequirement(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Mục tiêu</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Những kỹ năng, kiến thức đạt được sau khi hoàn thành khóa học.
            </Typography>
            
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Thêm mục tiêu mới"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddObjective()}
                size="small"
              />
              <Button 
                variant="contained" 
                onClick={handleAddObjective}
                sx={{ ml: 1 }}
              >
                Thêm
              </Button>
            </Box>
            
            <List sx={{ bgcolor: 'background.paper' }}>
              {courseData.objectives.map((obj, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {index + 1}. {obj}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleRemoveObjective(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </List>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Cấu trúc bài học</Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={handleUseDefaultModules}
          >
            Sử dụng template
          </Button>
        </Box>
        
        {validationErrors.modules && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationErrors.modules}
          </Alert>
        )}
        
        <List>
          {modules.map((module, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1">Module {index + 1}</Typography>
                  <Box>
                    <Tooltip title="Di chuyển lên">
                      <IconButton
                        size="small"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Di chuyển xuống">
                      <IconButton
                        size="small"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === modules.length - 1}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa module">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveModule(index)}
                        disabled={modules.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tiêu đề module"
                      value={module.title}
                      onChange={(e) => handleModuleChange(index, 'title', e.target.value)}
                      required
                      error={!module.title && validationErrors.modules}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mô tả"
                      value={module.description}
                      onChange={(e) => handleModuleChange(index, 'description', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Media cho module này
                      {validationErrors[`module_${index}_media`] && (
                        <Chip 
                          label="Bắt buộc" 
                          size="small" 
                          color="error"
                          icon={<WarningIcon />}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                      Mỗi module bắt buộc phải có video bài giảng HOẶC hình ảnh riêng biệt. Bạn có thể chọn một trong hai hoặc cả hai.
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Link video bài giảng"
                          placeholder="Nhập URL video (YouTube, Vimeo, v.v.)"
                          value={module.videoUrl}
                          onChange={(e) => handleModuleVideoUrlChange(index, e)}
                          error={validationErrors[`module_${index}_media`] && !module.videoUrl}
                          helperText={validationErrors[`module_${index}_media`] && !module.videoUrl ? "Cần nhập link video hoặc tải ảnh" : ""}
                          InputProps={{
                            endAdornment: module.videoUrl ? (
                              <Button 
                                size="small" 
                                onClick={() => { 
                                  const updatedModules = [...modules];
                                  updatedModules[index].videoUrl = '';
                                  setModules(updatedModules);
                                }}
                              >
                                Xóa
                              </Button>
                            ) : null
                          }}
                        />
                        {module.videoUrl && (
                          <Box sx={{ mt: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="caption">Preview: {module.videoUrl}</Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          sx={{ height: '100%', minHeight: '40px' }}
                        >
                          Tải lên hình ảnh
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleModuleImageUpload(index, e)}
                          />
                        </Button>
                        {module.imagePreview && (
                          <Box 
                            sx={{ 
                              mt: 1,
                              width: '100%', 
                              height: 150, 
                              backgroundImage: `url(${module.imagePreview})`,
                              backgroundSize: 'contain',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              borderRadius: 1,
                              bgcolor: 'background.default'
                            }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </List>
        
        {modules.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Chưa có module nào. Hãy thêm module đầu tiên.
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={handleAddModule}
          >
            Thêm module
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          component={Link}
          to="/courses"
        >
          Hủy
        </Button>
        
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          size="large"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Tạo khóa học'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateCourse;
