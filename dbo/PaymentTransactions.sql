CREATE TABLE [dbo].[PaymentTransactions] (
    [TransactionID]   BIGINT          IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT          NULL,
    [CourseID]        BIGINT          NULL,
    [Amount]          DECIMAL (10, 2) NOT NULL,
    [Currency]        VARCHAR (10)    DEFAULT ('VND') NULL,
    [PaymentMethod]   VARCHAR (50)    NOT NULL,
    [TransactionCode] VARCHAR (100)   NULL,
    [PaymentStatus]   VARCHAR (20)    DEFAULT ('pending') NULL,
    [PaymentDate]     DATETIME        NULL,
    [CreatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    [PaymentDetails]  NVARCHAR (MAX)  NULL,
    [ReturnURL]       VARCHAR (500)   NULL,
    [CancelURL]       VARCHAR (500)   NULL,
    [Notes]           NVARCHAR (1000) NULL,
    PRIMARY KEY CLUSTERED ([TransactionID] ASC),
    CONSTRAINT [CHK_Payment_Method] CHECK ([PaymentMethod]='paypal' OR [PaymentMethod]='free' OR [PaymentMethod]='momo' OR [PaymentMethod]='bank_transfer' OR [PaymentMethod]='credit_card' OR [PaymentMethod]='vnpay' OR [PaymentMethod]='vietqr'),
    CONSTRAINT [CHK_Payment_Status] CHECK ([PaymentStatus]='cancelled' OR [PaymentStatus]='refunded' OR [PaymentStatus]='failed' OR [PaymentStatus]='completed' OR [PaymentStatus]='pending'),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([TransactionCode] ASC)
);
use campushubt;
-- Bước 1: Xóa constraint cũ
ALTER TABLE [dbo].[PaymentTransactions] DROP CONSTRAINT [CHK_Payment_Method];

-- Bước 2: Tạo lại constraint với vietqr
ALTER TABLE [dbo].[PaymentTransactions]
ADD CONSTRAINT [CHK_Payment_Method] CHECK (
  [PaymentMethod] IN ('paypal', 'free', 'momo', 'bank_transfer', 'credit_card', 'vnpay', 'vietqr')
);
