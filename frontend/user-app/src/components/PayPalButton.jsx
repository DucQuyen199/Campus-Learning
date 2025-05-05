import React, { useEffect, useState } from 'react';

const PayPalButton = ({ amount, onApprove, onError, disabled }) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  useEffect(() => {
    const addPayPalScript = () => {
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD`;
        script.async = true;
        script.onload = () => {
          setSdkReady(true);
        };
        script.onerror = () => {
          console.error('PayPal SDK could not be loaded.');
          setSdkError(true);
        };
        document.body.appendChild(script);
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
    return <div>Đang tải PayPal...</div>;
  }

  const createPayPalButtonRef = (container) => {
    if (container && window.paypal) {
      container.innerHTML = '';
      try {
        window.paypal.Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: 'USD',
                    value: amount,
                  },
                },
              ],
            });
          },
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
    }
  };

  return (
    <div className="paypal-button-container">
      <div ref={createPayPalButtonRef} id="paypal-button-container" />
    </div>
  );
};

export default PayPalButton; 