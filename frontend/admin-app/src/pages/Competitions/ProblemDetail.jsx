/*-----------------------------------------------------------------
* File: ProblemDetail.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Tag, Button, Space, Divider,
  message, Row, Col, Skeleton, Descriptions, Tooltip, Modal
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  CodeOutlined, ClockCircleOutlined, TrophyOutlined,
  FileTextOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import MainCard from '../../components/MainCard';
import { competitionsAPI } from '../../api/competitions';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

// Add CSS for better markdown rendering
const markdownStyles = {
  '.markdown-content': {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  '.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4': {
    margin: '16px 0 8px',
    fontWeight: 500,
  },
  '.markdown-content p': {
    margin: '8px 0',
  },
  '.markdown-content ul, .markdown-content ol': {
    paddingLeft: '24px',
    margin: '8px 0',
  },
  '.markdown-content code': {
    backgroundColor: '#f5f5f5',
    padding: '2px 4px',
    borderRadius: '3px',
    fontSize: '90%',
    fontFamily: 'monospace',
  },
  '.markdown-content blockquote': {
    borderLeft: '4px solid #ddd',
    paddingLeft: '16px',
    margin: '16px 0',
    color: '#666',
  },
  '.markdown-content img': {
    maxWidth: '100%',
  },
  '.markdown-content table': {
    borderCollapse: 'collapse',
    width: '100%',
    margin: '16px 0',
  },
  '.markdown-content th, .markdown-content td': {
    border: '1px solid #ddd',
    padding: '8px',
  },
};

const ProblemDetail = () => {
  const { id: competitionId, problemId } = useParams();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProblemData();
  }, [competitionId, problemId]);
  
  const fetchProblemData = async () => {
    try {
      setLoading(true);
      const response = await competitionsAPI.getProblem(competitionId, problemId);
      if (response && response.problem) {
        setProblem(response.problem);
      } else {
        message.error('Không tìm thấy thông tin bài tập');
        navigate(`/competitions/${competitionId}`);
      }
    } catch (error) {
      console.error('Error fetching problem:', error);
      message.error('Không thể tải thông tin bài tập');
      navigate(`/competitions/${competitionId}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteProblem = () => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa bài tập này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await competitionsAPI.deleteProblem(competitionId, problemId);
          message.success('Xóa bài tập thành công');
          navigate(`/competitions/${competitionId}`);
        } catch (error) {
          message.error('Không thể xóa bài tập');
        }
      },
    });
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

  const renderTags = (tags) => {
    if (!tags) return null;
    
    const tagList = typeof tags === 'string' 
      ? tags.split(',').map(tag => tag.trim()) 
      : tags;
      
    return (
      <Space wrap>
        {tagList.map((tag, index) => (
          <Tag key={index} color="blue">{tag}</Tag>
        ))}
      </Space>
    );
  };
  
  if (loading || !problem) {
    return (
      <MainCard 
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/competitions/${competitionId}`)}
            />
            Chi tiết bài tập
          </Space>
        }
      >
        <Skeleton active paragraph={{ rows: 10 }} />
      </MainCard>
    );
  }
  
  return (
    <MainCard
      title={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/competitions/${competitionId}`)}
          />
          Chi tiết bài tập
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="Chỉnh sửa bài tập">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/competitions/${competitionId}/problems/${problemId}/edit`)}
            >
              Chỉnh sửa
            </Button>
          </Tooltip>
          <Tooltip title="Xóa bài tập">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteProblem}
            >
              Xóa
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <style>
        {Object.entries(markdownStyles)
          .map(([selector, styles]) => 
            `${selector} {${Object.entries(styles)
              .map(([property, value]) => `${property}: ${value};`)
              .join(' ')}}`
          )
          .join('\n')
        }
      </style>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={2}>{problem.Title}</Title>
            <Space wrap style={{ marginBottom: 16 }}>
              {getDifficultyTag(problem.Difficulty)}
              <Tag icon={<TrophyOutlined />} color="gold">Điểm: {problem.Points}</Tag>
              <Tag icon={<ClockCircleOutlined />}>Thời gian: {problem.TimeLimit} giây</Tag>
              <Tag icon={<FileTextOutlined />}>Bộ nhớ: {problem.MemoryLimit} MB</Tag>
            </Space>
            {renderTags(problem.Tags)}
          </div>
          
          {problem.ImageURL && (
            <img 
              src={problem.ImageURL} 
              alt={problem.Title}
              style={{ 
                maxWidth: '120px', 
                maxHeight: '120px', 
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          )}
        </div>
        
        <Divider orientation="left">Mô tả bài toán</Divider>
        <div className="markdown-content">
          <ReactMarkdown>{problem.Description}</ReactMarkdown>
        </div>
        
        <Divider orientation="left">Định dạng đầu vào</Divider>
        <div className="markdown-content">
          <ReactMarkdown>{problem.InputFormat}</ReactMarkdown>
        </div>
        
        <Divider orientation="left">Định dạng đầu ra</Divider>
        <div className="markdown-content">
          <ReactMarkdown>{problem.OutputFormat}</ReactMarkdown>
        </div>
        
        <Divider orientation="left">Ràng buộc</Divider>
        <div className="markdown-content">
          <ReactMarkdown>{problem.Constraints}</ReactMarkdown>
        </div>
        
        <Divider orientation="left">Ví dụ</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Card title="Đầu vào mẫu" bordered>
              <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
                {problem.SampleInput}
              </pre>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Đầu ra mẫu" bordered>
              <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
                {problem.SampleOutput}
              </pre>
            </Card>
          </Col>
        </Row>
        
        {problem.Explanation && (
          <>
            <Divider orientation="left">Giải thích</Divider>
            <div className="markdown-content">
              <ReactMarkdown>{problem.Explanation}</ReactMarkdown>
            </div>
          </>
        )}
        
        {problem.Instructions && (
          <>
            <Divider orientation="left">Hướng dẫn</Divider>
            <div className="markdown-content">
              <ReactMarkdown>{problem.Instructions}</ReactMarkdown>
            </div>
          </>
        )}
        
        {problem.StarterCode && (
          <>
            <Divider orientation="left">Mã khởi tạo</Divider>
            <pre 
              style={{ 
                background: '#282c34', 
                color: '#abb2bf',
                padding: '16px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            >
              {problem.StarterCode}
            </pre>
          </>
        )}
      </Card>
    </MainCard>
  );
};

export default ProblemDetail; 
