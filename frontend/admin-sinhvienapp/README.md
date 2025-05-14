# HUBT Admin Portal

Hệ thống quản lý sinh viên HUBT dành cho quản trị viên.

## Giới thiệu

HUBT Admin Portal là ứng dụng quản lý dành cho quản trị viên, cung cấp các tính năng để quản lý sinh viên, chương trình đào tạo, môn học, và kết quả học tập.

## Cài đặt

### Yêu cầu

- Node.js (phiên bản 14.x trở lên)
- npm hoặc yarn

### Các bước cài đặt

1. Clone dự án từ repository:
```
git clone <repository-url>
```

2. Di chuyển vào thư mục dự án:
```
cd frontend/admin-sinhvienapp
```

3. Cài đặt các dependencies:
```
npm install
# hoặc
yarn install
```

4. Cấu hình file .env (nếu cần):
```
REACT_APP_API_URL=http://localhost:5011
```

## Chạy ứng dụng

Để chạy ứng dụng trong môi trường phát triển:

```
npm start
# hoặc
yarn start
```

Ứng dụng sẽ chạy ở `http://localhost:3000`

## Build ứng dụng

Để build ứng dụng cho môi trường sản phẩm:

```
npm run build
# hoặc
yarn build
```

## Cấu trúc thư mục

```
src/
  ├── assets/        # Hình ảnh, icons, và các tài nguyên tĩnh
  ├── components/    # Các component dùng chung
  │   ├── common/    # UI components cơ bản
  │   ├── layout/    # Layout components (Header, Sidebar...)
  │   └── ...
  ├── contexts/      # React contexts cho quản lý state
  ├── hooks/         # Custom React hooks
  ├── pages/         # Các trang trong ứng dụng
  │   ├── auth/      # Trang đăng nhập, quên mật khẩu...
  │   ├── students/  # Quản lý sinh viên
  │   ├── academic/  # Quản lý học tập
  │   └── ...
  ├── services/      # API services và các utilities
  ├── styles/        # Theme và các styles chung
  ├── utils/         # Các hàm utility
  ├── App.js         # Các cấu hình route chính
  └── index.js       # Entry point
```

## Tính năng chính

- **Quản lý sinh viên**: Xem, thêm, sửa, xóa thông tin sinh viên
- **Quản lý học tập**: Quản lý chương trình đào tạo, môn học, kết quả học tập
- **Quản lý học kỳ**: Tạo và quản lý các học kỳ
- **Báo cáo và thống kê**: Xem các báo cáo và thống kê về sinh viên, kết quả học tập

## Công nghệ sử dụng

- React.js
- Material-UI
- React Router
- Axios
- Formik & Yup
- JWT Authentication 