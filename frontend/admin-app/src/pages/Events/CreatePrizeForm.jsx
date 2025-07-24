/*-----------------------------------------------------------------
* File: CreatePrizeForm.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, InputNumber, Select,
  Typography, Space, message
} from 'antd';
import {
  ArrowLeftOutlined, TrophyOutlined, SaveOutlined
} from '@ant-design/icons';
import { addEventPrize } from '../../api/events';
import MainCard from '../../components/MainCard';

const { Title } = Typography;
const { Option } = Select;

const CreatePrizeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Hàm xử lý khi submit form
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await addEventPrize(id, {
        rank: values.rank,
        amount: values.amount,
        description: values.description
      });
      
      message.success('Thêm giải thưởng thành công');
      navigate(`/events/${id}`);
    } catch (error) {
      console.error('Lỗi khi thêm giải thưởng:', error);
      message.error('Không thể thêm giải thưởng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainCard
      title={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/events/${id}`)}
          />
          <span>Thêm giải thưởng sự kiện</span>
        </Space>
      }
    >
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <TrophyOutlined style={{ fontSize: 24, marginRight: 16, color: '#faad14' }} />
          <Title level={4} style={{ margin: 0 }}>Thông tin giải thưởng</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            rank: 1,
            amount: 0,
            description: ''
          }}
        >
          <Form.Item
            name="rank"
            label="Thứ hạng"
            rules={[{ required: true, message: 'Vui lòng chọn thứ hạng' }]}
          >
            <Select placeholder="Chọn thứ hạng">
              <Option value={1}>Giải Nhất</Option>
              <Option value={2}>Giải Nhì</Option>
              <Option value={3}>Giải Ba</Option>
              <Option value={4}>Giải Khuyến khích</Option>
              <Option value={5}>Giải Phụ</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Giá trị giải thưởng (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập giá trị giải thưởng' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\s?|(,*)/g, '')}
              min={0}
              step={100000}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả giải thưởng"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả giải thưởng' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập mô tả chi tiết về giải thưởng..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                Lưu giải thưởng
              </Button>
              <Button
                onClick={() => navigate(`/events/${id}`)}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </MainCard>
  );
};

export default CreatePrizeForm; 
