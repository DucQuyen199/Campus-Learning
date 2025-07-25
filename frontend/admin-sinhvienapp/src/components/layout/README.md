# Hướng dẫn sử dụng PageContainer

## Giới thiệu
Để đảm bảo tất cả các trang hiển thị đúng với chiều rộng đầy đủ và thống nhất trong toàn bộ ứng dụng, chúng ta sử dụng component `PageContainer` bọc nội dung của mỗi trang.

## Cách sử dụng
Đối với tất cả các trang trong thư mục `/pages`, bạn cần thêm và sử dụng PageContainer như sau:

1. Import PageContainer vào trang:
```jsx
import PageContainer from '../components/layout/PageContainer';
```

2. Bọc nội dung trang bằng PageContainer:
```jsx
const YourPage = () => {
  return (
    <PageContainer>
      {/* Nội dung trang của bạn */}
    </PageContainer>
  );
};
```

3. Các props có thể sử dụng:
   - `fullHeight`: Để PageContainer chiếm toàn bộ chiều cao (mặc định: false)
   - `noPadding`: Bỏ padding bên trong PageContainer (mặc định: false)

## Ví dụ đã cập nhật
- `Dashboard.js`
- `NotFound.js`

## Cần cập nhật
Tất cả các file còn lại trong thư mục `/pages` nên được cập nhật tương tự. 