"use client"

import { useEffect, useState, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchEvents, setFilters, clearCurrentEvent } from "@/store/slices/eventSlice"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import {
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  AcademicCapIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
  ClockIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ServerIcon,
  MagnifyingGlassIcon,
  ArrowUpRightIcon,
  StarIcon,
  BoltIcon,
  FireIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  ChevronRightIcon,
  PlusIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline"
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid"

// Difficulty badges with updated purple theme
const DifficultyBadge = ({ difficulty }) => {
  const badges = {
    beginner: {
      icon: <StarIcon className="w-3.5 h-3.5" />,
      label: "Beginner",
      class: "bg-white text-purple-700 border border-purple-200 shadow-sm",
    },
    intermediate: {
      icon: <StarIconSolid className="w-3.5 h-3.5" />,
      label: "Intermediate",
      class: "bg-white text-amber-700 border border-amber-200 shadow-sm",
    },
    advanced: {
      icon: <BoltIcon className="w-3.5 h-3.5" />,
      label: "Advanced",
      class: "bg-white text-orange-700 border border-orange-200 shadow-sm",
    },
    expert: {
      icon: <FireIcon className="w-3.5 h-3.5" />,
      label: "Expert",
      class: "bg-white text-red-700 border border-red-200 shadow-sm",
    },
  }

  const badge = badges[difficulty] || badges.beginner

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${badge.class}`}>
      {badge.icon}
      {badge.label}
    </span>
  )
}

// Status badges with updated purple theme
const StatusBadge = ({ status }) => {
  const badges = {
    upcoming: {
      label: "Sắp diễn ra",
      class: "bg-white text-blue-700 border border-blue-200 shadow-sm",
    },
    ongoing: {
      label: "Đang diễn ra",
      class: "bg-white text-purple-700 border border-purple-200 shadow-sm",
    },
    completed: {
      label: "Đã kết thúc",
      class: "bg-white text-gray-700 border border-gray-200 shadow-sm",
    },
    cancelled: {
      label: "Đã hủy",
      class: "bg-white text-red-700 border border-red-200 shadow-sm",
    },
  }

  const badge = badges[status] || badges.upcoming

  return <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${badge.class}`}>{badge.label}</span>
}

// Category chip with updated purple theme
const CategoryChip = ({ category }) => {
  const categories = {
    "Competitive Programming": {
      icon: <RocketLaunchIcon className="w-3.5 h-3.5" />,
      class: "bg-white text-purple-700 border border-purple-200 shadow-sm",
    },
    Hackathon: {
      icon: <ClockIcon className="w-3.5 h-3.5" />,
      class: "bg-white text-blue-700 border border-blue-200 shadow-sm",
    },
    "Web Development": {
      icon: <ComputerDesktopIcon className="w-3.5 h-3.5" />,
      class: "bg-white text-indigo-700 border border-indigo-200 shadow-sm",
    },
    "AI/ML": {
      icon: <SparklesIcon className="w-3.5 h-3.5" />,
      class: "bg-white text-pink-700 border border-pink-200 shadow-sm",
    },
    "Mobile Development": {
      icon: <DevicePhoneMobileIcon className="w-3.5 h-3.5" />,
      class: "bg-white text-cyan-700 border border-cyan-200 shadow-sm",
    },
    DevOps: {
      icon: <ServerIcon className="w-3.5 h-3.5" />,
      class: "bg-white text-emerald-700 border border-emerald-200 shadow-sm",
    },
    Security: {
      icon: <ShieldCheckIcon className="w-3.5 h-3.5" />,
      class: "bg-white text-red-700 border border-red-200 shadow-sm",
    },
  }

  const chip = categories[category] || {
    icon: <AcademicCapIcon className="w-3.5 h-3.5" />,
    class: "bg-white text-gray-700 border border-gray-200 shadow-sm",
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${chip.class}`}>
      {chip.icon}
      {category}
    </span>
  )
}

// Skeleton loading component for events
const EventCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden animate-pulse shadow-sm border border-gray-100">
    <div className="aspect-[16/9] bg-gray-100"></div>
    <div className="p-6">
      <div className="space-y-4">
        <div className="h-7 bg-gray-100 rounded-lg w-3/4"></div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-100 rounded-md w-20"></div>
          <div className="h-5 bg-gray-100 rounded-md w-24"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-4 bg-gray-100 rounded-md"></div>
          <div className="h-4 bg-gray-100 rounded-md"></div>
          <div className="h-4 bg-gray-100 rounded-md"></div>
          <div className="h-4 bg-gray-100 rounded-md"></div>
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="h-6 bg-gray-100 rounded-md w-1/4"></div>
          <div className="h-8 bg-gray-100 rounded-md w-24"></div>
        </div>
      </div>
    </div>
  </div>
)

const Events = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [showFilters, setShowFilters] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState("grid") // grid or list
  const [showSearch, setShowSearch] = useState(false)
  const filterRef = useRef(null)
  const searchRef = useRef(null)
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95])
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98])

  const {
    events = [],
    loading = false,
    error = null,
    filters = {},
  } = useSelector((state) => {
    return state.event || {}
  })

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const result = await dispatch(fetchEvents(filters)).unwrap()
      } catch (err) {
        console.error("Error loading events:", err)
      }
    }
    loadEvents()

    // Close filter dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dispatch, filters])

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }))
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (time) => {
    return time.substring(0, 5)
  }

  const eventsList = Array.isArray(events) ? events : []

  // Filter events by category and search term
  const filteredEvents = eventsList
    .filter((event) => activeCategory === "all" || event.Category === activeCategory)
    .filter(
      (event) =>
        !searchTerm ||
        event.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.Organizer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.Location?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  const handleViewDetail = (eventId) => {
    if (!eventId) {
      console.error("Invalid event ID")
      return
    }
    dispatch(clearCurrentEvent())
    navigate(`/events/${eventId}`)
  }

  const clearFilters = () => {
    dispatch(setFilters({}))
    setActiveCategory("all")
    setSearchTerm("")
  }

  // Get all unique categories from events
  const eventCategories = [...new Set(eventsList.map((event) => event.Category))].filter(Boolean)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="flex flex-col items-center">
          <XMarkIcon className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-500 mb-6">{typeof error === "string" ? error : error.message}</p>
          <button
            className="text-purple-600 hover:text-purple-700 flex items-center"
            onClick={() => dispatch(fetchEvents(filters))}
          >
            <ArrowUpRightIcon className="w-5 h-5 mr-2" />
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Thu nhỏ chiều cao */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87"
            alt="Events Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-indigo-900/90" />
        </div>
        
        {/* Hero Content - Thu gọn spacing */}
        <div className="relative h-full max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-center h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-4">
                <CalendarDaysIcon className="w-4 h-4" />
                <span>{Array.isArray(events) ? events.length : 0} sự kiện đang diễn ra</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                Khám phá sự kiện công nghệ{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  dành cho bạn
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/80 max-w-3xl">
                Tham gia các sự kiện công nghệ hấp dẫn từ các tổ chức hàng đầu và kết nối với cộng đồng developer
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content - Điều chỉnh margin top */}
      <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 -mt-12 relative z-10 pb-20">
        {/* Search and Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-300 transition-all"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={filters.category || "all"}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="pl-4 pr-10 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-300 bg-white"
              >
                <option value="all">Tất cả danh mục</option>
                {eventCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filters.difficulty || "all"}
                onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                className="pl-4 pr-10 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-300 bg-white"
              >
                <option value="all">Mọi độ khó</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" 
                      ? "bg-white text-purple-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list" 
                      ? "bg-white text-purple-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex overflow-x-auto gap-2 mt-6 pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === "all"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tất cả
            </button>
            {eventCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Events Grid - Điều chỉnh số cột và gap */}
        <div className={`grid ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" 
            : "grid-cols-1 gap-4"
        }`}>
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.EventID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`group cursor-pointer ${viewMode === "list" ? "flex" : ""}`}
              onClick={() => handleViewDetail(event.EventID)}
            >
              {/* Event Card - Điều chỉnh kích thước cho phù hợp */}
              <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 ${
                viewMode === "list" ? "flex w-full" : "flex flex-col"
              }`}>
                {/* Image Container - Điều chỉnh tỷ lệ */}
                <div className={`relative ${viewMode === "list" ? "w-72" : "aspect-[4/3]"}`}>
                  <img
                    src={event.ImageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
                    alt={event.Title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={event.Status} />
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-sm">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{formatDate(event.EventDate)}</span>
                  </div>
                </div>

                {/* Content - Điều chỉnh padding và spacing */}
                <div className="flex-1 p-6">
                  <div className="flex gap-2 mb-3">
                    <CategoryChip category={event.Category} />
                    <DifficultyBadge difficulty={event.Difficulty} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {event.Title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      <span>{event.Location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span>{event.CurrentAttendees}/{event.MaxAttendees} người tham gia</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="font-bold">
                      {event.Price > 0 ? (
                        <span className="text-purple-600">{event.Price.toLocaleString()}đ</span>
                      ) : (
                        <span className="text-emerald-600">Miễn phí</span>
                      )}
                    </div>
                    <button className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700">
                      Chi tiết
                      <ArrowUpRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State - Giữ nguyên */}
        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <CalendarDaysIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `Không có sự kiện nào phù hợp với từ khóa "${searchTerm}"`
                : "Hiện tại chưa có sự kiện nào trong danh mục này"}
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Events
