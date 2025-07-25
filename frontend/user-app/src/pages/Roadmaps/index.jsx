/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
"use client"

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import {
  CodeBracketIcon,
  ServerIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LightBulbIcon,
  BookOpenIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CubeIcon,
  CircleStackIcon,
  CloudIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const Roadmaps = () => {
  const navigate = useNavigate();
  const [selectedRoadmap, setSelectedRoadmap] = useState('frontend');

  const roadmaps = {
    frontend: {
      title: "Front-end Development",
      description: "Lộ trình học để trở thành nhà phát triển Front-end chuyên nghiệp",
      icon: CodeBracketIcon,
      color: "bg-rose-500",
      timeToComplete: "6-8 tháng",
      level: "Cơ bản đến nâng cao",
      steps: [
        {
          id: 1,
          title: "Nền tảng cơ bản",
          description: "Học các kiến thức cơ bản về HTML, CSS và JavaScript",
          courses: ["HTML & CSS Fundamentals", "JavaScript Basics", "Responsive Web Design"],
          duration: "4-6 tuần",
          isActive: true,
          isCompleted: false,
        },
        {
          id: 2,
          title: "JavaScript nâng cao",
          description: "Tìm hiểu sâu về JavaScript và DOM manipulation",
          courses: ["Advanced JavaScript", "ES6+ Features", "JavaScript Data Structures"],
          duration: "4-6 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 3,
          title: "Framework cơ bản",
          description: "Làm quen với React.js, Vue.js hoặc Angular",
          courses: ["React Fundamentals", "State Management", "Component Architecture"],
          duration: "6-8 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 4,
          title: "Tools & Workflow",
          description: "Học cách sử dụng các công cụ phát triển và quy trình làm việc",
          courses: ["Git & GitHub", "Webpack", "Package Managers (npm/yarn)"],
          duration: "2-3 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 5,
          title: "Front-end nâng cao",
          description: "Học các kỹ thuật nâng cao và tối ưu hóa hiệu suất",
          courses: ["Performance Optimization", "Advanced React Patterns", "Testing (Jest, RTL)"],
          duration: "6-8 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 6,
          title: "Dự án thực tế",
          description: "Xây dựng portfolio với các dự án thực tế",
          courses: ["E-commerce Project", "Social Media Application", "Real-time Dashboard"],
          duration: "8-10 tuần",
          isActive: false,
          isCompleted: false,
        },
      ],
    },
    backend: {
      title: "Back-end Development",
      description: "Lộ trình học để trở thành nhà phát triển Back-end chuyên nghiệp",
      icon: ServerIcon,
      color: "bg-violet-500",
      timeToComplete: "8-10 tháng",
      level: "Cơ bản đến nâng cao",
      steps: [
        {
          id: 1,
          title: "Nền tảng lập trình",
          description: "Học cơ bản về ngôn ngữ lập trình back-end (JavaScript/Node.js, Python, Java, PHP)",
          courses: ["Programming Fundamentals", "Algorithm Basics", "Data Structures"],
          duration: "6-8 tuần",
          isActive: true,
          isCompleted: false,
        },
        {
          id: 2,
          title: "Cơ sở dữ liệu",
          description: "Tìm hiểu về SQL và NoSQL databases",
          courses: ["SQL Fundamentals", "Database Design", "MongoDB Basics"],
          duration: "4-6 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 3,
          title: "Web server & API",
          description: "Học cách xây dựng web server và RESTful APIs",
          courses: ["Node.js & Express", "REST API Design", "Authentication & Authorization"],
          duration: "6-8 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 4,
          title: "DevOps cơ bản",
          description: "Làm quen với các công cụ DevOps và deployment",
          courses: ["Docker Basics", "CI/CD Pipelines", "Cloud Services (AWS/GCP/Azure)"],
          duration: "4-6 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 5,
          title: "Back-end nâng cao",
          description: "Học các kỹ thuật nâng cao và tối ưu hóa hiệu suất",
          courses: ["Microservices Architecture", "Caching Strategies", "Performance Optimization"],
          duration: "6-8 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 6,
          title: "Bảo mật & Testing",
          description: "Hiểu về bảo mật web và kỹ thuật testing",
          courses: ["Web Security", "Unit & Integration Testing", "Load Testing"],
          duration: "4-6 tuần",
          isActive: false,
          isCompleted: false,
        },
      ],
    },
    mobile: {
      title: "Mobile Development",
      description: "Lộ trình học để trở thành nhà phát triển ứng dụng di động",
      icon: DevicePhoneMobileIcon,
      color: "bg-sky-500",
      timeToComplete: "8-10 tháng",
      level: "Trung cấp đến nâng cao",
      steps: [
        {
          id: 1,
          title: "Cơ bản lập trình",
          description: "Học cơ bản về lập trình và ngôn ngữ cần thiết (JavaScript, Java, Swift, Dart)",
          courses: ["Programming Fundamentals", "Object-Oriented Programming", "UI/UX Basics"],
          duration: "6-8 tuần",
          isActive: true,
          isCompleted: false,
        },
        {
          id: 2,
          title: "Cross-platform Development",
          description: "Học React Native hoặc Flutter để phát triển đa nền tảng",
          courses: ["React Native Basics", "Flutter Fundamentals", "Navigation & State Management"],
          duration: "6-8 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 3,
          title: "Native Development",
          description: "Tìm hiểu về phát triển native cho iOS (Swift) hoặc Android (Kotlin)",
          courses: ["iOS Development with Swift", "Android Development with Kotlin"],
          duration: "8-10 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 4,
          title: "Mobile UI/UX",
          description: "Thiết kế giao diện người dùng di động hiệu quả",
          courses: ["Mobile UI Design", "UX Best Practices", "Animation & Interaction"],
          duration: "4-6 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 5,
          title: "Backend Integration",
          description: "Kết nối ứng dụng di động với backend và APIs",
          courses: ["RESTful API Integration", "Mobile Authentication", "Offline Storage"],
          duration: "4-6 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 6,
          title: "Publishing & Monetization",
          description: "Xuất bản ứng dụng lên App Store, Google Play và kiếm tiền",
          courses: ["App Store Submission", "Google Play Deployment", "Monetization Strategies"],
          duration: "2-4 tuần",
          isActive: false,
          isCompleted: false,
        },
      ],
    },
    devops: {
      title: "DevOps & Cloud",
      description: "Lộ trình học để trở thành chuyên gia DevOps và Cloud",
      icon: GlobeAltIcon,
      color: "bg-amber-500",
      timeToComplete: "10-12 tháng",
      level: "Trung cấp đến nâng cao",
      steps: [
        {
          id: 1,
          title: "Nền tảng Linux & Networking",
          description: "Học cơ bản về hệ điều hành Linux và mạng máy tính",
          courses: ["Linux Administration", "Networking Fundamentals", "Shell Scripting"],
          duration: "6-8 tuần",
          isActive: true,
          isCompleted: false,
        },
        {
          id: 2,
          title: "Containerization",
          description: "Tìm hiểu về Docker và container orchestration",
          courses: ["Docker Fundamentals", "Kubernetes Basics", "Container Security"],
          duration: "6-8 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 3,
          title: "CI/CD & Automation",
          description: "Học cách thiết lập CI/CD pipelines và tự động hóa",
          courses: ["Jenkins", "GitHub Actions", "Infrastructure as Code (Terraform)"],
          duration: "6-8 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 4,
          title: "Cloud Platforms",
          description: "Làm quen với các nền tảng cloud chính",
          courses: ["AWS Essentials", "Azure Fundamentals", "Google Cloud Platform"],
          duration: "8-10 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 5,
          title: "Monitoring & Logging",
          description: "Triển khai các giải pháp giám sát và logging",
          courses: ["Prometheus & Grafana", "ELK Stack", "Distributed Tracing"],
          duration: "4-6 tuần",
          isActive: false,
          isCompleted: false,
        },
        {
          id: 6,
          title: "Security & Compliance",
          description: "Bảo mật và tuân thủ trong môi trường cloud",
          courses: ["Cloud Security", "Compliance in DevOps", "Security Automation"],
          duration: "4-6 tuần",
          isActive: false,
          isCompleted: false,
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 pt-16 pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-600 opacity-90"></div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0, 0 100%)" }}></div>
        
        <div className="container relative mx-auto px-4">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight"
            >
              Lộ trình học tập
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-lg md:text-xl mb-10 text-indigo-100 leading-relaxed max-w-3xl mx-auto"
            >
              Khám phá lộ trình học tập toàn diện, được thiết kế bởi chuyên gia để giúp bạn đạt được mục tiêu nghề nghiệp trong lĩnh vực công nghệ.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Roadmap Selection */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {Object.keys(roadmaps).map((key) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRoadmap(key)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedRoadmap === key
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center">
                  {React.createElement(roadmaps[key].icon, { className: "w-5 h-5 mr-2" })}
                  {roadmaps[key].title}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Current Roadmap Details */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-xl ${roadmaps[selectedRoadmap].color} flex items-center justify-center`}>
                {React.createElement(roadmaps[selectedRoadmap].icon, { className: "w-8 h-8 text-white" })}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{roadmaps[selectedRoadmap].title}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">{roadmaps[selectedRoadmap].description}</p>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  <span>{roadmaps[selectedRoadmap].timeToComplete}</span>
                </div>
                <div className="flex items-center">
                  <AcademicCapIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  <span>{roadmaps[selectedRoadmap].level}</span>
                </div>
                <div className="flex items-center">
                  <BookOpenIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  <span>{roadmaps[selectedRoadmap].steps.length} giai đoạn</span>
                </div>
              </div>
            </div>

            {/* Roadmap Steps */}
            <div className="max-w-5xl mx-auto">
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
                
                {roadmaps[selectedRoadmap].steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative mb-16 last:mb-0"
                  >
                    <div className={`absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white ${
                      step.isCompleted ? "bg-green-500" : step.isActive ? roadmaps[selectedRoadmap].color : "bg-gray-300"
                    }`}>
                      {step.isCompleted ? (
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white font-bold">{step.id}</span>
                      )}
                    </div>
                    
                    <div className={`bg-white rounded-xl shadow-lg border ${
                      step.isActive ? "border-indigo-200" : "border-gray-100"
                    } p-6 ml-12 lg:ml-0 ${
                      index % 2 === 0 ? "lg:mr-auto lg:ml-0 lg:text-right lg:pr-12" : "lg:ml-auto lg:mr-0 lg:pl-12"
                    } lg:w-5/12`}>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Khóa học đề xuất:</h4>
                        <ul className="space-y-1">
                          {step.courses.map((course, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircleIcon className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0 mt-0.5" />
                              <span>{course}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {step.duration}
                        </div>
                        
                        <button
                          onClick={() => navigate("/courses")}
                          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                            step.isActive
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {step.isCompleted ? "Xem lại" : "Khám phá"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <h2 className="text-2xl font-bold mb-4">Bắt đầu hành trình học tập của bạn</h2>
                <p className="mb-6">
                  Đăng ký tài khoản để lưu lại lộ trình học tập và theo dõi tiến độ của bạn.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    <span>Lộ trình học được cá nhân hóa</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    <span>Theo dõi tiến độ học tập</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    <span>Nhận chứng chỉ hoàn thành</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate("/register")}
                  className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                >
                  Đăng ký ngay
                </button>
              </div>
              <div className="p-10">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Bạn cần tư vấn?</h3>
                <p className="text-gray-600 mb-6">
                  Không chắc chắn về lộ trình học nào phù hợp với bạn? Hãy để chúng tôi giúp bạn lựa chọn con đường sự nghiệp phù hợp nhất.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <UserGroupIcon className="w-10 h-10 text-indigo-600 mr-4" />
                    <div>
                      <h4 className="font-medium text-gray-900">Tư vấn miễn phí</h4>
                      <p className="text-sm text-gray-600">
                        Đặt lịch tư vấn 1:1 với chuyên gia
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <LightBulbIcon className="w-10 h-10 text-indigo-600 mr-4" />
                    <div>
                      <h4 className="font-medium text-gray-900">Đánh giá năng lực</h4>
                      <p className="text-sm text-gray-600">
                        Làm bài test đánh giá năng lực miễn phí
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => navigate("/contact")}
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  >
                    Liên hệ tư vấn <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Câu hỏi thường gặp
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Giải đáp những thắc mắc phổ biến về lộ trình học tập
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  question: "Làm thế nào để chọn lộ trình học phù hợp?",
                  answer: "Việc chọn lộ trình phụ thuộc vào mục tiêu nghề nghiệp, sở thích và kỹ năng hiện tại của bạn. Bạn có thể đánh giá năng lực hoặc liên hệ với đội ngũ tư vấn của chúng tôi để được hướng dẫn cụ thể."
                },
                {
                  question: "Mất bao lâu để hoàn thành một lộ trình?",
                  answer: "Thời gian hoàn thành mỗi lộ trình khác nhau, thường từ 6-12 tháng tùy thuộc vào lộ trình và thời gian bạn dành cho việc học. Bạn có thể học theo tốc độ riêng và không có thời hạn cố định để hoàn thành."
                },
                {
                  question: "Tôi cần kiến thức nền tảng gì trước khi bắt đầu?",
                  answer: "Hầu hết các lộ trình đều bắt đầu từ cơ bản và không yêu cầu kiến thức chuyên sâu. Tuy nhiên, việc có nền tảng về máy tính cơ bản và tư duy logic sẽ rất hữu ích."
                },
                {
                  question: "Tôi có thể chuyển đổi giữa các lộ trình không?",
                  answer: "Có, bạn có thể chuyển đổi giữa các lộ trình bất cứ lúc nào. Nhiều khóa học cơ bản còn được dùng chung cho nhiều lộ trình khác nhau nên việc chuyển đổi sẽ không làm mất tiến độ của bạn."
                },
                {
                  question: "Tôi có nhận được hỗ trợ trong quá trình học không?",
                  answer: "Tất nhiên! Chúng tôi cung cấp hỗ trợ thông qua diễn đàn cộng đồng, phiên hỏi đáp trực tiếp với giảng viên, và nhóm học tập. Bạn sẽ không đơn độc trong hành trình học tập của mình."
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Roadmaps; 
