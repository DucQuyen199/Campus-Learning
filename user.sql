use campushubt;
select * from users;
WITH Numbers AS (
    SELECT TOP (10000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
),
RandomUsers AS (
    SELECT 
        'user' + RIGHT('00000' + CAST(n AS VARCHAR(5)), 5) AS Username,
        'user' + RIGHT('00000' + CAST(n AS VARCHAR(5)), 5) + '@example.com' AS Email,
        CAST(NEWID() AS VARCHAR(36)) AS Password,
        N'Người Dùng ' + CAST(n AS NVARCHAR) AS FullName,
        DATEADD(DAY, -n % 10000, GETDATE()) AS DateOfBirth,
        N'Trường ' + CAST(n % 100 AS NVARCHAR) AS School,
        -- CHỈ CÓ STUDENT VÀ TEACHER
        CASE 
            WHEN n % 10 < 8 THEN 'STUDENT' -- 80%
            ELSE 'TEACHER'                -- 20%
        END AS Role,
        CASE 
            WHEN n % 3 = 0 THEN 'ONLINE'
            WHEN n % 3 = 1 THEN 'OFFLINE'
            ELSE 'AWAY'
        END AS Status,
        CASE 
            WHEN n % 100 < 90 THEN 'ACTIVE'
            WHEN n % 100 < 95 THEN 'LOCKED'
            WHEN n % 100 < 99 THEN 'SUSPENDED'
            ELSE 'DELETED'
        END AS AccountStatus,
        'https://example.com/avatar/' + CAST(n AS VARCHAR) + '.jpg' AS Image,
        N'Tiểu sử người dùng ' + CAST(n AS NVARCHAR) AS Bio,
        'local' AS Provider,
        NULL AS ProviderID,
        CASE WHEN n % 2 = 0 THEN 1 ELSE 0 END AS EmailVerified,
        '09' + CAST(10000000 + n AS VARCHAR) AS PhoneNumber,
        N'Số ' + CAST(n AS NVARCHAR) + ' Đường ABC' AS Address,
        N'TP ' + CAST(n % 100 AS NVARCHAR) AS City,
        N'Việt Nam' AS Country,
        CAST(CONVERT(VARCHAR(15), ABS(CHECKSUM(NEWID()))) AS VARCHAR) AS LastLoginIP,
        GETDATE() AS CreatedAt,
        GETDATE() AS UpdatedAt,
        NULL AS LastLoginAt,
        NULL AS DeletedAt
    FROM Numbers
)

INSERT INTO Users (
    Username, Email, Password, FullName, DateOfBirth, School, Role, Status,
    AccountStatus, Image, Bio, Provider, ProviderID, EmailVerified, PhoneNumber,
    Address, City, Country, LastLoginIP, CreatedAt, UpdatedAt, LastLoginAt, DeletedAt
)
SELECT 
    Username, Email, Password, FullName, DateOfBirth, School, Role, Status,
    AccountStatus, Image, Bio, Provider, ProviderID, EmailVerified, PhoneNumber,
    Address, City, Country, LastLoginIP, CreatedAt, UpdatedAt, LastLoginAt, DeletedAt
FROM RandomUsers;

