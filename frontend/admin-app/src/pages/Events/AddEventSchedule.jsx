import React, { useState } from 'react';
import { 
  Form, Input, Button, DatePicker, TimePicker, Select, 
  message, Typography, Space
} from 'antd';
import { SaveOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { addEventSchedule } from '../../api/events';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Các loại hoạt động trong lịch trình
const activityTypes = [
  { value: 'main_event', label: 'Sự kiện chính' },
  { value: 'registration', label: 'Đăng ký' },
  { value: 'opening', label: 'Khai mạc' },
  { value: 'break', label: 'Giải lao' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'networking', label: 'Giao lưu' },
  { value: 'presentation', label: 'Thuyết trình' },
  { value: 'competition', label: 'Thi đấu' },
  { value: 'judging', label: 'Chấm điểm' },
  { value: 'awards', label: 'Trao giải' },
  { value: 'closing', label: 'Bế mạc' },
  { value: 'other', label: 'Khác' }
];

const AddEventSchedule = ({ eventId, onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Định dạng thời gian
  const formatTimeForServer = (dayjsObj) => {
    if (!dayjsObj || !dayjs.isDayjs(dayjsObj)) {
      return null;
    }
    
    return dayjsObj.format('YYYY-MM-DDTHH:mm:ss');
  };

  // Xử lý khi submit form
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const scheduleData = {
        activityName: values.activityName,
        startTime: formatTimeForServer(values.startTime),
        endTime: formatTimeForServer(values.endTime),
        description: values.description,
        location: values.location,
        type: values.type
      };

      console.log('Thêm lịch trình:', scheduleData);
      
      const response = await addEventSchedule(eventId, scheduleData);
      console.log('Server response:', response);
      
      message.success('Thêm lịch trình thành công');
      form.resetFields();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Lỗi khi thêm lịch trình:', error);
      message.error('Không thể thêm lịch trình. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="activityName"
          label="Tên hoạt động"
          rules={[{ required: true, message: 'Vui lòng nhập tên hoạt động' }]}
        >
          <Input placeholder="Nhập tên hoạt động" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Loại hoạt động"
          rules={[{ required: true, message: 'Vui lòng chọn loại hoạt động' }]}
        >
          <Select placeholder="Chọn loại hoạt động">
            {activityTypes.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Space direction="horizontal" size={16} style={{ display: 'flex', marginBottom: 16 }}>
          <Form.Item
            name="startTime"
            label="Thời gian bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu' }]}
            style={{ flex: 1, minWidth: '45%' }}
          >
            <DatePicker 
              showTime 
              format="DD/MM/YYYY HH:mm" 
              placeholder="Chọn thời gian bắt đầu"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="Thời gian kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc' }]}
            style={{ flex: 1, minWidth: '45%' }}
          >
            <DatePicker 
              showTime 
              format="DD/MM/YYYY HH:mm" 
              placeholder="Chọn thời gian kết thúc"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space>

        <Form.Item
          name="location"
          label="Địa điểm"
          rules={[{ required: true, message: 'Vui lòng nhập địa điểm' }]}
        >
          <Input placeholder="Nhập địa điểm diễn ra hoạt động" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
        >
          <TextArea rows={4} placeholder="Nhập mô tả chi tiết về hoạt động" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={submitting}
          >
            Lưu lịch trình
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default AddEventSchedule; 