/*-----------------------------------------------------------------
* File: NotificationDelivery.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[NotificationDelivery] (
    [DeliveryID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [NotificationID] BIGINT         NULL,
    [Channel]        VARCHAR (20)   NULL,
    [Status]         VARCHAR (20)   NULL,
    [SentAt]         DATETIME       NULL,
    [DeliveredAt]    DATETIME       NULL,
    [ErrorMessage]   NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([DeliveryID] ASC),
    CONSTRAINT [CHK_Delivery_Channel] CHECK ([Channel]='in-app' OR [Channel]='sms' OR [Channel]='push' OR [Channel]='email'),
    CONSTRAINT [CHK_Delivery_Status] CHECK ([Status]='failed' OR [Status]='delivered' OR [Status]='sent' OR [Status]='pending'),
    FOREIGN KEY ([NotificationID]) REFERENCES [dbo].[Notifications] ([NotificationID])
);


GO

