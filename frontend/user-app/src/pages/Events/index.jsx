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

// Enhanced Skeleton loading component for events - cập nhật để giống Courses
const EventCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-200 shadow-lg h-full flex flex-col">
    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 relative">
      <div className="absolute top-3 right-3 flex gap-2">
        <div className="h-5 w-12 bg-gray-300 rounded-xl"></div>
      </div>
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <div className="h-5 w-16 bg-gray-300 rounded-xl"></div>
        <div className="h-5 w-12 bg-gray-300 rounded-xl"></div>
      </div>
    </div>
    <div className="p-5 space-y-3 flex-1 flex flex-col">
      <div className="space-y-2">
        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-full"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5"></div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
          <div className="h-3 bg-gray-300 rounded-full w-3"></div>
          <div className="h-3 bg-gray-300 rounded-lg w-8"></div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
          <div className="h-3 bg-gray-300 rounded-full w-3"></div>
          <div className="h-3 bg-gray-300 rounded-lg w-6"></div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
        <div className="space-y-1">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16"></div>
          <div className="h-3 bg-gray-200 rounded-lg w-12"></div>
        </div>
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-16"></div>
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
      {/* Enhanced Header with better aligned buttons */}
      <div className="bg-white border-b border-gray-200 py-6 w-full shadow-sm">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <div className="flex flex-col md:flex-row gap-6 items-center w-full">
              {/* Search with enhanced border */}
              <div className="relative flex-grow w-full">
                <div className="flex shadow-sm">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sự kiện..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-l-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-r-lg flex items-center justify-center transition-colors font-medium"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    <span className="ml-2">Tìm kiếm</span>
                  </button>
                </div>
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              {/* Filters - Better aligned */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="relative">
                  <select
                    value={filters.category || "all"}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="pl-3 pr-10 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none shadow-sm hover:border-blue-400 transition-colors font-medium"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {eventCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filters.difficulty || "all"}
                    onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                    className="pl-3 pr-10 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none shadow-sm hover:border-blue-400 transition-colors font-medium"
                  >
                    <option value="all">Mọi độ khó</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                </div>

                {/* Enhanced View Toggle */}
                <div className="flex items-center bg-gray-200 rounded-lg p-1.5 shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid" 
                        ? "bg-white text-blue-600 shadow-md" 
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                    aria-label="Grid view"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list" 
                        ? "bg-white text-blue-600 shadow-md" 
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                    aria-label="List view"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Enhanced Category Pills */}
            <div className="flex overflow-x-auto gap-3 mt-5 pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  activeCategory === "all"
                    ? "bg-blue-600 text-white border-blue-700 shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                }`}
              >
                Tất cả
              </button>
              {eventCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                    activeCategory === category
                      ? "bg-blue-600 text-white border-blue-700 shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content - Coursera Style */}
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Events Grid - Coursera Style */}
        <div className={`grid ${
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
            : "grid-cols-1 gap-3"
        }`}>
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.EventID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`group cursor-pointer ${viewMode === "list" ? "flex" : ""}`}
              onClick={() => handleViewDetail(event.EventID)}
            >
              {/* Event Card - Coursera Style */}
              <div className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden ${
                viewMode === "list" ? "flex w-full" : "flex flex-col h-full"
              }`}>
                {/* Image Container - Now exactly 65% width in list view */}
                <div className={`relative ${
                  viewMode === "list" 
                    ? "w-[65%]" 
                    : "aspect-video"
                }`}>
                  <img
                    src={event.ImageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
                    alt={event.Title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <StatusBadge status={event.Status} />
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    <span>{formatDate(event.EventDate)}</span>
                  </div>
                </div>

                {/* Content - Now exactly 35% width in list view */}
                <div className={`flex-1 p-4 flex flex-col ${viewMode === "list" ? "w-[35%]" : ""}`}>
                  <div className="flex gap-1.5 mb-2">
                    <CategoryChip category={event.Category} />
                    <DifficultyBadge difficulty={event.Difficulty} />
                  </div>
                  
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                    {event.Title}
                  </h3>
                  
                  <div className="space-y-1.5 text-xs text-gray-500 flex-1">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{event.Location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{event.CurrentAttendees}/{event.MaxAttendees}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      {event.Price > 0 ? (
                        <span className="text-base font-bold text-blue-600">
                          {event.Price.toLocaleString()}₫
                        </span>
                      ) : (
                        <span className="text-base font-bold text-green-600">
                          Miễn phí
                        </span>
                      )}
                    </div>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State - Coursera Style */}
        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-lg shadow-sm"
          >
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Không tìm thấy sự kiện</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `Không có sự kiện nào phù hợp với từ khóa "${searchTerm}"`
                : "Hiện tại chưa có sự kiện nào trong danh mục này"}
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
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
