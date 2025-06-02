-- Insert sample data into StudentServices table
INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Xác nhận sinh viên', N'Giấy xác nhận đang học tập tại trường, có dấu mộc của phòng Đào tạo', 10000, N'3 ngày làm việc', N'CMND/CCCD, Thẻ sinh viên', N'Phòng Đào tạo', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Bảng điểm chính thức', N'Bảng điểm có xác nhận của Nhà trường, có dấu đỏ và chữ ký của Trưởng phòng Đào tạo', 20000, N'5 ngày làm việc', N'Thẻ sinh viên hoặc CMND/CCCD', N'Phòng Đào tạo', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Thẻ sinh viên', N'Cấp lại thẻ sinh viên khi bị mất, hỏng hoặc thay đổi thông tin', 50000, N'7 ngày làm việc', N'Đơn đề nghị cấp lại thẻ, CMND/CCCD, Ảnh 3x4', N'Phòng Công tác sinh viên', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Giấy giới thiệu thực tập', N'Giấy giới thiệu sinh viên đến thực tập tại doanh nghiệp, công ty, tổ chức', 10000, N'3 ngày làm việc', N'Thẻ sinh viên, Thông tin đơn vị thực tập', N'Phòng Đào tạo', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Xác nhận hoàn thành chương trình', N'Xác nhận đã hoàn thành chương trình học và đang chờ nhận bằng tốt nghiệp', 30000, N'5 ngày làm việc', N'Thẻ sinh viên, CMND/CCCD', N'Phòng Đào tạo', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Bản sao bằng tốt nghiệp', N'Cấp bản sao bằng tốt nghiệp từ sổ gốc, có giá trị như bằng chính', 50000, N'7 ngày làm việc', N'Đơn đề nghị cấp bản sao, CMND/CCCD, Bằng gốc (nếu có)', N'Phòng Đào tạo', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Bản sao học bạ', N'Cấp bản sao học bạ từ hồ sơ lưu trữ', 30000, N'5 ngày làm việc', N'Đơn đề nghị cấp bản sao, CMND/CCCD', N'Phòng Đào tạo', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Giấy xác nhận điểm rèn luyện', N'Xác nhận điểm rèn luyện của sinh viên trong học kỳ hoặc năm học', 15000, N'3 ngày làm việc', N'Thẻ sinh viên', N'Phòng Công tác sinh viên', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Giấy chứng nhận sinh viên', N'Chứng nhận là sinh viên của trường dành cho mục đích xin visa du học, thực tập nước ngoài', 50000, N'5 ngày làm việc', N'Thẻ sinh viên, CMND/CCCD, Thư mời hoặc chấp nhận từ đối tác nước ngoài', N'Phòng Hợp tác Quốc tế', 1);

INSERT INTO StudentServices (ServiceName, Description, Price, ProcessingTime, RequiredDocuments, Department, IsActive)
VALUES
(N'Đăng ký thi lại', N'Đăng ký tham gia kỳ thi lại các môn học không đạt', 100000, N'Theo lịch thi', N'Thẻ sinh viên, Biên lai đóng lệ phí thi lại', N'Phòng Khảo thí và Đảm bảo chất lượng', 1); 