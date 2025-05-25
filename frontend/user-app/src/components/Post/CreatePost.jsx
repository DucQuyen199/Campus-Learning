"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  PhotoIcon,
  VideoCameraIcon,
  MapPinIcon,
  PaperClipIcon,
  XMarkIcon,
  GlobeAltIcon,
  UserGroupIcon,
  LockClosedIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline"

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("")
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [visibility, setVisibility] = useState("public")
  const [showVisibilityOptions, setShowVisibilityOptions] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [contentError, setContentError] = useState("")
  const fileInputRef = useRef(null)

  // IT topics for validation
  const itTopics = [
    // Từ tiếng Anh hiện có
    "programming", "code", "software", "developer", "web", "app", 
    "database", "cloud", "server", "frontend", "backend", "fullstack", 
    "javascript", "python", "java", "react", "angular", "vue", "node", 
    "php", "html", "css", "api", "cybersecurity", "ai", "machine learning",
    "data science", "devops", "git", "github", "docker", "kubernetes",
    "aws", "azure", "google cloud", "algorithm", "coding", "debugging",
    "framework", "library", "testing", "deployment", "agile", "scrum",
    "network", "linux", "windows", "mac", "operating system", "mobile development",
    
    // Từ tiếng Anh bổ sung
    "sql", "nosql", "mongodb", "mysql", "postgresql", "oracle", "sap",
    "flutter", "kotlin", "swift", "objective-c", "c++", "c#", ".net", "ruby",
    "rails", "go", "golang", "rust", "scala", "typescript", "jquery", "bootstrap",
    "tailwind", "sass", "less", "webpack", "babel", "eslint", "prettier",
    "jest", "mocha", "chai", "cypress", "selenium", "qa", "quality assurance",
    "continuous integration", "ci/cd", "jenkins", "gitlab", "bitbucket",
    "jira", "confluence", "trello", "slack", "discord", "figma", "sketch",
    "adobe xd", "photoshop", "illustrator", "ui", "ux", "user interface",
    "user experience", "responsive", "mobile first", "pwa", "seo", "analytics",
    "blockchain", "cryptocurrency", "bitcoin", "ethereum", "smart contract",
    "nft", "security", "encryption", "firewall", "vpn", "proxy", "cache",
    "cdn", "dns", "domain", "hosting", "ssl", "tls", "https", "http",
    "rest", "graphql", "soap", "microservices", "serverless", "lambda",
    "function as a service", "saas", "paas", "iaas", "virtual machine", "vm",
    "virtualization", "emulator", "compiler", "interpreter", "assembly",
    "low level", "high level", "bug", "patch", "version control", "svn",
    "mercurial", "computer vision", "natural language processing", "nlp",
    
    // Thêm từ tiếng Anh mở rộng
    "hardware", "software", "firmware", "computer science", "networking",
    "router", "switch", "modem", "bandwidth", "latency", "ping", "big data",
    "hadoop", "spark", "kafka", "elasticsearch", "kibana", "grafana", "prometheus",
    "monitoring", "logging", "tracing", "observability", "sre", "site reliability",
    "incident management", "anomaly detection", "machine", "deep learning",
    "neural network", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas",
    "numpy", "jupyter", "anaconda", "data visualization", "tableau", "power bi",
    "qlik", "looker", "dax", "etl", "data warehouse", "data lake", "datalakehouse",
    "olap", "oltp", "webrtc", "websocket", "socket.io", "iot", "raspberry pi",
    "arduino", "esp32", "esp8266", "microcontroller", "edge computing", "fog computing",
    "quantum computing", "augmented reality", "ar", "virtual reality", "vr",
    "mixed reality", "mr", "xr", "3d modeling", "unity", "unreal engine", "godot",
    "game development", "animation", "physics engine", "shader", "webgl", "webgpu",
    "vulkan", "directx", "opengl", "cuda", "parallel computing", "distributed systems",
    "consensus algorithm", "peer-to-peer", "p2p", "defi", "nft marketplace", "web3",
    "solidity", "smart contracts", "wallet", "metamask", "authentication", "oauth",
    "openid", "saml", "sso", "two-factor", "2fa", "mfa", "biometric", "facial recognition",
    "fingerprint", "keylogger", "malware", "spyware", "ransomware", "phishing",
    "sql injection", "xss", "csrf", "ddos", "zero-day", "exploit", "vulnerability",
    "penetration testing", "pen testing", "ethical hacking", "red team", "blue team",
    "soc", "security operations", "compliance", "gdpr", "hipaa", "pci dss", "iso 27001",
    "nist", "embedded systems", "real-time systems", "rtos", "kernel", "driver",
    "firmware", "bios", "uefi", "interrupt", "process", "thread", "concurrency",
    "parallelism", "multiprocessing", "multithreading", "async", "await", "promise",
    "callback", "observable", "reactive programming", "functional programming",
    "object-oriented programming", "oop", "procedural programming", "declarative programming",
    "imperative programming", "immutable", "mutable", "stateful", "stateless",
    "idempotent", "atomicity", "acid", "base", "cap theorem", "eventual consistency",
    "strong consistency", "sharding", "partitioning", "replication", "load balancing",
    "reverse proxy", "forward proxy", "database indexing", "query optimization",
    "execution plan", "crud", "orm", "odm", "database migration", "seeding",
    "polymorphism", "inheritance", "encapsulation", "abstraction", "interface",
    "solid principles", "design patterns", "singleton", "factory", "observer",
    "strategy", "command", "decorator", "builder", "adapter", "facade", "proxy pattern",
    
    // Từ tiếng Việt cơ bản
    "lập trình", "mã nguồn", "phần mềm", "phần cứng", "ứng dụng", "thiết kế web",
    "cơ sở dữ liệu", "điện toán đám mây", "máy chủ", "công nghệ thông tin",
    "hệ điều hành", "mạng máy tính", "bảo mật", "phát triển ứng dụng", "trí tuệ nhân tạo",
    "học máy", "dữ liệu lớn", "thuật toán", "mã hóa", "giải mã", "lỗi phần mềm",
    "giao diện người dùng", "trải nghiệm người dùng", "chuỗi khối", "tiền điện tử",
    "hệ thống quản lý", "phần mềm nguồn mở", "lập trình viên", "đám mây", "sao lưu",
    "khôi phục dữ liệu", "kiểm thử", "tự động hóa", "tích hợp", "triển khai",
    "máy tính", "máy tính xách tay", "điện thoại thông minh", "thiết bị di động", 
    "thiết bị đeo", "thực tế ảo", "thực tế tăng cường", "internet vạn vật", "IoT",
    "kiến trúc phần mềm", "nền tảng", "máy trạm", "điều khiển từ xa", "đồ họa",
    "phát triển game", "cắt lớp", "đa nền tảng", "tương thích", "tối ưu hóa",
    "công cụ phát triển", "xử lý song song", "tính toán phân tán", "quản lý dự án IT",
    "phân tích hệ thống", "thiết kế hệ thống", "kỹ thuật hệ thống", "quản trị mạng",
    "quản trị cơ sở dữ liệu", "phân tích dữ liệu", "khai phá dữ liệu", "quản lý mã nguồn",
    "đánh giá hiệu năng", "tuân thủ bảo mật", "chứng chỉ bảo mật", "tiêu chuẩn IT",
    "tường lửa", "mạng riêng ảo", "đám mây riêng", "mật mã", "xác thực", "phân quyền", 
    "hệ thống tích hợp", "trung tâm dữ liệu", "hạ tầng IT", "máy ảo", "ảo hóa",
    "chuyển đổi số", "số hóa", "kỹ sư phần mềm", "kỹ sư hệ thống", "nghề IT",
    "CNTT", "an toàn thông tin", "hack", "virus", "malware", "trojan", "mã độc",
    
    // Từ tiếng Việt mở rộng
    "cổng thông tin", "phát triển website", "lắp ráp máy tính", "cài đặt phần mềm",
    "máy in", "máy quét", "màn hình", "CPU", "GPU", "RAM", "ổ cứng", "ổ SSD", "VGA",
    "bo mạch chủ", "nguồn máy tính", "tản nhiệt", "lập trình web", "framework laravel",
    "excel", "word", "powerpoint", "outlook", "photoshop", "illustrator", "figma",
    "thiết kế đồ họa", "xử lý ảnh", "biên tập video", "đồ họa 3D", "render", "makefile",
    "biên dịch", "dịch ngược", "phát hiện lỗi", "sửa lỗi", "vá lỗi", "bảo trì phần mềm",
    "hệ quản trị CSDL", "cổng kết nối", "giao thức mạng", "wifi", "bluetooth",
    "cáp mạng", "cài win", "ghost", "driver", "Windown", "MacOS", "Linux", "Ubuntu",
    "Fedora", "CentOS", "Debian", "Alpine", "distro", "kernel", "trình biên dịch",
    "thư viện", "trang web", "dịch vụ web", "web service", "tiện ích mở rộng",
    "plugin", "theme", "giao diện", "chủ đề", "mẫu thiết kế", "responsive",
    "tương thích di động", "SEO", "phần mềm diệt virus", "giả lập", "emulator",
    "máy chủ ảo", "định tuyến", "vùng nhớ", "vùng địa chỉ IP", "domain", "tên miền",
    "SSL", "chứng chỉ bảo mật", "mã nguồn mở", "phần mềm thương mại", "bản quyền",
    "license", "giấy phép", "kế hoạch dự phòng", "sao lưu dự phòng", "UPS",
    "nguồn điện dự phòng", "thiết kế giao diện", "UI/UX", "sprint", "kỹ thuật số",
    "thực tế ảo tăng cường", "công nghệ thực tế ảo", "smartphone", "laptop gaming",
    "máy tính bảng", "phần mềm ERP", "học trực tuyến", "e-learning", "đào tạo CNTT",
    "tài nguyên số", "nội dung số", "ứng dụng di động", "app mobile", "app store",
    "play store", "công nghệ blockchain", "NFT", "tiền mã hóa", "crypto", "bitcoin",
    "ethereum", "smart contract", "hợp đồng thông minh", "trí tuệ nhân tạo", "AI",
    "chatGPT", "OpenAI", "chatbot", "robot", "tự động hóa", "RPA", "tự động hóa quy trình",
    "phân tích dữ liệu", "kết nối API", "đám mây", "điện toán đám mây", "dịch vụ đám mây",
    "phân tích big data", "dữ liệu lớn", "chuyển đổi số", "digital transformation",
    "ngôn ngữ lập trình", "codebase", "repo", "repository", "commit", "pull request",
    "push code", "debug", "test case", "unit test", "kiểm thử đơn vị", "testing",
    "QA", "quản lý chất lượng", "tổ chức code", "mô hình MVC", "mô hình MVVM",
    "nguyên tắc SOLID", "clean code", "code sạch", "mã nguồn rõ ràng", "comment code",
    "code review", "kiểm tra mã nguồn", "tài liệu kỹ thuật"
  ]
  
  // Fetch current user info from localStorage or context
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setCurrentUser({
          name: data.name,
          avatar: data.avatar || "https://i.pravatar.cc/300",
          username: data.username,
        })
      })
      .catch(err => {
        console.error("Error fetching user:", err)
      })
    }
  }, [])

  const validateITContent = (text) => {
    // Kiểm tra nếu nội dung rỗng
    if (!text.trim()) return false;
    
    // Kiểm tra nếu nội dung có chứa một trong các chủ đề IT
    const lowerText = text.toLowerCase();
    
    // Kiểm tra từng từ trong danh sách
    return itTopics.some(topic => lowerText.includes(topic));
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && media.length === 0) return
    
    // Kiểm tra xem nội dung có liên quan đến IT không
    if (!validateITContent(content)) {
      setContentError("Bài viết phải liên quan đến công nghệ thông tin (IT)")
      return
    }
    
    setContentError("")
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("content", content)
      formData.append("visibility", visibility)
      media.forEach((file) => {
        formData.append("media", file)
      })

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Không thể tạo bài viết")
      }

      setContent("")
      setMedia([])
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (error) {
      console.error("Create post error:", error)
      alert("Có lỗi xảy ra khi đăng bài. Vui lòng thử lại sau.")
    } finally {
      setLoading(false)
    }
  }

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setMedia([...media, ...files])
    }
  }

  const removeMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index))
  }

  const visibilityOptions = [
    { id: "public", label: "Công khai", description: "Mọi người đều có thể xem", icon: GlobeAltIcon },
    { id: "friends", label: "Bạn bè", description: "Chỉ bạn bè có thể xem", icon: UserGroupIcon },
    { id: "private", label: "Riêng tư", description: "Chỉ bạn có thể xem", icon: LockClosedIcon },
  ]

  // Get formatted date for preview
  const getFormattedDate = () => {
    const now = new Date()
    return now.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
          <h2 className="font-semibold text-xl text-gray-800">Tạo bài viết mới</h2>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="p-1.5 text-gray-500 hover:text-emerald-600 rounded-full hover:bg-emerald-50 transition-all duration-200"
              title="Hỗ trợ Markdown"
            >
              <InformationCircleIcon className="w-5 h-5" />
            </button>
            <div className="text-sm text-emerald-600 font-medium px-3 py-1 bg-emerald-50 rounded-full">
              Chỉ dành cho nội dung về IT
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Create Post Form */}
          <div className="lg:w-3/5 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Nội dung bài viết</div>
                  <div className="text-xs text-gray-500">Hỗ trợ định dạng Markdown</div>
                </div>
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-200 hover:border-gray-300">
                  <textarea
                    className="w-full resize-none bg-transparent border-none focus:outline-none p-0 min-h-[200px] text-gray-700 placeholder-gray-400 font-mono text-sm"
                    placeholder="# Tiêu đề bài viết

Chia sẻ ý tưởng, câu hỏi, hoặc bài viết về IT của bạn...

Bạn có thể sử dụng **Markdown** để định dạng văn bản:
- Danh sách
- Code blocks \`\`\`
- Và nhiều tính năng khác"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value)
                      if (contentError) setContentError("")
                    }}
                  />
                </div>
                {contentError && (
                  <div className="mt-2 text-red-500 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {contentError}
                  </div>
                )}
              </div>

              {media.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    Tệp đính kèm ({media.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {media.map((file, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg bg-gray-50 border border-gray-200 overflow-hidden group hover:border-emerald-300 transition-all duration-200"
                      >
                        {file.type.startsWith("image/") ? (
                          <>
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
                              <svg
                                className="animate-spin h-8 w-8 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            </div>
                            <img
                              src={URL.createObjectURL(file) || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-28 object-cover relative z-10"
                              onLoad={(e) => {
                                const parent = e.target.parentNode
                                const spinner = parent.querySelector("div.absolute")
                                if (spinner) spinner.remove()
                              }}
                            />
                          </>
                        ) : file.type.startsWith("video/") ? (
                          <div className="flex items-center justify-center h-28 bg-gray-800">
                            <VideoCameraIcon className="h-10 w-10 text-white opacity-70" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-28 bg-gray-100">
                            <PaperClipIcon className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-80"
                          aria-label="Remove media"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                        <div className="p-1.5 text-xs truncate text-gray-600">{file.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowVisibilityOptions(!showVisibilityOptions)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl text-sm text-gray-700 transition-all duration-200 shadow-sm"
                  >
                    {(() => {
                      const Icon = visibilityOptions.find((opt) => opt.id === visibility)?.icon
                      return <Icon className="w-4 h-4 text-emerald-600" />
                    })()}
                    <span>{visibilityOptions.find((opt) => opt.id === visibility)?.label}</span>
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {showVisibilityOptions && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-10 w-72 transform transition-all duration-200">
                      {visibilityOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                              visibility === option.id ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" : "text-gray-700"
                            }`}
                            onClick={() => {
                              setVisibility(option.id)
                              setShowVisibilityOptions(false)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${visibility === option.id ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl text-sm text-gray-700 transition-all duration-200 shadow-sm"
                  >
                    <PhotoIcon className="h-5 w-5 text-emerald-500" />
                    <span>Thêm ảnh</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                  />

                  <button
                    type="button"
                    className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-red-400 hover:bg-red-50 rounded-xl text-sm text-gray-700 transition-all duration-200 shadow-sm"
                  >
                    <MapPinIcon className="h-5 w-5 text-red-500" />
                    <span>Thêm vị trí</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || (!content.trim() && media.length === 0)}
                  className={`px-8 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    loading || (!content.trim() && media.length === 0)
                      ? "bg-gray-100 cursor-not-allowed text-gray-400"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Đang đăng...</span>
                    </div>
                  ) : (
                    "Đăng bài"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Panel */}
          <div className="lg:w-2/5">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-l from-emerald-50 to-white flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Xem trước bài viết
              </h3>
              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm">Hiển thị khi đăng</div>
            </div>

            <div className="p-6">
              {/* User info */}
              {currentUser && (
                <div className="flex items-center mb-4">
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-800">{currentUser.name}</div>
                    <div className="flex items-center text-xs text-gray-500 space-x-2">
                      <span>{getFormattedDate()}</span>
                      <span>•</span>
                      <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
                        {(() => {
                          const Icon = visibilityOptions.find((opt) => opt.id === visibility)?.icon
                          return <Icon className="w-3 h-3 mr-1" />
                        })()}
                        {visibilityOptions.find((opt) => opt.id === visibility)?.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                {content ? (
                  <div className="prose max-w-none text-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 italic">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <p>Chưa có nội dung bài viết</p>
                  </div>
                )}
              </div>

              {/* Media preview */}
              {media.length > 0 && (
                <div className="rounded-lg overflow-hidden mb-3">
                  {media.length === 1 ? (
                    // Single media display
                    <div className="w-full">
                      {media[0].type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(media[0]) || "/placeholder.svg"}
                          alt="Media preview"
                          className="w-full rounded-lg max-h-[300px] object-contain bg-gray-50"
                        />
                      ) : media[0].type.startsWith("video/") ? (
                        <div className="flex items-center justify-center h-48 bg-gray-800 rounded-lg">
                          <VideoCameraIcon className="h-12 w-12 text-white opacity-70" />
                          <div className="absolute text-white text-sm mt-20">Video: {media[0].name}</div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                          <PaperClipIcon className="h-10 w-10 text-gray-400" />
                          <div className="absolute text-gray-600 text-sm mt-16">{media[0].name}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Multiple media grid
                    <div className="grid grid-cols-2 gap-2">
                      {media.slice(0, 4).map((file, index) => (
                        <div
                          key={index}
                          className={`relative rounded-lg overflow-hidden ${index === 3 && media.length > 4 ? "relative" : ""}`}
                        >
                          {file.type.startsWith("image/") ? (
                            <img
                              src={URL.createObjectURL(file) || "/placeholder.svg"}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          ) : file.type.startsWith("video/") ? (
                            <div className="flex items-center justify-center h-32 bg-gray-800">
                              <VideoCameraIcon className="h-8 w-8 text-white opacity-70" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-32 bg-gray-100">
                              <PaperClipIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}

                          {index === 3 && media.length > 4 && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <div className="text-white font-bold text-xl">+{media.length - 4}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Post actions */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  <span className="font-medium">Thích</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="font-medium">Bình luận</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-purple-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span className="font-medium">Chia sẻ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePost
