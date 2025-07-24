/*-----------------------------------------------------------------
* File: events.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import adminApi from './config';

const API_URL = '/events';

/**
 * Get all events
 * @returns {Promise} Promise object represents the list of events
 */
export const getAllEvents = () => {
  return adminApi.get(API_URL);
};

/**
 * Get event by ID
 * @param {string} id Event ID
 * @returns {Promise} Promise object represents the event
 */
export const getEventById = (id) => {
  return adminApi.get(`${API_URL}/${id}`);
};

/**
 * Create new event
 * @param {Object} data Event data following the database schema
 * @returns {Promise} Promise object represents the created event
 */
export const createEvent = (data) => {
  // Đảm bảo dữ liệu khớp với schema của bảng Events
  const eventData = {
    Title: data.title,
    Description: data.description,
    Category: data.category,
    EventDate: data.eventDate,
    EventTime: data.eventTime,
    Location: data.location,
    ImageUrl: data.imageUrl,
    MaxAttendees: data.maxAttendees,
    CurrentAttendees: 0, // Giá trị mặc định theo schema
    Price: data.price || 0,
    Organizer: data.organizer,
    Difficulty: data.difficulty || 'intermediate',
    Status: 'upcoming', // Giá trị mặc định theo schema
    CreatedAt: new Date().toISOString()
  };
  return adminApi.post(API_URL, eventData);
};

/**
 * Update event
 * @param {string} id Event ID
 * @param {Object} data Updated event data
 * @returns {Promise} Promise object represents the updated event
 */
export const updateEvent = (id, data) => {
  // Ensure data matches database schema
  // Sử dụng trực tiếp dữ liệu được truyền vào mà không cần chuyển đổi tên trường
  // Giả sử backend nhận các trường có tên bắt đầu bằng chữ hoa
  return adminApi.put(`${API_URL}/${id}`, data);
};

/**
 * Delete event
 * @param {string} id Event ID
 * @returns {Promise} Promise object represents the deletion result
 */
export const deleteEvent = (id) => {
  return adminApi.delete(`${API_URL}/${id}`);
};

/**
 * Update event status
 * @param {string} id Event ID
 * @param {string} status New status (must be: 'upcoming', 'ongoing', 'completed', 'cancelled')
 * @returns {Promise} Promise object represents the update result
 */
export const updateEventStatus = (id, status) => {
  if (!['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
    throw new Error('Invalid status value');
  }
  return adminApi.put(`${API_URL}/${id}/status`, { Status: status });
};

/**
 * Get event languages
 * @param {string} eventId Event ID
 * @returns {Promise} Promise object represents the list of languages
 */
export const getEventLanguages = (eventId) => {
  return adminApi.get(`${API_URL}/${eventId}/languages`);
};

/**
 * Add programming language to an event
 * @param {string} eventId Event ID
 * @param {Object} data Language data
 * @returns {Promise} Promise object represents the created language
 */
export const addEventLanguage = (eventId, data) => {
  return adminApi.post(`${API_URL}/${eventId}/languages`, {
    Language: data.language
  });
};

/**
 * Get event technologies
 * @param {string} eventId Event ID
 * @returns {Promise} Promise object represents the list of technologies
 */
export const getEventTechnologies = (eventId) => {
  return adminApi.get(`${API_URL}/${eventId}/technologies`);
};

/**
 * Add technology to an event
 * @param {string} eventId Event ID
 * @param {Object} data Technology data
 * @returns {Promise} Promise object represents the created technology
 */
export const addEventTechnology = (eventId, data) => {
  return adminApi.post(`${API_URL}/${eventId}/technologies`, {
    Technology: data.technology
  });
};

/**
 * Get event schedule
 * @param {string} eventId - Event ID
 * @returns {Promise} - Promise object represents the schedule list
 */
export const getEventSchedule = (eventId) => {
  return adminApi.get(`${API_URL}/${eventId}/schedule`);
};

/**
 * Add schedule to an event
 * @param {string} eventId - Event ID
 * @param {Object} data - Schedule data
 * @returns {Promise} - Promise object represents the created schedule
 */
export const addEventSchedule = (eventId, data) => {
  return adminApi.post(`${API_URL}/${eventId}/schedule`, {
    ActivityName: data.activityName,
    StartTime: data.startTime,
    EndTime: data.endTime,
    Description: data.description,
    Location: data.location,
    Type: data.type || 'main_event'
  });
};

/**
 * Delete schedule from an event
 * @param {string} eventId - Event ID
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise} - Promise object represents the delete result
 */
export const deleteEventSchedule = (eventId, scheduleId) => {
  return adminApi.delete(`${API_URL}/${eventId}/schedule/${scheduleId}`);
};

/**
 * Get event prizes
 * @param {string} eventId Event ID
 * @returns {Promise} Promise object represents the list of prizes
 */
export const getEventPrizes = (eventId) => {
  return adminApi.get(`${API_URL}/${eventId}/prizes`);
};

/**
 * Add prize to an event
 * @param {string} eventId Event ID
 * @param {Object} data Prize data
 * @returns {Promise} Promise object represents the created prize
 */
export const addEventPrize = (eventId, data) => {
  return adminApi.post(`${API_URL}/${eventId}/prizes`, {
    Rank: data.rank,
    PrizeAmount: data.amount,
    Description: data.description
  });
};

/**
 * Get event participants
 * @param {string} eventId Event ID
 * @returns {Promise} Promise object represents the list of participants
 */
export const getEventParticipants = (eventId) => {
  return adminApi.get(`${API_URL}/${eventId}/participants`);
}; 
