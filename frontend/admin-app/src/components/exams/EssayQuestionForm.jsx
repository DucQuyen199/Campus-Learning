/*-----------------------------------------------------------------
* File: EssayQuestionForm.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  TextField, Grid, Box, Button, Typography, Divider, Chip,
  Paper, IconButton, List, ListItem, ListItemText, Alert,
  CircularProgress
} from '@mui/material';
import { Description, NoteAdd, Add, Delete, Save } from '@mui/icons-material';
import { getEssayTemplate, addEssayContent } from '../../api/exams';

const EssayQuestionForm = ({ examId, questionId, onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [essayData, setEssayData] = useState({
    content: '',
    keywords: [],
    minimumMatchPercentage: 60,
    scoringRubric: {}
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Tạo biến theo dõi việc component unmount
    let isMounted = true;
    
    // Fetch existing template if available
    const fetchTemplate = async () => {
      if (!questionId) return;
      
      try {
        setLoading(true);
        
        // Hiển thị giao diện loading ngay lập tức
        const response = await getEssayTemplate(examId, questionId);
        
        // Nếu component đã unmount, không cập nhật state nữa
        if (!isMounted) return;
        
        // getEssayTemplate đã xử lý lỗi 404 và trả về dữ liệu trống
        const template = response?.essayTemplate || response;
        
        const formattedData = {
          content: template.templateText || template.content || '',
          keywords: Array.isArray(template.keywords) ? template.keywords : [],
          minimumMatchPercentage: template.minimumMatchPercentage || 
            (template.scoringCriteria && typeof template.scoringCriteria === 'string'
              ? JSON.parse(template.scoringCriteria).minimumMatchPercentage
              : 60),
          scoringRubric: template.scoringRubric || {}
        };
        
        if (isMounted) {
          setEssayData(formattedData);
        }
      } catch (err) {
        if (isMounted) {
          console.log('Không thể tải mẫu đáp án, sử dụng mẫu mặc định');
        }
        // Không cần xử lý lỗi ở đây vì người dùng vẫn có thể tạo mẫu mới
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Gọi hàm fetch data chỉ một lần
    fetchTemplate();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [examId, questionId]);

  const handleChange = (field, value) => {
    setEssayData({ ...essayData, [field]: value });
    // Reset success message when form is edited
    setSavedSuccess(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange('content', event.target.result);
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const updatedKeywords = [...essayData.keywords, newKeyword.trim()];
      handleChange('keywords', updatedKeywords);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index) => {
    const updatedKeywords = [...essayData.keywords];
    updatedKeywords.splice(index, 1);
    handleChange('keywords', updatedKeywords);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSavedSuccess(false);
      
      // Kiểm tra dữ liệu trước khi lưu
      if (!essayData.content.trim()) {
        setError('Vui lòng nhập nội dung mẫu đáp án');
        setLoading(false);
        return;
      }
      
      // Thực hiện lưu dữ liệu
      await addEssayContent(examId, questionId, essayData);
      
      setSavedSuccess(true);
      if (onSaveSuccess) {
        onSaveSuccess(essayData);
      }
    } catch (err) {
      console.error('Lỗi khi lưu:', err.message || 'Lỗi không xác định');
      setError('Không thể lưu nội dung mẫu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mt={3}>
      <Divider sx={{ mb: 3 }}>
        <Chip icon={<Description />} label="Mẫu câu hỏi tự luận" />
      </Divider>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {savedSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Đã lưu mẫu câu hỏi tự luận thành công!
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Mẫu đáp án
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Đây là nội dung mẫu sẽ được sử dụng để tham chiếu khi chấm điểm tự động. Hệ thống 
          sẽ so sánh bài làm của học viên với mẫu này để tính điểm tương đồng.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nội dung mẫu câu hỏi tự luận"
              multiline
              rows={8}
              value={essayData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              margin="normal"
              placeholder="Nhập nội dung mẫu sẽ được sử dụng để so sánh khi chấm điểm"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<NoteAdd />}
              sx={{ mb: 2 }}
            >
              Tải tệp văn bản
              <input
                type="file"
                hidden
                accept=".txt,.doc,.docx"
                onChange={handleFileChange}
              />
            </Button>
            {file && (
              <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                Tệp: {file.name}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Từ khóa và chấm điểm
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Xác định các từ khóa quan trọng cần xuất hiện trong bài làm của học viên. Thuật toán
          chấm điểm sẽ kiểm tra các từ khóa này khi tính điểm.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Thêm từ khóa"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              margin="normal"
              placeholder="Nhập từ khóa và nhấn Enter hoặc nút Thêm"
            />
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addKeyword}
              sx={{ mt: 2 }}
              disabled={!newKeyword.trim()}
            >
              Thêm từ khóa
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Danh sách từ khóa ({essayData.keywords.length})
            </Typography>
            {essayData.keywords.length > 0 ? (
              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {essayData.keywords.map((keyword, index) => (
                  <ListItem 
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => removeKeyword(index)}>
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={keyword} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chưa có từ khóa nào. Thêm từ khóa để cải thiện chấm điểm tự động.
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Tỷ lệ phần trăm tương đồng tối thiểu"
              value={essayData.minimumMatchPercentage}
              onChange={(e) => handleChange('minimumMatchPercentage', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              margin="normal"
              InputProps={{ inputProps: { min: 0, max: 100 } }}
              helperText="Mức độ tương đồng tối thiểu yêu cầu để đạt điểm (0-100%)"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSubmit}
          disabled={loading || !essayData.content.trim()}
        >
          {loading ? 'Đang lưu...' : 'Lưu mẫu câu hỏi'}
        </Button>
      </Box>
    </Box>
  );
};

export default EssayQuestionForm; 
