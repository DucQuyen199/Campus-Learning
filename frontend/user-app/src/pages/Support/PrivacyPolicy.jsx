/*-----------------------------------------------------------------
* File: PrivacyPolicy.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "Giới thiệu",
      content: "Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi bạn sử dụng nền tảng Campus Learning."
    },
    {
      title: "Thông tin chúng tôi thu thập",
      content: "Chúng tôi thu thập các thông tin sau:",
      items: [
        "Thông tin cá nhân (họ tên, email, số điện thoại)",
        "Thông tin thanh toán",
        "Dữ liệu học tập và tiến độ",
        "Thông tin thiết bị và trình duyệt",
        "Dữ liệu tương tác với nền tảng"
      ]
    },
    {
      title: "Cách chúng tôi sử dụng thông tin",
      content: "Chúng tôi sử dụng thông tin của bạn để:",
      items: [
        "Cung cấp và cải thiện dịch vụ",
        "Xử lý thanh toán và giao dịch",
        "Gửi thông báo và cập nhật",
        "Phân tích và tối ưu hóa trải nghiệm người dùng",
        "Tuân thủ các yêu cầu pháp lý"
      ]
    },
    {
      title: "Bảo mật thông tin",
      content: "Chúng tôi áp dụng các biện pháp bảo mật sau:",
      items: [
        "Mã hóa dữ liệu nhạy cảm",
        "Kiểm soát truy cập nghiêm ngặt",
        "Bảo mật hệ thống và mạng",
        "Đào tạo nhân viên về bảo mật",
        "Đánh giá bảo mật định kỳ"
      ]
    },
    {
      title: "Chia sẻ thông tin",
      content: "Chúng tôi chỉ chia sẻ thông tin của bạn trong các trường hợp:",
      items: [
        "Với sự đồng ý của bạn",
        "Để cung cấp dịch vụ",
        "Tuân thủ pháp luật",
        "Bảo vệ quyền lợi hợp pháp",
        "Hợp tác với đối tác đáng tin cậy"
      ]
    },
    {
      title: "Quyền của người dùng",
      content: "Bạn có quyền:",
      items: [
        "Truy cập thông tin cá nhân",
        "Yêu cầu sửa đổi thông tin",
        "Yêu cầu xóa thông tin",
        "Từ chối tiếp thị",
        "Khiếu nại về việc xử lý dữ liệu"
      ]
    },
    {
      title: "Cookie và công nghệ theo dõi",
      content: "Chúng tôi sử dụng cookie để:",
      items: [
        "Cải thiện trải nghiệm người dùng",
        "Phân tích lưu lượng truy cập",
        "Nhớ tùy chọn của bạn",
        "Cung cấp nội dung phù hợp",
        "Bảo mật tài khoản"
      ]
    },
    {
      title: "Liên hệ",
      content: "Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ:",
      items: [
        "Email: contact@Campus Learning.vn",
        "Địa chỉ: 123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
        "Điện thoại: (84) 123-456-789"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Chính sách bảo mật</h1>
          <p className="text-lg text-gray-600">Cập nhật lần cuối: 01/01/2024</p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
              <p className="text-gray-600 mb-4">{section.content}</p>
              {section.items && (
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-gray-600">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 
