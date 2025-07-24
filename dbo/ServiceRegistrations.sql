/*-----------------------------------------------------------------
* File: ServiceRegistrations.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[ServiceRegistrations] (
    [RegistrationID] BIGINT          IDENTITY (1, 1) NOT NULL,
    [UserID]         BIGINT          NULL,
    [ServiceID]      BIGINT          NULL,
    [Quantity]       INT             DEFAULT ((1)) NULL,
    [TotalPrice]     DECIMAL (10, 2) NULL,
    [RequestDate]    DATETIME        DEFAULT (getdate()) NULL,
    [Status]         VARCHAR (20)    DEFAULT ('Pending') NULL,
    [ProcessedBy]    BIGINT          NULL,
    [ProcessedAt]    DATETIME        NULL,
    [DeliveryMethod] VARCHAR (50)    NULL,
    [PaymentStatus]  VARCHAR (20)    DEFAULT ('Unpaid') NULL,
    [Comments]       NVARCHAR (500)  NULL,
    [CreatedAt]      DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]      DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([RegistrationID] ASC),
    CONSTRAINT [CHK_ServicePayment_Status] CHECK ([PaymentStatus]='Free' OR [PaymentStatus]='Refunded' OR [PaymentStatus]='Paid' OR [PaymentStatus]='Unpaid'),
    CONSTRAINT [CHK_ServiceRequest_Status] CHECK ([Status]='Cancelled' OR [Status]='Rejected' OR [Status]='Completed' OR [Status]='Processing' OR [Status]='Pending'),
    FOREIGN KEY ([ProcessedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([ServiceID]) REFERENCES [dbo].[StudentServices] ([ServiceID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

