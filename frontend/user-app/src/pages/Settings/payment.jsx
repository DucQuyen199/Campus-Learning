import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import {
  CreditCardIcon, 
  ReceiptRefundIcon, 
  DocumentTextIcon, 
  KeyIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowUpRightIcon
} from '@heroicons/react/24/outline';
import { billingServices } from '@/services/api';

// Giả lập dữ liệu thanh toán và giấy phép
const fallbackPaymentData = {
  subscriptionPlan: 'basic',
  nextBillingDate: null,
  amount: null,
  currency: 'VND',
  paymentMethods: [],
  billingHistory: [],
  licenses: []
};

// Plans data
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Cơ bản',
    price: '0',
    features: [
      'Truy cập các khóa học miễn phí',
      'Diễn đàn cộng đồng',
      'Ứng dụng di động cơ bản'
    ],
    isPopular: false
  },
  {
    id: 'pro',
    name: 'Chuyên nghiệp',
    price: '299000',
    features: [
      'Tất cả tính năng của gói Cơ bản',
      'Không giới hạn khóa học',
      'Chứng chỉ khóa học',
      'Hỗ trợ ưu tiên',
      'Nội dung học tập ngoại tuyến'
    ],
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Doanh nghiệp',
    price: 'Liên hệ',
    features: [
      'Tất cả tính năng của gói Chuyên nghiệp',
      'Quản lý người dùng doanh nghiệp',
      'Báo cáo và phân tích chi tiết',
      'Đào tạo dành riêng',
      'API tích hợp',
      'Hỗ trợ 24/7'
    ],
    isPopular: false
  }
];

const PaymentSettings = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(fallbackPaymentData);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardData, setNewCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  const [activeTab, setActiveTab] = useState('payment-methods');

  // Fetch payment data on load (simulated)
  useEffect(() => {
    // In a real app, this would be a dispatch to fetch payment data
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await billingServices.getOverview();
        let apiData = res.data.data;
        // If backend does not return any payment methods, fallback to localStorage
        const storedMethodsRaw = localStorage.getItem('paymentMethods');
        const storedMethods = storedMethodsRaw ? JSON.parse(storedMethodsRaw) : [];
        if ((!apiData.paymentMethods || apiData.paymentMethods.length === 0) && storedMethods.length > 0) {
          apiData = { ...apiData, paymentMethods: storedMethods };
        }
        setPaymentData(apiData);
      } catch (error) {
        console.error('Error fetching payment data:', error);
        toast.error('Không thể tải thông tin thanh toán');
        // Fallback: try localStorage for payment methods as well
        const storedMethodsRaw = localStorage.getItem('paymentMethods');
        const storedMethods = storedMethodsRaw ? JSON.parse(storedMethodsRaw) : [];
        setPaymentData({ ...fallbackPaymentData, paymentMethods: storedMethods });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Persist payment methods to localStorage whenever they change
  useEffect(() => {
    if (paymentData && paymentData.paymentMethods) {
      localStorage.setItem('paymentMethods', JSON.stringify(paymentData.paymentMethods));
    }
  }, [paymentData.paymentMethods]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleNewCardChange = (e) => {
    setNewCardData({
      ...newCardData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate adding a card
    setTimeout(() => {
      const newCard = {
        id: `pm_${Math.random().toString(36).substr(2, 9)}`,
        type: 'credit_card',
        brand: 'visa',
        last4: newCardData.cardNumber.slice(-4),
        expiryMonth: newCardData.expiryMonth,
        expiryYear: newCardData.expiryYear,
        isDefault: false
      };
      
      setPaymentData({
        ...paymentData,
        paymentMethods: [...paymentData.paymentMethods, newCard]
      });
      
      setNewCardData({
        cardNumber: '',
        cardName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
      });
      
      setShowAddCard(false);
      setLoading(false);
      toast.success('Đã thêm thẻ mới thành công');
    }, 1000);
  };

  const handleSetDefaultPayment = (id) => {
    const updatedMethods = paymentData.paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id
    }));
    
    setPaymentData({
      ...paymentData,
      paymentMethods: updatedMethods
    });
    
    toast.success('Đã cập nhật phương thức thanh toán mặc định');
  };

  const handleDeletePaymentMethod = (id) => {
    const updatedMethods = paymentData.paymentMethods.filter(method => method.id !== id);
    
    setPaymentData({
      ...paymentData,
      paymentMethods: updatedMethods
    });
    
    toast.success('Đã xóa phương thức thanh toán');
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: currency || 'VND' 
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const getCardIcon = (brandRaw) => {
    if (!brandRaw) return <CreditCardIcon className="h-6 w-6 text-gray-500" />;
    const brand = brandRaw.toLowerCase();
    if (brand.includes('visa')) {
      return (
        <div className="flex items-center justify-center w-10 h-6 bg-blue-700 text-white text-[10px] font-bold rounded">
          VISA
        </div>
      );
    }
    if (brand.includes('master')) {
      return (
        <div className="flex items-center justify-center w-10 h-6 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 text-[10px] text-white font-bold rounded">
          MC
        </div>
      );
    }
    if (brand.includes('amex') || brand.includes('american')) {
      return (
        <div className="flex items-center justify-center w-10 h-6 bg-blue-500 text-white text-[10px] font-bold rounded">
          AMEX
        </div>
      );
    }
    if (brand.includes('jcb')) {
      return (
        <div className="flex items-center justify-center w-10 h-6 bg-green-600 text-white text-[10px] font-bold rounded">
          JCB
        </div>
      );
    }
    return <CreditCardIcon className="h-6 w-6 text-gray-500" />;
  };

  if (loading && !paymentData) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'payment-methods', label: 'Phương thức thanh toán', icon: CreditCardIcon },
    { id: 'subscription', label: 'Gói dịch vụ', icon: DocumentTextIcon },
    { id: 'billing-history', label: 'Lịch sử thanh toán', icon: ReceiptRefundIcon },
    { id: 'licenses', label: 'Giấy phép', icon: KeyIcon }
  ];

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white text-gray-900">
      <ToastContainer position="top-right" autoClose={5000} theme="light" />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Thanh toán và giấy phép</h1>
        <p className="mt-2 text-gray-600">Quản lý phương thức thanh toán, đăng ký và giấy phép của bạn</p>
      </div>
      
      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id ? 
                    'border-blue-500 text-blue-600' : 
                    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <tab.icon className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                `} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Payment Methods Tab */}
          {activeTab === 'payment-methods' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Phương thức thanh toán</h2>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {paymentData.paymentMethods.map((method) => (
                      <div 
                        key={method.id}
                        className={`
                          flex items-center justify-between p-4 rounded-lg border
                          ${method.isDefault ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          {getCardIcon(method.brand)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                            </p>
                            <p className="text-sm text-gray-500">
                              Hết hạn {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                          {method.isDefault && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {!method.isDefault && (
                            <button
                              onClick={() => handleSetDefaultPayment(method.id)}
                              className="p-2 text-sm text-gray-500 hover:text-gray-700"
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePaymentMethod(method.id)}
                            className="p-2 text-sm text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!showAddCard ? (
                    <button
                      onClick={() => setShowAddCard(true)}
                      className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2 text-gray-500" />
                      Thêm phương thức thanh toán
                    </button>
                  ) : (
                    <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <h3 className="text-md font-medium text-gray-900 mb-4">Thêm thẻ mới</h3>
                      <form onSubmit={handleAddCard} className="space-y-4">
                        <div>
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                            Số thẻ
                          </label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={newCardData.cardNumber}
                            onChange={handleNewCardChange}
                            placeholder="1234 5678 9012 3456"
                            required
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">
                            Tên chủ thẻ
                          </label>
                          <input
                            type="text"
                            id="cardName"
                            name="cardName"
                            value={newCardData.cardName}
                            onChange={handleNewCardChange}
                            placeholder="NGUYEN VAN A"
                            required
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700">
                              Tháng hết hạn
                            </label>
                            <select
                              id="expiryMonth"
                              name="expiryMonth"
                              value={newCardData.expiryMonth}
                              onChange={handleNewCardChange}
                              required
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="">Tháng</option>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <option key={month} value={month}>{month}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700">
                              Năm hết hạn
                            </label>
                            <select
                              id="expiryYear"
                              name="expiryYear"
                              value={newCardData.expiryYear}
                              onChange={handleNewCardChange}
                              required
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="">Năm</option>
                              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                              Mã CVV
                            </label>
                            <input
                              type="text"
                              id="cvv"
                              name="cvv"
                              value={newCardData.cvv}
                              onChange={handleNewCardChange}
                              placeholder="123"
                              required
                              maxLength="4"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 pt-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            {loading ? (
                              <>
                                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                                Đang xử lý
                              </>
                            ) : 'Thêm thẻ'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddCard(false)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Thông tin thanh toán của bạn được mã hóa và bảo mật an toàn. Chúng tôi không bao giờ lưu trữ thông tin CVV sau khi giao dịch đã được xử lý.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Gói dịch vụ hiện tại</h2>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xl font-medium text-gray-900">
                        Gói {paymentData.subscriptionPlan === 'pro' ? 'Chuyên Nghiệp' : (paymentData.subscriptionPlan === 'enterprise' ? 'Doanh Nghiệp' : 'Cơ Bản')}
                      </p>
                      <p className="mt-2 text-gray-500">
                        Thanh toán tiếp theo: {formatDate(paymentData.nextBillingDate)} 
                        ({formatCurrency(paymentData.amount, paymentData.currency)}/tháng)
                      </p>
                    </div>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Hủy đăng ký
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Các gói dịch vụ</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subscriptionPlans.map((plan) => (
                      <div 
                        key={plan.id}
                        className={`
                          rounded-lg border overflow-hidden
                          ${plan.isPopular ? 'border-blue-400 ring-2 ring-blue-400' : 'border-gray-200'}
                          ${plan.id === paymentData.subscriptionPlan ? 'bg-blue-50' : 'bg-white'}
                        `}
                      >
                        {plan.isPopular && (
                          <div className="bg-blue-500 px-4 py-1 text-center">
                            <p className="text-xs font-medium text-white uppercase tracking-wide">
                              Phổ biến nhất
                            </p>
                          </div>
                        )}
                        <div className="p-5">
                          <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                          <p className="mt-3 text-gray-900">
                            {plan.price !== 'Liên hệ' ? (
                              <>
                                <span className="text-3xl font-extrabold">
                                  {formatCurrency(plan.price, 'VND')}
                                </span>
                                <span className="text-base font-medium">/tháng</span>
                              </>
                            ) : (
                              <span className="text-xl font-bold">Liên hệ</span>
                            )}
                          </p>
                          <ul className="mt-6 space-y-3">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex">
                                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span className="ml-2 text-sm text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            className={`
                              mt-8 w-full py-2 px-4 rounded-md font-medium text-sm 
                              ${plan.id === paymentData.subscriptionPlan ? 
                                'bg-gray-100 text-gray-500 cursor-default' : 
                                'bg-blue-600 text-white hover:bg-blue-700'}
                              ${plan.id === 'enterprise' ? 'flex items-center justify-center' : ''}
                            `}
                            disabled={plan.id === paymentData.subscriptionPlan}
                          >
                            {plan.id === paymentData.subscriptionPlan ? 'Gói hiện tại' : (
                              plan.id === 'enterprise' ? (
                                <>
                                  <span>Liên hệ với chúng tôi</span>
                                  <ArrowUpRightIcon className="ml-1 h-4 w-4" />
                                </>
                              ) : 'Nâng cấp'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Billing History Tab */}
          {activeTab === 'billing-history' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Lịch sử thanh toán</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mã hóa đơn
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số tiền
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentData.billingHistory.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invoice.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.id.toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {invoice.status === 'paid' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Đã thanh toán
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Chưa thanh toán
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a 
                              href={invoice.invoice_pdf} 
                              className="text-blue-600 hover:text-blue-900"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Tải xuống
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paymentData.billingHistory.length === 0 && (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">Chưa có hóa đơn nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Licenses Tab */}
          {activeTab === 'licenses' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Giấy phép của bạn</h2>
                </div>
                <div className="p-5">
                  {paymentData.licenses.map((license) => (
                    <div 
                      key={license.id}
                      className={`
                        mb-4 rounded-lg border p-4
                        ${license.status === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">{license.name}</h3>
                            {license.status === 'active' ? (
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Kích hoạt
                              </span>
                            ) : (
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Hết hạn
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            ID: {license.id} • Số ghế: {license.seats}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Ngày kích hoạt: {formatDate(license.activationDate)} • 
                            Ngày hết hạn: {formatDate(license.expirationDate)}
                          </p>
                        </div>
                        <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                          Gia hạn
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {paymentData.licenses.length === 0 && (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">Bạn chưa có giấy phép nào</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Đăng ký giấy phép mới</h2>
                </div>
                <div className="p-5">
                  <div className="text-center">
                    <p className="text-gray-600">Để đăng ký giấy phép mới, vui lòng liên hệ với đội ngũ bán hàng của chúng tôi.</p>
                    <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                      Liên hệ bán hàng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSettings;
