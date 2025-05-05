import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const FAQ = () => {
  const faqs = [
    {
      question: "Làm thế nào để đăng ký tài khoản?",
      answer: "Bạn có thể đăng ký tài khoản bằng cách nhấp vào nút 'Đăng ký' ở góc trên bên phải của trang web. Sau đó điền đầy đủ thông tin theo yêu cầu và xác nhận email của bạn."
    },
    {
      question: "Tôi có thể học thử trước khi đăng ký không?",
      answer: "Có, chúng tôi cung cấp các bài học thử miễn phí cho mỗi khóa học. Bạn có thể xem trước nội dung và trải nghiệm chất lượng giảng dạy trước khi quyết định đăng ký."
    },
    {
      question: "Làm thế nào để thanh toán khóa học?",
      answer: "Chúng tôi chấp nhận nhiều phương thức thanh toán như chuyển khoản ngân hàng, ví điện tử, và thẻ tín dụng. Sau khi chọn khóa học, bạn sẽ được chuyển đến trang thanh toán để hoàn tất giao dịch."
    },
    {
      question: "Tôi có thể học trên thiết bị di động không?",
      answer: "Có, nền tảng của chúng tôi được thiết kế responsive và hoạt động tốt trên cả máy tính và thiết bị di động. Bạn có thể học mọi lúc, mọi nơi."
    },
    {
      question: "Làm thế nào để nhận chứng chỉ sau khi hoàn thành khóa học?",
      answer: "Sau khi hoàn thành tất cả bài học và vượt qua các bài kiểm tra của khóa học, bạn sẽ nhận được chứng chỉ điện tử. Chứng chỉ này có thể tải xuống và chia sẻ trên LinkedIn."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h1>
          <p className="text-lg text-gray-600">Tìm câu trả lời cho những thắc mắc phổ biến nhất</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                </div>
                <div className="mt-4 text-gray-600">
                  {faq.answer}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy câu trả lời bạn cần?</p>
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

export default FAQ; 