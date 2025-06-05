const { base64url } = require('../utils/encoding');
const User = require('../models/user');
const crypto = require('crypto');

// Store challenges temporarily in memory (in production, use Redis or similar)
const challenges = new Map();

// WebAuthn configuration
const rpName = 'CampusT';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || `https://${rpID}`;

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
    if (user.passkeyCredentials) {
      try {
        const credentials = JSON.parse(user.passkeyCredentials);
        if (Array.isArray(credentials) && credentials.length > 0) {
          registrationOptions.excludeCredentials = credentials.map(cred => ({
            id: cred.id,
            type: 'public-key',
            transports: ['internal']
          }));
        }
      } catch (error) {
        console.error('Error parsing existing credentials:', error);
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
    if (user.passkeyCredentials) {
      try {
        credentials = JSON.parse(user.passkeyCredentials);
        if (!Array.isArray(credentials)) {
          credentials = [];
        }
      } catch (error) {
        console.error('Error parsing existing credentials:', error);
      }
    }
    
    credentials.push(credential);
    
    // Update user with new credential
    await user.update({ 
      passkeyCredentials: JSON.stringify(credentials),
      hasPasskey: true
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
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ 
      $or: [
        { username: email },
        { email: email }
      ]
    });
    
    if (!user || !user.hasPasskey) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found or no passkey registered' 
      });
    }
    
    // Generate a random challenge
    const challenge = crypto.randomBytes(32);
    const challengeBase64 = base64url.encode(challenge);
    
    // Store the challenge with user ID for verification later
    challenges.set(user._id.toString(), {
      challenge: challengeBase64,
      userId: user._id
    });
    
    // Get user credentials
    let credentials = [];
    if (user.passkeyCredentials) {
      try {
        credentials = JSON.parse(user.passkeyCredentials);
      } catch (error) {
        console.error('Error parsing credentials:', error);
      }
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
      return res.status(400).json({ 
        success: false,
        message: 'Email and authentication response are required'
      });
    }
    
    // Find user
    const user = await User.findOne({
      $or: [
        { username: email },
        { email: email }
      ]
    });
    
    if (!user || !user.hasPasskey) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found or no passkey registered'
      });
    }
    
    // Parse response data
    const clientDataJSON = JSON.parse(
      Buffer.from(base64url.decode(response.response.clientDataJSON)).toString()
    );
    
    // Find the challenge
    const storedData = challenges.get(user._id.toString());
    if (!storedData || storedData.challenge !== clientDataJSON.challenge) {
      return res.status(400).json({ 
        success: false,
        message: 'Authentication challenge not found or expired'
      });
    }
    
    // Remove used challenge
    challenges.delete(user._id.toString());
    
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
    
    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Update last login time
    await user.update({
      lastLoginAt: new Date(),
      lastLoginIP: req.ip || 'unknown'
    });
    
    return res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        image: user.image
      },
      tokens: {
        accessToken,
        refreshToken
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
    if (user.passkeyCredentials) {
      try {
        credentials = JSON.parse(user.passkeyCredentials);
        
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
      hasPasskey: user.hasPasskey,
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
    
    if (!user.passkeyCredentials) {
      return res.status(404).json({ message: 'No passkeys found' });
    }
    
    let credentials = [];
    try {
      credentials = JSON.parse(user.passkeyCredentials);
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
      passkeyCredentials: JSON.stringify(updatedCredentials),
      hasPasskey
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
  // This should be implemented according to your authentication system
  // For example, using JWT:
  // return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return 'access-token-placeholder';
};

// Helper function to generate refresh token
const generateRefreshToken = (user) => {
  // This should be implemented according to your authentication system
  // For example, using JWT with longer expiry:
  // return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return 'refresh-token-placeholder';
}; 