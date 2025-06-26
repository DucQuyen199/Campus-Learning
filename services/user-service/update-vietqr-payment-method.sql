-- Add VietQR to payment methods check constraint
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Payment_Method')
BEGIN
    ALTER TABLE PaymentTransactions DROP CONSTRAINT CHK_Payment_Method;
    
    ALTER TABLE PaymentTransactions 
    ADD CONSTRAINT CHK_Payment_Method CHECK (
        PaymentMethod IN ('paypal', 'free', 'momo', 'bank_transfer', 'credit_card', 'vnpay', 'vietqr')
    );
    
    PRINT 'PaymentTransactions table updated with VietQR payment method';
END
ELSE
BEGIN
    PRINT 'CHK_Payment_Method constraint not found';
END
