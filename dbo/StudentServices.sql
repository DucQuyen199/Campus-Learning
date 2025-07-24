/*-----------------------------------------------------------------
* File: StudentServices.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[StudentServices] (
    [ServiceID]         BIGINT          IDENTITY (1, 1) NOT NULL,
    [ServiceName]       NVARCHAR (100)  NULL,
    [Description]       NVARCHAR (MAX)  NULL,
    [Price]             DECIMAL (10, 2) NULL,
    [ProcessingTime]    VARCHAR (50)    NULL,
    [RequiredDocuments] NVARCHAR (MAX)  NULL,
    [Department]        NVARCHAR (100)  NULL,
    [IsActive]          BIT             DEFAULT ((1)) NULL,
    [CreatedAt]         DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]         DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ServiceID] ASC)
);


GO

