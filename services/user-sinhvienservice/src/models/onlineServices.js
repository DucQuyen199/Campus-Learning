/*-----------------------------------------------------------------
* File: onlineServices.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const sql = require('mssql');
const dbConfig = require('../config/database');

const OnlineServices = {
  // Get all available services
  async getServices() {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .query(`
          SELECT 
            ServiceID as id,
            ServiceName as title,
            Description as description,
            Price as fee,
            ProcessingTime as processingTime,
            RequiredDocuments as requiredDocuments,
            Department as department
          FROM StudentServices
          WHERE IsActive = 1
          ORDER BY ServiceName
        `);
      
      return { success: true, services: result.recordset };
    } catch (error) {
      console.error('Error fetching services:', error);
      return { success: false, error: error.message };
    }
  },

  // Create a new service request
  async createServiceRequest(requestData) {
    try {
      const pool = await sql.connect(dbConfig);
      
      // Get service price
      const serviceResult = await pool.request()
        .input('ServiceID', sql.BigInt, requestData.serviceId)
        .query(`
          SELECT Price FROM StudentServices WHERE ServiceID = @ServiceID AND IsActive = 1
        `);
      
      if (serviceResult.recordset.length === 0) {
        return { success: false, error: 'Service not found or inactive' };
      }
      
      const price = serviceResult.recordset[0].Price;
      const totalPrice = price * requestData.quantity;
      
      // Create registration
      const result = await pool.request()
        .input('UserID', sql.BigInt, requestData.userId)
        .input('ServiceID', sql.BigInt, requestData.serviceId)
        .input('Quantity', sql.Int, requestData.quantity)
        .input('TotalPrice', sql.Decimal(10,2), totalPrice)
        .input('DeliveryMethod', sql.VarChar(50), requestData.deliveryMethod || 'Pick Up')
        .input('Comments', sql.NVarChar(500), requestData.comments)
        .input('Purpose', sql.NVarChar(500), requestData.purpose)
        .query(`
          INSERT INTO ServiceRegistrations
            (UserID, ServiceID, Quantity, TotalPrice, DeliveryMethod, Comments, Status, PaymentStatus, RequestDate, CreatedAt, UpdatedAt)
          VALUES
            (@UserID, @ServiceID, @Quantity, @TotalPrice, @DeliveryMethod, @Comments, 'Pending', 'Unpaid', GETDATE(), GETDATE(), GETDATE());
          SELECT SCOPE_IDENTITY() AS RegistrationID;
        `);
      
      return { 
        success: true, 
        registrationId: result.recordset[0].RegistrationID,
        totalPrice: totalPrice
      };
    } catch (error) {
      console.error('Error creating service request:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's service request history
  async getUserServiceRequests(userId) {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('UserID', sql.BigInt, userId)
        .query(`
          SELECT 
            r.RegistrationID as id,
            s.ServiceName as serviceTitle,
            FORMAT(r.RequestDate, 'dd/MM/yyyy') as requestDate,
            r.Comments as purpose,
            r.Quantity as quantity,
            r.Status as status,
            r.DeliveryMethod as deliveryMethod,
            r.PaymentStatus as paymentStatus,
            r.TotalPrice as totalPrice,
            FORMAT(r.ProcessedAt, 'dd/MM/yyyy') as receiveDate
          FROM ServiceRegistrations r
          JOIN StudentServices s ON r.ServiceID = s.ServiceID
          WHERE r.UserID = @UserID
          ORDER BY r.RequestDate DESC
        `);
      
      return { success: true, requests: result.recordset };
    } catch (error) {
      console.error('Error fetching user service requests:', error);
      return { success: false, error: error.message };
    }
  },

  // Get delivery methods for dropdown
  async getDeliveryMethods() {
    try {
      return { 
        success: true, 
        methods: [
          { id: 'Pick Up', name: 'Nhận tại trường' },
          { id: 'Mail', name: 'Gửi qua bưu điện' },
          { id: 'Email', name: 'Gửi qua email' }
        ]
      };
    } catch (error) {
      console.error('Error fetching delivery methods:', error);
      return { success: false, error: error.message };
    }
  },

  // Get service-specific purposes for dropdown
  async getServicePurposes(serviceId) {
    try {
      // Define common purposes for all services
      const commonPurposes = [
        { id: 'other', name: 'Mục đích khác' }
      ];
      
      // Define service-specific purposes based on serviceId
      let servicePurposes = [];
      
      switch(parseInt(serviceId)) {
        case 1: // Xác nhận sinh viên
          servicePurposes = [
            { id: 'visa', name: 'Xin visa du học' },
            { id: 'bank', name: 'Mở tài khoản ngân hàng' },
            { id: 'residence', name: 'Đăng ký tạm trú' },
            { id: 'scholarship', name: 'Xin học bổng' }
          ];
          break;
          
        case 2: // Bảng điểm chính thức
          servicePurposes = [
            { id: 'scholarship', name: 'Xin học bổng' },
            { id: 'transfer', name: 'Chuyển trường' },
            { id: 'job', name: 'Xin việc làm' },
            { id: 'grad_study', name: 'Học sau đại học' }
          ];
          break;
          
        case 3: // Thẻ sinh viên
          servicePurposes = [
            { id: 'lost', name: 'Mất thẻ cũ' },
            { id: 'damaged', name: 'Thẻ cũ bị hỏng' },
            { id: 'info_change', name: 'Thay đổi thông tin' }
          ];
          break;
          
        case 4: // Giấy giới thiệu thực tập
          servicePurposes = [
            { id: 'internship', name: 'Thực tập theo chương trình học' },
            { id: 'part_time', name: 'Thực tập bán thời gian' },
            { id: 'summer', name: 'Thực tập hè' }
          ];
          break;
          
        case 5: // Xác nhận hoàn thành chương trình
          servicePurposes = [
            { id: 'job', name: 'Xin việc làm' },
            { id: 'grad_study', name: 'Học sau đại học' },
            { id: 'temp_cert', name: 'Chứng nhận tạm thời' }
          ];
          break;
          
        case 6: // Bản sao bằng tốt nghiệp
          servicePurposes = [
            { id: 'lost', name: 'Mất bản gốc' },
            { id: 'job', name: 'Xin việc làm' },
            { id: 'multi_copy', name: 'Cần nhiều bản sao' },
            { id: 'abroad', name: 'Sử dụng ở nước ngoài' }
          ];
          break;
          
        case 7: // Bản sao học bạ
          servicePurposes = [
            { id: 'lost', name: 'Mất bản gốc' },
            { id: 'transfer', name: 'Chuyển trường' },
            { id: 'job', name: 'Xin việc làm' }
          ];
          break;
          
        case 8: // Giấy xác nhận điểm rèn luyện
          servicePurposes = [
            { id: 'scholarship', name: 'Xin học bổng' },
            { id: 'dormitory', name: 'Đăng ký ký túc xá' },
            { id: 'reward', name: 'Xét khen thưởng' }
          ];
          break;
          
        case 9: // Giấy chứng nhận sinh viên
          servicePurposes = [
            { id: 'visa', name: 'Xin visa du học' },
            { id: 'intern_abroad', name: 'Thực tập nước ngoài' },
            { id: 'exchange', name: 'Chương trình trao đổi' },
            { id: 'int_scholarship', name: 'Học bổng quốc tế' }
          ];
          break;
          
        case 10: // Đăng ký thi lại
          servicePurposes = [
            { id: 'failed', name: 'Thi không đạt' },
            { id: 'improve', name: 'Cải thiện điểm số' },
            { id: 'absent', name: 'Vắng thi có phép' }
          ];
          break;
          
        default:
          // If serviceId is not found, return default general purposes
          servicePurposes = [
            { id: 'academic', name: 'Mục đích học tập' },
            { id: 'personal', name: 'Mục đích cá nhân' },
            { id: 'job', name: 'Mục đích việc làm' }
          ];
      }
      
      // Combine service-specific purposes with common purposes
      return { 
        success: true, 
        purposes: [...servicePurposes, ...commonPurposes]
      };
      
    } catch (error) {
      console.error('Error fetching service purposes:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = OnlineServices; 
