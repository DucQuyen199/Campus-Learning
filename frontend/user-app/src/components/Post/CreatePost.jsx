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
  const [title, setTitle] = useState("")
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [visibility, setVisibility] = useState("public")
  const [showVisibilityOptions, setShowVisibilityOptions] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [contentError, setContentError] = useState("")
  const [mediaError, setMediaError] = useState("")
  const [location, setLocation] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState("")
  const fileInputRef = useRef(null)
  const [showDraftSaved, setShowDraftSaved] = useState(false)

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
      // Get user from localStorage if available
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (user?.UserID) {
        setCurrentUser({
          name: user.FullName || user.username,
          avatar: user.ProfileImage || "https://i.pravatar.cc/300",
          username: user.username,
        })
      } else {
      fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setCurrentUser({
            name: data.FullName || data.username,
            avatar: data.ProfileImage || "https://i.pravatar.cc/300",
          username: data.username,
        })
      })
      .catch(err => {
        console.error("Error fetching user:", err)
      })
      }
    }
  }, [])

  // Save draft functionality
  const saveDraft = () => {
    const draft = {
      title,
      content,
      location: location ? JSON.stringify(location) : null,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem('postDraft', JSON.stringify(draft))
    setShowDraftSaved(true)
    setTimeout(() => setShowDraftSaved(false), 3000)
  }

  // Load draft if exists
  useEffect(() => {
    const savedDraft = localStorage.getItem('postDraft')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setTitle(draft.title || '')
        setContent(draft.content || '')
        if (draft.location) {
          setLocation(JSON.parse(draft.location))
        }
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }
  }, [])

  // Get current location
  const getCurrentLocation = () => {
    // Clear previous location errors
    setLocationError("")
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    setIsLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'vi' } }
          );
          const data = await response.json();
          
          setLocation({
            latitude,
            longitude,
            displayName: data.display_name || 'Vị trí hiện tại',
            address: data.address
          });
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocation({
            latitude,
            longitude,
            displayName: 'Vị trí hiện tại',
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        if (error.code === 1) {
          // Permission denied
          setLocationError('Quyền định vị bị từ chối. Vui lòng bật quyền truy cập vị trí nếu muốn sử dụng chức năng này.');
        } else {
          // Other errors
          setLocationError('Không thể lấy vị trí của bạn. Vui lòng thử lại sau.');
          console.error('Error getting location:', error);
        }
      }
    );
  };

  // Remove location
  const removeLocation = () => {
    setLocation(null);
  };

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
    
    // Reset error messages
    setContentError("")
    setMediaError("")
    
    // Validate media presence
    if (media.length === 0) {
      setMediaError("Bài viết phải có ít nhất một ảnh hoặc video")
      return
    }
    
    // Kiểm tra xem nội dung có liên quan đến IT không
    if (content.trim() && !validateITContent(content)) {
      setContentError("Bài viết phải liên quan đến công nghệ thông tin (IT)")
      return
    }
    
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("content", content)
      formData.append("visibility", visibility)
      if (title) formData.append("title", title)
      
      media.forEach((file) => {
        formData.append("media", file)
      })

      // Add location if available
      if (location) {
        formData.append("location", JSON.stringify(location))
      }

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

      // Clear form and local storage draft
      setContent("")
      setTitle("")
      setMedia([])
      setLocation(null)
      localStorage.removeItem('postDraft')
      
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
      setMediaError("") // Clear media error when files are added
    }
  }

  const removeMedia = (index) => {
    const updatedMedia = media.filter((_, i) => i !== index)
    setMedia(updatedMedia)
    // If all media are removed, show the error again
    if (updatedMedia.length === 0) {
      setMediaError("Bài viết phải có ít nhất một ảnh hoặc video")
    }
  }

  const visibilityOptions = [
    { id: "public", label: "Công khai", description: "Mọi người đều có thể xem", icon: GlobeAltIcon },
    { id: "friends", label: "Bạn bè", description: "Chỉ bạn bè có thể xem", icon: UserGroupIcon },
    { id: "private", label: "Riêng tư", description: "Chỉ bạn có thể xem", icon: LockClosedIcon },
  ]

  return (
    <div className="flex flex-col w-full max-w-full">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 md:px-8 border-b flex justify-between items-center">
          <div>
            <h2 className="font-bold text-xl">Tạo bài viết mới</h2>
            <div className="text-sm text-gray-500">Chia sẻ ý tưởng, câu hỏi, hoặc kiến thức về IT của bạn</div>
          </div>
          <button 
            onClick={saveDraft}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Lưu bản nháp
          </button>
        </div>

        {/* User info */}
        {currentUser && (
          <div className="flex items-center p-4 md:px-8 border-b">
            <img 
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <div className="font-medium">{currentUser.name}</div>
              <div className="flex items-center text-xs text-gray-500">
            <button
              type="button"
                  onClick={() => setShowVisibilityOptions(!showVisibilityOptions)}
                  className="flex items-center space-x-1 py-1 px-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {(() => {
                    const Icon = visibilityOptions.find((opt) => opt.id === visibility)?.icon
                    return <Icon className="w-3 h-3 mr-1" />
                  })()}
                  <span>{visibilityOptions.find((opt) => opt.id === visibility)?.label}</span>
                  <svg className="w-3 h-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showVisibilityOptions && (
                  <div className="absolute mt-2 top-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-64">
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors ${
                            visibility === option.id ? "bg-blue-50 text-blue-600" : "text-gray-700"
                          }`}
                          onClick={() => {
                            setVisibility(option.id)
                            setShowVisibilityOptions(false)
                          }}
                        >
                          <div className="flex items-center">
                            <Icon className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium text-sm">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </div>
            </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row w-full">
          {/* Left side - Form */}
          <div className="lg:w-3/5 p-4 md:p-8 lg:border-r lg:border-gray-200">
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="mb-4">
                <input
                  type="text"
                  id="title"
                  placeholder="Tiêu đề bài viết"
                  className="w-full p-3 text-lg font-medium border-0 focus:ring-0 focus:outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
        </div>
        
              {/* Content */}
              <div className="mb-6">
                  <textarea
                  id="content"
                  className="w-full p-3 border-0 focus:ring-0 focus:outline-none min-h-[300px] text-gray-700 placeholder-gray-400 resize-none"
                  placeholder="Chia sẻ ý tưởng, câu hỏi, hoặc kiến thức về IT của bạn...

Bạn có thể sử dụng Markdown để định dạng văn bản:
- Danh sách
- **In đậm** hoặc *in nghiêng*
- Code blocks ```
- Và nhiều tính năng khác"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value)
                      if (contentError) setContentError("")
                    }}
                  />
                {contentError && (
                  <div className="mt-2 text-red-500 text-sm">{contentError}</div>
                )}
              </div>

              {/* Media section - Add a required indicator */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium flex items-center">
                    <span>Hình ảnh/Video</span>
                    <span className="text-red-500 ml-1">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Bắt buộc)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Thêm file
                  </button>
                </div>
                
                {media.length === 0 ? (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors ${mediaError ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <div className={`rounded-full p-3 mb-2 ${mediaError ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <PhotoIcon className={`h-8 w-8 ${mediaError ? 'text-red-500' : 'text-gray-500'}`} />
                    </div>
                    <div className="font-medium">Thêm ảnh hoặc video</div>
                    <div className="text-sm text-gray-500 mt-1">Nhấn để chọn hoặc kéo thả file</div>
                    {mediaError && (
                      <div className="text-red-500 text-sm mt-2">{mediaError}</div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-b py-4">
                    <div className="text-sm font-medium mb-2">Media đính kèm ({media.length})</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {media.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="h-32 bg-gray-100 rounded-lg overflow-hidden">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : file.type.startsWith("video/") ? (
                              <div className="flex items-center justify-center h-full">
                                <VideoCameraIcon className="h-10 w-10 text-gray-500" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <PaperClipIcon className="h-10 w-10 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                />
              </div>

              {/* Location display if selected */}
              {location && (
                <div className="mb-4 flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm">
                  <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="flex-1 truncate">
                    <span className="font-medium">{location.displayName}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={removeLocation}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}

              {locationError && (
                <div className="mb-4 text-red-500 text-sm">{locationError}</div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center border-t pt-4">
                <div className="flex items-center space-x-2 mr-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center p-2 rounded-full hover:bg-gray-100 text-gray-700"
                    title="Thêm ảnh/video"
                  >
                    <PhotoIcon className="h-6 w-6" />
                  </button>

                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex items-center p-2 rounded-full hover:bg-gray-100 text-gray-700"
                    title="Thêm vị trí"
                    disabled={isLoadingLocation || location !== null}
                  >
                    {isLoadingLocation ? (
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                      <MapPinIcon className="h-6 w-6" />
                    )}
                  </button>
                  
                  <div className="text-xs text-blue-600 bg-blue-50 rounded-full px-3 py-1">
                    Hỗ trợ định dạng Markdown
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || media.length === 0}
                  className={`px-8 py-2 rounded-full font-medium transition-all duration-300 ${
                    loading || media.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

          {/* Right side - Preview */}
          <div className="lg:w-2/5 bg-gray-50 p-4 md:p-8">
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Xem trước</h3>
                <div className="text-xs text-gray-500">Bài viết của bạn sẽ hiển thị như sau</div>
            </div>

              <div className="bg-white rounded-lg border p-4">
                {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
                
                <div className="prose prose-sm max-w-none mb-4">
                {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-400 italic">Chưa có nội dung</p>
                )}
              </div>

                {media.length > 0 && media.length <= 2 && (
                  <div className="mb-4">
                    {media.map((file, index) => (
                      <div key={index} className="mb-2">
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="max-h-[300px] object-contain rounded-lg mx-auto"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg">
                            <VideoCameraIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                )}
                
                {media.length > 2 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      {media.slice(0, 4).map((file, index) => (
                      <div key={index} className={`relative rounded-lg overflow-hidden ${index === 3 && media.length > 4 ? "relative" : ""}`}>
                          {file.type.startsWith("image/") ? (
                            <img
                            src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-32 bg-gray-100">
                            <VideoCameraIcon className="h-8 w-8 text-gray-400" />
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
                
                {location && (
                  <div className="flex items-center text-sm text-blue-600 mb-4">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{location.displayName}</span>
                </div>
              )}

                {/* Action preview */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded-full hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                    <button className="p-1 rounded-full hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                    <button className="p-1 rounded-full hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Draft saved notification */}
      {showDraftSaved && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
          Đã lưu bản nháp!
        </div>
      )}
    </div>
  )
}

export default CreatePost
