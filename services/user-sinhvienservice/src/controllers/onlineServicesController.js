/*-----------------------------------------------------------------
* File: onlineServicesController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const OnlineServices = require('../models/onlineServices');

// Get all available services
exports.getServices = async (req, res) => {
  try {
    const result = await OnlineServices.getServices();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách dịch vụ',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      services: result.services
    });
  } catch (err) {
    console.error('Error in getServices controller:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình lấy danh sách dịch vụ',
      error: err.message
    });
  }
};

// Create a new service request
exports.createServiceRequest = async (req, res) => {
  try {
    const { serviceId, quantity, deliveryMethod, purpose, comments } = req.body;
    
    // Validate required fields
    if (!serviceId || !quantity || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }
    
    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải từ 1 đến 10 bản'
      });
    }
    
    // Get userId from authenticated user
    const userId = req.user.id;
    
    // Create service request
    const result = await OnlineServices.createServiceRequest({
      userId,
      serviceId,
      quantity,
      deliveryMethod: deliveryMethod || 'Pick Up',
      purpose,
      comments
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi gửi yêu cầu dịch vụ',
        error: result.error
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Yêu cầu dịch vụ của bạn đã được ghi nhận thành công!',
      registrationId: result.registrationId,
      totalPrice: result.totalPrice
    });
  } catch (err) {
    console.error('Error in createServiceRequest controller:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình gửi yêu cầu dịch vụ',
      error: err.message
    });
  }
};

// Get user's service request history
exports.getUserServiceRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await OnlineServices.getUserServiceRequests(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy lịch sử yêu cầu dịch vụ',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      requests: result.requests
    });
  } catch (err) {
    console.error('Error in getUserServiceRequests controller:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình lấy lịch sử yêu cầu dịch vụ',
      error: err.message
    });
  }
};

// Get service metadata (delivery methods, etc.)
exports.getServiceMetadata = async (req, res) => {
  try {
    const result = await OnlineServices.getDeliveryMethods();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy thông tin chung'
      });
    }
    
    return res.status(200).json({
      success: true,
      deliveryMethods: result.methods
    });
  } catch (err) {
    console.error('Error in getServiceMetadata controller:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình lấy thông tin chung',
      error: err.message
    });
  }
};

// Get service-specific purposes
exports.getServicePurposes = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin dịch vụ'
      });
    }
    
    const result = await OnlineServices.getServicePurposes(serviceId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy mục đích yêu cầu',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      purposes: result.purposes
    });
  } catch (err) {
    console.error('Error in getServicePurposes controller:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình lấy mục đích yêu cầu',
      error: err.message
    });
  }
}; 
