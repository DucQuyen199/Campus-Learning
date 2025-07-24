/*-----------------------------------------------------------------
* File: EventTechnologies.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[EventTechnologies] (
    [EventID]    BIGINT        NOT NULL,
    [Technology] VARCHAR (100) NOT NULL,
    PRIMARY KEY CLUSTERED ([EventID] ASC, [Technology] ASC),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

