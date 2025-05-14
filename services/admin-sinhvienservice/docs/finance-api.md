# Admin Student Service - Finance API Documentation

## Tuition Management API Endpoints

### Get All Tuition Records
```
GET /api/finance/tuition
```

Query Parameters:
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of records per page (default: 10)
- `search` (optional): Search by student code or name
- `semesterId` (optional): Filter by semester ID
- `status` (optional): Filter by status (unpaid, partial, paid, overdue, waived)

Response:
```json
{
  "success": true,
  "tuition": [
    {
      "TuitionID": 1,
      "UserID": 100,
      "SemesterID": 5,
      "TotalCredits": 18,
      "AmountPerCredit": 850000,
      "TotalAmount": 15300000,
      "ScholarshipAmount": 0,
      "FinalAmount": 15300000,
      "DueDate": "2023-09-15T00:00:00.000Z",
      "Status": "partial",
      "StudentName": "Nguyễn Văn A",
      "StudentCode": "SV001",
      "SemesterName": "Học kỳ 1, 2023-2024",
      "AcademicYear": "2023-2024",
      "PaidAmount": 10000000,
      "RemainingAmount": 5300000,
      "ClassName": "CNTT01",
      "ProgramName": "Công nghệ Thông tin",
      "FacultyName": "Công nghệ Thông tin"
    },
    // More records...
  ],
  "pagination": {
    "total": 150,
    "totalPages": 15,
    "currentPage": 1,
    "limit": 10
  }
}
```

### Get Tuition Details
```
GET /api/finance/tuition/:id
```

Path Parameters:
- `id`: The ID of the tuition record

Response:
```json
{
  "success": true,
  "tuition": {
    "TuitionID": 1,
    "UserID": 100,
    "SemesterID": 5,
    "TotalCredits": 18,
    "AmountPerCredit": 850000,
    "TotalAmount": 15300000,
    "ScholarshipAmount": 0,
    "FinalAmount": 15300000,
    "DueDate": "2023-09-15T00:00:00.000Z",
    "Status": "partial",
    "Notes": "Học phí học kỳ 1 năm học 2023-2024",
    "StudentName": "Nguyễn Văn A",
    "StudentCode": "SV001",
    "SemesterName": "Học kỳ 1, 2023-2024",
    "AcademicYear": "2023-2024",
    "PaidAmount": 10000000,
    "RemainingAmount": 5300000,
    "ClassName": "CNTT01",
    "ProgramName": "Công nghệ Thông tin",
    "FacultyName": "Công nghệ Thông tin"
  }
}
```

### Get Payment History
```
GET /api/finance/tuition/:id/payments
```

Path Parameters:
- `id`: The ID of the tuition record

Response:
```json
{
  "success": true,
  "payments": [
    {
      "PaymentID": 10,
      "TuitionID": 1,
      "UserID": 5,
      "Amount": 5000000,
      "PaymentMethod": "Bank Transfer",
      "TransactionCode": "TRX123456",
      "PaymentDate": "2023-09-10T10:30:00.000Z",
      "Status": "Completed",
      "BankReference": "Vietcombank",
      "Notes": "Thanh toán đợt 1",
      "ProcessedBy": "Admin User"
    },
    {
      "PaymentID": 15,
      "TuitionID": 1,
      "UserID": 5,
      "Amount": 5000000,
      "PaymentMethod": "Cash",
      "TransactionCode": null,
      "PaymentDate": "2023-09-20T10:30:00.000Z",
      "Status": "Completed",
      "BankReference": null,
      "Notes": "Thanh toán đợt 2",
      "ProcessedBy": "Admin User"
    }
  ]
}
```

### Process Payment
```
POST /api/finance/tuition/:id/payments
```

Path Parameters:
- `id`: The ID of the tuition record

Request Body:
```json
{
  "amount": 5000000,
  "paymentMethod": "Bank Transfer",
  "transactionCode": "TRX123456",
  "bankReference": "Vietcombank",
  "paymentDate": "2023-10-15T09:30:00.000Z",
  "notes": "Thanh toán đợt 3"
}
```

Response:
```json
{
  "success": true,
  "message": "Thanh toán đã được xử lý thành công.",
  "payment": {
    "paymentId": 20,
    "amount": 5000000,
    "paymentMethod": "Bank Transfer",
    "paymentDate": "2023-10-15T09:30:00.000Z",
    "status": "Completed"
  }
}
```

### Get Payment Receipt
```
GET /api/finance/tuition/payments/:paymentId/receipt
```

Path Parameters:
- `paymentId`: The ID of the payment

Response:
```json
{
  "success": true,
  "receipt": {
    "PaymentID": 10,
    "TuitionID": 1,
    "UserID": 5,
    "Amount": 5000000,
    "PaymentMethod": "Bank Transfer",
    "TransactionCode": "TRX123456",
    "PaymentDate": "2023-09-10T10:30:00.000Z",
    "Status": "Completed",
    "BankReference": "Vietcombank",
    "Notes": "Thanh toán đợt 1",
    "StudentName": "Nguyễn Văn A",
    "StudentCode": "SV001",
    "ProcessedBy": "Admin User",
    "SemesterID": 5,
    "SemesterName": "Học kỳ 1, 2023-2024",
    "AcademicYear": "2023-2024",
    "receiptNumber": "RECEIPT-10",
    "receiptDate": "2023-10-16T08:30:00.000Z",
    "institutionName": "Trường Đại học Hutech",
    "institutionAddress": "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
    "institutionTaxCode": "0123456789"
  }
}
```

### Generate Tuition Invoices
```
POST /api/finance/tuition/generate/:semesterId
```

Path Parameters:
- `semesterId`: The ID of the semester to generate invoices for

Request Body:
```json
{
  "programId": 3,
  "amountPerCredit": 850000,
  "dueDate": "2023-11-30",
  "notes": "Học phí học kỳ 2 năm học 2023-2024"
}
```

Response:
```json
{
  "success": true,
  "message": "Đã tạo 120 hóa đơn học phí thành công.",
  "stats": {
    "totalStudents": 125,
    "createdCount": 120,
    "errorCount": 5
  },
  "errors": [
    "UserID 105 đã có hóa đơn học phí cho học kỳ này.",
    "UserID 110 đã có hóa đơn học phí cho học kỳ này.",
    "UserID 115 đã có hóa đơn học phí cho học kỳ này.",
    "UserID 120 đã có hóa đơn học phí cho học kỳ này.",
    "UserID 125 đã có hóa đơn học phí cho học kỳ này."
  ]
}
```

### Get Tuition Statistics
```
GET /api/finance/tuition/statistics
```

Query Parameters:
- `semesterId` (optional): Filter by semester ID

Response:
```json
{
  "success": true,
  "statistics": {
    "overview": {
      "TotalInvoices": 500,
      "TotalAmount": 750000000,
      "TotalPaid": 500000000,
      "TotalUnpaid": 200000000,
      "TotalPartial": 50000000,
      "TotalOverdue": 0,
      "TotalWaived": 0,
      "AverageAmount": 15000000
    },
    "paymentMethods": [
      {
        "PaymentMethod": "Bank Transfer",
        "PaymentCount": 150,
        "TotalAmount": 300000000
      },
      {
        "PaymentMethod": "Cash",
        "PaymentCount": 100,
        "TotalAmount": 150000000
      },
      {
        "PaymentMethod": "Momo",
        "PaymentCount": 50,
        "TotalAmount": 50000000
      }
    ],
    "programs": [
      {
        "ProgramName": "Công nghệ Thông tin",
        "InvoiceCount": 150,
        "TotalAmount": 250000000,
        "PaidAmount": 200000000,
        "UnpaidAmount": 50000000
      },
      {
        "ProgramName": "Quản trị Kinh doanh",
        "InvoiceCount": 120,
        "TotalAmount": 200000000,
        "PaidAmount": 150000000,
        "UnpaidAmount": 50000000
      }
    ],
    "timeline": [
      {
        "Month": "2023-05",
        "PaymentCount": 100,
        "TotalAmount": 150000000
      },
      {
        "Month": "2023-06",
        "PaymentCount": 120,
        "TotalAmount": 180000000
      },
      {
        "Month": "2023-07",
        "PaymentCount": 80,
        "TotalAmount": 120000000
      },
      {
        "Month": "2023-08",
        "PaymentCount": 50,
        "TotalAmount": 75000000
      },
      {
        "Month": "2023-09",
        "PaymentCount": 30,
        "TotalAmount": 45000000
      },
      {
        "Month": "2023-10",
        "PaymentCount": 20,
        "TotalAmount": 30000000
      }
    ]
  }
}
```

## Error Responses

### Not Found (404)
```json
{
  "success": false,
  "message": "Không tìm thấy thông tin học phí."
}
```

### Bad Request (400)
```json
{
  "success": false,
  "message": "Vui lòng cung cấp đầy đủ thông tin bắt buộc."
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi xử lý thanh toán."
}
``` 