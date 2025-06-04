const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { generateAuthenticationOptions, verifyAuthenticationResponse, 
        generateRegistrationOptions, verifyRegistrationResponse } = require('@simplewebauthn/server');
const { isoBase64URL } = require('@simplewebauthn/server/helpers');

// In-memory cache for challenges (in production, use Redis or another persistent store)
const challengeCache = new Map();

// Configuration for WebAuthn
const rpName = 'CampusT Learning Platform';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || `https://${rpID}`;

/**
 * Generate passkey registration options
 */
exports.generateRegistrationOptions = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Parse existing credentials if any
    let existingCredentials = [];
    if (user.PasskeyCredentials) {
      try {
        existingCredentials = JSON.parse(user.PasskeyCredentials);
      } catch (error) {
        console.error('Error parsing existing credentials:', error);
      }
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.UserID.toString(),
      userName: user.Email,
      userDisplayName: user.FullName,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(cred => ({
        id: isoBase64URL.toBuffer(cred.credentialID),
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
      extensions: {
        credProps: true,
        // Store user info for credential discovery
        prf: {
          eval: {
            first: JSON.stringify({ 
              userId: user.UserID.toString(), 
              email: user.Email 
            })
          }
        }
      }
    });

    // Store challenge in cache with user ID
    const challenge = options.challenge;
    challengeCache.set(user.UserID.toString(), {
      challenge,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
    });

    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('Error generating registration options:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo tùy chọn đăng ký',
      error: error.message
    });
  }
};

/**
 * Verify passkey registration
 */
exports.verifyRegistration = async (req, res) => {
  try {
    const { userId } = req.user;
    const { response } = req.body;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Get stored challenge
    const challengeData = challengeCache.get(user.UserID.toString());
    if (!challengeData || challengeData.expires < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Challenge đã hết hạn hoặc không hợp lệ, vui lòng thử lại' 
      });
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Xác thực đăng ký không thành công' 
      });
    }

    // Get credential details
    const { credentialID, credentialPublicKey } = verification.registrationInfo;

    // Parse existing credentials or initialize empty array
    let existingCredentials = [];
    if (user.PasskeyCredentials) {
      try {
        existingCredentials = JSON.parse(user.PasskeyCredentials);
      } catch (error) {
        console.error('Error parsing existing credentials:', error);
      }
    }

    // Add new credential
    const newCredential = {
      id: uuidv4(),
      credentialID: isoBase64URL.fromBuffer(credentialID),
      credentialPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
      counter: verification.registrationInfo.counter,
      createdAt: new Date().toISOString()
    };

    existingCredentials.push(newCredential);

    // Update user with new credentials
    await User.updateOne(
      { UserID: user.UserID },
      { 
        PasskeyCredentials: JSON.stringify(existingCredentials),
        HasPasskey: true
      }
    );

    // Clear challenge from cache
    challengeCache.delete(user.UserID.toString());

    res.json({
      success: true,
      message: 'Đăng ký passkey thành công'
    });
  } catch (error) {
    console.error('Error verifying registration:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xác minh đăng ký',
      error: error.message
    });
  }
};

/**
 * Generate authentication options for login
 */
exports.generateAuthenticationOptions = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email is provided
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email là bắt buộc' 
      });
    }

    // Find user by email
    const user = await User.findOne({ Email: email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng với email này' 
      });
    }

    // Check if user has registered passkeys
    if (!user.HasPasskey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Người dùng chưa đăng ký passkey' 
      });
    }

    // Parse existing credentials
    let existingCredentials = [];
    try {
      existingCredentials = JSON.parse(user.PasskeyCredentials || '[]');
    } catch (error) {
      console.error('Error parsing credentials:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi xử lý thông tin xác thực' 
      });
    }

    if (!existingCredentials.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không tìm thấy passkey đã đăng ký' 
      });
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials: existingCredentials.map(cred => ({
        id: isoBase64URL.toBuffer(cred.credentialID),
        type: 'public-key',
      })),
    });

    // Store challenge in cache with user ID
    challengeCache.set(user.UserID.toString(), {
      challenge: options.challenge,
      email: user.Email,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
    });

    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('Error generating authentication options:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo tùy chọn xác thực',
      error: error.message
    });
  }
};

/**
 * Verify passkey authentication for login
 */
exports.verifyAuthentication = async (req, res) => {
  try {
    const { email, response } = req.body;
    
    // Find user by email
    const user = await User.findOne({ Email: email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng với email này' 
      });
    }

    // Get stored challenge
    const challengeData = challengeCache.get(user.UserID.toString());
    if (!challengeData || challengeData.expires < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Challenge đã hết hạn hoặc không hợp lệ, vui lòng thử lại' 
      });
    }

    // Parse existing credentials
    let existingCredentials = [];
    try {
      existingCredentials = JSON.parse(user.PasskeyCredentials || '[]');
    } catch (error) {
      console.error('Error parsing credentials:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi xử lý thông tin xác thực' 
      });
    }

    // Find the credential that was used
    const credentialID = isoBase64URL.fromBuffer(response.id);
    const credential = existingCredentials.find(
      cred => cred.credentialID === credentialID
    );

    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không tìm thấy thông tin xác thực' 
      });
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(credential.credentialID),
        credentialPublicKey: isoBase64URL.toBuffer(credential.credentialPublicKey),
        counter: credential.counter,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Xác thực không thành công' 
      });
    }

    // Update the credential counter
    credential.counter = verification.authenticationInfo.newCounter;
    
    // Update credentials in database
    await User.updateOne(
      { UserID: user.UserID },
      { PasskeyCredentials: JSON.stringify(existingCredentials) }
    );

    // Clear challenge from cache
    challengeCache.delete(user.UserID.toString());

    // Update last login info
    await User.updateOne(
      { UserID: user.UserID },
      { 
        LastLoginAt: new Date(),
        LastLoginIP: req.ip
      }
    );

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.UserID, email: user.Email, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.UserID },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info and tokens
    res.json({
      success: true,
      message: 'Đăng nhập thành công bằng passkey',
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role,
        image: user.Image
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xác minh xác thực',
      error: error.message
    });
  }
};

/**
 * List all registered passkeys for a user
 */
exports.listPasskeys = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Parse existing credentials
    let credentials = [];
    if (user.HasPasskey && user.PasskeyCredentials) {
      try {
        const fullCredentials = JSON.parse(user.PasskeyCredentials);
        // Only return non-sensitive information
        credentials = fullCredentials.map(cred => ({
          id: cred.id,
          createdAt: cred.createdAt
        }));
      } catch (error) {
        console.error('Error parsing credentials:', error);
      }
    }

    res.json({
      success: true,
      hasPasskey: user.HasPasskey,
      passkeys: credentials
    });
  } catch (error) {
    console.error('Error listing passkeys:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách passkey',
      error: error.message
    });
  }
};

/**
 * Remove a passkey
 */
exports.removePasskey = async (req, res) => {
  try {
    const { userId } = req.user;
    const { passkeyId } = req.params;
    
    if (!passkeyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID passkey là bắt buộc' 
      });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Parse existing credentials
    let credentials = [];
    if (user.PasskeyCredentials) {
      try {
        credentials = JSON.parse(user.PasskeyCredentials);
      } catch (error) {
        console.error('Error parsing credentials:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi khi xử lý thông tin xác thực' 
        });
      }
    }

    // Filter out the credential to remove
    const updatedCredentials = credentials.filter(cred => cred.id !== passkeyId);
    
    // Update user with new credentials list
    const hasPasskey = updatedCredentials.length > 0;
    await User.updateOne(
      { UserID: user.UserID },
      { 
        PasskeyCredentials: JSON.stringify(updatedCredentials),
        HasPasskey: hasPasskey
      }
    );

    res.json({
      success: true,
      message: 'Xóa passkey thành công',
      hasPasskey
    });
  } catch (error) {
    console.error('Error removing passkey:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa passkey',
      error: error.message
    });
  }
}; 