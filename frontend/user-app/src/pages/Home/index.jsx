"use client"

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchEnrolledCourses, addEnrolledCourse, loadCachedAllCourses, preloadAllCourses } from '@/store/slices/courseSlice';
import courseApi from '@/api/courseApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpenIcon,
  UserGroupIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  PlayIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  LightBulbIcon,
  ServerIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  CommandLineIcon,
  StarIcon,
  SparklesIcon,
  AcademicCapIcon,
  TrophyIcon,
  ClockIcon,
  CheckBadgeIcon,
  FireIcon,
  BoltIcon,
} from "@heroicons/react/24/outline"
import { setUser } from '@/store/slices/authSlice';

const Home = () => {
  const navigate = useNavigate()
  const { currentUser, isAuthenticated } = useAuth()
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [popularCourses, setPopularCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch();
  const userFromRedux = useSelector(state => state.auth.user);
  const [authChecked, setAuthChecked] = useState(false);

  // Load user data from localStorage if not in Redux - only once
  useEffect(() => {
    if (!userFromRedux || Object.keys(userFromRedux).length === 0) {
      const userDataString = localStorage.getItem('user');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          dispatch(setUser(userData));
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
        }
      }
    }
  }, [dispatch, userFromRedux]);

  // Redirect if not authenticated - only once
  useEffect(() => {
    if (!authChecked) {
      if (!isAuthenticated && !localStorage.getItem('token')) {
        navigate('/login', { replace: true });
      }
      setAuthChecked(true);
    }
  }, [isAuthenticated, navigate, authChecked]);

  const famousQuotes = [
    {
      quote:
        "Mọi người nghĩ rằng khoa học máy tính là nghệ thuật của những thiên tài, nhưng thực tế ngược lại, chỉ là nhiều người làm việc cùng nhau, giống như xây dựng một bức tường gạch nhỏ.",
      author: "Alan Kay",
      role: "Nhà khoa học máy tính",
    },
    {
      quote: "Đoạn code đầu tiên mà bạn viết sẽ luôn là đoạn code tồi tệ nhất.",
      author: "Jeff Atwood",
      role: "Đồng sáng lập Stack Overflow",
    },
    {
      quote: "Học lập trình không phải là học ngôn ngữ, mà là học cách giải quyết vấn đề.",
      author: "Edsger W. Dijkstra",
      role: "Nhà khoa học máy tính",
    },
    {
      quote: "Máy tính tốt nhất là máy tính trong đầu bạn.",
      author: "Alan Turing",
      role: "Cha đẻ của khoa học máy tính",
    },
    {
      quote: "Đừng sợ thất bại, hãy sợ việc không thử.",
      author: "Linus Torvalds",
      role: "Người tạo ra Linux",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex === famousQuotes.length - 1 ? 0 : prevIndex + 1))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchPopularCourses = async () => {
      try {
        const response = await courseApi.getAllCourses()
        if (response.data && response.data.success) {
          // Lọc và sắp xếp các khóa học theo số lượng học viên
          const courses = response.data.data || []
          const sortedCourses = courses
            .sort((a, b) => (b.EnrolledCount || 0) - (a.EnrolledCount || 0))
            .slice(0, 4) // Lấy 4 khóa học phổ biến nhất
          
          setPopularCourses(sortedCourses)
        }
      } catch (error) {
        console.error('Error fetching popular courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularCourses()
  }, [])

  const courses = [
    {
      title: "Front-end Development",
      description: "HTML, CSS, JavaScript, React, Vue và nhiều công nghệ khác",
      icon: CodeBracketIcon,
      color: "bg-rose-500",
      students: "5,234",
      level: "Cơ bản đến nâng cao",
    },
    {
      title: "Back-end Development",
      description: "Node.js, Python, Java, PHP, SQL và các framework phổ biến",
      icon: ServerIcon,
      color: "bg-violet-500",
      students: "4,129",
      level: "Cơ bản đến nâng cao",
    },
    {
      title: "Mobile Development",
      description: "React Native, Flutter, Swift, Kotlin cho phát triển ứng dụng di động",
      icon: DevicePhoneMobileIcon,
      color: "bg-sky-500",
      students: "3,876",
      level: "Trung cấp",
    },
    {
      title: "DevOps & Cloud",
      description: "Docker, Kubernetes, AWS, Azure, CI/CD và quản lý hạ tầng",
      icon: GlobeAltIcon,
      color: "bg-amber-500",
      students: "2,543",
      level: "Nâng cao",
    },
  ]

  const features = [
    {
      title: "Học tập thông minh",
      description: "Hệ thống học tập thông minh với AI giúp bạn tiếp thu kiến thức hiệu quả hơn",
      icon: LightBulbIcon,
    },
    {
      title: "Nội dung chất lượng",
      description: "Kho tài liệu phong phú, được biên soạn bởi các chuyên gia hàng đầu trong ngành",
      icon: BookOpenIcon,
    },
    {
      title: "Thực hành trực tuyến",
      description: "Môi trường thực hành code trực tuyến với các bài tập và dự án thực tế",
      icon: CommandLineIcon,
    },
    {
      title: "Cộng đồng học tập",
      description: "Kết nối và trao đổi với cộng đồng người học và chuyên gia trên toàn quốc",
      icon: UserGroupIcon,
    },
    {
      title: "Chứng chỉ công nghiệp",
      description: "Nhận chứng chỉ được công nhận bởi các công ty công nghệ hàng đầu",
      icon: ShieldCheckIcon,
    },
    {
      title: "Lộ trình cá nhân hóa",
      description: "Xây dựng lộ trình học tập phù hợp với mục tiêu và trình độ của bạn",
      icon: RocketLaunchIcon,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Apple Style */}
      <section className="relative overflow-hidden bg-white py-32">
        <div className="max-w-[1120px] mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 leading-none"
            >
              Thành thạo công nghệ.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Tạo dựng tương lai.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-xl md:text-2xl mb-12 text-gray-600 font-light max-w-3xl mx-auto"
            >
              Khám phá hơn <span className="text-black font-normal">500+</span> khóa học IT chất lượng cao. 
              Học từ các chuyên gia hàng đầu và xây dựng sự nghiệp công nghệ thành công.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex justify-center gap-4 mb-20"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/courses")}
                className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg shadow-sm transition-all duration-300 flex items-center justify-center gap-2"
              >
                Khám phá ngay
                <ChevronRightIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/roadmaps")}
                className="px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 flex items-center justify-center gap-2 text-blue-600"
              >
                Xem lộ trình
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80" 
                alt="Campus Learning Platform"
                className="mx-auto rounded-2xl shadow-2xl w-full max-w-5xl object-cover"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Apple Style */}
      <section className="py-24 bg-white">
        <div className="max-w-[1120px] mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-16"
          >
            <div>
              <div className="text-5xl font-medium text-gray-900 mb-4">10K+</div>
              <div className="text-gray-500 text-lg">Học viên</div>
            </div>
            <div>
              <div className="text-5xl font-medium text-gray-900 mb-4">500+</div>
              <div className="text-gray-500 text-lg">Khóa học</div>
            </div>
            <div>
              <div className="text-5xl font-medium text-gray-900 mb-4">98%</div>
              <div className="text-gray-500 text-lg">Hài lòng</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quotes Section - Apple Style */}
      <section className="py-24 bg-white">
        <div className="max-w-[900px] mx-auto px-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <blockquote className="text-3xl md:text-4xl text-gray-900 mb-8 font-light leading-tight">
                "{famousQuotes[currentQuoteIndex].quote}"
              </blockquote>
              <div>
                <p className="text-xl font-medium text-gray-900">{famousQuotes[currentQuoteIndex].author}</p>
                <p className="text-gray-500">{famousQuotes[currentQuoteIndex].role}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-center mt-12 gap-3">
            {famousQuotes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuoteIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentQuoteIndex 
                    ? "bg-gray-900 w-6" 
                    : "bg-gray-300 hover:bg-gray-400 w-2.5"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses - Apple Style */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-[1120px] mx-auto px-8 mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 tracking-tight">
              Khóa học phổ biến
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
              Bắt đầu hành trình học tập với những khóa học được yêu thích nhất
            </p>
          </motion.div>
        </div>

        <div className="w-full flex justify-center items-center">
          <div className="grid grid-cols-2 gap-1 w-full mx-6 md:mx-12 max-w-[1440px] md:max-w-[90%] lg:max-w-[80%]">
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="animate-pulse relative">
                  <div className="relative aspect-[4/3] bg-gray-200">
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="absolute bottom-4 left-4">
                        <div className="h-6 w-40 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 w-48 bg-gray-300/70 rounded mb-4"></div>
                        <div className="flex gap-2">
                          <div className="h-8 w-24 bg-blue-300 rounded-full"></div>
                          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              popularCourses.slice(0, 4).map((course, index) => (
                <motion.div
                  key={course.CourseID || course.id + '-' + index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="group relative cursor-pointer overflow-hidden h-full"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={course.ImageUrl || course.thumbnail || 'https://placehold.co/600x400?text=No+Image'}
                      alt={course.Title || course.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {course.Title || course.title}
                        </h3>
                        <p className="text-sm text-white/80 font-light mb-4 line-clamp-1">
                          {course.ShortDescription || course.Description || course.description || 'Nâng cao kỹ năng của bạn'}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/courses/${course.CourseID || course.id}`);
                            }}
                            className="bg-blue-600 text-white text-sm font-medium py-1.5 px-4 rounded-full hover:bg-blue-500 transition-colors"
                          >
                            Tìm hiểu thêm
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                          >
                            <ChevronRightIcon className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="max-w-[1120px] mx-auto px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <button
              onClick={() => navigate("/courses")}
              className="inline-flex items-center px-8 py-4 bg-black text-white font-medium rounded-full transition-all duration-300 hover:opacity-80"
            >
              Xem tất cả khóa học
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Apple Style */}
      <section className="py-40 bg-white">
        <div className="max-w-[1120px] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-6">
              Tại sao chọn Campus Learning?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
              Nền tảng học tập toàn diện với công nghệ AI tiên tiến và phương pháp giảng dạy hiện đại
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="mb-6">
                  <feature.icon className="h-12 w-12 text-gray-900" />
                </div>
                <h3 className="text-2xl font-medium text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-light">{feature.description}</p>
                <div className="mt-6 w-12 h-0.5 bg-gray-200 group-hover:bg-gray-900 transition-colors duration-300"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Apple Style */}
      <section className="py-40 bg-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=80"
            alt="Background pattern"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-[800px] mx-auto px-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 mb-8 leading-tight"
            >
              Sẵn sàng bắt đầu hành trình học tập?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-gray-500 mb-12 max-w-2xl font-light"
            >
              Tham gia ngay để trải nghiệm phương pháp học tập hiện đại và hiệu quả
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg transition-all duration-300 hover:opacity-80"
              >
                Đăng ký ngay
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/courses")}
                className="px-8 py-4 text-blue-600 rounded-full font-medium text-lg transition-all duration-300"
              >
                Xem khóa học
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Apple Style */}
      <footer className="py-16 bg-gray-50">
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <CodeBracketIcon className="h-5 w-5 text-gray-900" />
                <span className="text-lg font-medium text-gray-900">Campus Learning</span>
              </div>
              <p className="text-gray-500 mb-6 max-w-sm font-light">
                Nền tảng học tập trực tuyến hàng đầu, giúp bạn phát triển kỹ năng và kiến thức một cách hiệu quả.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-gray-900 mb-5 uppercase tracking-wider">Liên kết nhanh</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/courses" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    Khóa học
                  </Link>
                </li>
                <li>
                  <Link to="/roadmaps" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    Lộ trình học tập
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    Về chúng tôi
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-gray-900 mb-5 uppercase tracking-wider">Hỗ trợ</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/support/faq" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    Câu hỏi thường gặp
                  </Link>
                </li>
                <li>
                  <Link to="/support/help-center" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link to="/support/privacy-policy" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link to="/support/terms-of-use" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    Điều khoản sử dụng
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-gray-900 mb-5 uppercase tracking-wider">Liên hệ</h4>
              <ul className="space-y-3">
                <li className="flex items-start text-gray-500 text-sm">
                  <span className="block">123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh</span>
                </li>
                <li className="text-gray-500 text-sm">
                  <a href="mailto:contact@campuslearning.vn" className="hover:text-gray-900 transition-colors">
                    contact@campuslearning.vn
                  </a>
                </li>
                <li className="text-gray-500 text-sm">
                  <a href="tel:84123456789" className="hover:text-gray-900 transition-colors">
                    (84) 123 456 789
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Campus Learning. All rights reserved.</p>
            <div className="flex mt-4 md:mt-0 gap-6">
              <Link to="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                Chính sách riêng tư
              </Link>
              <Link to="/terms" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                Điều khoản sử dụng
              </Link>
              <Link to="/sitemap" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                Bản đồ trang
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
