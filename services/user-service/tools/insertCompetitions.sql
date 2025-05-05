-- Insert 3 new competitions with complete information
-- Competition 1: Web Development Challenge
INSERT INTO Competitions (
    Title, 
    Description, 
    StartTime, 
    EndTime, 
    Duration, 
    Difficulty, 
    Status, 
    MaxParticipants, 
    CurrentParticipants, 
    PrizePool, 
    OrganizedBy, 
    CoverImageURL
)
VALUES (
    N'Web Development Challenge 2025', 
    N'Thử thách phát triển giao diện web và ứng dụng client-side với React và state management hiện đại. Người tham gia sẽ xây dựng ứng dụng theo yêu cầu với UI/UX đẹp và code chất lượng cao.',
    '2025-06-15 09:00:00',
    '2025-06-15 13:00:00',
    240, -- 4 hours
    N'Trung bình',
    'upcoming',
    300,
    0,
    3000000.00, -- 3 million VND
    1, -- Admin ID
    'https://picsum.photos/1200/400?random=101'
);

-- Add problems for Web Development Challenge
INSERT INTO CompetitionProblems (
    CompetitionID,
    Title,
    Description,
    Difficulty,
    Points,
    TimeLimit,
    MemoryLimit,
    InputFormat,
    OutputFormat,
    Constraints,
    SampleInput,
    SampleOutput,
    Explanation,
    ImageURL,
    StarterCode,
    TestCasesVisible,
    TestCasesHidden,
    Tags,
    Instructions
)
VALUES
-- Problem 1: Todo App
(
    10, -- Use SCOPE_IDENTITY() in real implementation
    N'Xây dựng Todo App với React',
    N'Xây dựng một ứng dụng Todo List sử dụng React hooks và state management. Ứng dụng cần có các chức năng: thêm, xóa, đánh dấu hoàn thành, lọc tasks, và lưu trữ trong localStorage.',
    N'Dễ',
    100,
    60, -- 60 minutes
    256,
    N'Không có input từ stdin, chỉ đánh giá code và giao diện người dùng',
    N'Đầu ra là một ứng dụng web hoạt động đúng yêu cầu',
    N'- Sử dụng React với functional components và hooks
- Lưu trữ dữ liệu trong localStorage
- Styling sử dụng CSS/SCSS hoặc framework UI như Tailwind',
    N'{"task": "Buy groceries", "completed": false}',
    N'Ứng dụng Todo List với UI thân thiện người dùng',
    N'Yêu cầu tối thiểu: Thêm, xóa, đánh dấu hoàn thành task. Lưu vào localStorage. Điểm cộng cho filter, search, drag & drop.',
    'https://picsum.photos/800/600?random=201',
    N'// React Todo App Starter Code
// Implement Todo app with React',
    N'[{"input": "add task", "output": "task added"}]',
    N'[{"input": "delete task", "output": "task deleted"}]',
    N'React, JavaScript, Frontend, State Management',
    N'Xây dựng ứng dụng Todo sử dụng React với các chức năng thêm, xóa, đánh dấu hoàn thành. Lưu ý sử dụng các hook như useState, useEffect, và lưu trữ dữ liệu trong localStorage.'
),
-- Problem 2: API Integration
(
    10, -- Use SCOPE_IDENTITY() in real implementation
    N'Tích hợp API trong ứng dụng React',
    N'Xây dựng ứng dụng hiển thị dữ liệu từ API công khai, bao gồm phân trang, tìm kiếm, và xử lý lỗi. Sử dụng API JSONPlaceholder để lấy và hiển thị danh sách bài viết.',
    N'Trung bình',
    150,
    90, -- 90 minutes
    256,
    N'Không có input từ stdin, đánh giá dựa trên code và chức năng ứng dụng',
    N'Đầu ra là ứng dụng web có khả năng fetch và hiển thị dữ liệu từ API',
    N'- Sử dụng fetch hoặc axios để lấy dữ liệu từ API
- Xử lý loading state và errors
- Triển khai phân trang, tìm kiếm, và lọc dữ liệu
- Giao diện thân thiện người dùng',
    N'fetch("https://jsonplaceholder.typicode.com/posts")',
    N'Danh sách bài viết với phân trang và tìm kiếm',
    N'Yêu cầu tối thiểu: Fetch dữ liệu, hiển thị loading state, xử lý lỗi, phân trang. Điểm cộng cho tìm kiếm, lọc, và UI đẹp.',
    'https://picsum.photos/800/600?random=202',
    N'// API Integration React App Starter Code
// Implement API fetching and display',
    N'[{"input": "fetch posts", "output": "100 posts"}]',
    N'[{"input": "search post", "output": "filtered posts"}]',
    N'React, API, Fetch, Async, Frontend',
    N'Xây dựng ứng dụng React tích hợp với API JSONPlaceholder để hiển thị danh sách bài viết. Cần có chức năng xử lý loading state, phân trang, và tìm kiếm.'
),
-- Problem 3: Responsive Web Design
(
    10, -- Use SCOPE_IDENTITY() in real implementation
    N'Thiết kế trang landing page responsive',
    N'Xây dựng trang landing page responsive cho một sản phẩm công nghệ theo mẫu thiết kế cho trước. Trang web phải responsive trên mọi kích thước màn hình từ mobile đến desktop.',
    N'Khó',
    200,
    120, -- 120 minutes
    256,
    N'Mockup design và yêu cầu kỹ thuật',
    N'Code HTML/CSS/JS tạo ra trang web theo yêu cầu',
    N'- Responsive trên mọi kích thước màn hình (mobile, tablet, desktop)
- Sử dụng flexbox hoặc grid layout
- Đảm bảo accessibility
- Tối ưu performance',
    N'Design mockup: https://example.com/mockup.png',
    N'Trang landing page responsive theo thiết kế',
    N'Đánh giá dựa trên độ chính xác so với thiết kế, khả năng responsive, và code chất lượng. Điểm cộng cho animations mượt mà và performance tốt.',
    'https://picsum.photos/800/600?random=203',
    N'<!-- Landing Page Starter Code -->
<!-- Implement responsive landing page -->',
    N'[{"input": "mobile view", "output": "responsive"}]',
    N'[{"input": "desktop view", "output": "responsive"}]',
    N'HTML, CSS, Responsive Design, UI/UX',
    N'Thiết kế trang landing page responsive cho sản phẩm công nghệ. Trang web phải hoạt động tốt trên mọi kích thước màn hình, sử dụng flexbox/grid, và đảm bảo accessibility.'
);

-- Competition 2: Algorithm Master Challenge
INSERT INTO Competitions (
    Title, 
    Description, 
    StartTime, 
    EndTime, 
    Duration, 
    Difficulty, 
    Status, 
    MaxParticipants, 
    CurrentParticipants, 
    PrizePool, 
    OrganizedBy, 
    CoverImageURL
)
VALUES (
    N'Algorithm Master Challenge 2025', 
    N'Thử thách thuật toán với các bài toán nâng cao về cấu trúc dữ liệu, quy hoạch động, và thuật toán tìm kiếm. Phù hợp cho người có kinh nghiệm lập trình và muốn trau dồi kỹ năng giải thuật.',
    '2025-07-20 10:00:00',
    '2025-07-20 14:00:00',
    240, -- 4 hours
    N'Khó',
    'upcoming',
    200,
    0,
    5000000.00, -- 5 million VND
    1, -- Admin ID
    'https://picsum.photos/1200/400?random=102'
);

-- Add problems for Algorithm Master Challenge
INSERT INTO CompetitionProblems (
    CompetitionID,
    Title,
    Description,
    Difficulty,
    Points,
    TimeLimit,
    MemoryLimit,
    InputFormat,
    OutputFormat,
    Constraints,
    SampleInput,
    SampleOutput,
    Explanation,
    ImageURL,
    StarterCode,
    TestCasesVisible,
    TestCasesHidden,
    Tags,
    Instructions
)
VALUES
-- Problem 1: Dynamic Programming
(
    11, -- Use SCOPE_IDENTITY() in real implementation
    N'Tối ưu hóa dãy con tăng dài nhất',
    N'Cho một dãy số nguyên, tìm độ dài của dãy con tăng dần dài nhất (longest increasing subsequence - LIS). Dãy con không nhất thiết phải liên tiếp.',
    N'Khó',
    150,
    1, -- 1 minute time limit
    256,
    N'Dòng đầu tiên chứa số nguyên n (1 ≤ n ≤ 10^5), là độ dài của dãy.
Dòng thứ hai chứa n số nguyên a_1, a_2, ..., a_n (1 ≤ a_i ≤ 10^9).',
    N'In ra một số nguyên duy nhất - độ dài của dãy con tăng dần dài nhất.',
    N'- 1 ≤ n ≤ 10^5
- 1 ≤ a_i ≤ 10^9
- Thời gian chạy: O(n log n)',
    N'5
1 3 2 4 5',
    N'4',
    N'Dãy con tăng dần dài nhất là [1, 3, 4, 5], có độ dài là 4.',
    'https://picsum.photos/800/600?random=204',
    N'// LIS Algorithm Starter Code
// Implement O(n log n) solution',
    N'[{"input": "5 1 3 2 4 5", "output": "4"}]',
    N'[{"input": "10 1 2 3 4 5", "output": "5"}]',
    N'Dynamic Programming, Binary Search, Arrays, Algorithms',
    N'Triển khai giải thuật tìm dãy con tăng dần dài nhất với độ phức tạp O(n log n). Cần sử dụng thuật toán tối ưu dựa trên tìm kiếm nhị phân.'
),
-- Problem 2: Graph Algorithms
(
    11, -- Use SCOPE_IDENTITY() in real implementation
    N'Tìm đường đi ngắn nhất',
    N'Cho đồ thị có hướng có trọng số không âm, hãy tìm đường đi ngắn nhất từ đỉnh nguồn đến tất cả các đỉnh còn lại.',
    N'Khó',
    200,
    2, -- 2 minute time limit
    512,
    N'Dòng đầu tiên chứa ba số nguyên n, m, s (1 ≤ n ≤ 10^5, 0 ≤ m ≤ 10^6, 1 ≤ s ≤ n), lần lượt là số đỉnh, số cạnh, và đỉnh nguồn.
M dòng tiếp theo, mỗi dòng chứa ba số nguyên u, v, w (1 ≤ u, v ≤ n, 0 ≤ w ≤ 10^9), biểu thị cạnh từ u đến v có trọng số w.',
    N'In ra n số nguyên, số thứ i biểu thị khoảng cách ngắn nhất từ đỉnh nguồn s đến đỉnh i. Nếu không tồn tại đường đi, in ra -1.',
    N'- 1 ≤ n ≤ 10^5
- 0 ≤ m ≤ 10^6
- 1 ≤ s ≤ n
- 1 ≤ u, v ≤ n
- 0 ≤ w ≤ 10^9',
    N'4 4 1
1 2 1
1 3 4
2 3 2
3 4 1',
    N'0 1 3 4',
    N'Khoảng cách từ đỉnh 1 đến các đỉnh [1, 2, 3, 4] lần lượt là [0, 1, 3, 4].',
    'https://picsum.photos/800/600?random=205',
    N'// Dijkstra Algorithm Starter Code
// Implement shortest path algorithm',
    N'[{"input": "4 4 1", "output": "0 1 3 4"}]',
    N'[{"input": "5 7 1", "output": "0 8 5 9 7"}]',
    N'Graphs, Dijkstra, Shortest Path, Priority Queue',
    N'Triển khai thuật toán Dijkstra để tìm đường đi ngắn nhất từ đỉnh nguồn đến tất cả các đỉnh khác trong đồ thị. Cần sử dụng cấu trúc dữ liệu priority queue để đạt được độ phức tạp tốt nhất.'
),
-- Problem 3: Backtracking
(
    11, -- Use SCOPE_IDENTITY() in real implementation
    N'Bài toán N quân hậu',
    N'Đặt N quân hậu trên bàn cờ N×N sao cho không có quân hậu nào tấn công quân hậu khác. Tìm số cách đặt quân hậu khác nhau.',
    N'Khó',
    250,
    3, -- 3 minute time limit
    256,
    N'Một số nguyên duy nhất N (1 ≤ N ≤ 15).',
    N'Số lượng cách đặt N quân hậu trên bàn cờ N×N.',
    N'1 ≤ N ≤ 15',
    N'8',
    N'92',
    N'Với bàn cờ 8×8, có 92 cách đặt 8 quân hậu sao cho không quân hậu nào tấn công quân khác.',
    'https://picsum.photos/800/600?random=206',
    N'// N-Queens Problem Starter Code
// Implement backtracking algorithm',
    N'[{"input": "4", "output": "2"}]',
    N'[{"input": "8", "output": "92"}]',
    N'Backtracking, Recursion, Chess Problem',
    N'Triển khai thuật toán quay lui (backtracking) để giải bài toán N quân hậu. Cần tối ưu hóa cách kiểm tra xem một quân hậu có tấn công quân khác không.'
);

-- Competition 3: Data Science and ML Challenge
INSERT INTO Competitions (
    Title, 
    Description, 
    StartTime, 
    EndTime, 
    Duration, 
    Difficulty, 
    Status, 
    MaxParticipants, 
    CurrentParticipants, 
    PrizePool, 
    OrganizedBy, 
    CoverImageURL
)
VALUES (
    N'Data Science & Machine Learning Challenge 2025', 
    N'Cuộc thi về phân tích dữ liệu và machine learning. Người tham gia sẽ xử lý dữ liệu thực tế, xây dựng mô hình dự đoán, và trình bày insights từ dữ liệu. Phù hợp cho người quan tâm đến AI, ML và Data Science.',
    '2025-08-10 09:00:00',
    '2025-08-17 23:59:59',
    11520, -- 8 days
    N'Trung bình',
    'upcoming',
    400,
    0,
    8000000.00, -- 8 million VND
    1, -- Admin ID
    'https://picsum.photos/1200/400?random=103'
);

-- Add problems for Data Science & ML Challenge
INSERT INTO CompetitionProblems (
    CompetitionID,
    Title,
    Description,
    Difficulty,
    Points,
    TimeLimit,
    MemoryLimit,
    InputFormat,
    OutputFormat,
    Constraints,
    SampleInput,
    SampleOutput,
    Explanation,
    ImageURL,
    StarterCode,
    TestCasesVisible,
    TestCasesHidden,
    Tags,
    Instructions
)
VALUES
-- Problem 1: Data Preprocessing
(
    12, -- Use SCOPE_IDENTITY() in real implementation
    N'Tiền xử lý dữ liệu',
    N'Xử lý và làm sạch bộ dữ liệu chứa thông tin về khách hàng. Cần xử lý dữ liệu bị thiếu, loại bỏ outliers, và chuẩn hóa dữ liệu trước khi phân tích.',
    N'Dễ',
    100,
    5, -- 5 minute time limit
    512,
    N'Bộ dữ liệu CSV chứa thông tin khách hàng với các cột: ID, Age, Income, Gender, Education, Occupation, và LoyaltyScore.',
    N'Bộ dữ liệu đã được xử lý và làm sạch, sẵn sàng cho phân tích.',
    N'- Xử lý dữ liệu bị thiếu
- Loại bỏ hoặc xử lý outliers
- Chuẩn hóa dữ liệu số
- Mã hóa dữ liệu categorical',
    N'ID,Age,Income,Gender,Education,Occupation,LoyaltyScore
1,25,45000,M,Bachelor,Engineer,8
2,,72000,F,Master,Manager,9
3,41,63000,M,PhD,Scientist,
...',
    N'Bộ dữ liệu đã được xử lý, không còn giá trị bị thiếu, outliers đã được xử lý, dữ liệu đã được chuẩn hóa.',
    N'Cần áp dụng các kỹ thuật làm sạch dữ liệu như imputation, standard scaling, one-hot encoding, v.v.',
    'https://picsum.photos/800/600?random=207',
    N'# Data Preprocessing Starter Code
# Implement data preprocessing steps',
    N'[{"input": "customer_data.csv", "output": "processed"}]',
    N'[{"input": "customer_data_large.csv", "output": "processed"}]',
    N'Data Preprocessing, Pandas, Feature Engineering, Data Cleaning',
    N'Implement các bước tiền xử lý dữ liệu như xử lý missing values (sử dụng SimpleImputer), loại bỏ outliers (sử dụng IQR hoặc Z-score), chuẩn hóa dữ liệu số (StandardScaler), và mã hóa dữ liệu categorical (OneHotEncoder).'
),
-- Problem 2: Predictive Modeling
(
    12, -- Use SCOPE_IDENTITY() in real implementation
    N'Xây dựng mô hình dự đoán churn',
    N'Xây dựng mô hình machine learning để dự đoán khách hàng có khả năng rời bỏ dịch vụ (churn). Cần áp dụng feature engineering, lựa chọn mô hình phù hợp, và đánh giá hiệu suất.',
    N'Trung bình',
    150,
    10, -- 10 minute time limit
    1024,
    N'Bộ dữ liệu CSV chứa thông tin về khách hàng và lịch sử sử dụng dịch vụ. Cột "Churn" là biến mục tiêu (0: không rời bỏ, 1: rời bỏ).',
    N'Mô hình dự đoán với độ chính xác, precision, recall, và F1-score cao.',
    N'- Áp dụng feature engineering
- Xử lý imbalanced data
- Lựa chọn và tối ưu mô hình
- Đánh giá bằng cross-validation
- Precision, Recall, F1-score >= 0.75',
    N'CustomerID,Age,Tenure,Contract,MonthlyCharges,TotalCharges,InternetService,PhoneService,StreamingTV,StreamingMovies,Churn
1,29,34,Month-to-month,56.95,1889.5,Fiber optic,Yes,No,No,0
2,45,22,One year,53.85,1184.7,Fiber optic,No,Yes,No,1
...',
    N'Accuracy: 0.82
Precision: 0.79
Recall: 0.76
F1-score: 0.77',
    N'Mô hình cần phải xử lý dữ liệu không cân bằng và lựa chọn các features quan trọng để đạt được kết quả tốt.',
    'https://picsum.photos/800/600?random=208',
    N'# Churn Prediction Model Starter Code
# Implement predictive modeling',
    N'[{"input": "churn_data.csv", "output": "model trained"}]',
    N'[{"input": "churn_data_large.csv", "output": "model trained"}]',
    N'Machine Learning, Classification, Feature Engineering, Model Evaluation',
    N'Xây dựng pipeline ML hoàn chỉnh từ tiền xử lý dữ liệu đến feature engineering và lựa chọn mô hình. Cần sử dụng kỹ thuật xử lý dữ liệu không cân bằng như SMOTE hoặc class_weight.'
),
-- Problem 3: Time Series Analysis
(
    12, -- Use SCOPE_IDENTITY() in real implementation
    N'Phân tích và dự báo chuỗi thời gian',
    N'Phân tích dữ liệu chuỗi thời gian về doanh số bán hàng và xây dựng mô hình dự báo cho 6 tháng tiếp theo. Cần phát hiện xu hướng, tính mùa vụ, và chọn mô hình phù hợp.',
    N'Khó',
    200,
    15, -- 15 minute time limit
    1024,
    N'Bộ dữ liệu CSV chứa doanh số bán hàng theo tháng trong 5 năm qua.',
    N'Mô hình dự báo chính xác với các metrics như MAE, RMSE, MAPE.',
    N'- Phân tích xu hướng và tính mùa vụ
- Chia dữ liệu thành training và testing
- Xây dựng mô hình dự báo
- Đánh giá bằng MAE, RMSE, MAPE
- Dự báo 6 tháng tiếp theo',
    N'Date,Sales
2020-01,10500
2020-02,11200
2020-03,9800
...',
    N'RMSE: 850
MAE: 720
MAPE: 5.2%
Dự báo 6 tháng tiếp theo:
2025-07: 15200
2025-08: 16100
...',
    N'Cần phân tích thành phần xu hướng, tính mùa vụ, và cyclical. Sử dụng mô hình thích hợp như ARIMA, SARIMA, hoặc Prophet.',
    'https://picsum.photos/800/600?random=209',
    N'# Time Series Forecasting Starter Code
# Implement time series analysis and forecasting',
    N'[{"input": "sales_data.csv", "output": "forecast generated"}]',
    N'[{"input": "sales_data_large.csv", "output": "forecast generated"}]',
    N'Time Series, Forecasting, ARIMA, Seasonality Analysis',
    N'Triển khai phân tích chuỗi thời gian và dự báo với mô hình thích hợp. Cần khám phá xu hướng, tính mùa vụ, và chọn mô hình phù hợp như ARIMA, SARIMA, hoặc Prophet.'
); 