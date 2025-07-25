/*-----------------------------------------------------------------
* File: TermsOfUse.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { motion } from 'framer-motion';

const TermsOfUse = () => {
  const sections = [
    {
      title: "Giới thiệu",
      content: "Bằng việc sử dụng nền tảng Campus Learning, bạn đồng ý với các điều khoản và điều kiện được nêu trong tài liệu này. Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ."
    },
    {
      title: "Điều kiện sử dụng",
      content: "Để sử dụng nền tảng, bạn phải:",
      items: [
        "Đủ 13 tuổi trở lên",
        "Có tài khoản hợp lệ",
        "Cung cấp thông tin chính xác",
        "Tuân thủ các quy định của nền tảng",
        "Không vi phạm bản quyền"
      ]
    },
    {
      title: "Quyền sở hữu trí tuệ",
      content: "Tất cả nội dung trên nền tảng thuộc sở hữu của Campus Learning hoặc được cấp phép sử dụng. Bạn không được:",
      items: [
        "Sao chép hoặc phân phối nội dung",
        "Sử dụng nội dung cho mục đích thương mại",
        "Chỉnh sửa hoặc tạo tác phẩm phái sinh",
        "Xóa thông tin bản quyền",
        "Chia sẻ tài khoản với người khác"
      ]
    },
    {
      title: "Quy định về nội dung",
      content: "Người dùng không được đăng tải nội dung:",
      items: [
        "Vi phạm pháp luật",
        "Xúc phạm, đe dọa người khác",
        "Chứa thông tin sai lệch",
        "Quảng cáo trái phép",
        "Chứa virus hoặc mã độc"
      ]
    },
    {
      title: "Thanh toán và hoàn tiền",
      content: "Các quy định về thanh toán:",
      items: [
        "Giá cả được niêm yết rõ ràng",
        "Thanh toán trước khi sử dụng",
        "Hoàn tiền trong vòng 7 ngày nếu chưa học",
        "Không hoàn tiền sau khi đã học",
        "Chính sách hoàn tiền chi tiết"
      ]
    },
    {
      title: "Chấm dứt tài khoản",
      content: "Chúng tôi có quyền chấm dứt tài khoản nếu:",
      items: [
        "Vi phạm điều khoản sử dụng",
        "Gian lận hoặc lừa đảo",
        "Không hoạt động trong thời gian dài",
        "Cung cấp thông tin giả mạo",
        "Vi phạm pháp luật"
      ]
    },
    {
      title: "Giới hạn trách nhiệm",
      content: "Chúng tôi không chịu trách nhiệm về:",
      items: [
        "Mất mát dữ liệu",
        "Gián đoạn dịch vụ",
        "Thiệt hại gián tiếp",
        "Hành vi của người dùng khác",
        "Vấn đề kỹ thuật ngoài tầm kiểm soát"
      ]
    },
    {
      title: "Thay đổi điều khoản",
      content: "Chúng tôi có quyền:",
      items: [
        "Cập nhật điều khoản khi cần",
        "Thông báo trước 30 ngày",
        "Áp dụng cho tất cả người dùng",
        "Lưu trữ các phiên bản cũ",
        "Giải thích rõ các thay đổi"
      ]
    },
    {
      title: "Giải quyết tranh chấp",
      content: "Trong trường hợp có tranh chấp:",
      items: [
        "Ưu tiên giải quyết hòa giải",
        "Áp dụng luật Việt Nam",
        "Tòa án có thẩm quyền tại TP. HCM",
        "Thời hạn khiếu nại 30 ngày",
        "Bồi thường theo quy định pháp luật"
      ]
    },
    {
      title: "Liên hệ",
      content: "Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng liên hệ:",
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Điều khoản sử dụng</h1>
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

export default TermsOfUse; 
