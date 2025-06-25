CREATE TABLE [dbo].[Attendance] (
    [AttendanceID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]       BIGINT         NULL,
    [ClassID]      BIGINT         NULL,
    [SessionDate]  DATE           NULL,
    [Status]       VARCHAR (20)   DEFAULT ('Present') NULL,
    [CheckInTime]  TIME (7)       NULL,
    [CheckOutTime] TIME (7)       NULL,
    [Method]       VARCHAR (20)   DEFAULT ('Manual') NULL,
    [Notes]        NVARCHAR (255) NULL,
    [RecordedBy]   BIGINT         NULL,
    [CreatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AttendanceID] ASC),
    CONSTRAINT [CHK_Attendance_Method] CHECK ([Method]='Face Recognition' OR [Method]='Online' OR [Method]='Manual' OR [Method]='RFID' OR [Method]='QR Code'),
    CONSTRAINT [CHK_Attendance_Status] CHECK ([Status]='Leave' OR [Status]='Excused' OR [Status]='Late' OR [Status]='Absent' OR [Status]='Present'),
    FOREIGN KEY ([ClassID]) REFERENCES [dbo].[CourseClasses] ([ClassID]),
    FOREIGN KEY ([RecordedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

