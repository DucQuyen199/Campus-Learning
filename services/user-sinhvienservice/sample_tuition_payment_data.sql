USE campushubt;
GO

-- Sample data for tuition and payments

-- Sample semesters if not already created
IF NOT EXISTS (SELECT 1 FROM Semesters WHERE SemesterCode = 'HK1_2023_2024')
BEGIN
    INSERT INTO Semesters (SemesterCode, SemesterName, AcademicYear, StartDate, EndDate, 
                           RegistrationStartDate, RegistrationEndDate, Status, IsCurrent)
    VALUES 
    ('HK1_2023_2024', 'Học kỳ 1', '2023-2024', '2023-08-15', '2023-12-31', 
     '2023-07-15', '2023-08-10', 'Ongoing', 1),
    ('HK2_2023_2024', 'Học kỳ 2', '2023-2024', '2024-01-15', '2024-05-31', 
     '2023-12-15', '2024-01-10', 'Upcoming', 0),
    ('HK1_2022_2023', 'Học kỳ 1', '2022-2023', '2022-08-15', '2022-12-31', 
     '2022-07-15', '2022-08-10', 'Completed', 0),
    ('HK2_2022_2023', 'Học kỳ 2', '2022-2023', '2023-01-15', '2023-05-31', 
     '2022-12-15', '2023-01-10', 'Completed', 0)
END

-- Insert tuition data for user ID 1 (assuming this user exists)
IF NOT EXISTS (SELECT 1 FROM Tuition WHERE UserID = 1)
BEGIN
    DECLARE @HK1_2023_2024 BIGINT = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK1_2023_2024')
    DECLARE @HK2_2022_2023 BIGINT = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK2_2022_2023')
    DECLARE @HK1_2022_2023 BIGINT = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK1_2022_2023')
    
    -- Insert tuition records
    INSERT INTO Tuition (UserID, SemesterID, TotalCredits, AmountPerCredit, TotalAmount, 
                        ScholarshipAmount, FinalAmount, DueDate, Status, CreatedAt, UpdatedAt)
    VALUES 
    -- Current semester with partial payment
    (1, @HK1_2023_2024, 15, 850000, 12750000, 
     0, 12750000, '2023-09-30', 'Partial', GETDATE(), GETDATE()),
    
    -- Previous semester fully paid
    (1, @HK2_2022_2023, 18, 850000, 15300000, 
     0, 15300000, '2023-02-28', 'Paid', GETDATE(), GETDATE()),
    
    -- Older semester fully paid
    (1, @HK1_2022_2023, 18, 850000, 15300000, 
     0, 15300000, '2022-09-30', 'Paid', GETDATE(), GETDATE())
END

-- Add some other fees for variety
UPDATE Tuition SET 
    OtherFees = 2500000,
    TotalAmount = TotalAmount + 2500000,
    FinalAmount = FinalAmount + 2500000
WHERE UserID = 1 AND OtherFees IS NULL

-- Insert payment records
IF NOT EXISTS (SELECT 1 FROM TuitionPayments)
BEGIN
    DECLARE @CurrentTuitionID BIGINT = (
        SELECT TuitionID FROM Tuition 
        WHERE UserID = 1 AND SemesterID = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK1_2023_2024')
    )
    
    DECLARE @PreviousTuitionID1 BIGINT = (
        SELECT TuitionID FROM Tuition 
        WHERE UserID = 1 AND SemesterID = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK2_2022_2023')
    )
    
    DECLARE @PreviousTuitionID2 BIGINT = (
        SELECT TuitionID FROM Tuition 
        WHERE UserID = 1 AND SemesterID = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK1_2022_2023')
    )
    
    -- Partial payment for current semester
    INSERT INTO TuitionPayments (TuitionID, UserID, Amount, PaymentMethod, TransactionCode, 
                                PaymentDate, Status, BankReference, Notes, CreatedAt, UpdatedAt)
    VALUES
    (@CurrentTuitionID, 1, 6375000, 'Bank Transfer', 'TRX123456789',
     DATEADD(day, -20, GETDATE()), 'Completed', 'BANK123456', 'Đợt 1', GETDATE(), GETDATE()),
    
    -- Complete payment for previous semester (two transactions)
    (@PreviousTuitionID1, 1, 9000000, 'Bank Transfer', 'TRX223456789',
     DATEADD(day, -120, GETDATE()), 'Completed', 'BANK223456', 'Đợt 1', GETDATE(), GETDATE()),
    
    (@PreviousTuitionID1, 1, 8800000, 'Credit Card', 'TRX323456789',
     DATEADD(day, -90, GETDATE()), 'Completed', 'BANK323456', 'Đợt 2', GETDATE(), GETDATE()),
    
    -- Complete payment for older semester (lump sum)
    (@PreviousTuitionID2, 1, 17800000, 'Bank Transfer', 'TRX423456789',
     DATEADD(day, -240, GETDATE()), 'Completed', 'BANK423456', 'Thanh toán một lần', GETDATE(), GETDATE())
END

-- Update remaining amounts to reflect payments
UPDATE Tuition 
SET RemainingAmount = FinalAmount - (
    SELECT ISNULL(SUM(Amount), 0) 
    FROM TuitionPayments 
    WHERE TuitionID = Tuition.TuitionID AND Status = 'Completed'
)
WHERE UserID = 1

-- Update status based on payments
UPDATE Tuition
SET Status = CASE 
    WHEN RemainingAmount = 0 THEN 'Paid'
    WHEN RemainingAmount < FinalAmount THEN 'Partial'
    ELSE 'Unpaid'
END
WHERE UserID = 1

-- Add failed payment for testing
INSERT INTO TuitionPayments (TuitionID, UserID, Amount, PaymentMethod, TransactionCode, 
                           PaymentDate, Status, BankReference, Notes, CreatedAt, UpdatedAt)
VALUES
((SELECT TuitionID FROM Tuition WHERE UserID = 1 AND Status = 'Partial'), 
 1, 3000000, 'Credit Card', 'TRX987654321',
 DATEADD(day, -3, GETDATE()), 'Failed', NULL, 'Giao dịch bị từ chối', GETDATE(), GETDATE())

GO

-- Verify data was inserted correctly
SELECT t.TuitionID, t.UserID, s.SemesterName, s.AcademicYear, t.TotalAmount, t.FinalAmount, t.RemainingAmount, t.Status
FROM Tuition t
JOIN Semesters s ON t.SemesterID = s.SemesterID
WHERE t.UserID = 1
ORDER BY s.StartDate DESC

SELECT tp.PaymentID, tp.TuitionID, tp.Amount, tp.PaymentMethod, tp.Status, tp.PaymentDate, 
       s.SemesterName, s.AcademicYear
FROM TuitionPayments tp
JOIN Tuition t ON tp.TuitionID = t.TuitionID
JOIN Semesters s ON t.SemesterID = s.SemesterID
ORDER BY tp.PaymentDate DESC 