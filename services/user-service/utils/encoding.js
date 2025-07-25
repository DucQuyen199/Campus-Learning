/*-----------------------------------------------------------------
* File: encoding.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
/**
 * Utility functions for base64url encoding and decoding
 * Used for WebAuthn/Passkey implementation
 */

/**
 * Base64url encoding and decoding utilities
 * These are needed for WebAuthn operations
 */
const base64url = {
  /**
   * Encodes a buffer to a base64url string
   * @param {Buffer} buffer - The buffer to encode
   * @returns {string} - The base64url encoded string
   */
  encode: (buffer) => {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  },

  /**
   * Decodes a base64url string to a buffer
   * @param {string} base64url - The base64url encoded string
   * @returns {Buffer} - The decoded buffer
   */
  decode: (base64url) => {
    // Add padding if needed
    base64url = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64url.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error('Invalid base64url string');
      }
      base64url += new Array(5 - pad).join('=');
    }
    return Buffer.from(base64url, 'base64');
  }
};

module.exports = { base64url }; 
