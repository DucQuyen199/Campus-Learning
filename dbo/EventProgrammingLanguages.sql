/*-----------------------------------------------------------------
* File: EventProgrammingLanguages.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[EventProgrammingLanguages] (
    [EventID]  BIGINT       NOT NULL,
    [Language] VARCHAR (50) NOT NULL,
    PRIMARY KEY CLUSTERED ([EventID] ASC, [Language] ASC),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

