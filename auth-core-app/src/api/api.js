import axios from 'axios';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://auth-core-sz7p.vercel.app'; // Your Vercel Backend

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getHardwareSignals = async () => {
  return {
    model: Device.modelName,
    brand: Device.brand,
    osVersion: Device.osVersion,
    deviceName: Device.deviceName,
    manufacturer: Device.manufacturer,
    fingerprint: Device.osBuildId, // Unique build identifier
  };
};

export const getHwid = async () => {
    // Generate a pseudo-HWID for mobile based on hardware constants
    const signals = await getHardwareSignals();
    return `${Device.manufacturer}-${Device.modelName}-${Device.osBuildId}`.replace(/\s+/g, '-').toLowerCase();
};

export const AuthAPI = {
  login: async (licenceKey, appId = 2) => {
    try {
      const hwid = await getHwid();
      const signals = await getHardwareSignals();
      
      const response = await api.post('/runtime/validate', {
        appId,
        licenceKey,
        hwid,
        signals,
        appVersion: '1.0.0-mobile',
        appSecret: 'iya03oEyo3fkS5jJVykVLpS5ziOQaT46' // Matches your KarenMods secret
      });

      if (response.data.status) {
        await SecureStore.setItemAsync('user_licence', licenceKey);
        await SecureStore.setItemAsync('hwid', hwid);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      return { 
        status: false, 
        message: error.response?.data?.message || 'Connection failed' 
      };
    }
  },

  checkSession: async () => {
    try {
      const licenceKey = await SecureStore.getItemAsync('user_licence');
      if (!licenceKey) return { active: false };

      const response = await api.post('/runtime/heartbeat', {
        licenceKey,
        appId: 2
      });

      return response.data;
    } catch (error) {
      return { active: false };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('user_licence');
  }
};
