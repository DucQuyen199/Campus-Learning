/*-----------------------------------------------------------------
* File: VNPayCheckout.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { useEffect, useState } from 'react';
import paymentService from '@/services/paymentService';

/**
 * VNPayCheckout component
 * Props:
 *   courseId     – required, id of course to pay
 *   defaultBank  – optional default selected bank code (e.g. 'NCB')
 *   onError(err) – optional callback when any error happens
 */
export default function VNPayCheckout({ courseId, defaultBank = '', onError }) {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(defaultBank);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [paying, setPaying] = useState(false);

  // Fetch supported banks on mount
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const list = await paymentService.getVNPayBankList();
        setBanks(list);
      } catch (err) {
        console.error('Failed to load bank list', err);
        if (typeof onError === 'function') onError(err);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  const startPayment = async () => {
    if (!courseId) return;
    setPaying(true);
    try {
      const codeToSend = selectedBank || null; // null lets VNPay show bank list
      const { paymentUrl } = await paymentService.createPaymentUrl(courseId, codeToSend);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (err) {
      console.error('VNPay payment error', err);
      if (typeof onError === 'function') onError(err);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Bank selector */}
      {loadingBanks ? (
        <p>Đang tải danh sách ngân hàng…</p>
      ) : (
        <select
          className="border rounded p-2 w-full"
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
        >
          <option value="">-- Chọn ngân hàng (hoặc để trống) --</option>
          {banks.map((b) => (
            <option key={b.code || b.bankCode} value={b.code || b.bankCode}>
              {b.shortName || b.name || b.code}
            </option>
          ))}
        </select>
      )}

      {/* Pay button */}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        disabled={paying}
        onClick={startPayment}
      >
        {paying ? 'Đang chuyển hướng…' : 'Thanh toán qua VNPay'}
      </button>
    </div>
  );
} 
