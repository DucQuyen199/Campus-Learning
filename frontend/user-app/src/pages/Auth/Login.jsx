/*-----------------------------------------------------------------
* File: Login.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  FingerPrintIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';
import { motion } from 'framer-motion';
import axios from 'axios';
// Add Google OAuth library
import { GoogleLogin } from '@react-oauth/google';
// Add Facebook SDK
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

// Check if passkey is supported by the browser
const isPasskeySupported = () => {
  // Check for basic PublicKeyCredential support
  const hasCredentials = typeof window.PublicKeyCredential !== 'undefined';
  // Check for isUserVerifyingPlatformAuthenticatorAvailable (needed for biometrics)
  const hasBiometricCheck = hasCredentials && 
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  
  console.log('WebAuthn Support Check:', { 
    hasCredentials, 
    hasBiometricCheck
  });
  
  return hasCredentials;
};

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login, login2Fa, isAuthenticated, loginWithGoogle, loginWithFacebook } = useAuth();

  // Redirect to home if already authenticated (also covers account-selection screen)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirectMessage, setRedirectMessage] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [isPasskeyAvailable, setIsPasskeyAvailable] = useState(false);
  const [biometricAttempts, setBiometricAttempts] = useState(0);
  const maxBiometricAttempts = 3;
  const biometricTimeoutRef = useRef(null);
  const emailInputRef = useRef(null);
  const [twoFaStage, setTwoFaStage] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState('');
  // Create refs for 2FA inputs and handler for auto-submit
  const inputsRef = useRef([]);
  const handleTwoFaInput = (e, idx) => {
    const val = e.target.value.replace(/\D/, '');
    
    // Update the code array
    const codeArr = twoFaCode.split('');
    codeArr[idx] = val;
    const newCode = codeArr.join('').slice(0, 6);
    setTwoFaCode(newCode);
    
    // If we have a value, move to next input
    if (val && idx < 5) {
      inputsRef.current[idx + 1].focus();
    }
    
    // If we have a complete 6-digit code, try to auto-verify
    if (newCode.length === 6) {
      autoVerifyTwoFa(newCode);
    }
  };
  const autoVerifyTwoFa = async (code) => {
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      const result = await login2Fa(tempToken, code);
      if (result.success) {
        handleLoginSuccess(result.user);
        // Ensure navigation happens
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 300);
      }
      else {
        setTwoFaError(result.error || 'Xác thực 2FA thất bại');
        // Clear the code when verification fails
        clearTwoFaCode();
      }
    } catch (err) {
      setTwoFaError(err.message || 'Xác thực 2FA thất bại');
      // Clear the code when verification fails
      clearTwoFaCode();
    } finally {
      setTwoFaLoading(false);
    }
  };

  // Update to handle backspace key better
  const handleTwoFaKeyDown = (e, idx) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      const codeArr = twoFaCode.split('');
      
      // If current field has a value, clear it
      if (codeArr[idx]) {
        codeArr[idx] = '';
        setTwoFaCode(codeArr.join(''));
      } 
      // If current field is empty and not the first field, move to previous field
      else if (idx > 0) {
        codeArr[idx - 1] = '';
        setTwoFaCode(codeArr.join(''));
        inputsRef.current[idx - 1].focus();
      }
    }
  };

  // Function to clear the 2FA code and focus on the first input
  const clearTwoFaCode = () => {
    setTwoFaCode('');
    // Focus on the first input field after a short delay to ensure UI has updated
    setTimeout(() => {
      if (inputsRef.current[0]) {
        inputsRef.current[0].focus();
      }
    }, 50);
  };

  // Check if browser supports passkeys and platform authenticator (biometrics)
  useEffect(() => {
    // Basic WebAuthn support check
    const hasBasicSupport = isPasskeySupported();
    setIsPasskeyAvailable(hasBasicSupport);
    
    // Additionally check for platform authenticator (biometrics)
    if (hasBasicSupport && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          console.log(`Platform authenticator (biometrics) available: ${available}`);
          // We'll still enable the button even if platform authenticator isn't available,
          // as the user might have a security key or other authenticator
        })
        .catch(err => {
          console.error('Error checking platform authenticator:', err);
        });
    }
  }, []);

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (biometricTimeoutRef.current) {
        clearTimeout(biometricTimeoutRef.current);
      }
    };
  }, []);

  // Check if there's a message in location state and handle redirect only once
  useEffect(() => {
    if (location.state?.message) {
      setRedirectMessage(location.state.message);
    }
    
    // If user is already authenticated, redirect to home page
    // But only do this check once when component mounts
    if (isAuthenticated && !authChecked) {
      navigate('/', { replace: true });
    }
    
    setAuthChecked(true);
  }, [location, isAuthenticated, navigate, authChecked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success && result.twoFaRequired) {
        setTwoFaStage(true);
        setTempToken(result.tempToken);
      } else if (result.success) {
        // Add password to the user object if remember is checked
        if (formData.remember) {
          result.user.hasStoredPassword = true;
          result.user.storedPassword = btoa(formData.password);
        }
        handleLoginSuccess(result.user);
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = useCallback((userData) => {
    // Log incoming userData for debugging
    console.log('handleLoginSuccess called with:', userData);
    
    // Ensure user data has the required fields
    const processedUserData = {
      ...userData,
      // Ensure consistent field naming (backend might use different formats)
      id: userData.id || userData.UserID,
      UserID: userData.UserID || userData.id,
      username: userData.username || userData.Username,
      email: userData.email || userData.Email,
      role: (userData.role || userData.Role || 'STUDENT').toUpperCase(),
      token: userData.token,
    };
    
    // Store user data and token in Redux
    dispatch(setUser(processedUserData));
    
    // Persist token and user in localStorage for future sessions
    if (processedUserData.token) {
      localStorage.setItem('token', processedUserData.token);
      localStorage.setItem('authToken', processedUserData.token);
    }
    
    // Store complete user data
    localStorage.setItem('user', JSON.stringify(processedUserData));
    
    // Show success toast
    toast.success('Đăng nhập thành công!');
    
    // Log that we're about to navigate
    console.log('Navigating to home page after successful login');
    
    // Navigate with replace to prevent going back to login page
    navigate('/home', { replace: true });
    
    // Ensure navigation happens even if there's an issue with the first attempt
    setTimeout(() => {
      if (window.location.pathname.includes('/login')) {
        console.log('Backup navigation triggered');
        navigate('/home', { replace: true });
      }
    }, 500);
    
    // Store into previousAccounts in localStorage
    const storedAccounts = JSON.parse(localStorage.getItem('previousAccounts') || '[]');
    const updatedAccounts = storedAccounts.filter(acc => acc.email !== (userData.email || userData.Email));
    
    // Check if we need to keep the stored password
    const hasStoredPassword = userData.hasStoredPassword === true;
    const storedPassword = hasStoredPassword ? userData.storedPassword : null;
    
    // Add the current account with the saved password if remember is true
    const savedAccount = {
      ...userData,
      email: userData.email || userData.Email,
      username: userData.username || userData.Username || '',
      // Save password if specified in userData or from formData
      hasStoredPassword: hasStoredPassword,
      storedPassword: storedPassword,
      token: userData.token,
      lastLogin: new Date().toISOString()
    };
    
    updatedAccounts.unshift(savedAccount);
    localStorage.setItem('previousAccounts', JSON.stringify(updatedAccounts.slice(0, 3)));
  }, [dispatch, navigate]);

  const loginWithPasskey = async () => {
    // Check if max attempts reached
    if (biometricAttempts >= maxBiometricAttempts) {
      toast.error('Quá nhiều lần thử không thành công. Vui lòng sử dụng mật khẩu.');
      return;
    }

    // Verify browser support first
    if (!window.PublicKeyCredential) {
      toast.error('Trình duyệt của bạn không hỗ trợ xác thực sinh trắc học.');
      console.error('WebAuthn is not supported in this browser');
      return;
    }

    setError('');
    
    // Ensure email is provided to fetch authentication options
    if (!formData.email) {
      setError('Vui lòng nhập email để đăng nhập bằng sinh trắc học');
      toast.error('Vui lòng nhập email trước khi sử dụng sinh trắc học');
      // Focus on the email input
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
      return;
    }
    
    try {
      // Set loading state for the fingerprint button only
      setPasskeyLoading(true);
      
      let options;
      console.log(`Requesting authentication options for email: ${formData.email}`);
      try {
        // Get the API base URL from environment or use a fallback
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        console.log(`Using API base URL: ${API_BASE_URL}`);
        
        const optionsResponse = await axios.post(`${API_BASE_URL}/api/passkeys/auth/options`, {
          email: formData.email
        });
        console.log('Server response for auth options:', optionsResponse.data);
        if (!optionsResponse.data.success) {
          throw new Error(optionsResponse.data.message || 'Không thể tạo yêu cầu xác thực');
        }
        options = optionsResponse.data.options;
      } catch (apiError) {
        console.error('Error fetching authentication options:', apiError);
        if (apiError.response) {
          console.error('Server response:', apiError.response.data);
          console.error('Status code:', apiError.response.status);
        } else if (apiError.request) {
          console.error('No response received:', apiError.request);
          console.error('Network error or server not running');
        } else {
          console.error('Error setting up request:', apiError.message);
        }
        throw new Error(`Lỗi khi lấy thông tin xác thực: ${apiError.message}`);
      }

      // Step 2: Create credentials with WebAuthn API
      try {
        // Convert base64url challenge to Uint8Array
        options.challenge = Uint8Array.from(
          atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), 
          c => c.charCodeAt(0)
        );

        if (options.allowCredentials) {
          options.allowCredentials = options.allowCredentials.map(credential => {
            return {
              ...credential,
              id: Uint8Array.from(
                atob(credential.id.replace(/-/g, '+').replace(/_/g, '/')), 
                c => c.charCodeAt(0)
              )
            };
          });
        }
      } catch (encodingError) {
        console.error('Error preparing WebAuthn options:', encodingError);
        throw new Error('Lỗi định dạng dữ liệu xác thực');
      }

      // Tell the user what's happening
      toast('Vui lòng xác thực bằng sinh trắc học của thiết bị khi được yêu cầu');

      // Request authentication from browser - this will trigger the OS biometric prompt
      // This is a blocking call - it will wait for the user to provide biometric input
      // IMPORTANT: At this point, the device's native biometric UI (TouchID/FaceID/etc.) will appear
      console.log('🔐 Activating device biometric authentication - watch for native OS prompt');
      console.log('Authentication options:', JSON.stringify({
        ...options,
        challenge: 'Uint8Array',
        allowCredentials: options.allowCredentials ? 'Array of credentials' : undefined
      }));
      
      // Force a slight delay to ensure UI updates before the potentially blocking credential.get call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // The native biometric prompt should appear after this call
      const credential = await navigator.credentials.get({
        publicKey: options
      });

      // If we got here, the user has successfully provided their fingerprint/biometric through the device's hardware
      console.log('✅ Native biometric authentication successful - processing server verification');

      // Step 3: Prepare credential for server verification
      let authResponse;
      try {
        authResponse = {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, ''),
          response: {
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON)))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=/g, ''),
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array(credential.response.authenticatorData)))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=/g, ''),
            signature: btoa(String.fromCharCode(...new Uint8Array(credential.response.signature)))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=/g, ''),
            userHandle: credential.response.userHandle
              ? btoa(String.fromCharCode(...new Uint8Array(credential.response.userHandle)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '')
              : null
          },
          type: credential.type
        };
      } catch (encodingError) {
        console.error('Error encoding credential for server:', encodingError);
        throw new Error('Lỗi xử lý dữ liệu sinh trắc học');
      }

      // Step 4: Send response to server for verification
      let verifyResponse;
      try {
        // Get the API base URL from environment or use a fallback
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        
        verifyResponse = await axios.post(`${API_BASE_URL}/api/passkeys/auth/verify`, {
          email: formData.email,
          response: authResponse
        });
        
        console.log('Server verification response:', verifyResponse.data);

        if (!verifyResponse.data.success) {
          throw new Error(verifyResponse.data.message || 'Xác thực không thành công');
        }
      } catch (apiError) {
        console.error('Error during server verification:', apiError);
        if (apiError.response) {
          console.error('Server response:', apiError.response.data);
          console.error('Status code:', apiError.response.status);
        } else if (apiError.request) {
          console.error('No response received:', apiError.request);
        } else {
          console.error('Error setting up request:', apiError.message);
        }
        throw new Error(`Lỗi xác thực với máy chủ: ${apiError.message}`);
      }

      // Authentication successful - reset attempts
      setBiometricAttempts(0);

      // Handle successful login
      const { user, tokens } = verifyResponse.data;
      
      // Build full user object with token
      const userWithToken = { 
        ...user, 
        token: tokens.accessToken,
        // Ensure these critical fields are available for the app's authentication system
        UserID: user.id,
        username: user.username,
        role: user.role || 'STUDENT',
      };
      
      console.log('Constructed user object for login:', userWithToken);
      
      // Store tokens in localStorage directly for extra safety
      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('authToken', tokens.accessToken);
      
      // Handle successful login via passkey
      handleLoginSuccess(userWithToken);
      
      toast.success('Đăng nhập bằng sinh trắc học thành công!');
      
      // Add a direct navigation as backup in case handleLoginSuccess doesn't redirect
      setTimeout(() => {
        if (window.location.pathname.includes('/login')) {
          console.log('Backup navigation to home triggered');
          navigate('/home', { replace: true });
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Passkey authentication error:', error);
      
      // Increment failed attempts
      const newAttempts = biometricAttempts + 1;
      setBiometricAttempts(newAttempts);
      
      // Check if max attempts reached
      if (newAttempts >= maxBiometricAttempts) {
        setError('Quá nhiều lần thử không thành công. Vui lòng sử dụng mật khẩu.');
        toast.error('Quá nhiều lần thử không thành công. Vui lòng sử dụng mật khẩu.');
      } else {
        // Provide more helpful error messages based on common WebAuthn errors
        let errorMessage = `Xác thực sinh trắc học thất bại (lần thử ${newAttempts}/${maxBiometricAttempts}).`;
        
        if (error.name === 'NotAllowedError') {
          errorMessage += ' Người dùng từ chối xác thực hoặc không có sinh trắc học được đăng ký.';
        } else if (error.name === 'SecurityError') {
          errorMessage += ' Lỗi bảo mật: yêu cầu xác thực phải đến từ nguồn an toàn (HTTPS).';
        } else if (error.name === 'AbortError') {
          errorMessage += ' Xác thực bị hủy.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += ' Phương thức xác thực không được hỗ trợ.';
        } else {
          errorMessage += ` ${error.message || ''}`;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setPasskeyLoading(false);
      
      // Remove the timeout for hiding the prompt
      if (biometricTimeoutRef.current) {
        clearTimeout(biometricTimeoutRef.current);
        biometricTimeoutRef.current = null;
      }
    }
  };

  // Handle OTP login button click (request OTP)
  const handleLoginOtp = () => {
    // Điều hướng sang trang đăng nhập OTP
    navigate('/login-otp', { state: { email: formData.email } });
  };

  // Update handleTwoFaVerify to clear the code on failure
  const handleTwoFaVerify = async (e) => {
    e.preventDefault();
    setTwoFaError('');
    setTwoFaLoading(true);
    try {
      const result = await login2Fa(tempToken, twoFaCode);
      if (result.success) {
        handleLoginSuccess(result.user);
        // Ensure navigation happens
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 300);
      } else {
        setTwoFaError(result.error || 'Xác thực 2FA thất bại');
        // Clear the code when verification fails
        clearTwoFaCode();
      }
    } catch (error) {
      setTwoFaError(error.message || 'Xác thực 2FA thất bại');
      // Clear the code when verification fails
      clearTwoFaCode();
    } finally {
      setTwoFaLoading(false);
    }
  };

  // Handle Google login success for connection
  const handleGoogleSuccess = async (response) => {
    try {
      console.log('Google login callback received:', response);
      setLoading(true);
      setError('');
      
      if (!response || !response.credential) {
        toast.error('Google login failed. Missing credentials.');
        return;
      }
      
      const result = await loginWithGoogle(response.credential);
      
      if (result.success) {
        // Log success for debugging
        console.log('Google login successful:', result);
        handleLoginSuccess(result.user);
        
        // Force navigation and clear any URL parameters
        navigate('/home', { replace: true });
      } else {
        toast.error(result.error || 'Google login failed');
        setError(result.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Google login failed');
      setError(error.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login error
  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
    setError('Google login failed. Please try again.');
  };

  // Handle Facebook login
  const handleFacebookLogin = async (response) => {
    try {
      if (response.accessToken) {
        const result = await loginWithFacebook(response.accessToken);
        
        if (result.success) {
          handleLoginSuccess(result.user);
        } else {
          toast.error(result.error || 'Facebook login failed');
        }
      } else {
        toast.error('Facebook login failed. No access token received.');
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      toast.error(error.message || 'Facebook login failed');
    }
  };

  // Handle Google OAuth redirect response
  useEffect(() => {
    // Check if there's a hash fragment in the URL (from Google OAuth redirect)
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Log for debugging
    if (hash || searchParams.toString()) {
      console.log('Detected OAuth response:', { 
        hash: hash || 'none', 
        search: searchParams.toString() || 'none' 
      });
    }
    
    if (hash) {
      try {
        const params = new URLSearchParams(hash.substring(1)); // Remove #
        const idToken = params.get('id_token');
        const accessToken = params.get('access_token');

        if (idToken) {
          console.log('Found ID token in URL hash, processing Google login');
          // Set loading state
          setLoading(true);
          
          // Send idToken directly to backend for verification
          handleGoogleSuccess({ credential: idToken });
          
          // Clean URL immediately to prevent re-processing on navigation
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (accessToken) {
          console.log('Found access token in URL hash, fetching user info');
          setLoading(true);
          
          // Fallback: fetch user info and process login
          fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
            .then(res => res.json())
            .then(data => {
              console.log('Retrieved Google user info:', data);
              const credential = {
                credential: accessToken,
                clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '890586528678-d33nj5dfqbptc5j5773g9mgkfsd45413.apps.googleusercontent.com',
                select_by: 'user',
                ...data,
              };
              handleGoogleSuccess({ credential });
            })
            .catch(err => {
              console.error('Error fetching Google user info:', err);
              toast.error('Failed to get Google user information');
              setError('Failed to get Google user information');
              setLoading(false);
            })
            .finally(() => {
              // Clean URL
              window.history.replaceState({}, document.title, window.location.pathname);
            });
        }
      } catch (error) {
        console.error('Error processing OAuth response:', error);
        toast.error('Failed to process login response');
        setError('Failed to process login response');
        setLoading(false);
      }
    }
    
    // Also check for code parameter (used in some OAuth flows)
    const code = searchParams.get('code');
    if (code) {
      console.log('Found authorization code in URL, processing OAuth login');
      // Here you would send the code to your backend for token exchange
      // For now, just clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [previousAccounts, setPreviousAccounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('previousAccounts') || '[]');
    } catch {
      return [];
    }
  });
  const [showLoginForm, setShowLoginForm] = useState(previousAccounts.length === 0);

  // State for selected account that needs password input
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAccountPassword, setSelectedAccountPassword] = useState('');
  const [selectedAccountLoading, setSelectedAccountLoading] = useState(false);
  const [selectedAccountError, setSelectedAccountError] = useState('');

  // Add handler for choosing a previous account
  const handleAccountClick = async (account) => {
    try {
      // Show loading toast
      toast.loading("Đang xử lý...", { id: "accountLogin" });
      
      // Check if we have a stored password for this account
      if (account.hasStoredPassword && account.storedPassword) {
        // We have a stored password, attempt to log in directly
        setSelectedAccountLoading(true);
        
        try {
          // Decode the stored password
          const decodedPassword = atob(account.storedPassword);
          
          // Attempt to login with stored credentials
          const result = await login(account.email, decodedPassword);
          
          if (result.success && result.twoFaRequired) {
            // If 2FA is required, show 2FA form
            toast.dismiss("accountLogin");
            toast.success("Vui lòng nhập mã xác thực 2FA");
            // Switch to main login form to display 2FA UI
            setShowLoginForm(true);
            setTwoFaStage(true);
            setTempToken(result.tempToken);
          } else if (result.success) {
            // Login successful - ensure we preserve the stored password flag
            toast.dismiss("accountLogin");
            toast.success("Đăng nhập thành công");
            
            // Ensure password storage information is passed along
            result.user.hasStoredPassword = true;
            result.user.storedPassword = account.storedPassword;
            
            handleLoginSuccess(result.user);
            
            // Ensure navigation happens
            setTimeout(() => {
              navigate('/home', { replace: true });
            }, 300);
          } else {
            // Login failed with saved password - password might have changed
            toast.dismiss("accountLogin");
            toast.error("Mật khẩu đã thay đổi hoặc hết hạn. Vui lòng nhập lại.");
            setSelectedAccount(account);
            setSelectedAccountError('Phiên đăng nhập đã hết hạn, vui lòng nhập mật khẩu');
          }
        } catch (error) {
          // Error during login with stored password
          console.error("Error logging in with saved credentials:", error);
          toast.dismiss("accountLogin");
          toast.error("Lỗi đăng nhập. Vui lòng thử lại.");
          setSelectedAccount(account);
          setSelectedAccountError('Đã xảy ra lỗi, vui lòng nhập mật khẩu để tiếp tục');
        }
      } else {
        // No stored password, show password form
        toast.dismiss("accountLogin");
        setSelectedAccount(account);
        // Pre-select the remember checkbox if the account had it stored before
        setFormData(prev => ({...prev, remember: account.hasStoredPassword || false}));
        setSelectedAccountError('Vui lòng nhập mật khẩu để tiếp tục');
      }
    } catch (error) {
      toast.dismiss("accountLogin");
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
      console.error("Error handling account selection:", error);
      setSelectedAccount(account);
    } finally {
      setSelectedAccountLoading(false);
    }
  };

  // Handler for login with selected account after password entry
  const handleSelectedAccountLogin = async (e) => {
    e.preventDefault();
    
    if (!selectedAccount || !selectedAccountPassword) {
      setSelectedAccountError('Vui lòng nhập mật khẩu');
      return;
    }
    
    setSelectedAccountLoading(true);
    setSelectedAccountError('');
    
    try {
      const result = await login(selectedAccount.email, selectedAccountPassword);
      
      if (result.success && result.twoFaRequired) {
        // If 2FA is required, show 2FA form
        toast.success("Vui lòng nhập mã xác thực 2FA");
        // Switch to main login form to display 2FA UI
        setShowLoginForm(true);
        setTwoFaStage(true);
        setTempToken(result.tempToken);
        setSelectedAccount(null); // Clear selected account since we're moving to 2FA
      } else if (result.success) {
        // Login successful
        toast.success("Đăng nhập thành công!");
        
        // Update remember status based on current form setting
        result.user.hasStoredPassword = formData.remember;
        result.user.storedPassword = formData.remember ? btoa(selectedAccountPassword) : null;
        
        handleLoginSuccess(result.user);
        setSelectedAccount(null);
        
        // Ensure navigation happens
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 300);
      } else {
        // Login failed
        setSelectedAccountError(result.error || 'Mật khẩu không chính xác');
      }
    } catch (error) {
      setSelectedAccountError(error.message || 'Đăng nhập thất bại');
    } finally {
      setSelectedAccountLoading(false);
    }
  };

  // Return to account selection from password screen
  const handleBackToAccounts = () => {
    setSelectedAccount(null);
    setSelectedAccountPassword('');
    setSelectedAccountError('');
  };

  // Render the selected account password form if an account is selected
  if (selectedAccount) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Login Section - Keeping original width */}
        <div className="flex min-h-screen">
          {/* Left side - Password form for selected account */}
          <div className="flex-1 flex items-center justify-center bg-white">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-md w-full px-6 py-12"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center"
              >
                <div className="flex items-center justify-center space-x-2">
                  <img className="h-14 w-auto" src="/images/education-icon.svg" alt="Education Icon" />
                  <h1 className="text-4xl font-bold text-blue-600">Learning</h1>
                </div>
                
                <div className="mt-8 flex flex-col items-center">
                  <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-3xl font-medium text-white mb-4">
                    {selectedAccount.username?.charAt(0).toUpperCase() || selectedAccount.email.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedAccount.username || selectedAccount.email}
                  </h2>
                  <p className="mt-2 text-base text-gray-600">{selectedAccount.email}</p>
                </div>
              </motion.div>

              {selectedAccountError && (
                <p className="mt-6 text-sm text-red-600 text-center">{selectedAccountError}</p>
              )}

              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-6 space-y-6" 
                onSubmit={handleSelectedAccountLogin}
              >
                <div>
                  {/* Password field with toggle visibility */}
                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-center">
                      Nhập mật khẩu của bạn
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={selectedAccountPassword}
                        onChange={(e) => setSelectedAccountPassword(e.target.value)}
                        className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={formData.remember}
                      onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                      Ghi nhớ đăng nhập
                    </label>
                  </div>
                  <div className="text-sm">
                    <Link 
                      to="/forgot-password" 
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                </div>

        <div className="flex flex-col space-y-4">
            <button
                    type="submit"
                    disabled={selectedAccountLoading}
                    className={`flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      selectedAccountLoading 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {selectedAccountLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang đăng nhập...
                      </>
                    ) : 'Đăng nhập'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToAccounts}
                    className="flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Quay lại danh sách tài khoản
                  </button>
                </div>
              </motion.form>
            </motion.div>
          </div>

          {/* Right side - Image (same as login page) */}
          <div className="hidden lg:block relative flex-1">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
              alt="Learning background"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-indigo-700/80">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center flex-1">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl mx-auto text-center text-white px-4"
                  >
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                      Learning
                    </h1>
                    <p className="text-xl sm:text-2xl mb-8">
                      Khám phá thế giới kiến thức không giới hạn
                    </p>
                    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
                      <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-left">
                          <div className="font-semibold text-lg">10,000+</div>
                          <div className="text-sm text-white/80">Khóa học đa dạng</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-left">
                          <div className="font-semibold text-lg">24/7</div>
                          <div className="text-sm text-white/80">Hỗ trợ mọi lúc</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-left">
                          <div className="font-semibold text-lg">100%</div>
                          <div className="text-sm text-white/80">Cam kết chất lượng</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showLoginForm && previousAccounts.length > 0) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Login Section - Keeping original width */}
        <div className="flex min-h-screen">
          {/* Left side - Account selection */}
          <div className="flex-1 flex items-center justify-center bg-white">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-md w-full px-6 py-12"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center"
              >
                <div className="flex items-center justify-center space-x-2">
                  <img className="h-14 w-auto" src="/images/education-icon.svg" alt="Education Icon" />
                  <h1 className="text-4xl font-bold text-blue-600">Learning</h1>
                </div>
                <h2 className="mt-8 text-3xl font-extrabold text-gray-900">
                  Chọn tài khoản
                </h2>
                <p className="mt-3 text-base text-gray-600">
                  Tiếp tục với tài khoản đã đăng nhập trước đó
                </p>
              </motion.div>

              <div className="mt-8 space-y-4">
                {previousAccounts.map(account => (
                  <motion.button
              key={account.email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
              onClick={() => handleAccountClick(account)}
                    className="w-full flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            >
                    <div className="h-14 w-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xl font-medium text-white">
                {account.username?.charAt(0).toUpperCase() || account.email.charAt(0).toUpperCase()}
              </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-gray-800">{account.username || account.email}</span>
                      {account.username && <span className="text-sm text-gray-500">{account.email}</span>}
                    </div>
                  </motion.button>
          ))}
        </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => setShowLoginForm(true)}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-colors"
        >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
          Sử dụng tài khoản khác
        </button>

                <div className="mt-6 text-center">
                  <span className="text-sm text-gray-600">
                    Chưa có tài khoản?{' '}
                    <Link 
                      to="/register" 
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      Đăng ký ngay
                    </Link>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right side - Image (keeping the same as login form) */}
          <div className="hidden lg:block relative flex-1">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
              alt="Learning background"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-indigo-700/80">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center flex-1">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl mx-auto text-center text-white px-4"
                  >
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                      Learning
                    </h1>
                    <p className="text-xl sm:text-2xl mb-8">
                      Khám phá thế giới kiến thức không giới hạn
                    </p>
                    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
                      <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-left">
                          <div className="font-semibold text-lg">10,000+</div>
                          <div className="text-sm text-white/80">Khóa học đa dạng</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-left">
                          <div className="font-semibold text-lg">24/7</div>
                          <div className="text-sm text-white/80">Hỗ trợ mọi lúc</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-left">
                          <div className="font-semibold text-lg">100%</div>
                          <div className="text-sm text-white/80">Cam kết chất lượng</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-10">
                      <button 
                        onClick={() => {
                          document.getElementById('about-us').scrollIntoView({ 
                            behavior: 'smooth' 
                          });
                        }}
                        className="flex items-center mx-auto space-x-2 text-white bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full hover:bg-white/30 transition-all duration-200"
                      >
                        <span>Về Chúng Tôi</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div id="about-us" className="bg-gradient-to-b from-gray-50 to-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Về Chúng Tôi</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                CampusLearning là nền tảng học tập trực tuyến hàng đầu tại Việt Nam, được thành lập với sứ mệnh 
                mang đến cơ hội tiếp cận kiến thức công nghệ chất lượng cao cho mọi người. Chúng tôi tự hào 
                là đối tác đào tạo tin cậy của nhiều doanh nghiệp công nghệ hàng đầu trong và ngoài nước.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  title: "Tầm Nhìn",
                  content: "Trở thành nền tảng giáo dục công nghệ số 1 Việt Nam, đào tạo 100,000+ lập trình viên chuyên nghiệp đến năm 2025. Xây dựng cộng đồng học tập công nghệ lớn mạnh với hơn 1 triệu thành viên, góp phần thúc đẩy sự phát triển của ngành công nghệ thông tin Việt Nam.",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                },
                {
                  title: "Sứ Mệnh",
                  content: "Cung cấp nền tảng học tập công nghệ toàn diện với chi phí tối ưu nhất. Đào tạo nguồn nhân lực chất lượng cao đáp ứng nhu cầu chuyển đổi số của doanh nghiệp. Tạo môi trường học tập và phát triển nghề nghiệp chuyên nghiệp cho cộng đồng IT Việt Nam.",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                },
                {
                  title: "Giá Trị Cốt Lõi",
                  content: "- Chất lượng đào tạo là ưu tiên hàng đầu\n- Đổi mới sáng tạo trong phương pháp giảng dạy\n- Tận tâm hỗ trợ người học\n- Cam kết đồng hành cùng sự phát triển của học viên\n- Liên tục cập nhật và nâng cao chất lượng",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border border-gray-100"
                >
                  <div className="h-14 w-14 mx-auto mb-4 rounded-lg bg-blue-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-center whitespace-pre-line">
                    {item.content}
                  </p>
                </motion.div>
              ))}
            </div>
            
            {/* Đội Ngũ Chuyên Gia */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="mt-16 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
            >
              <div className="md:flex">
                <div className="md:flex-shrink-0">
                  <img className="h-full w-full object-cover md:w-72" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80" alt="Đội ngũ giảng viên" />
                </div>
                <div className="p-8">
                  <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">Đội Ngũ Chuyên Gia</div>
                  <h2 className="mt-2 text-2xl font-bold leading-tight text-gray-900">
                    Giảng viên hàng đầu trong lĩnh vực công nghệ
                  </h2>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    Đội ngũ giảng viên của CampusLearning gồm các chuyên gia có trên 10 năm kinh nghiệm đến từ các 
                    công ty công nghệ hàng đầu như Google, Microsoft, AWS, FPT Software. Với kinh nghiệm thực tế 
                    phong phú, các giảng viên không chỉ truyền đạt kiến thức chuyên môn mà còn chia sẻ những 
                    bài học quý giá từ dự án thực tế.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Front-end</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Back-end</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">DevOps</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">AI & ML</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Mobile Dev</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Cloud Computing</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Phương Pháp Đào Tạo và Cam Kết */}
            <div className="mt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="bg-white p-8 rounded-xl shadow-md border border-gray-100"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Phương Pháp Đào Tạo</h3>
                  <ul className="space-y-4">
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">Học tập dựa trên dự án thực tế (Project-based learning)</p>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">Nội dung học tập được cá nhân hóa theo trình độ và mục tiêu</p>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">Hệ thống hỗ trợ học tập 1-1 với giảng viên và mentor</p>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">Cập nhật liên tục kiến thức mới nhất theo xu hướng công nghệ</p>
                    </li>
                  </ul>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="bg-white p-8 rounded-xl shadow-md border border-gray-100"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Cam Kết Với Học Viên</h3>
                  <ul className="space-y-4">
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">Bảo mật thông tin cá nhân và dữ liệu học tập</p>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">Hoàn trả học phí nếu không hài lòng trong 7 ngày đầu</p>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">Hỗ trợ kỹ thuật và giải đáp thắc mắc 24/7</p>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="ml-3 text-gray-600">Cấp chứng chỉ hoàn thành có giá trị trong ngành công nghệ</p>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>
            
            {/* Đối Tác */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="mt-16 text-center"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Đối Tác Của Chúng Tôi</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  {
                    title: "FPT Software",
                    image: "https://upload.wikimedia.org/wikipedia/commons/1/11/FPT_logo_2010.svg"
                  },
                  {
                    title: "VNG Corporation",
                    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/VNG_Corp._logo.svg/1200px-VNG_Corp._logo.svg.png"
                  },
                  {
                    title: "Microsoft Vietnam",
                    image: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg"
                  },
                  {
                    title: "Amazon Web Services",
                    image: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
                  },
                  {
                    title: "Google",
                    image: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
                  },
                  {
                    title: "MoMo",
                    image: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                  },
                  {
                    title: "Tiki",
                    image: "https://upload.wikimedia.org/wikipedia/commons/4/43/Logo_Tiki_2023.png"
                  },
                  {
                    title: "Shopee",
                    image: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    className="bg-white p-8 rounded-lg shadow-sm flex items-center justify-center h-32 border border-gray-100"
                  >
                    <img src={item.image} alt={item.title} className="w-36 h-16 object-contain" />
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  "Đối Tác Tuyển Dụng", 
                  "Đối Tác Đào Tạo", 
                  "Đối Tác Công Nghệ"
                ].map((title, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-blue-50 p-6 rounded-xl"
                  >
                    <h4 className="font-semibold text-lg text-blue-900 mb-2">{title}</h4>
                    <p className="text-blue-700">200+ doanh nghiệp công nghệ tuyển dụng trực tiếp từ CampusLearning</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-blue-50 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Liên Hệ Với Chúng Tôi</h2>
              <p className="text-lg text-gray-600">
                Hãy liên hệ với chúng tôi nếu bạn cần hỗ trợ hoặc có bất kỳ câu hỏi nào
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  title: "Điện thoại",
                  content: ["0332029410", "Thứ 2 - Chủ nhật: 8:00 - 22:00"],
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                },
                {
                  title: "Email",
                  content: ["support@CampusLearning.edu.vn", "quyen.nd19@outlook.com"],
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                },
                {
                  title: "Địa chỉ",
                  content: ["Tầng 15, Tòa nhà Innovation", "Quận 1, TP. Hồ Chí Minh"],
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-md text-center"
                >
                  <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  {item.content.map((line, i) => (
                    <p key={i} className="text-gray-600">{line}</p>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 text-white py-8"
        >
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400">© 2025 CampusLearning. Tất cả quyền được bảo lưu.</p>
          </div>
        </motion.footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Login Section - Keeping original width */}
      <div className="flex min-h-screen">
        {/* Left side - Login form */}
        <div className="flex-1 flex items-center justify-center bg-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full px-6 py-12"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center space-x-2">
                <img
                  className="h-14 w-auto"
                  src="/images/education-icon.svg"
                  alt="Education Icon"
                />
                <h1 className="text-4xl font-bold text-blue-600">Learning</h1>
              </div>
              <h2 className="mt-8 text-3xl font-extrabold text-gray-900">
                Chào mừng trở lại!
              </h2>
              <p className="mt-3 text-base text-gray-600">
                Đăng nhập để tiếp tục hành trình học tập của bạn
              </p>
            </motion.div>

            {redirectMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">{redirectMessage}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <p className="mt-6 text-sm text-red-600 text-center">{error}</p>
            )}

            {twoFaError && (
              <p className="mt-6 text-sm text-red-600 text-center">{twoFaError}</p>
            )}

            {twoFaStage ? (
              <div className="mt-8">
                <label className="block text-sm font-semibold text-gray-700 text-center">Mã xác thực 2FA</label>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Vui lòng nhập mã xác thực từ ứng dụng của bạn
                </p>
                
                <div className="mt-4 flex justify-center space-x-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={twoFaCode[idx] || ''}
                      onChange={(e) => handleTwoFaInput(e, idx)}
                      onKeyDown={(e) => handleTwoFaKeyDown(e, idx)}
                      ref={(el) => (inputsRef.current[idx] = el)}
                      disabled={twoFaLoading}
                      className={`w-10 h-10 text-center border ${twoFaError ? 'border-red-300' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 ${twoFaError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} transition-all duration-200`}
                    />
                  ))}
                </div>
                
                {twoFaError && (
                  <div className="mt-3 flex items-center justify-center text-red-600">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                    <p className="text-sm">{twoFaError}</p>
                  </div>
                )}
                
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setTwoFaStage(false)}
                    disabled={twoFaLoading}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8 space-y-6" 
                onSubmit={handleSubmit}
              >
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Email
                      </label>
                    </div>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your@email.com"
                        ref={emailInputRef}
                      />
                    </div>
                  </div>

                  <div>
                    {/* Password field with toggle visibility */}
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Mật khẩu
                        </label>
                      </div>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={formData.remember}
                      onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                      Ghi nhớ đăng nhập
                    </label>
                  </div>
                  <div className="text-sm">
                    <Link 
                      to="/forgot-password" 
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex space-x-4">
                    {/* Main login button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 flex justify-center items-center py-3 px-4 border border-black rounded-lg shadow-sm text-base font-medium text-white transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                        loading 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đăng nhập...
                        </>
                      ) : 'Đăng nhập'}
                    </button>
                    
                    {/* Fingerprint button - as a separate button */}
                    {isPasskeyAvailable && (
                      <button
                        type="button"
                        onClick={loginWithPasskey}
                        disabled={passkeyLoading || !formData.email || loading}
                        className={`flex items-center justify-center p-3 border border-black rounded-lg shadow-sm transform transition-all duration-200 hover:scale-[1.05] active:scale-[0.95] ${
                          passkeyLoading || !formData.email || loading
                            ? 'bg-gray-300 cursor-not-allowed opacity-70 text-gray-500'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        } relative group`}
                        title={!formData.email ? "Vui lòng nhập email trước khi sử dụng đăng nhập sinh trắc học" : "Đăng nhập bằng sinh trắc học"}
                      >
                        {!formData.email && (
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Nhập email trước
                          </div>
                        )}
                        {passkeyLoading ? (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <FingerPrintIcon className={`h-6 w-6 ${!formData.email ? 'text-gray-500' : 'text-red-500'}`} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {/* Facebook */}
                  <FacebookLogin
                    appId={import.meta.env.VITE_FACEBOOK_APP_ID || '123456789012345'}
                    callback={handleFacebookLogin}
                    fields="name,email,picture"
                    render={renderProps => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (window.location.protocol !== 'https:') {
                            toast.error('Facebook login requires HTTPS; please use a secure connection.');
                            return;
                          }
                          renderProps.onClick();
                        }}
                        className="inline-flex justify-center items-center py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="11" fill="white" />
                          <path d="M17,12 L13,12 L13,8 C13,7.5 13.5,7 14,7 L17,7 L17,4 L14,4 C11.8,4 10,5.8 10,8 L10,12 L7,12 L7,15 L10,15 L10,24 L13,24 L13,15 L16,15 L17,12 Z" fill="#1877F2" />
                        </svg>
                      </button>
                    )}
                  />
                  
                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        // Show loading state
                        setLoading(true);
                        setError('');
                        
                        // Get configuration from environment or use defaults
                        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '890586528678-d33nj5dfqbptc5j5773g9mgkfsd45413.apps.googleusercontent.com';
                        
                        // Use the current origin as redirect URI by default
                        // This should match exactly what's registered in Google Cloud Console
                        const redirectUri = encodeURIComponent(
                          import.meta.env.VITE_GOOGLE_REDIRECT_URI || 
                          window.location.origin
                        );
                        
                        // Request both profile information and email
                        const scope = encodeURIComponent('openid email profile');
                        
                        // Request both token and id_token for complete authentication
                        const responseType = encodeURIComponent('token id_token');
                        
                        // Generate a random nonce for security
                        const nonce = Math.random().toString(36).substring(2);
                        localStorage.setItem('google_auth_nonce', nonce);
                        
                        // Log the authentication attempt
                        console.log('Initiating Google authentication:', {
                          clientId: clientId.substring(0, 10) + '...',
                          redirectUri: decodeURIComponent(redirectUri),
                        });
                        
                        // Construct the auth URL with all parameters
                        const googleAuthUrl = 
                          `https://accounts.google.com/o/oauth2/v2/auth?` +
                          `client_id=${clientId}` +
                          `&redirect_uri=${redirectUri}` +
                          `&scope=${scope}` +
                          `&response_type=${responseType}` +
                          `&nonce=${nonce}` + 
                          `&prompt=select_account`;  // Force account selection
                        
                        // Redirect to Google auth
                        window.location.href = googleAuthUrl;
                      } catch (error) {
                        console.error('Error initiating Google login:', error);
                        toast.error('Failed to start Google login');
                        setError('Failed to start Google login');
                        setLoading(false);
                      }
                    }}
                    className="inline-flex justify-center items-center py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" 
                      alt="Google"
                      className="h-5 w-5"
                    />
                  </button>
                  
                  {/* GitHub */}
                  <button
                    type="button"
                    className="inline-flex justify-center items-center py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" fill="white" />
                      <path d="M12,2 C6.48,2 2,6.48 2,12 C2,16.42 5.1,20.08 9.28,21.34 C9.78,21.44 9.98,21.14 9.98,20.88 C9.98,20.64 9.97,20.02 9.97,19.28 C7,19.82 6.35,18.14 6.15,17.6 C6.04,17.34 5.55,16.5 5.1,16.26 C4.73,16.06 4.23,15.52 5.09,15.51 C5.9,15.5 6.5,16.19 6.7,16.46 C7.7,17.9 9.28,17.63 10.02,17.37 C10.12,16.73 10.42,16.3 10.75,16.06 C8.35,15.82 5.85,15 5.85,11.14 C5.85,10.08 6.3,9.2 6.72,8.54 C6.61,8.29 6.21,7.28 6.82,5.97 C6.82,5.97 7.76,5.71 9.98,7.28 C10.63,7.06 11.33,6.95 12.03,6.95 C12.73,6.95 13.43,7.06 14.08,7.28 C16.3,5.7 17.24,5.97 17.24,5.97 C17.85,7.28 17.45,8.29 17.34,8.54 C17.77,9.2 18.21,10.07 18.21,11.14 C18.21,15.01 15.7,15.82 13.3,16.06 C13.7,16.36 14.05,16.95 14.05,17.85 C14.05,19.15 14.04,20.54 14.04,20.88 C14.04,21.14 14.24,21.45 14.74,21.34 C18.92,20.08 22.02,16.41 22.02,12 C22.02,6.48 17.54,2 12.02,2 L12,2 Z" fill="#24292F" />
                    </svg>
                  </button>
                  
                  {/* Twitter/X */}
                  <button
                    type="button"
                    className="inline-flex justify-center items-center py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" fill="white" />
                      <path d="M18.5,6.5 L15,10.5 L19,17.5 L13,17.5 L11,15 L8.5,17.5 L5,17.5 L10,10.5 L6,4.5 L11.5,4.5 L13.5,7 L16,4.5 L18.5,6.5 Z" fill="black" />
                    </svg>
                  </button>
                  
                  {/* OTP login */}
                  <button
                    type="button"
                    onClick={handleLoginOtp}
                    disabled={loading}
                    className="inline-flex justify-center items-center py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    title="Đăng nhập bằng OTP"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" fill="white" />
                      <path d="M4,8 L20,8 C21.1,8 22,8.9 22,10 L22,18 C22,19.1 21.1,20 20,20 L4,20 C2.9,20 2,19.1 2,18 L2,10 C2,8.9 2.9,8 4,8 Z" fill="none" stroke="#6B7280" strokeWidth="1.5" />
                      <path d="M22,10 L12,15 L2,10" fill="none" stroke="#6B7280" strokeWidth="1.5" />
                    </svg>
                  </button>
                </div>

                <div className="text-center mt-6">
                  <span className="text-sm text-gray-600">
                    Chưa có tài khoản?{' '}
                    <Link 
                      to="/register" 
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      Đăng ký ngay
                    </Link>
                  </span>
                </div>
                
                {previousAccounts.length > 0 && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowLoginForm(false)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Quay lại danh sách tài khoản
                    </button>
                  </div>
                )}
              </motion.form>
            )}

            {/* Display a message if fingerprint login is not available */}
            {!isPasskeyAvailable && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Thiết bị không hỗ trợ</h4>
                    <p className="text-sm mt-1 text-gray-600">
                      Trình duyệt hoặc thiết bị của bạn không hỗ trợ xác thực sinh trắc học.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:block relative flex-1">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
            alt="Learning background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-indigo-700/80">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-center flex-1">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-2xl mx-auto text-center text-white px-4"
                >
                  <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                    Learning
                  </h1>
                  <p className="text-xl sm:text-2xl mb-8">
                    Khám phá thế giới kiến thức không giới hạn
                  </p>
                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
                    <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-left">
                        <div className="font-semibold text-lg">10,000+</div>
                        <div className="text-sm text-white/80">Khóa học đa dạng</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-left">
                        <div className="font-semibold text-lg">24/7</div>
                        <div className="text-sm text-white/80">Hỗ trợ mọi lúc</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-left">
                        <div className="font-semibold text-lg">100%</div>
                        <div className="text-sm text-white/80">Cam kết chất lượng</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-10">
                    <button 
                      onClick={() => {
                        document.getElementById('about-us').scrollIntoView({ 
                          behavior: 'smooth' 
                        });
                      }}
                      className="flex items-center mx-auto space-x-2 text-white bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full hover:bg-white/30 transition-all duration-200"
                    >
                      <span>Về Chúng Tôi</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section - Updated content */}
      <div id="about-us" className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Về Chúng Tôi</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CampusLearning là nền tảng học tập trực tuyến hàng đầu tại Việt Nam, được thành lập với sứ mệnh 
              mang đến cơ hội tiếp cận kiến thức công nghệ chất lượng cao cho mọi người. Chúng tôi tự hào 
              là đối tác đào tạo tin cậy của nhiều doanh nghiệp công nghệ hàng đầu trong và ngoài nước.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Tầm Nhìn",
                content: "Trở thành nền tảng giáo dục công nghệ số 1 Việt Nam, đào tạo 100,000+ lập trình viên chuyên nghiệp đến năm 2025. Xây dựng cộng đồng học tập công nghệ lớn mạnh với hơn 1 triệu thành viên, góp phần thúc đẩy sự phát triển của ngành công nghệ thông tin Việt Nam.",
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              },
              {
                title: "Sứ Mệnh",
                content: "Cung cấp nền tảng học tập công nghệ toàn diện với chi phí tối ưu nhất. Đào tạo nguồn nhân lực chất lượng cao đáp ứng nhu cầu chuyển đổi số của doanh nghiệp. Tạo môi trường học tập và phát triển nghề nghiệp chuyên nghiệp cho cộng đồng IT Việt Nam.",
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              },
              {
                title: "Giá Trị Cốt Lõi",
                content: "- Chất lượng đào tạo là ưu tiên hàng đầu\n- Đổi mới sáng tạo trong phương pháp giảng dạy\n- Tận tâm hỗ trợ người học\n- Cam kết đồng hành cùng sự phát triển của học viên\n- Liên tục cập nhật và nâng cao chất lượng",
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border border-gray-100"
              >
                <div className="h-14 w-14 mx-auto mb-4 rounded-lg bg-blue-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-center whitespace-pre-line">
                  {item.content}
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* Đội Ngũ Chuyên Gia */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mt-16 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
          >
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                <img className="h-full w-full object-cover md:w-72" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80" alt="Đội ngũ giảng viên" />
              </div>
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">Đội Ngũ Chuyên Gia</div>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-gray-900">
                  Giảng viên hàng đầu trong lĩnh vực công nghệ
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Đội ngũ giảng viên của CampusLearning gồm các chuyên gia có trên 10 năm kinh nghiệm đến từ các 
                  công ty công nghệ hàng đầu như Google, Microsoft, AWS, FPT Software. Với kinh nghiệm thực tế 
                  phong phú, các giảng viên không chỉ truyền đạt kiến thức chuyên môn mà còn chia sẻ những 
                  bài học quý giá từ dự án thực tế.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Front-end</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Back-end</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">DevOps</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">AI & ML</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Mobile Dev</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Cloud Computing</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Phương Pháp Đào Tạo và Cam Kết */}
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-8 rounded-xl shadow-md border border-gray-100"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Phương Pháp Đào Tạo</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Học tập dựa trên dự án thực tế (Project-based learning)</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Nội dung học tập được cá nhân hóa theo trình độ và mục tiêu</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Hệ thống hỗ trợ học tập 1-1 với giảng viên và mentor</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Cập nhật liên tục kiến thức mới nhất theo xu hướng công nghệ</p>
                  </li>
                </ul>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-8 rounded-xl shadow-md border border-gray-100"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Cam Kết Với Học Viên</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Bảo mật thông tin cá nhân và dữ liệu học tập</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Hoàn trả học phí nếu không hài lòng trong 7 ngày đầu</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Hỗ trợ kỹ thuật và giải đáp thắc mắc 24/7</p>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-600">Cấp chứng chỉ hoàn thành có giá trị trong ngành công nghệ</p>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
          
          {/* Đối Tác */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mt-16 text-center"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Đối Tác Của Chúng Tôi</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  title: "FPT Software",
                  image: "https://upload.wikimedia.org/wikipedia/commons/1/11/FPT_logo_2010.svg"
                },
                {
                  title: "VNG Corporation",
                  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/VNG_Corp._logo.svg/1200px-VNG_Corp._logo.svg.png"
                },
                {
                  title: "Microsoft Vietnam",
                  image: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg"
                },
                {
                  title: "Amazon Web Services",
                  image: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
                },
                {
                  title: "Google",
                  image: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
                },
                {
                  title: "MoMo",
                  image: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                },
                {
                  title: "Tiki",
                  image: "https://upload.wikimedia.org/wikipedia/commons/4/43/Logo_Tiki_2023.png"
                },
                {
                  title: "Shopee",
                  image: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  className="bg-white p-8 rounded-lg shadow-sm flex items-center justify-center h-32 border border-gray-100"
                >
                  <img src={item.image} alt={item.title} className="w-36 h-16 object-contain" />
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                "Đối Tác Tuyển Dụng", 
                "Đối Tác Đào Tạo", 
                "Đối Tác Công Nghệ"
              ].map((title, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-blue-50 p-6 rounded-xl"
                >
                  <h4 className="font-semibold text-lg text-blue-900 mb-2">{title}</h4>
                  <p className="text-blue-700">200+ doanh nghiệp công nghệ tuyển dụng trực tiếp từ CampusLearning</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-20 bg-blue-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Liên Hệ Với Chúng Tôi</h2>
            <p className="text-lg text-gray-600">
              Hãy liên hệ với chúng tôi nếu bạn cần hỗ trợ hoặc có bất kỳ câu hỏi nào
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Điện thoại",
                content: ["0332029410", "Thứ 2 - Chủ nhật: 8:00 - 22:00"],
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              },
              {
                title: "Email",
                content: ["support@CampusLearning.edu.vn", "quyen.nd19@outlook.com"],
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              },
              {
                title: "Địa chỉ",
                content: ["Tầng 15, Tòa nhà Innovation", "Quận 1, TP. Hồ Chí Minh"],
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-md text-center"
              >
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                {item.content.map((line, i) => (
                  <p key={i} className="text-gray-600">{line}</p>
                ))}
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mt-12 max-w-3xl mx-auto"
          >
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold text-center mb-6">Gửi Tin Nhắn Cho Chúng Tôi</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                  <textarea rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div className="text-center">
                  <button type="submit" className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Gửi tin nhắn
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Youtube</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.418-4.814a2.507 2.507 0 0 1 1.768-1.768C5.746 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.07-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900 text-white py-8"
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 CampusLearning. Tất cả quyền được bảo lưu.</p>
        </div>
      </motion.footer>
    </div>
  );
};

export default Login; 
