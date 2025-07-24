/*-----------------------------------------------------------------
* File: PostMedia.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[PostMedia] (
    [MediaID]      BIGINT        IDENTITY (1, 1) NOT NULL,
    [PostID]       BIGINT        NULL,
    [MediaUrl]     VARCHAR (255) NOT NULL,
    [MediaType]    VARCHAR (20)  NULL,
    [ThumbnailUrl] VARCHAR (255) NULL,
    [Size]         INT           NULL,
    [Width]        INT           NULL,
    [Height]       INT           NULL,
    [Duration]     INT           NULL,
    [CreatedAt]    DATETIME      DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([MediaID] ASC),
    CONSTRAINT [CHK_Media_Type] CHECK ([MediaType]='audio' OR [MediaType]='document' OR [MediaType]='video' OR [MediaType]='image'),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID])
);


GO

