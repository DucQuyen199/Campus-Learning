-- Thêm dữ liệu mẫu cho bài thi ID = 6 (Bài thi về tư tưởng Hồ Chí Minh)

-- Xóa dữ liệu cũ nếu có
DELETE FROM ExamQuestions WHERE ExamID = 6;

-- Thêm câu hỏi tự luận
INSERT INTO ExamQuestions (ExamID, Type, Content, Points, OrderIndex, CorrectAnswer, Explanation)
VALUES 
(6, 'essay', N'Phân tích tư tưởng Hồ Chí Minh về độc lập dân tộc và chủ nghĩa xã hội.', 20, 1, 
 N'Tư tưởng Hồ Chí Minh về độc lập dân tộc gắn liền với chủ nghĩa xã hội, kết hợp mục tiêu dân tộc với mục tiêu xã hội. Người khẳng định con đường giành độc lập dân tộc phải gắn liền với con đường đi lên chủ nghĩa xã hội.', 
 N'Đây là câu hỏi đánh giá mức độ hiểu biết về tư tưởng Hồ Chí Minh.'),

(6, 'essay', N'Làm thế nào tư tưởng Hồ Chí Minh về đoàn kết dân tộc vẫn còn giá trị trong thời đại ngày nay?', 20, 2, 
 N'Tư tưởng đoàn kết dân tộc của Hồ Chí Minh vẫn có giá trị lớn trong thời đại ngày nay thông qua việc đoàn kết toàn dân, không phân biệt tôn giáo, dân tộc, để xây dựng và phát triển đất nước, đoàn kết quốc tế trong bối cảnh hội nhập toàn cầu.', 
 N'Yêu cầu liên hệ thực tiễn hiện nay.'),

(6, 'essay', N'Nêu những đóng góp của Hồ Chí Minh trong việc xây dựng nhà nước của dân, do dân và vì dân.', 20, 3, 
 N'Hồ Chí Minh đã có đóng góp to lớn trong việc xây dựng nhà nước của dân, do dân và vì dân thông qua việc thiết lập chế độ dân chủ nhân dân, xây dựng hiến pháp và pháp luật, đề cao quyền làm chủ của nhân dân, thực hiện nguyên tắc tập trung dân chủ, và phát huy vai trò của nhân dân trong xây dựng và kiểm soát nhà nước.', 
 N'Câu hỏi đánh giá kiến thức về tư tưởng Hồ Chí Minh về nhà nước.'),

(6, 'essay', N'Phân tích tư tưởng đạo đức cách mạng của Hồ Chí Minh và ý nghĩa của nó đối với việc xây dựng đạo đức trong xã hội ngày nay.', 20, 4, 
 N'Tư tưởng đạo đức cách mạng của Hồ Chí Minh bao gồm: trung với nước, hiếu với dân; cần, kiệm, liêm, chính; thương yêu con người; tinh thần quốc tế trong sáng. Những tư tưởng này có ý nghĩa quan trọng trong việc xây dựng đạo đức xã hội hiện nay, đấu tranh chống quan liêu, tham nhũng, lãng phí.', 
 N'Câu hỏi yêu cầu liên hệ thực tiễn và đánh giá ý nghĩa.'),

(6, 'essay', N'So sánh tư tưởng Hồ Chí Minh với chủ nghĩa Mác-Lênin về vấn đề giải phóng dân tộc.', 20, 5, 
 N'Cả tư tưởng Hồ Chí Minh và chủ nghĩa Mác-Lênin đều khẳng định tầm quan trọng của giải phóng dân tộc. Tuy nhiên, Hồ Chí Minh đặt giải phóng dân tộc là nhiệm vụ hàng đầu, là tiền đề của cách mạng vô sản, phù hợp với điều kiện Việt Nam và các nước thuộc địa. Đây là sự vận dụng và phát triển sáng tạo chủ nghĩa Mác-Lênin vào điều kiện cụ thể của Việt Nam.', 
 N'Câu hỏi đánh giá khả năng phân tích, so sánh.'); 