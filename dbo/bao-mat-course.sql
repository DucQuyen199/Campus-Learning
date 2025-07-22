-- Tạo khóa học bảo mật giá 100$
USE campushubt;

-- Thêm khóa học Bảo Mật Thông Tin có giá 100$
INSERT INTO Courses (
    Title, Slug, Description, ShortDescription, 
    InstructorID, Level, Category, SubCategory, 
    CourseType, Language, Duration, Capacity, 
    Price, DiscountPrice, ImageUrl, VideoUrl, Requirements, Objectives,
    Status, IsPublished, PublishedAt
)
VALUES (
    N'Bảo Mật Thông Tin và An Toàn Mạng', 
    'bao-mat-thong-tin-an-toan-mang', 
    N'<p>Khóa học toàn diện về bảo mật thông tin và an toàn mạng, từ cơ bản đến nâng cao. Học viên sẽ được trang bị kiến thức về các lỗ hổng bảo mật phổ biến, các kỹ thuật tấn công mạng, phương pháp phòng thủ và bảo vệ hệ thống. Khóa học còn bao gồm các bài thực hành về kiểm thử xâm nhập và ứng phó sự cố bảo mật.</p><p>Được thiết kế bởi các chuyên gia an ninh mạng hàng đầu, khóa học này là cơ hội tuyệt vời để phát triển sự nghiệp trong lĩnh vực bảo mật thông tin đang phát triển mạnh mẽ.</p>', 
    N'Khóa học chuyên sâu về bảo mật thông tin và an toàn mạng giúp bạn trở thành chuyên gia bảo mật',
    NULL, -- InstructorID là NULL
    'advanced', 
    N'Bảo mật', 
    N'An toàn thông tin',
    'it', 
    'vi', 
    900, -- 15 giờ
    100,
    2300000, -- 100$ tương đương khoảng 2,300,000 VND - sử dụng số nguyên để tránh lỗi định dạng
    NULL, -- DiscountPrice là NULL 
    'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    N'["Kiến thức cơ bản về mạng máy tính","Hiểu biết về hệ điều hành Windows và Linux","Kinh nghiệm lập trình cơ bản (Python, JavaScript hoặc các ngôn ngữ khác)","Máy tính với quyền admin để cài đặt các công cụ bảo mật"]',
    N'["Hiểu rõ về các mối đe dọa bảo mật và lỗ hổng phổ biến","Thực hiện các cuộc kiểm thử xâm nhập (penetration testing) cơ bản","Phát hiện và ứng phó với các cuộc tấn công mạng","Triển khai các giải pháp bảo mật cho cá nhân và doanh nghiệp","Sử dụng thành thạo các công cụ bảo mật chuyên nghiệp"]',
    'published',
    1,
    GETDATE()
);

-- Lấy CourseID vừa thêm
DECLARE @SecurityCourseID BIGINT;
SELECT @SecurityCourseID = SCOPE_IDENTITY();

-- MODULE 1: Cơ bản về Bảo mật thông tin
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @SecurityCourseID,
    N'Nhập môn Bảo mật thông tin',
    N'Module này giới thiệu các khái niệm cơ bản về bảo mật thông tin và tầm quan trọng của nó trong thời đại số.',
    1,
    180, -- 3 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/inWWhr5tnEA',
    'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg',
    N'Hiểu các mối đe dọa bảo mật và xây dựng tư duy bảo mật.',
    N'Nắm được các khái niệm căn bản và phân loại các mối đe dọa bảo mật.',
    N'Không yêu cầu kiến thức đặc biệt.',
    N'Tài liệu và các nghiên cứu về bảo mật.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @SecurityModule1ID BIGINT;
SELECT @SecurityModule1ID = SCOPE_IDENTITY();

-- Bài 1: Video giới thiệu
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @SecurityModule1ID,
    N'Tổng quan về Bảo mật thông tin',
    N'Giới thiệu về lĩnh vực bảo mật thông tin và tầm quan trọng trong thời đại kỹ thuật số.',
    'video',
    NULL,
    'https://www.youtube.com/embed/inWWhr5tnEA',
    45, -- 45 phút
    1,
    1, -- Đây là bài preview
    1  -- Đã publish
);

-- Bài 2: Các mối đe dọa bảo mật phổ biến
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @SecurityModule1ID,
    N'Các mối đe dọa bảo mật phổ biến',
    N'Tìm hiểu về các mối đe dọa bảo mật và tấn công phổ biến.',
    'text',
    N'<h2>Các mối đe dọa bảo mật phổ biến</h2><p>Trong thời đại số, các mối đe dọa bảo mật ngày càng đa dạng và phức tạp. Dưới đây là một số loại tấn công phổ biến:</p><h3>1. Tấn công lừa đảo (Phishing)</h3><p>Đây là hình thức tấn công thông qua kỹ thuật xã hội, kẻ tấn công mạo danh các tổ chức uy tín để đánh cắp thông tin nhạy cảm.</p><h3>2. Tấn công từ chối dịch vụ (DDoS)</h3><p>Làm tràn ngập hệ thống mục tiêu bằng lưu lượng mạng khổng lồ, khiến dịch vụ không còn khả năng phục vụ người dùng bình thường.</p><h3>3. Phần mềm độc hại (Malware)</h3><p>Bao gồm virus, trojan, ransomware và các mã độc khác được thiết kế để xâm nhập hệ thống và gây hại.</p><h3>4. Tấn công SQL Injection</h3><p>Lợi dụng lỗ hổng trong ứng dụng web để chèn mã SQL độc hại vào cơ sở dữ liệu.</p>',
    60, -- 60 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- MODULE 2: Kiểm thử xâm nhập
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @SecurityCourseID,
    N'Kiểm thử xâm nhập (Penetration Testing)',
    N'Module này hướng dẫn các kỹ thuật kiểm thử xâm nhập để đánh giá bảo mật hệ thống.',
    2,
    240, -- 4 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/3Kq1MIfTWCE',
    'https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg',
    N'Thực hành các kỹ thuật kiểm thử xâm nhập và sử dụng công cụ chuyên dụng.',
    N'Hiểu và áp dụng được các phương pháp đánh giá an ninh hệ thống.',
    N'Kiến thức cơ bản về mạng và hệ điều hành.',
    N'Công cụ kiểm thử xâm nhập và tài liệu hướng dẫn.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @SecurityModule2ID BIGINT;
SELECT @SecurityModule2ID = SCOPE_IDENTITY();

-- Bài 1: Giới thiệu về kiểm thử xâm nhập
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @SecurityModule2ID,
    N'Giới thiệu về kiểm thử xâm nhập',
    N'Tìm hiểu về quy trình và phương pháp kiểm thử xâm nhập.',
    'video',
    NULL,
    'https://www.youtube.com/embed/3Kq1MIfTWCE',
    50, -- 50 phút
    1,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- MODULE 3: Bảo mật ứng dụng web
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @SecurityCourseID,
    N'Bảo mật ứng dụng web',
    N'Module này tập trung vào các lỗ hổng và giải pháp bảo mật cho ứng dụng web.',
    3,
    300, -- 5 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/WscuNqL6vL8',
    'https://images.pexels.com/photos/60626/pexels-photo-60626.jpeg',
    N'Phân tích và bảo vệ ứng dụng web khỏi các cuộc tấn công phổ biến.',
    N'Hiểu và khắc phục các lỗ hổng bảo mật web thường gặp.',
    N'Kiến thức về phát triển web và HTTP.',
    N'Các công cụ phân tích bảo mật web và code mẫu.',
    0 -- Không phải draft
);

-- Cập nhật số lượng đánh giá và điểm đánh giá cho khóa học
UPDATE Courses
SET Rating = 4.8,
    RatingCount = 126,
    EnrolledCount = 1840
WHERE CourseID = @SecurityCourseID;

-- In thông tin khóa học đã thêm để kiểm tra
SELECT CourseID, Title, Price, CourseType, Rating, EnrolledCount 
FROM Courses 
WHERE CourseID = @SecurityCourseID; 