# Hướng dẫn cập nhật trạng thái bài học xem trước

Đã cập nhật code để hiển thị 3 bài học đầu tiên của mỗi module khóa học là xem trước cho người dùng chưa đăng ký.

## Các thay đổi:

1. Frontend:
   - Cập nhật trang CourseLearning.jsx để hiển thị chế độ xem trước và thông báo cho người dùng
   - Thêm API getCourseContent để xử lý bài học xem trước

2. Backend:
   - Cập nhật controller getCourseContent cho phép người dùng chưa đăng ký vẫn truy cập bài học xem trước
   - Tạo file SQL update_preview_lessons.sql để cập nhật trạng thái xem trước cho 3 bài học đầu tiên của mỗi module

## Cách áp dụng SQL script:

1. Kết nối đến SQL Server và chọn cơ sở dữ liệu của ứng dụng
2. Chạy script SQL trong file update_preview_lessons.sql
3. Kiểm tra kết quả để đảm bảo cập nhật thành công thông qua câu lệnh SELECT đã được thêm vào script

## Ghi chú thêm:

- Sau khi áp dụng thay đổi, người dùng chưa đăng ký có thể xem 3 bài học đầu tiên của mỗi module
- Hiển thị thông báo rõ ràng cho người dùng rằng họ đang ở chế độ xem trước với nút đăng ký khóa học
- Các bài học xem trước được đánh dấu bằng nhãn "Xem trước" để dễ nhận biết
