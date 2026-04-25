import { Platform } from 'react-native';

let HC = null;

if (Platform.OS === 'android') {
  try {
    HC = require('react-native-health-connect');
  } catch (e) {
    console.warn('react-native-health-connect is not available');
  }
}

const healthConnectService = {
  async initialize() {
    if (!HC) return false;
    try {
      if (typeof HC.initialize === 'function') {
        return await HC.initialize();
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize Health Connect:', error);
      return false;
    }
  },

  async checkAvailability() {
    if (!HC) return { available: false, status: 'NOT_ANDROID' };
    try {
      const status = await HC.getSdkStatus();
      if (status === 3) return { available: true, status: 'AVAILABLE' };
      if (status === 2) return { available: false, status: 'UPDATE_REQUIRED' };
      return { available: false, status: 'UNAVAILABLE' };
    } catch (error) {
      console.error('Health Connect availability check failed:', error);
      return { available: false, status: 'ERROR', error: error.message };
    }
  },

  async openHealthConnectDataManagement() {
    if (!HC) return false;
    try {
      if (typeof HC.openHealthConnectDataManagement === 'function') {
        await HC.openHealthConnectDataManagement();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to open Health Connect data management:', error.message);
      return false;
    }
  },

  async openHealthConnectSettings() {
    if (!HC) return false;
    try {
      if (typeof HC.openHealthConnectSettings === 'function') {
        await HC.openHealthConnectSettings();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to open Health Connect settings:', error.message);
      return false;
    }
  },

  async getGrantedPermissions() {
    if (!HC || typeof HC.getGrantedPermissions !== 'function') return [];
    try {
      const granted = await HC.getGrantedPermissions();
      return granted || [];
    } catch (error) {
      console.warn('Failed to get granted permissions:', error.message);
      return [];
    }
  },

  async requestPermissions() {
    if (!HC) return false;
    try {
      if (typeof HC.requestPermissions === 'function') {
        try {
          const permissions = [
            { accessType: 'read', recordType: 'HeartRate' },
            { accessType: 'read', recordType: 'Steps' },
          ];
          await HC.requestPermissions(permissions);
          return true;
        } catch (err) {
          if (typeof HC.openHealthConnectSettings === 'function') {
            await HC.openHealthConnectSettings();
          }
          return true;
        }
      } else {
        if (typeof HC.openHealthConnectSettings === 'function') {
          await HC.openHealthConnectSettings();
        }
        return true;
      }
    } catch (error) {
      console.error('Permission request error:', error.message);
      return false;
    }
  },

  async getHeartRateData(durationMinutes = 5) {
    if (!HC) return [];
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);

      const response = await HC.readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      const records = Array.isArray(response) ? response : (response?.records || []);
      const hrValues = [];

      for (const record of records) {
        if (record.samples && Array.isArray(record.samples)) {
          for (const sample of record.samples) {
            if (
              sample.beatsPerMinute != null &&
              typeof sample.beatsPerMinute === 'number' &&
              sample.beatsPerMinute >= 30 &&
              sample.beatsPerMinute <= 220
            ) {
              hrValues.push(Math.round(sample.beatsPerMinute));
            }
          }
        }
      }

      return hrValues;
    } catch (error) {
      console.error('Failed to read heart rate:', error?.message || error);
      return [];
    }
  },

  async getSteps(durationMinutes = 60) {
    if (!HC) return 0;
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);

      const response = await HC.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      const records = Array.isArray(response) ? response : (response?.records || []);
      let totalSteps = 0;

      for (const record of records) {
        totalSteps += record.count || 0;
      }

      return totalSteps;
    } catch (error) {
      console.error('Failed to read steps:', error?.message || error);
      return 0;
    }
  },

  async getLatestHeartRate() {
    const windows = [15, 60, 360, 1440];
    for (const mins of windows) {
      const hrValues = await this.getHeartRateData(mins);
      if (hrValues.length > 0) return hrValues[hrValues.length - 1];
    }
    return null;
  },

  async collectForStressPrediction() {
    let heartRate = await this.getHeartRateData(5);
    if (heartRate.length < 10) heartRate = await this.getHeartRateData(15);
    if (heartRate.length < 10) heartRate = await this.getHeartRateData(30);
    if (heartRate.length < 10) heartRate = await this.getHeartRateData(60);
    if (heartRate.length < 10) heartRate = await this.getHeartRateData(360);
    if (heartRate.length < 10) heartRate = await this.getHeartRateData(1440);

    const steps = await this.getSteps(1440);
    return { heartRate, steps };
  },

  async verifyPermissions() {
    if (!HC) {
      return {
        verified: false,
        heartRateGranted: false,
        stepsGranted: false,
        diagnostics: 'Health Connect module not available',
      };
    }

    try {
      const granted = await this.getGrantedPermissions();
      const heartRateGranted = granted.some(
        (p) => p.recordType === 'HeartRate' && p.accessType === 'read'
      );
      const stepsGranted = granted.some(
        (p) => p.recordType === 'Steps' && p.accessType === 'read'
      );
      const verified = heartRateGranted || stepsGranted;

      return {
        verified,
        heartRateGranted,
        stepsGranted,
        diagnostics: verified
          ? 'Permissions confirmed - you can proceed'
          : 'Permissions not granted - open Health Connect app, find this app, and toggle ON Heart Rate and Steps',
      };
    } catch (error) {
      console.error('Verification error:', error.message);
      return {
        verified: false,
        heartRateGranted: false,
        stepsGranted: false,
        diagnostics: 'Error during verification: ' + error.message,
      };
    }
  },
};

export default healthConnectService;
