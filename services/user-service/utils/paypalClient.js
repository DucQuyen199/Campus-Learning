const axios = require('axios');

/**
 * PayPal API client for creating and managing PayPal orders
 * Enhanced with retry logic and better error handling
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
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
    
    // Log PayPal configuration on startup
    this.logConfiguration();
  }
  
  /**
   * Log the current PayPal configuration
   */
  logConfiguration() {
    console.log('=== PayPal Client Configuration ===');
    console.log(`Mode: ${this.mode}`);
    console.log(`API Base URL: ${this.baseURL}`);
    console.log(`Client ID: ${this.clientId.substring(0, 8)}...${this.clientId.substring(this.clientId.length - 4)}`);
    console.log(`Client Secret: ${this.clientSecret ? '********' : 'Not configured'}`);
    console.log('===================================');
  }

  /**
   * Helper method to implement retry logic for API calls
   * @param {Function} apiCall - Function that returns a promise
   */
  async withRetry(apiCall) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Clear token if we're retrying and got an auth error previously
        if (attempt > 0 && lastError && 
            (lastError.response?.status === 401 || 
             lastError.message?.includes('auth') || 
             lastError.message?.includes('token'))) {
          this.accessToken = null;
          this.tokenExpiry = null;
        }
        
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's a client error (except auth errors which we handled above)
        if (error.response && error.response.status >= 400 && error.response.status < 500 &&
            error.response.status !== 401 && error.response.status !== 429) {
          break;
        }
        
        // Wait before retrying
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Get OAuth access token for API calls
   */
  async getAccessToken() {
    // Check if we have a valid token already
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    return this.withRetry(async () => {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v1/oauth2/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        data: 'grant_type=client_credentials',
        timeout: 10000 // 10 second timeout
      });

      this.accessToken = response.data.access_token;
      // Set token expiry (subtract 60 seconds for safety margin)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
      return this.accessToken;
    }).catch(error => {
      console.error('Error getting PayPal access token:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal access token');
    });
  }

  /**
   * Create a PayPal order
   * @param {Object} transaction - Transaction details
   * @param {string} returnUrl - Success URL
   * @param {string} cancelUrl - Cancel URL
   */
  async createOrder(transaction, returnUrl, cancelUrl) {
    return this.withRetry(async () => {
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
      
      // Make sure the amount is not zero or negative
      if (parseFloat(usdAmount) <= 0) {
        usdAmount = '1.00'; // Minimum value for testing
      }
      
      // For sandbox testing, ensure amount is reasonable
      if (this.mode === 'sandbox' && parseFloat(usdAmount) > 1000) {
        console.warn(`PayPal sandbox amount exceeds $1000 (${usdAmount}), capping at $100 for safety`);
        usdAmount = '100.00';
      }
      
      // Log transaction details in sandbox mode
      if (this.mode === 'sandbox') {
        console.log('=== PayPal Sandbox Order Creation ===');
        console.log(`Transaction ID: ${transaction.TransactionID}`);
        console.log(`Amount: ${usdAmount} USD (original: ${amount})`);
        console.log(`Return URL: ${returnUrl}`);
        console.log(`Cancel URL: ${cancelUrl}`);
      }
      
      const orderPayload = {
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
          cancel_url: cancelUrl,
          shipping_preference: 'NO_SHIPPING'
        }
      };
      
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/checkout/orders`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'PayPal-Request-Id': `order_${transaction.TransactionID}_${Date.now()}`
        },
        data: orderPayload,
        timeout: 15000 // 15 second timeout
      });

      // Log successful response in sandbox mode
      if (this.mode === 'sandbox' && response.data) {
        console.log('=== PayPal Sandbox Order Created ===');
        console.log(`Order ID: ${response.data.id}`);
        console.log(`Status: ${response.data.status}`);
        if (response.data.links) {
          response.data.links.forEach(link => {
            console.log(`Link [${link.rel}]: ${link.href}`);
          });
        }
        console.log('====================================');
      }

      return response.data;
    }).catch(error => {
      // Enhanced error logging
      console.error('Error creating PayPal order:');
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      throw new Error('Failed to create PayPal order: ' + (error.response?.data?.message || error.message));
    });
  }

  /**
   * Capture a payment for an approved PayPal order
   * @param {string} orderId - PayPal order ID
   */
  async capturePayment(orderId) {
    return this.withRetry(async () => {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'PayPal-Request-Id': `capture_${orderId}_${Date.now()}`
        },
        timeout: 15000 // 15 second timeout
      });

      return response.data;
    }).catch(error => {
      console.error('Error capturing PayPal payment:', error.response?.data || error.message);
      throw new Error('Failed to capture PayPal payment');
    });
  }

  /**
   * Get order details
   * @param {string} orderId - PayPal order ID
   */
  async getOrderDetails(orderId) {
    return this.withRetry(async () => {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseURL}/v2/checkout/orders/${orderId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      return response.data;
    }).catch(error => {
      console.error('Error getting PayPal order details:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal order details');
    });
  }

  /**
   * Validate and capture a payment
   * This method first checks if the order is valid and then captures it
   * @param {string} orderId - PayPal order ID
   */
  async validateAndCapturePayment(orderId) {
    try {
      if (this.mode === 'sandbox') {
        console.log(`=== PayPal Sandbox: Validating order ${orderId} ===`);
      }
      
      // First check if the order exists and is in a valid state
      const orderDetails = await this.getOrderDetails(orderId);
      
      if (this.mode === 'sandbox') {
        console.log(`Order status: ${orderDetails.status}`);
        console.log(`Order details: ${JSON.stringify(orderDetails, null, 2)}`);
      }
      
      // Check if the order is in an approved state that can be captured
      // In sandbox, we're more lenient with the status to help with testing
      if (orderDetails.status !== 'APPROVED' && orderDetails.status !== 'COMPLETED' && 
          !(this.mode === 'sandbox' && orderDetails.status === 'CREATED')) {
        throw new Error(`Order is not in a capturable state. Current status: ${orderDetails.status}`);
      }
      
      // If already completed in sandbox, return the order as is
      if (this.mode === 'sandbox' && orderDetails.status === 'COMPLETED') {
        console.log(`Order ${orderId} is already completed, returning details`);
        return orderDetails;
      }
      
      if (this.mode === 'sandbox') {
        console.log(`Attempting to capture payment for order ${orderId}`);
      }
      
      // If approved, capture the payment
      const captureResult = await this.capturePayment(orderId);
      
      if (this.mode === 'sandbox') {
        console.log(`Capture result: ${JSON.stringify(captureResult, null, 2)}`);
      }
      
      return captureResult;
    } catch (error) {
      console.error('Error validating and capturing PayPal payment:', error);
      
      // In sandbox mode, provide a fake successful response for testing if needed
      if (this.mode === 'sandbox' && process.env.PAYPAL_SANDBOX_ALWAYS_SUCCEED === 'true') {
        console.log('SANDBOX MODE: Returning fake successful capture response');
        return {
          id: orderId,
          status: 'COMPLETED',
          purchase_units: [{
            reference_id: `REF-${Date.now()}`,
            payments: {
              captures: [{
                id: `CAPTURE-${Date.now()}`,
                status: 'COMPLETED',
                amount: { value: '10.00', currency_code: 'USD' }
              }]
            }
          }]
        };
      }
      
      throw error;
    }
  }

  /**
   * Generate a test order for sandbox development
   * This method is only available in sandbox mode
   */
  async createSandboxTestOrder() {
    if (this.mode !== 'sandbox') {
      throw new Error('Test orders can only be created in sandbox mode');
    }
    
    console.log('Creating sandbox test order...');
    
    try {
      const accessToken = await this.getAccessToken();
      
      const testOrderPayload = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `TEST-${Date.now()}`,
          description: 'Test Order for Development',
          amount: {
            currency_code: 'USD',
            value: '5.00'
          }
        }],
        application_context: {
          brand_name: 'Campushubt Dev',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
          shipping_preference: 'NO_SHIPPING'
        }
      };
      
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/v2/checkout/orders`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'PayPal-Request-Id': `test_order_${Date.now()}`
        },
        data: testOrderPayload,
        timeout: 15000
      });
      
      console.log('Sandbox test order created:');
      console.log(`Order ID: ${response.data.id}`);
      console.log(`Status: ${response.data.status}`);
      console.log('Links:');
      response.data.links.forEach(link => {
        console.log(`- ${link.rel}: ${link.href}`);
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to create test order:', error.response?.data || error.message);
      throw new Error('Failed to create sandbox test order');
    }
  }
}

module.exports = new PayPalClient(); 