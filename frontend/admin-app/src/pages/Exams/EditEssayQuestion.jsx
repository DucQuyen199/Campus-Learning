/*-----------------------------------------------------------------
* File: EditEssayQuestion.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Breadcrumbs, 
  Link, CircularProgress, Alert, Button
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import EssayQuestionForm from '../../components/exams/EssayQuestionForm';
import { getExamById, getEssayTemplate } from '../../api/exams';

const EditEssayQuestion = () => {
  const { examId, questionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [question, setQuestion] = useState(null);
  
  useEffect(() => {
    // Tạo một biến để tracking việc component unmount
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get exam details
        console.log(`Đang tải dữ liệu bài thi ${examId} và câu hỏi ${questionId}`);
        const examData = await getExamById(examId);
        
        // Kiểm tra component có còn mounted không
        if (!isMounted) return;
        
        setExam(examData);
        
        // Kiểm tra xem exam có tồn tại không
        if (!examData || Object.keys(examData).length === 0) {
          throw new Error('Không thể tải thông tin bài thi');
        }
        
        // Find the specific question
        const foundQuestion = examData.questions.find(q => 
          q._id === questionId || q.QuestionID === questionId || q.QuestionID?.toString() === questionId
        );
        
        if (!foundQuestion) {
          console.error(`Không tìm thấy câu hỏi. ID: ${questionId}, Số lượng câu hỏi: ${examData.questions?.length || 0}`);
          throw new Error('Không tìm thấy câu hỏi trong bài thi này');
        }
        
        console.log('Đã tìm thấy câu hỏi:', foundQuestion.QuestionText || foundQuestion.Content);
        
        const questionType = foundQuestion.Type?.toLowerCase() || foundQuestion.type?.toLowerCase();
        if (questionType !== 'essay') {
          throw new Error('Đây không phải là câu hỏi tự luận');
        }
        
        if (isMounted) {
          setQuestion(foundQuestion);
        }
        
        try {
          const questionIdentifier = foundQuestion.QuestionID || foundQuestion._id;
          // Gọi API lấy mẫu câu hỏi tự luận với examId và questionId
          await getEssayTemplate(examId, questionIdentifier);
        } catch (err) {
          // Lỗi khác ngoài 404 đã được xử lý trong API
        }
      } catch (err) {
        if (isMounted) {
          console.error('Lỗi khi tải dữ liệu câu hỏi:', err.message);
          setError(err.message || 'Không thể tải dữ liệu câu hỏi');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Cleanup function để tránh cập nhật state sau khi component unmount
    return () => {
      isMounted = false;
    };
  }, [examId, questionId]);
  
  const handleBack = () => {
    navigate(`/exams/edit/${examId}`);
  };
  
  const handleSaveSuccess = () => {
    // Có thể thêm logic sau khi lưu thành công
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Đang tải thông tin câu hỏi...</Typography>
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 3 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Quay lại bài thi
          </Button>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Không thể tải thông tin câu hỏi tự luận
            </Typography>
            <Typography variant="body1" paragraph>
              Hệ thống không thể tải dữ liệu câu hỏi. Có thể do một trong các nguyên nhân sau:
            </Typography>
            <Box sx={{ textAlign: 'left', maxWidth: 600, mx: 'auto', mb: 3 }}>
              <Typography component="div">
                • Câu hỏi không tồn tại hoặc đã bị xóa
              </Typography>
              <Typography component="div">
                • API không hỗ trợ chức năng này
              </Typography>
              <Typography component="div">
                • Có lỗi kết nối đến máy chủ
              </Typography>
            </Box>
            <Button 
              variant="contained"
              onClick={handleBack}
              sx={{ mt: 2 }}
            >
              Quay lại bài thi
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }
  
  // Hỗ trợ cả hai cấu trúc dữ liệu có thể có
  const questionText = question?.Content || question?.text || question?.QuestionText || 'Câu hỏi tự luận';
  const questionDescription = question?.Description || question?.description || '';
  const questionPoints = question?.Points || question?.points || 0;
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Quay lại bài thi
        </Button>
        
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" onClick={() => navigate('/exams')}>
            Bài thi
          </Link>
          <Link color="inherit" onClick={handleBack}>
            {exam?.Title || exam?.title || 'Bài thi'}
          </Link>
          <Typography color="text.primary">
            Chỉnh sửa câu hỏi tự luận
          </Typography>
        </Breadcrumbs>
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {questionText}
          </Typography>
          {questionDescription && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {questionDescription}
            </Typography>
          )}
          <Typography variant="body2" gutterBottom>
            Điểm: {questionPoints}
          </Typography>
        </Paper>
        
        <EssayQuestionForm 
          examId={examId} 
          questionId={question?.QuestionID || questionId} 
          onSaveSuccess={handleSaveSuccess}
        />
      </Box>
    </Container>
  );
};

export default EditEssayQuestion; 
