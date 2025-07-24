/*-----------------------------------------------------------------
* File: HelpCenter.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  AcademicCapIcon, 
  CreditCardIcon, 
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const HelpCenter = () => {
  const helpSections = [
    {
      title: "Bắt đầu học",
      icon: BookOpenIcon,
      description: "Hướng dẫn cách bắt đầu học và sử dụng nền tảng",
      items: [
        "Cách đăng ký tài khoản",
        "Cách chọn khóa học phù hợp",
        "Hướng dẫn sử dụng giao diện học tập",
        "Cách theo dõi tiến độ học tập"
      ]
    },
    {
      title: "Khóa học",
      icon: AcademicCapIcon,
      description: "Thông tin về các khóa học và chương trình học",
      items: [
        "Các loại khóa học có sẵn",
        "Cách đăng ký khóa học",
        "Chính sách hoàn tiền",
        "Cách nhận chứng chỉ"
      ]
    },
    {
      title: "Thanh toán",
      icon: CreditCardIcon,
      description: "Hướng dẫn về các phương thức thanh toán",
      items: [
        "Các phương thức thanh toán được chấp nhận",
        "Cách sử dụng mã giảm giá",
        "Hóa đơn và biên lai",
        "Xử lý sự cố thanh toán"
      ]
    },
    {
      title: "Hỗ trợ kỹ thuật",
      icon: DevicePhoneMobileIcon,
      description: "Giải quyết các vấn đề kỹ thuật",
      items: [
        "Yêu cầu hệ thống",
        "Khắc phục sự cố đăng nhập",
        "Sự cố video/âm thanh",
        "Hỗ trợ thiết bị di động"
      ]
    },
    {
      title: "Tài liệu",
      icon: DocumentTextIcon,
      description: "Tài liệu hướng dẫn và tài nguyên học tập",
      items: [
        "Hướng dẫn sử dụng nền tảng",
        "Tài liệu học tập",
        "Mẫu bài tập",
        "Tài nguyên bổ sung"
      ]
    },
    {
      title: "Câu hỏi thường gặp",
      icon: QuestionMarkCircleIcon,
      description: "Giải đáp các thắc mắc phổ biến",
      items: [
        "Câu hỏi về tài khoản",
        "Câu hỏi về khóa học",
        "Câu hỏi về thanh toán",
        "Câu hỏi về chứng chỉ"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Trung tâm trợ giúp</h1>
          <p className="text-lg text-gray-600">Tìm kiếm hướng dẫn và hỗ trợ cho mọi vấn đề của bạn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <section.icon className="h-8 w-8 text-indigo-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-gray-600">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Vẫn cần hỗ trợ thêm?</p>
          <a
            href="/support/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter; 
