CREATE TABLE [dbo].[EventSchedule] (
    [ScheduleID]   BIGINT         IDENTITY (1, 1) NOT NULL,
    [EventID]      BIGINT         NULL,
    [ActivityName] NVARCHAR (255) NULL,
    [StartTime]    DATETIME       NULL,
    [EndTime]      DATETIME       NULL,
    [Description]  NVARCHAR (MAX) NULL,
    [Location]     NVARCHAR (255) NULL,
    [Type]         VARCHAR (50)   NULL,
    PRIMARY KEY CLUSTERED ([ScheduleID] ASC),
    CONSTRAINT [CHK_Schedule_Type] CHECK ([Type]='closing' OR [Type]='networking' OR [Type]='break' OR [Type]='main_event' OR [Type]='opening' OR [Type]='registration'),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

