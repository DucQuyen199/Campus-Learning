# Cấu Hình Xác Thực Email

Tính năng xác thực email cho phép người dùng xác thực địa chỉ email của họ thông qua mã OTP gửi đến email.

## Thêm Cấu Hình Email Vào File .env

Thêm các biến môi trường sau vào file `.env` của bạn:

```
# Cấu hình Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## Hướng Dẫn Tạo App Password Cho Gmail

Nếu bạn sử dụng Gmail làm email gửi, bạn cần tạo "App Password" thay vì sử dụng mật khẩu thông thường:

1. Truy cập vào [Google Account Settings](https://myaccount.google.com/)
2. Chọn "Security" từ menu bên trái
3. Trong phần "Signing in to Google", chọn "2-Step Verification" và đảm bảo đã bật
4. Sau khi bật xác thực 2 bước, quay lại trang Security và chọn "App passwords"
5. Chọn "Select app" và chọn "Other (Custom name)"
6. Đặt tên là "Campust Email Service" và nhấn "Generate"
7. Sao chép mật khẩu được tạo và dán vào biến `EMAIL_PASSWORD` trong file `.env`

## Cấu Hình Cho Các Dịch Vụ Email Khác

### Outlook/Office 365
```
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_password
```

### SendGrid
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

## Kiểm Tra Cấu Hình

Để kiểm tra cấu hình email có hoạt động không, bạn có thể thử xác thực email trên giao diện người dùng:

1. Đăng nhập vào hệ thống
2. Truy cập trang Hồ Sơ Cá Nhân
3. Nhấn vào nút "Xác thực ngay" bên cạnh email của bạn
4. Một mã OTP sẽ được gửi đến email của bạn
5. Nhập mã OTP để hoàn tất quá trình xác thực

## Bảng Email Verifications

Khi bạn chạy ứng dụng lần đầu tiên sau khi thêm tính năng này, hệ thống sẽ tự động tạo bảng `EmailVerifications` trong cơ sở dữ liệu của bạn. 