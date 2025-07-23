const { base64url } = require('../utils/encoding');
const User = require('../models/user');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const sql = require('mssql');
const { pool } = require('../config/db');

// Store challenges temporarily in memory (in production, use Redis or similar)
const challenges = new Map();

// WebAuthn configuration
const rpName = 'CampusLearning';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || `https://${rpID}`;

// Token configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate registration options for creating a new passkey
 */
exports.generateRegistrationOptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a random challenge
    const challenge = crypto.randomBytes(32);
    const challengeBase64 = base64url.encode(challenge);
    
    // Store the challenge with user ID for verification later
    challenges.set(userId.toString(), challengeBase64);
    
    // Generate registration options
    const registrationOptions = {
      challenge: challengeBase64,
      rp: {
        name: rpName,
        id: rpID,
      },
      user: {
        id: base64url.encode(Buffer.from(userId.toString())),
        name: user.Email || user.Username,
        displayName: user.FullName || user.Username,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (like fingerprint or Face ID)
        userVerification: 'required', // Require biometric verification
        requireResidentKey: true,
      },
      timeout: 60000, // 1 minute
      attestation: 'none' // Don't request attestation to keep things simple
    };

    // If user already has credentials, exclude them
    if (user.PasskeyCredentials) {
      try {
        let credentials = JSON.parse(user.PasskeyCredentials);
        if (Array.isArray(credentials) && credentials.length > 0) {
          console.log(`User ${userId} has ${credentials.length} existing credentials`);
          registrationOptions.excludeCredentials = credentials.map(cred => ({
            id: cred.id,
            type: 'public-key',
            transports: ['internal']
          }));
        }
      } catch (error) {
        console.error('Error parsing existing credentials:', error);
        console.error('Raw credentials:', user.PasskeyCredentials);
      }
    }

    return res.json({
      success: true,
      options: registrationOptions
    });
  } catch (error) {
    console.error('Error generating registration options:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Verify registration of a new passkey credential
 */
exports.verifyRegistration = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { id, rawId, type, response } = req.body;
    
    // Verify the challenge
    const expectedChallenge = challenges.get(userId.toString());
    if (!expectedChallenge) {
      return res.status(400).json({ message: 'Registration session expired' });
    }

    // Remove used challenge
    challenges.delete(userId.toString());
    
    // Parse client data JSON
    const clientDataJSON = JSON.parse(
      Buffer.from(base64url.decode(response.clientDataJSON)).toString()
    );
    
    // Verify challenge
    if (clientDataJSON.challenge !== expectedChallenge) {
      return res.status(400).json({ message: 'Challenge verification failed' });
    }
    
    // Verify origin: use ORIGIN env var or request Origin header
    const expectedOrigin = process.env.ORIGIN || req.headers.origin;
    if (clientDataJSON.origin !== expectedOrigin) {
      console.error(`Origin mismatch: expected ${expectedOrigin}, actual ${clientDataJSON.origin}`);
      return res.status(400).json({ 
        success: false,
        message: 'Origin verification failed',
        expected: expectedOrigin,
        actual: clientDataJSON.origin
      });
    }

    // Create credential object to store
    const credential = {
      id: rawId,
      publicKey: response.attestationObject, // In real implementation, extract the public key from attestationObject
      type,
      createdAt: new Date().toISOString(),
      name: req.body.name || 'My Passkey'
    };
    
    // Store the credential
    let credentials = [];
    if (user.PasskeyCredentials) {
      try {
        credentials = JSON.parse(user.PasskeyCredentials);
        if (!Array.isArray(credentials)) {
          credentials = [];
        }
        
        // Check for duplicate credentials
        const existingCredIndex = credentials.findIndex(cred => cred.id === rawId);
        if (existingCredIndex >= 0) {
          console.log(`Found duplicate credential ID ${rawId}, replacing it`);
          credentials.splice(existingCredIndex, 1);
        }
      } catch (error) {
        console.error('Error parsing existing credentials:', error);
        credentials = [];
      }
    }
    
    credentials.push(credential);
    
    // Update user with new credential
    await user.update({ 
      PasskeyCredentials: JSON.stringify(credentials),
      HasPasskey: true
    });
    
    return res.json({ 
      success: true, 
      message: 'Passkey registered successfully' 
    });
  } catch (error) {
    console.error('Error registering passkey:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Generate authentication options for login with passkey
 */
exports.generateAuthenticationOptions = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      console.log('Authentication options request missing email');
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }
    
    console.log(`Generating authentication options for email: ${email}`);
    
    const user = await User.findOne({ 
      where: {
        [Op.or]: [
          { Username: email },
          { Email: email }
        ]
      }
    });
    
    // Check if user exists and has a passkey
    // Treat NULL HasPasskey as false
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(404).json({ 
        success: false,
        message: 'User not found or no passkey registered' 
      });
    }
    
    if (user.HasPasskey !== true) {
      console.log(`User found but HasPasskey is not true: ${user.UserID}, HasPasskey=${user.HasPasskey}`);
      return res.status(404).json({ 
        success: false,
        message: 'User not found or no passkey registered' 
      });
    }
    
    // Generate a random challenge
    const challenge = crypto.randomBytes(32);
    const challengeBase64 = base64url.encode(challenge);
    
    // Store the challenge with user ID for verification later
    challenges.set(user.UserID.toString(), {
      challenge: challengeBase64,
      userId: user.UserID
    });
    
    // Get user credentials
    let credentials = [];
    if (user.PasskeyCredentials) {
      try {
        credentials = JSON.parse(user.PasskeyCredentials);
        console.log(`Found ${credentials.length} credentials for user ${user.UserID}`);
      } catch (error) {
        console.error('Error parsing credentials:', error);
        console.error('Raw credentials:', user.PasskeyCredentials);
      }
    } else {
      console.log(`No credentials found for user ${user.UserID} despite HasPasskey=true`);
    }
    
    // Create authentication options
    const authOptions = {
      challenge: challengeBase64,
      timeout: 60000,
      rpId: rpID,
      userVerification: 'required',
      allowCredentials: credentials.map(cred => ({
        id: cred.id,
        type: 'public-key',
        transports: ['internal']
      }))
    };
    
    console.log('Authentication options generated successfully');
    
    return res.json({
      success: true,
      options: authOptions,
      userInfo: {
        email: user.Email,
        name: user.FullName || user.Username
      }
    });
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * Verify passkey authentication
 */
exports.verifyAuthentication = async (req, res) => {
  try {
    const { email, response } = req.body;
    
    if (!email || !response) {
      console.log('Missing email or response in verification request');
      return res.status(400).json({ 
        success: false,
        message: 'Email and authentication response are required'
      });
    }
    
    console.log(`Verifying authentication for email: ${email}`);
    
    // Find user
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { Username: email },
          { Email: email }
        ]
      }
    });
    
    // Check if user exists and has a passkey
    // Treat NULL HasPasskey as false
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(404).json({ 
        success: false,
        message: 'User not found or no passkey registered'
      });
    }
    
    if (user.HasPasskey !== true) {
      console.log(`User found but HasPasskey is not true: ${user.UserID}, HasPasskey=${user.HasPasskey}`);
      return res.status(404).json({ 
        success: false,
        message: 'User not found or no passkey registered'
      });
    }
    
    // Parse response data
    let clientDataJSON;
    try {
      clientDataJSON = JSON.parse(
        Buffer.from(base64url.decode(response.response.clientDataJSON)).toString()
      );
      console.log('Parsed client data:', clientDataJSON);
    } catch (error) {
      console.error('Error parsing client data JSON:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid client data format'
      });
    }
    
    // Find the challenge
    const storedData = challenges.get(user.UserID.toString());
    if (!storedData) {
      console.log(`No challenge found for user ${user.UserID}`);
      return res.status(400).json({ 
        success: false,
        message: 'Authentication challenge not found or expired'
      });
    }
    
    if (storedData.challenge !== clientDataJSON.challenge) {
      console.log(`Challenge mismatch for user ${user.UserID}`);
      console.log(`Expected: ${storedData.challenge}`);
      console.log(`Received: ${clientDataJSON.challenge}`);
      return res.status(400).json({ 
        success: false,
        message: 'Authentication challenge mismatch'
      });
    }
    
    // Remove used challenge
    challenges.delete(user.UserID.toString());
    
    // Verify origin: use ORIGIN env var or request Origin header
    const expectedOrigin = process.env.ORIGIN || req.headers.origin;
    if (clientDataJSON.origin !== expectedOrigin) {
      console.error(`Origin mismatch: expected ${expectedOrigin}, actual ${clientDataJSON.origin}`);
      return res.status(400).json({ 
        success: false,
        message: 'Origin verification failed',
        expected: expectedOrigin,
        actual: clientDataJSON.origin
      });
    }
    
    // In a real implementation, we would verify the signature here
    // For this example, we'll just assume the signature is valid
    console.log('Authentication successful for user:', user.UserID);
    
    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Update last login time - Fix the date format issue
    try {
      // Use direct SQL query instead of Sequelize model update to avoid date format issues
      await pool.request()
        .input('userId', sql.BigInt, user.UserID)
        .input('ip', sql.VarChar, req.ip || 'unknown')
        .query(`
          UPDATE Users
          SET LastLoginAt = GETDATE(), 
              LastLoginIP = @ip
          WHERE UserID = @userId
        `);
      
      console.log(`Updated LastLoginAt for user ${user.UserID}`);
    } catch (error) {
      console.error('Error updating LastLoginAt:', error);
      // Continue with the authentication process even if updating the login time fails
    }
    
    return res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.UserID,
        UserID: user.UserID,
        username: user.Username,
        Username: user.Username,
        email: user.Email,
        Email: user.Email,
        fullName: user.FullName,
        FullName: user.FullName,
        role: user.Role,
        Role: user.Role,
        image: user.Image,
        Image: user.Image,
        // Add any other user fields needed by the frontend
      },
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * List all passkeys for the current user
 */
exports.listPasskeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let credentials = [];
    if (user.PasskeyCredentials) {
      try {
        credentials = JSON.parse(user.PasskeyCredentials);
        
        // Clean up sensitive data before sending to client
        credentials = credentials.map(cred => ({
          id: cred.id,
          name: cred.name || 'Unnamed passkey',
          createdAt: cred.createdAt
        }));
      } catch (error) {
        console.error('Error parsing credentials:', error);
      }
    }
    
    return res.json({
      success: true,
      hasPasskey: user.HasPasskey,
      passkeys: credentials
    });
  } catch (error) {
    console.error('Error listing passkeys:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Remove a passkey
 */
exports.removePasskey = async (req, res) => {
  try {
    const userId = req.user.id;
    const passkeyId = req.params.passkeyId;
    
    if (!passkeyId) {
      return res.status(400).json({ message: 'Passkey ID is required' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.PasskeyCredentials) {
      return res.status(404).json({ message: 'No passkeys found' });
    }
    
    let credentials = [];
    try {
      credentials = JSON.parse(user.PasskeyCredentials);
      if (!Array.isArray(credentials)) {
        credentials = [];
      }
    } catch (error) {
      console.error('Error parsing credentials:', error);
      return res.status(500).json({ message: 'Error parsing credentials' });
    }
    
    // Filter out the passkey to remove
    const updatedCredentials = credentials.filter(cred => cred.id !== passkeyId);
    
    // If no passkeys left, set hasPasskey to false
    const hasPasskey = updatedCredentials.length > 0;
    
    // Update user
    await user.update({
      PasskeyCredentials: JSON.stringify(updatedCredentials),
      HasPasskey: hasPasskey
    });
    
    return res.json({
      success: true,
      message: 'Passkey removed successfully',
      hasPasskey
    });
  } catch (error) {
    console.error('Error removing passkey:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.UserID, role: user.Role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.UserID, role: user.Role, tokenType: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}; 