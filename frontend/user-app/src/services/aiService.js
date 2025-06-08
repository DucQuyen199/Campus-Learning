import { GoogleGenerativeAI } from "@google/generative-ai";

// Đảm bảo rằng API key được cung cấp từ biến môi trường
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Khởi tạo model Gemini AI
const genAI = new GoogleGenerativeAI(API_KEY);

// Cấu hình cho chat
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

// Khởi tạo chat history
const history = [];

// Cấu hình an toàn
const safetySettings = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
];

// Định nghĩa system prompt bắt buộc chỉ trả lời về IT
const systemPrompt = `Bạn là trợ lý AI chuyên về lĩnh vực IT và công nghệ. 
Chỉ trả lời những câu hỏi liên quan đến lập trình, phát triển phần mềm, mạng máy tính, bảo mật, 
trí tuệ nhân tạo, và các lĩnh vực công nghệ thông tin khác.

Với các câu hỏi không liên quan đến IT hoặc công nghệ, hãy từ chối nhẹ nhàng và 
đề nghị người dùng hỏi về các chủ đề liên quan đến IT.

Xin nhớ:
- Chỉ trả lời về IT/công nghệ
- Từ chối lịch sự với các chủ đề khác
- Trả lời ngắn gọn, súc tích và dễ hiểu
- Ưu tiên đưa ra ví dụ thực tế khi giải thích
`;

/**
 * Kiểm tra xem câu hỏi có liên quan đến IT không
 */
const isITRelatedQuestion = (message) => {
  const itKeywords = [
    // Programming & Development - Lập trình & Phát triển
    'lập trình', 'coding', 'code', 'program', 'chương trình', 'development', 'phát triển',
    'debug', 'debugging', 'gỡ lỗi', 'bug', 'lỗi', 'error', 'exception', 'ngoại lệ',
    'compiler', 'trình biên dịch', 'interpreter', 'biên dịch', 'syntax', 'cú pháp',
    'algorithm', 'thuật toán', 'data structure', 'cấu trúc dữ liệu', 'logic', 'lôgic',
    
    // Software & Applications - Phần mềm & Ứng dụng
    'phần mềm', 'software', 'web', 'app', 'ứng dụng', 'application', 'system', 'hệ thống',
    'plugin', 'extension', 'tiện ích mở rộng', 'module', 'mô-đun', 'component', 'thành phần',
    'interface', 'giao diện', 'library', 'thư viện', 'ui', 'ux', 'user interface', 'user experience',
    
    // Data & Databases - Dữ liệu & Cơ sở dữ liệu
    'database', 'dữ liệu', 'data', 'sql', 'nosql', 'cơ sở dữ liệu', 'mysql', 'postgresql',
    'mongodb', 'oracle', 'redis', 'cassandra', 'elasticsearch', 'cơ sở dữ liệu quan hệ',
    'relational database', 'data warehouse', 'kho dữ liệu', 'data mining', 'khai phá dữ liệu',
    'data science', 'khoa học dữ liệu', 'big data', 'dữ liệu lớn', 'data analytics', 'phân tích dữ liệu',
    
    // Networks & Security - Mạng & Bảo mật
    'mạng', 'network', 'server', 'máy chủ', 'bảo mật', 'security', 'firewall', 'tường lửa',
    'protocol', 'giao thức', 'tcp/ip', 'http', 'https', 'ftp', 'dns', 'dhcp', 'vpn', 'mạng riêng ảo',
    'ethernet', 'wifi', 'router', 'bộ định tuyến', 'lan', 'wan', 'mạng cục bộ', 'mạng diện rộng',
    'encryption', 'mã hóa', 'cryptography', 'mật mã học', 'cyber security', 'an ninh mạng',
    
    // Programming Languages - Ngôn ngữ lập trình
    'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin', 'go', 'golang',
    'typescript', 'html', 'css', 'rust', 'perl', 'r', 'scala', 'dart', 'lua', 'shell', 'bash',
    'powershell', 'assembly', 'hợp ngữ', 'cobol', 'fortran', 'lisp', 'prolog', 'ngôn ngữ lập trình',
    
    // Web Development - Phát triển web
    'frontend', 'front-end', 'giao diện người dùng', 'backend', 'back-end', 'phía máy chủ',
    'fullstack', 'full-stack', 'web development', 'phát triển web', 'responsive', 'tương thích',
    'dom', 'spa', 'single page application', 'ứng dụng một trang', 'seo', 'tối ưu hóa công cụ tìm kiếm',
    'web browser', 'trình duyệt web', 'web server', 'máy chủ web', 'web api', 'web service', 'dịch vụ web','viết mã',
    
    // Frameworks & Libraries - Framework & Thư viện
    'react', 'angular', 'vue', 'svelte', 'jquery', 'bootstrap', 'tailwind', 'express', 'django',
    'flask', 'spring', 'laravel', 'symfony', 'rails', 'node.js', 'next.js', 'nuxt.js', 'flutter',
    'xamarin', 'ionic', 'framework', 'thư viện', 'library', 'platform', 'nền tảng', 'sdk',
    
    // DevOps & Cloud - DevOps & Điện toán đám mây
    'api', 'cloud', 'điện toán đám mây', 'aws', 'azure', 'gcp', 'google cloud', 'cloud computing',
    'git', 'github', 'gitlab', 'bitbucket', 'devops', 'ci/cd', 'continuous integration', 'tích hợp liên tục',
    'docker', 'container', 'kubernetes', 'k8s', 'microservice', 'vi dịch vụ', 'serverless', 'không máy chủ',
    'infrastructure', 'cơ sở hạ tầng', 'iaas', 'paas', 'saas', 'deployment', 'triển khai',
    
    // Methodologies & Practices - Phương pháp & Thực hành
    'agile', 'scrum', 'kanban', 'waterfall', 'mô hình thác nước', 'lean', 'extreme programming', 'xp',
    'test driven development', 'tdd', 'phát triển hướng kiểm thử', 'bdd', 'behavior driven development',
    'clean code', 'mã sạch', 'refactoring', 'tái cấu trúc', 'code review', 'đánh giá mã',
    
    // Testing & QA - Kiểm thử & Đảm bảo chất lượng
    'testing', 'kiểm thử', 'qa', 'quality assurance', 'đảm bảo chất lượng', 'unit test', 'kiểm thử đơn vị',
    'integration test', 'kiểm thử tích hợp', 'e2e', 'end-to-end', 'manual testing', 'kiểm thử thủ công',
    'automated testing', 'kiểm thử tự động', 'regression', 'hồi quy', 'performance test', 'load test',
    
    // AI & ML - Trí tuệ nhân tạo & Học máy
    'ai', 'artificial intelligence', 'trí tuệ nhân tạo', 'machine learning', 'học máy',
    'deep learning', 'học sâu', 'neural network', 'mạng nơ-ron', 'nlp', 'xử lý ngôn ngữ tự nhiên',
    'computer vision', 'thị giác máy tính', 'chatbot', 'bot trò chuyện', 'expert system', 'hệ chuyên gia',
    
    // Software Design - Thiết kế phần mềm
    'oop', 'object oriented', 'hướng đối tượng', 'functional programming', 'lập trình hàm',
    'design pattern', 'mẫu thiết kế', 'mvc', 'mvvm', 'solid', 'dry', 'kiss', 'yagni',
    'architecture', 'kiến trúc', 'microservices', 'vi dịch vụ', 'monolith', 'đơn khối',
    'rest', 'restful', 'graphql', 'soap', 'api design', 'thiết kế api',
    
    // Hardware & Systems - Phần cứng & Hệ thống
    'computer', 'máy tính', 'hardware', 'phần cứng', 'cpu', 'gpu', 'ram', 'memory', 'bộ nhớ',
    'storage', 'lưu trữ', 'ssd', 'hdd', 'ổ cứng', 'operating system', 'hệ điều hành',
    'windows', 'linux', 'unix', 'mac', 'macos', 'ios', 'android', 'embedded', 'nhúng',
    'iot', 'internet of things', 'internet vạn vật', 'raspberry pi', 'arduino',
    
    // Version Control - Kiểm soát phiên bản
    'version control', 'kiểm soát phiên bản', 'git', 'svn', 'mercurial', 'repository', 'kho lưu trữ', 
    'commit', 'branch', 'nhánh', 'merge', 'trộn', 'conflict', 'xung đột', 'pull request', 'yêu cầu kéo',
    
    // Web Hosting & Deployment - Lưu trữ & Triển khai web
    'hosting', 'lưu trữ', 'web hosting', 'domain', 'tên miền', 'dns', 'server', 'máy chủ',
    'vps', 'dedicated server', 'shared hosting', 'cloud hosting', 'deployment', 'triển khai',
    
    // Mobile Development - Phát triển di động
    'mobile', 'di động', 'android', 'ios', 'react native', 'flutter', 'mobile app', 'ứng dụng di động',
    'native app', 'hybrid app', 'ứng dụng lai', 'pwa', 'progressive web app', 'swift', 'kotlin',
    
    // Additional Industry Terms - Thuật ngữ ngành bổ sung
    'it', 'công nghệ thông tin', 'information technology', 'tech', 'công nghệ',
    'digital', 'số hóa', 'innovation', 'đổi mới', 'startup', 'khởi nghiệp',
    'fintech', 'edtech', 'healthtech', 'cybersecurity', 'blockchain', 'cryptocurrency', 'tiền điện tử'
  ];

  const messageLower = message.toLowerCase();
  return itKeywords.some(keyword => messageLower.includes(keyword));
};

/**
 * Khởi tạo chat model
 */
export const initChat = async () => {
  try {
    // Kiểm tra xem API key có tồn tại không
    if (!API_KEY || API_KEY === 'undefined') {
      throw new Error('API key không hợp lệ hoặc chưa được cấu hình');
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // Sử dụng mô hình theo yêu cầu người dùng
      generationConfig,
      safetySettings,
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history,
      generationConfig,
      safetySettings,
    });

    return chat;
  } catch (error) {
    console.error("Error initializing chat:", error);
    throw error;
  }
};

/**
 * Gửi tin nhắn đến AI và nhận phản hồi
 */
export const sendMessage = async (chat, message) => {
  try {
    // Nếu câu hỏi không liên quan đến IT, trả về thông báo
    if (!isITRelatedQuestion(message)) {
      return "Xin lỗi, tôi chỉ có thể trả lời các câu hỏi liên quan đến IT và công nghệ. Vui lòng đặt câu hỏi về lập trình, phát triển phần mềm, cơ sở dữ liệu, mạng máy tính, bảo mật hoặc các chủ đề IT khác.";
    }

    // Kiểm tra xem chat đã được khởi tạo chưa
    if (!chat) {
      throw new Error('Chat chưa được khởi tạo');
    }

    const result = await chat.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending message:", error);
    if (error.message.includes("API key") || error.toString().includes("API_KEY_INVALID")) {
      return "Lỗi xác thực API key. Vui lòng kiểm tra cấu hình API key trong tệp .env";
    }
    if (error.message.includes("Chat chưa được khởi tạo")) {
      return "Lỗi kết nối với dịch vụ AI. Vui lòng làm mới trang và thử lại.";
    }
    if (error.toString().includes("503") || error.toString().includes("overloaded")) {
      return "Dịch vụ AI đang tạm thời quá tải. Vui lòng thử lại sau ít phút.";
    }
    return "Xin lỗi, tôi không thể trả lời câu hỏi này. Có lỗi xảy ra: " + (error.message || "Không xác định");
  }
};

export default {
  initChat,
  sendMessage,
}; 