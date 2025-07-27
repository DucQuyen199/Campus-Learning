/*-----------------------------------------------------------------
* File: About.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: About Us component extracted from Login page
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  const scrollToAbout = () => {
    document.getElementById('about-us').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <>
      {/* Scroll to About button */}
      <div className="mt-10">
        <button 
          onClick={scrollToAbout}
          className="flex items-center mx-auto space-x-2 text-white bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full hover:bg-white/30 transition-all duration-200"
        >
          <span>Về Chúng Tôi</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {/* About Us Section */}
      <div id="about-us" className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Về Chúng Tôi</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CampusLearning là nền tảng học tập trực tuyến hàng đầu tại Việt Nam, được thành lập với sứ mệnh 
              mang đến cơ hội tiếp cận kiến thức công nghệ chất lượng cao cho mọi người. Chúng tôi tự hào 
              là đối tác đào tạo tin cậy của nhiều doanh nghiệp công nghệ hàng đầu trong và ngoài nước.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Tầm Nhìn",
                content: "Trở thành nền tảng giáo dục công nghệ số 1 Việt Nam, đào tạo 100,000+ lập trình viên chuyên nghiệp đến năm 2025. Xây dựng cộng đồng học tập công nghệ lớn mạnh với hơn 1 triệu thành viên, góp phần thúc đẩy sự phát triển của ngành công nghệ thông tin Việt Nam.",
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              },
              {
                title: "Sứ Mệnh",
                content: "Cung cấp nền tảng học tập công nghệ toàn diện với chi phí tối ưu nhất. Đào tạo nguồn nhân lực chất lượng cao đáp ứng nhu cầu chuyển đổi số của doanh nghiệp. Tạo môi trường học tập và phát triển nghề nghiệp chuyên nghiệp cho cộng đồng IT Việt Nam.",
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              },
              {
                title: "Giá Trị Cốt Lõi",
                content: "- Chất lượng đào tạo là ưu tiên hàng đầu\n- Đổi mới sáng tạo trong phương pháp giảng dạy\n- Tận tâm hỗ trợ người học\n- Cam kết đồng hành cùng sự phát triển của học viên\n- Liên tục cập nhật và nâng cao chất lượng",
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border border-gray-100"
              >
                <div className="h-14 w-14 mx-auto mb-4 rounded-lg bg-blue-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-center whitespace-pre-line">
                  {item.content}
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* Đội Ngũ Chuyên Gia */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mt-16 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
          >
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                <img className="h-full w-full object-cover md:w-72" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80" alt="Đội ngũ giảng viên" />
              </div>
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">Đội Ngũ Chuyên Gia</div>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-gray-900">
                  Giảng viên hàng đầu trong lĩnh vực công nghệ
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Đội ngũ giảng viên của CampusLearning gồm các chuyên gia có trên 10 năm kinh nghiệm đến từ các 
                  công ty công nghệ hàng đầu như Google, Microsoft, AWS, FPT Software. Với kinh nghiệm thực tế 
                  phong phú, các giảng viên không chỉ truyền đạt kiến thức chuyên môn mà còn chia sẻ những 
                  bài học quý giá từ dự án thực tế.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Front-end</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Back-end</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">DevOps</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">AI & ML</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Mobile Dev</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Cloud Computing</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Phương Pháp Đào Tạo và Cam Kết */}
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-8 rounded-xl shadow-md border border-gray-100"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Phương Pháp Đào Tạo</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Học tập dựa trên dự án thực tế (Project-based learning)</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Nội dung học tập được cá nhân hóa theo trình độ và mục tiêu</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Hệ thống hỗ trợ học tập 1-1 với giảng viên và mentor</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Cập nhật liên tục kiến thức mới nhất theo xu hướng công nghệ</p>
                  </li>
                </ul>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-8 rounded-xl shadow-md border border-gray-100"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Cam Kết Với Học Viên</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Bảo mật thông tin cá nhân và dữ liệu học tập</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Hoàn trả học phí nếu không hài lòng trong 7 ngày đầu</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Hỗ trợ kỹ thuật và giải đáp thắc mắc 24/7</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Cấp chứng chỉ hoàn thành có giá trị trong ngành công nghệ</p>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
          
          {/* Đối Tác */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mt-16 text-center"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Đối Tác Của Chúng Tôi</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  title: "FPT Software",
                  image: "https://upload.wikimedia.org/wikipedia/commons/1/11/FPT_logo_2010.svg"
                },
                {
                  title: "VNG Corporation",
                  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/VNG_Corp._logo.svg/1200px-VNG_Corp._logo.svg.png"
                },
                {
                  title: "Microsoft Vietnam",
                  image: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg"
                },
                {
                  title: "Amazon Web Services",
                  image: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
                },
                {
                  title: "Google",
                  image: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
                },
                {
                  title: "MoMo",
                  image: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                },
                {
                  title: "Tiki",
                  image: "https://upload.wikimedia.org/wikipedia/commons/4/43/Logo_Tiki_2023.png"
                },
                {
                  title: "Shopee",
                  image: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  className="bg-white p-8 rounded-lg shadow-sm flex items-center justify-center h-32 border border-gray-100"
                >
                  <img src={item.image} alt={item.title} className="w-36 h-16 object-contain" />
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                "Đối Tác Tuyển Dụng", 
                "Đối Tác Đào Tạo", 
                "Đối Tác Công Nghệ"
              ].map((title, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-blue-50 p-6 rounded-xl"
                >
                  <h4 className="font-semibold text-lg text-blue-900 mb-2">{title}</h4>
                  <p className="text-blue-700">200+ doanh nghiệp công nghệ tuyển dụng trực tiếp từ CampusLearning</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-blue-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Liên Hệ Với Chúng Tôi</h2>
            <p className="text-lg text-gray-600">
              Hãy liên hệ với chúng tôi nếu bạn cần hỗ trợ hoặc có bất kỳ câu hỏi nào
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Điện thoại",
                content: ["0332029410", "Thứ 2 - Chủ nhật: 8:00 - 22:00"],
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              },
              {
                title: "Email",
                content: ["support@CampusLearning.edu.vn", "quyen.nd19@outlook.com"],
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              },
              {
                title: "Địa chỉ",
                content: ["Tầng 15, Tòa nhà Innovation", "Quận 1, TP. Hồ Chí Minh"],
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-md text-center"
              >
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                {item.content.map((line, i) => (
                  <p key={i} className="text-gray-600">{line}</p>
                ))}
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mt-12 max-w-3xl mx-auto"
          >
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold text-center mb-6">Gửi Tin Nhắn Cho Chúng Tôi</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                  <textarea rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div className="text-center">
                  <button type="submit" className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Gửi tin nhắn
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Youtube</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.418-4.814a2.507 2.507 0 0 1 1.768-1.768C5.746 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.07-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900 text-white py-8"
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 CampusLearning. Tất cả quyền được bảo lưu.</p>
        </div>
      </motion.footer>
    </>
  );
};

export default About;
