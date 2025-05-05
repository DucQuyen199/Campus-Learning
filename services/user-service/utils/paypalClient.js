const axios = require('axios');

/**
 * PayPal API client for creating and managing PayPal orders
 */
class PayPalClient {
  constructor() {
    // Hard-coded credentials for development (from user's instructions)
    this.clientId = process.env.PAYPAL_CLIENT_ID || 'AfZ6rsaDPE2qB4GdcppFwNylJpESc2uir8bLxOKWpoTGSOq2GhE450qRZsH1vCSG6zRCqlPv-Tzu8zaH';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'EJKRC9kGSWmlhqMMOkUcOM__dGwTMVRFlu3g-DGD15Q-5gFf_fvUyIEXGdwmUCcX37RBR7yG93UBcw9F';
    this.mode = process.env.PAYPAL_MODE || 'sandbox';
    this.baseURL = this.mode === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com' 
      : 'https://api-m.paypal.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth access token for API calls
   */
  async getAccessToken() {
    // Check if we have a valid token already
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v1/oauth2/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        data: 'grant_type=client_credentials'
      });

      this.accessToken = response.data.access_token;
      // Set token expiry (subtract 60 seconds for safety margin)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting PayPal access token:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal access token');
    }
  }

  /**
   * Create a PayPal order
   * @param {Object} transaction - Transaction details
   * @param {string} returnUrl - Success URL
   * @param {string} cancelUrl - Cancel URL
   */
  async createOrder(transaction, returnUrl, cancelUrl) {
    try {
      const accessToken = await this.getAccessToken();
      
      // Format amount to correct currency format
      const amount = parseFloat(transaction.Amount).toFixed(2);
      
      // Always use USD as the currency code since VND is not supported by PayPal
      // PayPal supports a limited set of currencies: https://developer.paypal.com/docs/api/reference/currency-codes/
      const currency = 'USD';
      
      // Convert VND to USD (approximate conversion for display only)
      // In a production environment, use a proper currency conversion API
      let usdAmount = amount;
      if (transaction.Currency === 'VND') {
        // Approximate conversion rate: 1 USD = 25,000 VND (adjust as needed)
        usdAmount = (parseFloat(amount) / 25000).toFixed(2);
      }
      
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/checkout/orders`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: transaction.TransactionCode,
            description: `Payment for Course ID: ${transaction.CourseID}`,
            amount: {
              currency_code: currency,
              value: usdAmount
            }
          }],
          application_context: {
            brand_name: 'Campushubt',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating PayPal order:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal order');
    }
  }

  /**
   * Capture a payment for an approved PayPal order
   * @param {string} orderId - PayPal order ID
   */
  async capturePayment(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error capturing PayPal payment:', error.response?.data || error.message);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  /**
   * Get order details
   * @param {string} orderId - PayPal order ID
   */
  async getOrderDetails(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseURL}/v2/checkout/orders/${orderId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting PayPal order details:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal order details');
    }
  }
}

module.exports = new PayPalClient(); 