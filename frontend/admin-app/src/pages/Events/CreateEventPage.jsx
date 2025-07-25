/*-----------------------------------------------------------------
* File: CreateEventPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Stepper, Step, StepLabel,
  Button, TextField, MenuItem, FormControl, InputLabel, Select,
  Grid, Card, CardContent, CircularProgress, Divider,
  IconButton, Chip, FormHelperText, Alert, useTheme
} from '@mui/material';
import { DatePicker, TimePicker, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add, Delete, ArrowBack, ArrowForward, Save, AddCircle
} from '@mui/icons-material';
import { createEvent, addEventSchedule, addEventPrize, addEventLanguage, addEventTechnology } from '../../api/events';
import { useNotification } from '../../contexts/NotificationContext';

// Các bước tạo sự kiện
const steps = ['Thông tin sự kiện', 'Chi tiết', 'Lịch trình', 'Xem lại'];

// Danh mục sự kiện
const categories = [
  { value: 'Competitive Programming', label: 'Lập trình thi đấu' },
  { value: 'Hackathon', label: 'Hackathon' },
  { value: 'Web Development', label: 'Phát triển Web' },
  { value: 'AI/ML', label: 'AI/ML' },
  { value: 'Mobile Development', label: 'Phát triển Mobile' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Security', label: 'Bảo mật' }
];

// Cấp độ khó
const difficulties = [
  { value: 'beginner', label: 'Người mới bắt đầu' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'advanced', label: 'Nâng cao' },
  { value: 'expert', label: 'Chuyên gia' }
];

// Ngôn ngữ lập trình
const programmingLanguages = [
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Go', 'Kotlin', 'TypeScript'
];

// Danh sách công nghệ
const technologiesList = [
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
  'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'MongoDB',
  'MySQL', 'PostgreSQL', 'GraphQL', 'REST API', 'WebSocket'
];

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const theme = useTheme();

  // Thông tin cơ bản của sự kiện
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: '',
    eventDate: null,
    eventTime: null,
    location: '',
    imageUrl: '',
    maxAttendees: 100,
    price: 0,
    organizer: '',
    difficulty: 'intermediate',
    languages: [],
    technologies: [],
    status: 'upcoming',
    specialRequirements: null,
    registrationUrl: null
  });

  // Các mục lịch trình
  const [scheduleItems, setScheduleItems] = useState([
    { startTime: null, endTime: null, title: '', description: '', speaker: '' }
  ]);

  // Chi tiết giải thưởng
  const [prizes, setPrizes] = useState([
    { rank: 1, name: 'Giải nhất', description: '', amount: '' }
  ]);

  // Kiểm tra dữ liệu của mỗi bước
  const validateStep = () => {
    switch (activeStep) {
      case 0: // Thông tin sự kiện
        if (!eventData.title || !eventData.category) {
          setError('Vui lòng nhập tiêu đề và chọn danh mục sự kiện');
          return false;
        }
        break;
      case 1: // Chi tiết
        if (!eventData.eventDate || !eventData.eventTime || !eventData.location) {
          setError('Vui lòng nhập ngày, giờ và địa điểm của sự kiện');
          return false;
        }
        break;
      case 2: // Lịch trình
        if (scheduleItems.some(item => !item.title || !item.startTime || !item.endTime)) {
          setError('Vui lòng hoàn thành tất cả các mục lịch trình với tiêu đề, thời gian bắt đầu và kết thúc');
          return false;
        }
        break;
      default:
        break;
    }
    setError(null);
    return true;
  };

  // Xử lý thay đổi dữ liệu sự kiện cơ bản
  const handleEventDataChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  // Xử lý thay đổi ngày và giờ
  const handleDateChange = (newDate) => {
    setEventData({ ...eventData, eventDate: newDate });
  };

  const handleTimeChange = (newTime) => {
    setEventData({ ...eventData, eventTime: newTime });
  };

  // Xử lý multi-select cho ngôn ngữ và công nghệ
  const handleLanguagesChange = (e) => {
    setEventData({ ...eventData, languages: e.target.value });
  };

  const handleTechnologiesChange = (e) => {
    setEventData({ ...eventData, technologies: e.target.value });
  };

  // Xử lý thay đổi mục lịch trình
  const handleScheduleChange = (index, field, value) => {
    const newScheduleItems = [...scheduleItems];
    newScheduleItems[index][field] = value;
    setScheduleItems(newScheduleItems);
  };

  // Thêm mục lịch trình mới
  const addScheduleItem = () => {
    setScheduleItems([
      ...scheduleItems,
      { startTime: null, endTime: null, title: '', description: '', speaker: '' }
    ]);
  };

  // Xóa mục lịch trình
  const removeScheduleItem = (index) => {
    const newScheduleItems = [...scheduleItems];
    newScheduleItems.splice(index, 1);
    setScheduleItems(newScheduleItems);
  };

  // Xử lý thay đổi giải thưởng
  const handlePrizeChange = (index, field, value) => {
    const newPrizes = [...prizes];
    newPrizes[index][field] = value;
    setPrizes(newPrizes);
  };

  // Thêm giải thưởng mới
  const addPrize = () => {
    const newRank = prizes.length + 1;
    let prizeName = '';
    
    switch (newRank) {
      case 2:
        prizeName = 'Giải nhì';
        break;
      case 3:
        prizeName = 'Giải ba';
        break;
      default:
        prizeName = `Giải ${newRank}`;
    }
    
    setPrizes([
      ...prizes,
      { rank: newRank, name: prizeName, description: '', amount: '' }
    ]);
  };

  // Xóa giải thưởng
  const removePrize = (index) => {
    const newPrizes = [...prizes];
    newPrizes.splice(index, 1);
    
    // Cập nhật thứ hạng cho các giải thưởng còn lại
    newPrizes.forEach((prize, idx) => {
      prize.rank = idx + 1;
    });
    
    setPrizes(newPrizes);
  };

  // Xử lý nút tiếp theo
  const handleNext = () => {
    if (!validateStep()) return;
    
    if (activeStep === steps.length - 1) {
      handleSubmitEvent();
    } else {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  // Xử lý nút quay lại
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  // Cập nhật hàm formatTimeForServer để đảm bảo định dạng TIME chính xác cho SQL Server
  const formatTimeForServer = (timeObj) => {
    if (!timeObj || !(timeObj instanceof Date) || isNaN(timeObj)) {
      return null;
    }
    
    try {
      // Format time as HH:mm:ss for SQL Server TIME data type
      const hours = timeObj.getHours().toString().padStart(2, '0');
      const minutes = timeObj.getMinutes().toString().padStart(2, '0');
      const seconds = '00'; // Set seconds to 00 since we don't collect seconds in the UI
      
      return `${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Lỗi định dạng thời gian:', error);
      return null;
    }
  };

  // Gửi dữ liệu sự kiện
  const handleSubmitEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Kiểm tra các trường bắt buộc theo schema
      if (!eventData.title || !eventData.eventDate || !eventData.eventTime) {
        setError('Tiêu đề, ngày và giờ là các trường bắt buộc');
        addNotification('Tiêu đề, ngày và giờ là các trường bắt buộc', 'error');
        return;
      }

      // Validate category theo CHK_Event_Category
      if (!eventData.category) {
        setError('Danh mục sự kiện là bắt buộc');
        addNotification('Danh mục sự kiện là bắt buộc', 'error');
        return;
      }

      const validCategory = categories.find(c => c.value === eventData.category);
      if (!validCategory) {
        setError('Danh mục sự kiện không hợp lệ. Vui lòng chọn từ các tùy chọn có sẵn.');
        addNotification('Danh mục sự kiện không hợp lệ. Vui lòng chọn từ các tùy chọn có sẵn.', 'error');
        return;
      }

      // Format dữ liệu theo đúng schema của bảng Events
      const formattedEventData = {
        title: eventData.title,
        description: eventData.description || null,
        category: eventData.category,
        eventDate: eventData.eventDate ? new Date(eventData.eventDate).toISOString().split('T')[0] : null,
        eventTime: eventData.eventTime ? formatTimeForServer(new Date(eventData.eventTime)) : null,
        location: eventData.location || null,
        imageUrl: eventData.imageUrl || null,
        maxAttendees: parseInt(eventData.maxAttendees) || null,
        currentAttendees: 0,
        price: parseFloat(eventData.price) || 0,
        organizer: eventData.organizer || null,
        difficulty: eventData.difficulty || 'intermediate',
        status: eventData.status || 'upcoming',
        specialRequirements: eventData.specialRequirements || null,
        registrationUrl: eventData.registrationUrl || null
      };

      // Validate difficulty theo CHK_Event_Difficulty
      if (!difficulties.find(d => d.value === formattedEventData.difficulty)) {
        setError('Cấp độ khó không hợp lệ');
        return;
      }

      // Log dữ liệu trước khi gửi để debug
      console.log('Gửi dữ liệu sự kiện:', formattedEventData);

      // Gửi dữ liệu event chính trước
      const response = await createEvent(formattedEventData);
      const eventId = response.data.eventId;

      // Sau khi tạo event thành công, thêm các dữ liệu liên quan
      try {
        // Thêm ngôn ngữ lập trình
        if (eventData.languages && eventData.languages.length > 0) {
          for (const language of eventData.languages) {
            await addEventLanguage(eventId, { language });
          }
        }

        // Thêm công nghệ
        if (eventData.technologies && eventData.technologies.length > 0) {
          for (const technology of eventData.technologies) {
            await addEventTechnology(eventId, { technology });
          }
        }

        // Thêm lịch trình
        if (scheduleItems && scheduleItems.some(item => item.title)) {
          for (const item of scheduleItems.filter(item => item.title)) {
            const scheduleData = {
              eventId,
              activityName: item.title,
              description: item.description || null,
              startTime: item.startTime ? new Date(item.startTime).toISOString() : null,
              endTime: item.endTime ? new Date(item.endTime).toISOString() : null,
              location: item.location || formattedEventData.location || null,
              type: 'main_event'
            };
            await addEventSchedule(eventId, scheduleData);
          }
        }

        // Thêm giải thưởng
        if (prizes && prizes.length > 0) {
          for (const prize of prizes.filter(p => p.name)) {
            const prizeData = {
              eventId,
              rank: prize.rank,
              prizeAmount: parseFloat(prize.amount) || 0,
              description: prize.description || null
            };
            if (prizeData.rank <= 0) {
              console.warn(`Bỏ qua thứ hạng giải thưởng không hợp lệ: ${prizeData.rank}`);
              continue;
            }
            await addEventPrize(eventId, prizeData);
          }
        }

        setSuccess('Tạo sự kiện thành công!');
        addNotification('Tạo sự kiện thành công!', 'success');
        setTimeout(() => {
          navigate('/events');
        }, 1500);

      } catch (error) {
        console.error('Lỗi khi thêm dữ liệu liên quan:', error);
        setError('Sự kiện đã được tạo nhưng một số chi tiết không thể lưu. Vui lòng kiểm tra và thử cập nhật sự kiện.');
      }

    } catch (err) {
      console.error('Lỗi tạo sự kiện:', err);
      if (err.response?.data) {
        console.error('Chi tiết lỗi từ server:', err.response.data);
      }
      const errorMessage = 'Lỗi tạo sự kiện: ' + (err.response?.data?.message || err.message);
      setError(errorMessage);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Render different form based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom sx={{ 
                  mb: 3,
                  fontWeight: 'bold'
                }}>
                  Thông tin cơ bản
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Tên sự kiện"
                      name="title"
                      value={eventData.title}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      placeholder="Nhập tên sự kiện"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      multiline
                      rows={4}
                      label="Mô tả"
                      name="description"
                      value={eventData.description}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      placeholder="Mô tả chi tiết về sự kiện"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required variant="outlined">
                      <InputLabel>Danh mục</InputLabel>
                      <Select
                        name="category"
                        value={eventData.category}
                        label="Danh mục"
                        onChange={handleEventDataChange}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.value} value={category.value}>
                            {category.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Cấp độ khó</InputLabel>
                      <Select
                        name="difficulty"
                        value={eventData.difficulty}
                        label="Cấp độ khó"
                        onChange={handleEventDataChange}
                      >
                        {difficulties.map((difficulty) => (
                          <MenuItem key={difficulty.value} value={difficulty.value}>
                            {difficulty.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Ngày tổ chức"
                        value={eventData.eventDate}
                        onChange={handleDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            variant: "outlined",
                            helperText: "Ngày diễn ra sự kiện",
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <TimePicker
                        label="Giờ bắt đầu"
                        value={eventData.eventTime}
                        onChange={handleTimeChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            variant: "outlined",
                            helperText: "Thời gian bắt đầu sự kiện",
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Địa điểm"
                      name="location"
                      value={eventData.location}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      placeholder="Địa điểm tổ chức chi tiết"
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom sx={{ 
                  mb: 3,
                  fontWeight: 'bold'
                }}>
                  Cài đặt bổ sung
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Đơn vị tổ chức"
                      name="organizer"
                      value={eventData.organizer}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      placeholder="Tên đơn vị tổ chức"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="URL hình ảnh"
                      name="imageUrl"
                      value={eventData.imageUrl}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      helperText="Đường dẫn đến ảnh đại diện của sự kiện"
                      placeholder="https://example.com/image.jpg"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Số người tham gia tối đa"
                      name="maxAttendees"
                      type="number"
                      value={eventData.maxAttendees}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      helperText="Giới hạn số lượng người tham gia"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Giá vé (VNĐ)"
                      name="price"
                      type="number"
                      value={eventData.price}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      helperText="Nhập 0 cho sự kiện miễn phí"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom sx={{ 
                  mb: 3,
                  fontWeight: 'bold'
                }}>
                  Chi tiết sự kiện
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                      <InputLabel>Ngôn ngữ lập trình</InputLabel>
                      <Select
                        multiple
                        name="languages"
                        value={eventData.languages}
                        label="Ngôn ngữ lập trình"
                        onChange={handleLanguagesChange}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" color="primary" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      >
                        {programmingLanguages.map((language) => (
                          <MenuItem key={language} value={language}>
                            {language}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Chọn các ngôn ngữ lập trình sẽ được sử dụng hoặc thảo luận</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Công nghệ</InputLabel>
                      <Select
                        multiple
                        name="technologies"
                        value={eventData.technologies}
                        label="Công nghệ"
                        onChange={handleTechnologiesChange}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" color="secondary" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      >
                        {technologiesList.map((tech) => (
                          <MenuItem key={tech} value={tech}>
                            {tech}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Chọn các công nghệ sẽ được sử dụng hoặc thảo luận</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Yêu cầu đặc biệt"
                      name="specialRequirements"
                      value={eventData.specialRequirements || ''}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      placeholder="Các yêu cầu hoặc ghi chú đặc biệt cho sự kiện"
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom sx={{ 
                  mb: 3,
                  fontWeight: 'bold'
                }}>
                  Thông tin bổ sung
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Số người tham gia tối đa"
                      name="maxAttendees"
                      type="number"
                      value={eventData.maxAttendees}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      helperText="Giới hạn số lượng người tham gia"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Giá vé (VNĐ)"
                      name="price"
                      type="number"
                      value={eventData.price}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      helperText="Nhập 0 cho sự kiện miễn phí"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="URL đăng ký"
                      name="registrationUrl"
                      value={eventData.registrationUrl || ''}
                      onChange={handleEventDataChange}
                      variant="outlined"
                      helperText="Đường dẫn đến trang đăng ký (nếu có)"
                      placeholder="https://example.com/register"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        name="status"
                        value={eventData.status || 'upcoming'}
                        label="Trạng thái"
                        onChange={handleEventDataChange}
                      >
                        <MenuItem value="draft">Bản nháp</MenuItem>
                        <MenuItem value="upcoming">Sắp diễn ra</MenuItem>
                        <MenuItem value="ongoing">Đang diễn ra</MenuItem>
                        <MenuItem value="completed">Đã kết thúc</MenuItem>
                        <MenuItem value="cancelled">Đã hủy</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Lịch trình
                  </Typography>
                  <Button 
                    startIcon={<Add />} 
                    onClick={addScheduleItem} 
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    Thêm hoạt động
                  </Button>
                </Box>
                {scheduleItems.map((item, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Hoạt động {index + 1}
                        </Typography>
                        <IconButton 
                          color="error" 
                          onClick={() => removeScheduleItem(index)}
                          disabled={scheduleItems.length <= 1}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            required
                            label="Tiêu đề"
                            value={item.title}
                            onChange={(e) => handleScheduleChange(index, 'title', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                              label="Thời gian bắt đầu"
                              value={item.startTime}
                              onChange={(newValue) => handleScheduleChange(index, 'startTime', newValue)}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  required: true,
                                  variant: "outlined",
                                  size: "small"
                                }
                              }}
                            />
                          </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                              label="Thời gian kết thúc"
                              value={item.endTime}
                              onChange={(newValue) => handleScheduleChange(index, 'endTime', newValue)}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  required: true,
                                  variant: "outlined",
                                  size: "small"
                                }
                              }}
                            />
                          </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Người trình bày"
                            value={item.speaker}
                            onChange={(e) => handleScheduleChange(index, 'speaker', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Mô tả"
                            value={item.description}
                            onChange={(e) => handleScheduleChange(index, 'description', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Giải thưởng
                  </Typography>
                  <Button 
                    startIcon={<AddCircle />} 
                    onClick={addPrize} 
                    variant="contained"
                    color="secondary"
                    size="small"
                  >
                    Thêm giải thưởng
                  </Button>
                </Box>
                {prizes.map((prize, index) => (
                  <Card key={index} variant="outlined" sx={{ 
                    mb: 3,
                    borderLeft: `4px solid ${theme.palette.secondary.main}`
                  }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Giải thưởng {index + 1}
                        </Typography>
                        <IconButton 
                          color="error" 
                          onClick={() => removePrize(index)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            required
                            label="Tên giải thưởng"
                            value={prize.name}
                            onChange={(e) => handlePrizeChange(index, 'name', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Giá trị"
                            value={prize.amount}
                            onChange={(e) => handlePrizeChange(index, 'amount', e.target.value)}
                            variant="outlined"
                            size="small"
                            helperText="Giá trị hoặc số tiền của giải thưởng"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Mô tả"
                            value={prize.description}
                            onChange={(e) => handlePrizeChange(index, 'description', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </Grid>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Xem lại thông tin sự kiện
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                      {eventData.title || 'Tên sự kiện'}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Danh mục</Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                          {categories.find(c => c.value === eventData.category)?.label || eventData.category || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Ngày & Giờ</Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                          {eventData.eventDate ? new Date(eventData.eventDate).toLocaleDateString() : '-'} {' '}
                          {eventData.eventTime ? new Date(eventData.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">Địa điểm</Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>{eventData.location || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">Mô tả</Typography>
                        <Typography variant="body1" gutterBottom>{eventData.description || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Đơn vị tổ chức</Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>{eventData.organizer || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Cấp độ khó</Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                          {difficulties.find(d => d.value === eventData.difficulty)?.label || eventData.difficulty || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 3, mb: 2 }}>
                  Lịch trình
                </Typography>
                {scheduleItems.filter(item => item.title).length > 0 ? (
                  scheduleItems.filter(item => item.title).map((item, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{item.title}</Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {item.startTime ? new Date(item.startTime).toLocaleString() : '-'} - {' '}
                          {item.endTime ? new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </Typography>
                        {item.speaker && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Người trình bày:</strong> {item.speaker}
                          </Typography>
                        )}
                        {item.description && (
                          <Typography variant="body2">{item.description}</Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" gutterBottom>Chưa có hoạt động nào</Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Thông tin bổ sung
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Số người tham gia tối đa</Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>{eventData.maxAttendees || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Giá vé</Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                          {eventData.price === 0 ? 'Miễn phí' : `${eventData.price.toLocaleString()} VNĐ`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">Ngôn ngữ lập trình</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {eventData.languages && eventData.languages.length > 0 ? 
                            eventData.languages.map((lang) => (
                              <Chip key={lang} label={lang} size="small" color="primary" variant="outlined" />
                            )) : 
                            <Typography variant="body2">Chưa chọn</Typography>
                          }
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">Công nghệ</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {eventData.technologies && eventData.technologies.length > 0 ? 
                            eventData.technologies.map((tech) => (
                              <Chip key={tech} label={tech} size="small" color="secondary" variant="outlined" />
                            )) : 
                            <Typography variant="body2">Chưa chọn</Typography>
                          }
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 3, mb: 2 }}>
                  Giải thưởng
                </Typography>
                {prizes.filter(prize => prize.name).length > 0 ? (
                  prizes.filter(prize => prize.name).map((prize, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{prize.name}</Typography>
                        {prize.amount && (
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            <strong>Giá trị:</strong> {prize.amount}
                          </Typography>
                        )}
                        {prize.description && (
                          <Typography variant="body2">{prize.description}</Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2">Chưa có giải thưởng nào</Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box my={3}>
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/events')}
              sx={{ mr: 2, borderRadius: '4px' }}
            />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Tạo sự kiện mới
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '4px' }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: '4px' }}>
              {success}
            </Alert>
          )}

          <Card variant="outlined" sx={{ mb: 3, border: 'none' }}>
            {getStepContent(activeStep)}
          </Card>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{ mr: 2 }}
            >
              Quay lại
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              endIcon={activeStep === steps.length - 1 ? <Save /> : <ArrowForward />}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                'Tạo sự kiện'
              ) : (
                'Tiếp theo'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateEventPage;
