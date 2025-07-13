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

// Enhanced Skeleton loading component for events - updated for mobile
const EventCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden animate-pulse border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative"></div>
    <div className="p-4 sm:p-5 space-y-2 sm:space-y-3 flex-1 flex flex-col">
      <div className="h-3 sm:h-4 bg-gray-100 rounded-md w-1/2 mb-1"></div>
      <div className="h-4 sm:h-5 bg-gray-200 rounded-md w-4/5"></div>
      <div className="h-3 sm:h-4 bg-gray-100 rounded-md w-full"></div>
      <div className="h-3 sm:h-4 bg-gray-100 rounded-md w-2/3"></div>
      <div className="flex items-center gap-2 mt-2">
        <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-gray-200"></div>
        <div className="h-2 sm:h-3 bg-gray-100 rounded-md w-12"></div>
        <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-gray-200"></div>
        <div className="h-2 sm:h-3 bg-gray-100 rounded-md w-16"></div>
      </div>
      <div className="mt-auto pt-3 sm:pt-4 flex justify-between items-center border-t border-gray-100 mt-2 sm:mt-3">
        <div className="h-4 sm:h-5 bg-gray-200 rounded-md w-16"></div>
        <div className="h-6 sm:h-8 bg-gray-200 rounded-md w-16 sm:w-20"></div>
      </div>
    </div>
  </div>
)

// Hàm helper để render skeleton trong loading state
const renderSkeletons = () => {
  return Array(6).fill(0).map((_, index) => (
    <EventCardSkeleton key={`skeleton-${index}`} />
  ));
};

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
      <div className="bg-gray-50 min-h-screen pb-8 sm:pb-12">
        <div className="bg-white border-b border-gray-200 mb-4 sm:mb-6">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Khám phá sự kiện</h1>
            <div className="animate-pulse mt-4 sm:mt-6">
              <div className="h-8 sm:h-10 bg-gray-200 rounded-md w-full max-w-3xl"></div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4">
          <div className="mb-6 sm:mb-8 animate-pulse">
            <div className="h-5 sm:h-6 bg-gray-200 rounded-md w-1/3 mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-100 rounded-md w-16"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {renderSkeletons()}
          </div>
        </div>
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
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Khám phá sự kiện</h1>
          
          {/* Mobile-optimized layout */}
          <div className="flex flex-col space-y-4 mt-6">
            {/* Horizontally scrollable categories - visible on all devices */}
            <div className="overflow-x-auto -mx-4 px-4 pb-1">
              <div className="flex space-x-3 min-w-max">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-4 py-2.5 font-medium rounded-md whitespace-nowrap ${
                    activeCategory === "all"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Tất cả
                </button>
                {eventCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2.5 font-medium rounded-md whitespace-nowrap ${
                      activeCategory === category
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filters - stacked on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <select
                  value={filters.difficulty || "all"}
                  onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-md text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                >
                  <option value="all">Mọi độ khó</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm sự kiện..."
                  className="w-full px-4 py-2.5 rounded-md text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg 
                  className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" 
                  fill="none" 
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Events Grid - Responsive grid with fewer columns on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loading ? renderSkeletons() : filteredEvents.map((event, index) => (
            <motion.div
              key={event.EventID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`group cursor-pointer ${viewMode === "list" ? "flex" : ""}`}
              onClick={() => handleViewDetail(event.EventID)}
            >
              {/* Event Card – Google Events style */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={event.ImageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=60'}
                    alt={event.Title}
                    className="w-full aspect-video object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Content section - optimized padding for mobile */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug line-clamp-2">
                      {event.Title}
                    </h3>
                    <StatusBadge status={event.Status} />
                  </div>
                  
                  {/* Event short description */}
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                    {event.Description || "Tham gia sự kiện này để có cơ hội giao lưu học hỏi và mở rộng kiến thức trong lĩnh vực này."}
                  </p>
                  
                  {/* Event stats - optimized for mobile */}
                  <div className="text-xs text-gray-500 mt-auto space-y-1.5">
                    <div className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>
                        {formatDate(event.EventDate)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                      <span>{event.Difficulty || 'Trung Bình'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="col-span-full py-8 sm:py-12 text-center">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md mx-auto shadow-sm">
              <div className="bg-gray-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4">
                <CalendarDaysIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Không tìm thấy sự kiện
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-5 sm:mb-6">
                {searchTerm 
                  ? `Không có sự kiện nào phù hợp với từ khóa "${searchTerm}". Vui lòng thử tìm kiếm với từ khóa khác.` 
                  : 'Hiện tại chưa có sự kiện nào trong danh mục này. Hãy thử danh mục khác!'}
              </p>
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Xóa tìm kiếm
                </button>
              ) : (
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Events
