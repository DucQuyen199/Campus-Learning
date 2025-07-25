/*-----------------------------------------------------------------
* File: StoryViews.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[StoryViews] (
    [ViewID]   BIGINT   IDENTITY (1, 1) NOT NULL,
    [StoryID]  BIGINT   NULL,
    [ViewerID] BIGINT   NULL,
    [ViewedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ViewID] ASC),
    FOREIGN KEY ([StoryID]) REFERENCES [dbo].[Stories] ([StoryID]),
    FOREIGN KEY ([ViewerID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Story_View] UNIQUE NONCLUSTERED ([StoryID] ASC, [ViewerID] ASC)
);


GO

