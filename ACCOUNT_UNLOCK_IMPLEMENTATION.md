# Account Unlock System Implementation

## Overview
This document describes the implementation of an automatic account locking and unlock system for the CampusLearning platform. The system detects multiple failed login attempts from the same IP address and temporarily locks accounts, requiring Gmail and 2FA verification for unlock.

## Features Implemented

### 1. **Failed Login Attempt Tracking**
- Tracks all login attempts (successful and failed) by IP address
- Configurable thresholds for maximum failed attempts (default: 5 attempts)
- Time window-based counting (default: 15 minutes)
- User agent and failure reason logging

### 2. **IP-Based Blocking**
- Blocks IP addresses after multiple failed attempts
- Temporary blocking with configurable duration
- Different blocking strategies for IPs vs user accounts

### 3. **Account Locking**
- Automatic account locking after threshold breaches
- Configurable lock duration (default: 30 minutes)
- Lock reason and metadata storage
- Automatic unlock after expiration

### 4. **Email-Based Unlock Verification**
- Secure token generation for unlock process
- Email with unlock instructions and link
- Token expiration handling (default: 24 hours)

### 5. **2FA Integration for Unlock**
- Requires 2FA verification if user has it enabled
- Secure temporary token for 2FA verification
- TOTP verification using speakeasy

## Database Schema

### New Tables Created

#### `LoginAttempts`
```sql
CREATE TABLE [dbo].[LoginAttempts] (
    [AttemptID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [IPAddress]     VARCHAR (45)   NOT NULL,
    [Email]         VARCHAR (100)  NULL,
    [UserID]        BIGINT         NULL,
    [AttemptTime]   DATETIME       DEFAULT (getdate()) NOT NULL,
    [IsSuccessful]  BIT            DEFAULT ((0)) NOT NULL,
    [UserAgent]     NVARCHAR (500) NULL,
    [FailureReason] NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([AttemptID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);
```

#### `AccountUnlockTokens`
```sql
CREATE TABLE [dbo].[AccountUnlockTokens] (
    [TokenID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]        BIGINT         NOT NULL,
    [UnlockToken]   VARCHAR (255)  NOT NULL,
    [EmailToken]    VARCHAR (255)  NOT NULL,
    [IPAddress]     VARCHAR (45)   NOT NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NOT NULL,
    [ExpiresAt]     DATETIME       NOT NULL,
    [IsUsed]        BIT            DEFAULT ((0)) NOT NULL,
    [UsedAt]        DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([TokenID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);
```

### Existing Table Updates
The system utilizes existing columns in the `Users` table:
- `AccountStatus` (supports 'LOCKED' status)
- `LockDuration`
- `LockReason`
- `LockedUntil`
- `LastLoginIP`

## Backend Implementation

### Security Service (`securityService.js`)
Core module handling:
- Login attempt recording
- IP blocking checks
- Account locking logic
- Token generation and verification
- Account unlock operations

### Email Service Updates (`emailService.js`)
Enhanced with:
- Account lock notification emails
- Unlock verification emails
- Account unlocked confirmation emails

### Auth Controller Updates (`authController.js`)
Enhanced login logic with:
- IP blocking checks
- Failed attempt tracking
- Account lock detection
- Automatic lock triggers
- Enhanced error responses

### New Controller (`accountUnlockController.js`)
Dedicated controller for:
- Unlock token verification
- Email token verification
- 2FA verification for unlock
- Account status checks

### API Routes (`/api/unlock/`)
- `GET /verify-token/:token` - Verify unlock token
- `POST /verify-email` - Verify email token
- `POST /verify-2fa` - Complete unlock with 2FA
- `POST /request-email` - Request new unlock email
- `GET /status/:email` - Check account lock status

## Frontend Implementation

### New Page (`UnlockAccount.jsx`)
Comprehensive unlock interface with:
- Token verification flow
- Email verification step
- 2FA input interface
- Success/error state handling
- Auto-redirect functionality

### Enhanced Login Page (`Login.jsx`)
Updated error handling for:
- Account lock notifications
- IP blocking messages
- Remaining attempts display
- Unlock email sent confirmation

### API Service Integration (`api.js`)
Added unlock-related API functions:
- `verifyUnlockToken()`
- `verifyEmailToken()`
- `verifyTwoFAUnlock()`
- `requestNewUnlockEmail()`
- `getAccountLockStatus()`

## Configuration

### Security Settings (Configurable in `securityService.js`)
```javascript
const MAX_FAILED_ATTEMPTS = 5;        // Max attempts before locking
const LOCKOUT_DURATION_MINUTES = 30;  // Account lock duration
const TIME_WINDOW_MINUTES = 15;       // Time window for counting attempts
const TOKEN_EXPIRY_HOURS = 24;        // Unlock token expiry
```

## Security Features

### 1. **Rate Limiting**
- IP-based attempt limiting
- Progressive lockout increases
- Time-based automatic unlock

### 2. **Token Security**
- UUID-based tokens
- Separate email and unlock tokens
- Token expiration handling
- Single-use tokens

### 3. **2FA Integration**
- Required for users with 2FA enabled
- TOTP verification
- Time-based code validation
- Secure temporary tokens

### 4. **Audit Trail**
- Complete login attempt logging
- IP address tracking
- User agent recording
- Failure reason categorization

## Error Handling

### HTTP Status Codes
- `423 Locked` - Account is locked
- `429 Too Many Requests` - IP blocked
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account suspended
- `400 Bad Request` - Invalid tokens/input

### Error Messages
- Clear, user-friendly Vietnamese messages
- Remaining attempts indication
- Lock duration information
- Unlock instructions

## Email Templates

### Account Lock Notification
Professional email template with:
- Lock reason and duration
- IP address information
- Unlock instructions
- Security recommendations

### Account Unlocked Confirmation
Confirmation email with:
- Unlock timestamp
- IP address used
- Security tips

## Usage Flow

### Normal Login Flow
1. User enters credentials
2. System checks IP blocking status
3. System verifies account lock status
4. Password verification
5. Track attempt (success/failure)
6. Handle 2FA if enabled
7. Complete login or show errors

### Account Lock Flow
1. Multiple failed attempts trigger lock
2. Account status set to 'LOCKED'
3. Unlock token generated
4. Email sent with unlock link
5. User clicks link to start unlock process

### Unlock Flow
1. User clicks unlock link
2. System verifies unlock token
3. Email token auto-verification
4. 2FA verification (if enabled)
5. Account unlocked
6. Confirmation email sent
7. User redirected to login

## Installation & Setup

### Database Setup
1. Run `dbo/login-security-tables.sql` to create new tables
2. Ensure indexes are created for performance

### Backend Setup
1. Security service is automatically loaded
2. Email service includes new templates
3. Routes are registered in `app.js`

### Frontend Setup
1. Unlock page component created
2. Routes configured in `App.jsx`
3. API services integrated

## Testing

### Test Scenarios
1. **Normal Login** - Verify tracking works
2. **Failed Attempts** - Test threshold triggers
3. **IP Blocking** - Verify IP-based blocking
4. **Account Unlock** - Test email flow
5. **2FA Unlock** - Test 2FA integration
6. **Token Expiration** - Test expired tokens
7. **Error Handling** - Test various error conditions

## Maintenance

### Regular Cleanup
- Implement cleanup job for expired tokens
- Archive old login attempts
- Monitor failed attempt patterns

### Monitoring
- Track lock frequency
- Monitor IP blocking patterns
- Review security metrics

## Security Considerations

### Best Practices Implemented
- Secure token generation
- Time-based token expiration
- Rate limiting
- Audit logging
- Progressive lockouts
- Email verification
- 2FA integration

### Future Enhancements
- CAPTCHA integration
- Geographic IP analysis
- Machine learning for anomaly detection
- Admin unlock interface
- Customizable lock durations
- SMS verification option

## File Structure

```
Backend:
├── dbo/
│   └── login-security-tables.sql
├── services/user-service/
│   ├── utils/
│   │   ├── securityService.js
│   │   └── emailService.js (updated)
│   ├── controllers/
│   │   ├── authController.js (updated)
│   │   └── accountUnlockController.js
│   └── routes/
│       └── unlockRoutes.js

Frontend:
├── src/
│   ├── pages/Auth/
│   │   ├── Login.jsx (updated)
│   │   └── UnlockAccount.jsx
│   ├── services/
│   │   └── api.js (updated)
│   └── App.jsx (updated)
```

## Conclusion

The account unlock system provides comprehensive security against brute force attacks while maintaining user experience through automated unlock processes. The implementation includes robust error handling, security features, and maintains audit trails for security monitoring.

The system is fully integrated with existing authentication flows and provides a seamless experience for legitimate users while effectively blocking malicious attempts. 