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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-25">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight"
              >
                <span className="text-slate-900">Thành thạo</span>{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600">
                  Công nghệ
                </span>
                <br />
                <span className="text-slate-900">Tạo dựng</span>{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600">
                  Tương lai
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl mb-12 text-slate-600 leading-relaxed max-w-2xl"
              >
                Khám phá hơn <span className="text-slate-900 font-bold">500+</span> khóa học IT chất lượng cao. 
                Học từ các chuyên gia hàng đầu và xây dựng sự nghiệp công nghệ thành công.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-6 mb-12"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/courses")}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <PlayIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Bắt đầu học ngay
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/roadmaps")}
                  className="group px-8 py-4 border-2 border-slate-300 bg-white/80 backdrop-blur-sm text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
                >
                  <AcademicCapIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Xem lộ trình
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-3 gap-8 max-w-lg mx-auto lg:mx-0"
              >
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900 mb-1">10K+</div>
                  <div className="text-slate-600 text-sm">Học viên</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900 mb-1">500+</div>
                  <div className="text-slate-600 text-sm">Khóa học</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900 mb-1">98%</div>
                  <div className="text-slate-600 text-sm">Hài lòng</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Enhanced Quotes Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-200 shadow-2xl">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl rotate-12"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl -rotate-12"></div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuoteIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
                      <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
                    </div>
                    <blockquote className="text-xl md:text-2xl text-slate-700 mb-8 italic font-medium leading-relaxed">
                      "{famousQuotes[currentQuoteIndex].quote}"
                    </blockquote>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{famousQuotes[currentQuoteIndex].author}</p>
                      <p className="text-slate-600">{famousQuotes[currentQuoteIndex].role}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex justify-center mt-8 gap-3">
                  {famousQuotes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuoteIndex(index)}
                      className={`h-3 rounded-full transition-all duration-300 ${
                        index === currentQuoteIndex 
                          ? "bg-gradient-to-r from-blue-500 to-violet-600 w-8" 
                          : "bg-slate-300 hover:bg-slate-400 w-3"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center px-6 py-3 mb-6 rounded-full bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200/50 shadow-lg">
              <FireIcon className="w-5 h-5 mr-2 text-orange-600" />
              <span className="text-orange-800 font-semibold">Khóa học được yêu thích nhất</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Khóa học <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">phổ biến</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Bắt đầu hành trình học tập với những khóa học được hàng nghìn học viên lựa chọn
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              // Enhanced Loading skeleton
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="group">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200/50 animate-pulse">
                    <div className="h-56 bg-slate-200"></div>
                    <div className="p-6">
                      <div className="h-6 bg-slate-200 rounded-xl w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded-lg w-full mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded-lg w-2/3 mb-6"></div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-4 bg-slate-200 rounded-lg w-20"></div>
                        <div className="h-4 bg-slate-200 rounded-lg w-16"></div>
                      </div>
                      <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              popularCourses.map((course, index) => (
                <motion.div
                  key={course.CourseID || course.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{
                    y: -10,
                    transition: { duration: 0.3 },
                  }}
                  className="group relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-600 rounded-3xl blur opacity-0 group-hover:opacity-15 transition duration-300"></div>
                  <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300 border border-slate-200/50">
                    <div className="relative overflow-hidden">
                      <img
                        src={course.ImageUrl || course.thumbnail || 'https://placehold.co/600x400?text=No+Image'}
                        alt={course.Title || course.title}
                        className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-bold rounded-full shadow-lg">
                          {course.Level || 'All Levels'}
                        </span>
                      </div>
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-white text-sm font-semibold bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                            4.9
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {course.Title || course.title}
                      </h3>
                      <p className="text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                        {course.ShortDescription || course.Description || course.description || 'Không có mô tả'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                        <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5">
                          <UserGroupIcon className="h-4 w-4 mr-1.5 text-blue-500" />
                          <span className="font-semibold">{course.EnrolledCount || 0}</span>
                        </div>
                        <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5">
                          <ClockIcon className="h-4 w-4 mr-1.5 text-violet-500" />
                          <span className="font-semibold">{course.Duration || 0}h</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/courses/${course.CourseID || course.id}`)}
                        className="group/btn w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                      >
                        Xem chi tiết
                        <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <button
              onClick={() => navigate("/courses")}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-slate-900/25"
            >
              Khám phá tất cả khóa học
              <ChevronRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center px-6 py-3 mb-6 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200/50 shadow-lg">
              <BoltIcon className="w-5 h-5 mr-2 text-indigo-600" />
              <span className="text-indigo-800 font-semibold">Tính năng vượt trội</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Tại sao chọn <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Campus Learning</span>?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Nền tảng học tập toàn diện với công nghệ AI tiên tiến và phương pháp giảng dạy hiện đại
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-15 transition duration-300"></div>
                <div className="relative bg-white p-8 rounded-3xl border border-slate-200/50 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  
                  {/* Hover effect decoration */}
                  <div className="absolute top-6 right-6 w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="inline-flex items-center space-x-2 text-slate-600 mb-4">
              <CheckBadgeIcon className="w-5 h-5 text-green-500" />
              <span>Được tin tưởng bởi hơn 10,000+ học viên</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-slate-100 border border-slate-200">
              <TrophyIcon className="w-5 h-5 mr-2 text-amber-500" />
              <span className="text-slate-800 font-semibold">Thành tích ấn tượng</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Những con số biết nói
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Minh chứng cho chất lượng và sự tin tưởng từ cộng đồng học viên
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="text-center group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white border border-slate-200 rounded-3xl p-8 group-hover:bg-slate-50 transition-all duration-300 shadow-lg">
                  <div className="text-5xl md:text-6xl font-black text-blue-600 mb-3">
                    10K+
                  </div>
                  <div className="text-slate-800 font-semibold text-lg">Học viên</div>
                  <div className="text-slate-600 text-sm mt-1">Đang học tập</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="text-center group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-100 to-purple-100 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white border border-slate-200 rounded-3xl p-8 group-hover:bg-slate-50 transition-all duration-300 shadow-lg">
                  <div className="text-5xl md:text-6xl font-black text-violet-600 mb-3">
                    500+
                  </div>
                  <div className="text-slate-800 font-semibold text-lg">Khóa học</div>
                  <div className="text-slate-600 text-sm mt-1">Chất lượng cao</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="text-center group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white border border-slate-200 rounded-3xl p-8 group-hover:bg-slate-50 transition-all duration-300 shadow-lg">
                  <div className="text-5xl md:text-6xl font-black text-emerald-600 mb-3">
                    100+
                  </div>
                  <div className="text-slate-800 font-semibold text-lg">Giảng viên</div>
                  <div className="text-slate-600 text-sm mt-1">Chuyên gia hàng đầu</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="text-center group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-pink-100 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white border border-slate-200 rounded-3xl p-8 group-hover:bg-slate-50 transition-all duration-300 shadow-lg">
                  <div className="text-5xl md:text-6xl font-black text-orange-600 mb-3">
                    98%
                  </div>
                  <div className="text-slate-800 font-semibold text-lg">Hài lòng</div>
                  <div className="text-slate-600 text-sm mt-1">Đánh giá 5 sao</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">1M+</div>
              <div className="text-slate-600">Giờ học đã hoàn thành</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">50K+</div>
              <div className="text-slate-600">Dự án thực tế</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">95%</div>
              <div className="text-slate-600">Tỷ lệ có việc làm</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Học viên nói gì về <span className="text-indigo-600">chúng tôi</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Những đánh giá từ học viên đã tham gia các khóa học của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
            >
              <div className="flex items-center mb-4">
                <img 
                  src="https://randomuser.me/api/portraits/men/32.jpg" 
                  alt="Nguyễn Văn An"
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">Nguyễn Văn An</h4>
                  <p className="text-sm text-gray-500">Học viên khóa Back-end</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-3">
                "Tôi rất ấn tượng với cách giảng dạy chuyên nghiệp. Các bài giảng được thiết kế logic và dễ hiểu. Sau khóa học, tôi đã tự tin làm việc với Node.js và Express."
              </p>
              <p className="text-sm text-gray-500">Tháng 1, 2024</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
            >
              <div className="flex items-center mb-4">
                <img 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="Trần Thị Minh"
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">Trần Thị Minh</h4>
                  <p className="text-sm text-gray-500">Học viên khóa UX/UI Design</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-3">
                "Khóa học đã giúp tôi hiểu sâu về nguyên tắc thiết kế và quy trình làm việc UX/UI. Các project thực tế rất hữu ích cho portfolio của tôi."
              </p>
              <p className="text-sm text-gray-500">Tháng 2, 2024</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
            >
              <div className="flex items-center mb-4">
                <img 
                  src="https://randomuser.me/api/portraits/men/75.jpg" 
                  alt="Lê Hoàng Nam"
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">Lê Hoàng Nam</h4>
                  <p className="text-sm text-gray-500">Học viên khóa DevOps</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-3">
                "Kiến thức DevOps được truyền đạt rất thực tế. Tôi đã học được cách sử dụng Docker, CI/CD và các công cụ cloud hiện đại. Rất hài lòng với khóa học."
              </p>
              <p className="text-sm text-gray-500">Tháng 3, 2024</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Sẵn sàng bắt đầu hành trình học tập của bạn?
            </h2>
            <p className="text-xl text-indigo-100 mb-10">
              Tham gia ngay để trải nghiệm phương pháp học tập hiện đại và hiệu quả
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Đăng ký ngay
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/courses")}
                className="px-8 py-4 border border-white bg-transparent text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Xem khóa học
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                  <CodeBracketIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Campus Learning</span>
              </div>
              <p className="text-gray-600 mb-6">
                Nền tảng học tập trực tuyến hàng đầu, giúp bạn phát triển kỹ năng và kiến thức một cách hiệu quả.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.074-4.947c-.061-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.844 0-3.196.016-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">Liên kết nhanh</h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/courses" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                    Khóa học
                  </Link>
                </li>
                <li>
                  <Link to="/roadmaps" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                    Lộ trình học tập
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                    Về chúng tôi
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">Hỗ trợ</h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/support/faq" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                    Câu hỏi thường gặp
                  </Link>
                </li>
                <li>
                  <Link to="/support/help-center" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link to="/support/privacy-policy" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link to="/support/terms-of-use" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                    Điều khoản sử dụng
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">Liên hệ</h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-indigo-600 mt-1 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                  <span className="text-gray-600">123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-indigo-600 mt-1 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                  </svg>
                  <span className="text-gray-600">contact@Campus Learning.vn</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-indigo-600 mt-1 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  <span className="text-gray-600">(84) 123 456 789</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-12 pt-8 text-center">
            <p className="text-gray-600">© {new Date().getFullYear()} Campus Learning. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
