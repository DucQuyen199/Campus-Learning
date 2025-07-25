/*-----------------------------------------------------------------
* File: Stories.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Stories] (
    [StoryID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT         NULL,
    [MediaUrl]        VARCHAR (255)  NULL,
    [MediaType]       VARCHAR (20)   NULL,
    [Duration]        INT            DEFAULT ((15)) NULL,
    [ViewCount]       INT            DEFAULT ((0)) NULL,
    [BackgroundColor] VARCHAR (20)   NULL,
    [TextContent]     NVARCHAR (500) NULL,
    [FontStyle]       VARCHAR (50)   NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [ExpiresAt]       DATETIME       NULL,
    [IsDeleted]       BIT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([StoryID] ASC),
    CONSTRAINT [CHK_Story_MediaType] CHECK ([MediaType]='text' OR [MediaType]='video' OR [MediaType]='image'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Stories_ExpiresAt]
    ON [dbo].[Stories]([ExpiresAt] ASC);


GO

