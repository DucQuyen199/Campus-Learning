/*-----------------------------------------------------------------
* File: StudentDetails.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[StudentDetails] (
    [DetailID]               BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]                 BIGINT         NULL,
    [StudentCode]            VARCHAR (20)   NULL,
    [IdentityCardNumber]     VARCHAR (20)   NULL,
    [IdentityCardIssueDate]  DATE           NULL,
    [IdentityCardIssuePlace] NVARCHAR (100) NULL,
    [Gender]                 VARCHAR (10)   NULL,
    [MaritalStatus]          VARCHAR (20)   NULL,
    [BirthPlace]             NVARCHAR (100) NULL,
    [Ethnicity]              NVARCHAR (50)  NULL,
    [Religion]               NVARCHAR (50)  NULL,
    [HomeTown]               NVARCHAR (100) NULL,
    [ParentName]             NVARCHAR (100) NULL,
    [ParentPhone]            VARCHAR (15)   NULL,
    [ParentEmail]            VARCHAR (100)  NULL,
    [EmergencyContact]       NVARCHAR (100) NULL,
    [EmergencyPhone]         VARCHAR (15)   NULL,
    [HealthInsuranceNumber]  VARCHAR (20)   NULL,
    [BloodType]              VARCHAR (5)    NULL,
    [EnrollmentDate]         DATE           NULL,
    [GraduationDate]         DATE           NULL,
    [Class]                  NVARCHAR (50)  NULL,
    [CurrentSemester]        INT            NULL,
    [AcademicStatus]         VARCHAR (30)   DEFAULT ('Regular') NULL,
    [BankAccountNumber]      VARCHAR (30)   NULL,
    [BankName]               NVARCHAR (100) NULL,
    [CreatedAt]              DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]              DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([DetailID] ASC),
    CONSTRAINT [CHK_Academic_Status] CHECK ([AcademicStatus]='On Leave' OR [AcademicStatus]='Graduated' OR [AcademicStatus]='Expelled' OR [AcademicStatus]='Suspended' OR [AcademicStatus]='Probation' OR [AcademicStatus]='Regular'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([StudentCode] ASC)
);


GO

