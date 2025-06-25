CREATE TABLE [dbo].[NotificationTemplates] (
    [TemplateID] INT            IDENTITY (1, 1) NOT NULL,
    [Type]       VARCHAR (50)   NULL,
    [Title]      NVARCHAR (255) NULL,
    [Content]    NVARCHAR (MAX) NULL,
    [Parameters] NVARCHAR (MAX) NULL,
    [CreatedAt]  DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TemplateID] ASC)
);


GO

