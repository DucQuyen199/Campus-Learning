/*-----------------------------------------------------------------
* File: UserSettings.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[UserSettings] (
    [SettingID]         BIGINT       IDENTITY (1, 1) NOT NULL,
    [UserID]            BIGINT       NOT NULL,
    [Theme]             VARCHAR (20) DEFAULT ('light') NULL,
    [NotificationEmail] BIT          DEFAULT ((1)) NULL,
    [NotificationPush]  BIT          DEFAULT ((1)) NULL,
    [NotificationInApp] BIT          DEFAULT ((1)) NULL,
    [Language]          VARCHAR (10) DEFAULT ('vi-VN') NULL,
    [TimeZone]          VARCHAR (50) DEFAULT ('Asia/Ho_Chi_Minh') NULL,
    [ProfileVisibility] VARCHAR (20) DEFAULT ('public') NULL,
    [LastLoggedIn]      DATETIME     NULL,
    [LastUpdated]       DATETIME     DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([SettingID] ASC),
    CONSTRAINT [CHK_Profile_Visibility] CHECK ([ProfileVisibility]='private' OR [ProfileVisibility]='friends' OR [ProfileVisibility]='public'),
    CONSTRAINT [CHK_User_Theme] CHECK ([Theme]='system' OR [Theme]='dark' OR [Theme]='light'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([UserID] ASC)
);


GO

