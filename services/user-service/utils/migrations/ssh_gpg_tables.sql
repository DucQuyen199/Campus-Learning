-- Add SSH keys table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserSSHKeys')
BEGIN
    CREATE TABLE UserSSHKeys (
        KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
        Title NVARCHAR(100) NOT NULL,
        KeyType VARCHAR(20) NOT NULL,
        KeyValue NVARCHAR(MAX) NOT NULL,
        Fingerprint VARCHAR(100) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        LastUsedAt DATETIME NULL,
        DeletedAt DATETIME NULL,
        CONSTRAINT UQ_UserSSHKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
    );
    
    PRINT 'Created UserSSHKeys table';
END
ELSE
BEGIN
    PRINT 'UserSSHKeys table already exists';
END;

-- Add GPG keys table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserGPGKeys')
BEGIN
    CREATE TABLE UserGPGKeys (
        KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
        Title NVARCHAR(100) NOT NULL,
        KeyType VARCHAR(20) NOT NULL,
        KeyValue NVARCHAR(MAX) NOT NULL,
        Fingerprint VARCHAR(100) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        ExpiresAt DATETIME NULL,
        DeletedAt DATETIME NULL,
        CONSTRAINT UQ_UserGPGKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
    );
    
    PRINT 'Created UserGPGKeys table';
END
ELSE
BEGIN
    PRINT 'UserGPGKeys table already exists';
END; 