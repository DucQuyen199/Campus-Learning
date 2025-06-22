import React, { useEffect, useState } from 'react';

const PayPalButton = ({ amount, createOrder: propCreateOrder, onApprove, onError, disabled }) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);

  // Default create order uses client SDK if no custom createOrder prop provided
  const defaultCreateOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [{
        amount: { currency_code: 'USD', value: amount }
      }]
    });
  };

  useEffect(() => {
    const addPayPalScript = () => {
      try {
        // First check if the script is already there
        if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
          setSdkReady(true);
          return;
        }

        // Create a test element to detect ad blockers
        const testImg = document.createElement('img');
        testImg.src = 'https://www.paypal.com/sdk/logo.svg';
        testImg.style.display = 'none';
        document.body.appendChild(testImg);
        
        // Set a timeout to check if the image loads
        const adBlockerTimer = setTimeout(() => {
          if (!testImg.complete || testImg.naturalHeight === 0) {
            setAdBlockerDetected(true);
          }
          document.body.removeChild(testImg);
        }, 1000);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        // Use a self-hosting proxy if available, or direct PayPal SDK
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AfZ6rsaDPE2qB4GdcppFwNylJpESc2uir8bLxOKWpoTGSOq2GhE450qRZsH1vCSG6zRCqlPv-Tzu8zaH';
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;
        script.onload = () => {
          clearTimeout(adBlockerTimer);
          setSdkReady(true);
        };
        script.onerror = (e) => {
          console.error('PayPal SDK could not be loaded:', e);
          setSdkError(true);
          // Check if it's likely due to ad blocker
          if (navigator.onLine) {
            setAdBlockerDetected(true);
          }
        };
        document.body.appendChild(script);

        return () => clearTimeout(adBlockerTimer);
      } catch (error) {
        console.error('Error adding PayPal script:', error);
        setSdkError(true);
      }
    };

    if (!window.paypal) {
      addPayPalScript();
    } else {
      setSdkReady(true);
    }
  }, []);

  if (adBlockerDetected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
        <p className="text-sm font-semibold">Trình chặn quảng cáo đang chặn PayPal</p>
        <p className="text-sm">
          Vui lòng tạm thời tắt trình chặn quảng cáo và làm mới trang để sử dụng PayPal.
          Hoặc bạn có thể chọn phương thức thanh toán khác.
        </p>
      </div>
    );
  }
  
  if (sdkError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
        <p className="text-sm">
          Không thể tải PayPal. Vui lòng kiểm tra kết nối mạng hoặc tạm thời tắt trình chặn quảng cáo và làm mới trang.
        </p>
      </div>
    );
  }

  if (!sdkReady) {
    return <div className="text-gray-600 py-2">Đang tải PayPal...</div>;
  }

  const createPayPalButtonRef = (container) => {
    if (!container || !window.paypal) return;
    
    container.innerHTML = '';
    try {
      window.paypal.Buttons({
        fundingSource: window.paypal.FUNDING.PAYPAL,
        createOrder: propCreateOrder || defaultCreateOrder,
        onApprove: async (data, actions) => {
          try {
            const orderData = await actions.order.capture();
            if (onApprove) onApprove(data.orderID, orderData);
          } catch (error) {
            console.error('Error capturing PayPal order:', error);
            if (onError) onError(error);
          }
        },
        onError: (err) => {
          console.error('PayPal Checkout onError', err);
          if (onError) onError(err);
        },
        onCancel: () => {
          console.log('PayPal Checkout cancelled');
        },
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay',
        },
        disabled: disabled,
      }).render(container);
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error);
      container.innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
          <p class="text-sm">Đã xảy ra lỗi khi hiển thị nút PayPal. Vui lòng làm mới trang.</p>
        </div>
      `;
    }
  };

  return (
    <div className="paypal-button-container">
      <div ref={createPayPalButtonRef} id="paypal-button-container" />
    </div>
  );
};

export default PayPalButton; 