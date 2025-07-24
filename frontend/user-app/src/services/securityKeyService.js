/*-----------------------------------------------------------------
* File: securityKeyService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from '../config';

const securityKeyService = {
  // SSH Key methods
  getSSHKeys: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/users/ssh-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching SSH keys:', error);
      throw error;
    }
  },
  
  addSSHKey: async (token, { title, key }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/users/ssh-keys`, 
        { title, key },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data;
    } catch (error) {
      console.error('Error adding SSH key:', error);
      throw error;
    }
  },
  
  deleteSSHKey: async (token, keyId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/users/ssh-keys/${keyId}`, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting SSH key:', error);
      throw error;
    }
  },
  
  // GPG Key methods
  getGPGKeys: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/users/gpg-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching GPG keys:', error);
      throw error;
    }
  },
  
  addGPGKey: async (token, { title, key }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/users/gpg-keys`, 
        { title, key },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data;
    } catch (error) {
      console.error('Error adding GPG key:', error);
      throw error;
    }
  },
  
  deleteGPGKey: async (token, keyId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/users/gpg-keys/${keyId}`, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting GPG key:', error);
      throw error;
    }
  }
};

export default securityKeyService; 
