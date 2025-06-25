// Storage utilities for Pill Reminder PWA
// Manages migration from localStorage to IndexedDB

import pillDB from './database.js';

// Storage adapter - provides unified interface
class StorageAdapter {
  constructor() {
    this.isIndexedDBSupported = 'indexedDB' in window;
    this.migrationCompleted = false;
  }

  async init() {
    if (this.isIndexedDBSupported) {
      try {
        await pillDB.init();
        console.log('✅ IndexedDB initialized');
        
        // Migrate data from localStorage if needed
        await this.migrateFromLocalStorage();
        
        return true;
      } catch (error) {
        console.error('❌ IndexedDB failed, falling back to localStorage:', error);
        this.isIndexedDBSupported = false;
        return false;
      }
    } else {
      console.warn('⚠️ IndexedDB not supported, using localStorage');
      return false;
    }
  }

  // Migrate existing localStorage data to IndexedDB
  async migrateFromLocalStorage() {
    try {
      const localStorageKeys = [
        'pill_reminder_pills',
        'pill_reminder_taken_today',
        'pill_reminder_premium',
        'pill_reminder_ai_session'
      ];

      let hasDataToMigrate = false;

      // Check if there's data in localStorage
      for (const key of localStorageKeys) {
        if (localStorage.getItem(key)) {
          hasDataToMigrate = true;
          break;
        }
      }

      if (!hasDataToMigrate) {
        console.log('📋 No localStorage data to migrate');
        return;
      }

      console.log('🔄 Starting localStorage to IndexedDB migration...');

      // Migrate pills
      const pillsData = this.getFromLocalStorage('pill_reminder_pills');
      if (pillsData && Array.isArray(pillsData)) {
        for (const pill of pillsData) {
          await pillDB.savePill(pill);
        }
        console.log(`✅ Migrated ${pillsData.length} pills`);
      }

      // Migrate taken today records
      const takenData = this.getFromLocalStorage('pill_reminder_taken_today');
      if (takenData && typeof takenData === 'object') {
        for (const [key, value] of Object.entries(takenData)) {
          if (value === true) {
            // Parse the key format: "date_pillId"
            const [date, pillId] = key.split('_');
            if (date && pillId) {
              const record = {
                id: key,
                pillId: pillId,
                date: date,
                takenAt: new Date(date).toISOString(),
                timestamp: new Date(date).getTime()
              };
              await pillDB.put('taken_history', record);
            }
          }
        }
        console.log('✅ Migrated taken history');
      }

      // Migrate premium status
      const premiumStatus = this.getFromLocalStorage('pill_reminder_premium');
      if (premiumStatus !== null) {
        await pillDB.setSetting('premium_status', premiumStatus);
        console.log('✅ Migrated premium status');
      }

      // Migrate AI session
      const aiSession = this.getFromLocalStorage('pill_reminder_ai_session');
      if (aiSession) {
        await pillDB.setSetting('ai_session_id', aiSession);
        console.log('✅ Migrated AI session');
      }

      // Clear localStorage after successful migration
      for (const key of localStorageKeys) {
        localStorage.removeItem(key);
      }

      console.log('🎉 Migration completed successfully!');
      this.migrationCompleted = true;

    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  // Pills methods
  async getPills() {
    if (this.isIndexedDBSupported) {
      return await pillDB.getPills();
    } else {
      return this.getFromLocalStorage('pill_reminder_pills') || [];
    }
  }

  async savePills(pills) {
    if (this.isIndexedDBSupported) {
      // Save each pill individually
      for (const pill of pills) {
        await pillDB.savePill(pill);
      }
      return true;
    } else {
      localStorage.setItem('pill_reminder_pills', JSON.stringify(pills));
      return true;
    }
  }

  async addPill(pill) {
    if (this.isIndexedDBSupported) {
      return await pillDB.savePill(pill);
    } else {
      const pills = await this.getPills();
      pills.push(pill);
      return this.savePills(pills);
    }
  }

  async deletePill(pillId) {
    if (this.isIndexedDBSupported) {
      return await pillDB.deletePill(pillId);
    } else {
      const pills = await this.getPills();
      const filteredPills = pills.filter(pill => pill.id !== pillId);
      return this.savePills(filteredPills);
    }
  }

  // Taken history methods
  async getTakenToday() {
    if (this.isIndexedDBSupported) {
      return await pillDB.getTakenToday();
    } else {
      return this.getFromLocalStorage('pill_reminder_taken_today') || {};
    }
  }

  async markPillTaken(pillId) {
    if (this.isIndexedDBSupported) {
      return await pillDB.markPillTaken(pillId);
    } else {
      const taken = await this.getTakenToday();
      const today = new Date().toDateString();
      taken[`${today}_${pillId}`] = true;
      localStorage.setItem('pill_reminder_taken_today', JSON.stringify(taken));
      return true;
    }
  }

  // Settings methods
  async getPremiumStatus() {
    if (this.isIndexedDBSupported) {
      return await pillDB.getSetting('premium_status', false);
    } else {
      return this.getFromLocalStorage('pill_reminder_premium') || false;
    }
  }

  async setPremiumStatus(status) {
    if (this.isIndexedDBSupported) {
      return await pillDB.setSetting('premium_status', status);
    } else {
      localStorage.setItem('pill_reminder_premium', JSON.stringify(status));
      return true;
    }
  }

  async getAISessionId() {
    if (this.isIndexedDBSupported) {
      return await pillDB.getSetting('ai_session_id', null);
    } else {
      return this.getFromLocalStorage('pill_reminder_ai_session');
    }
  }

  async setAISessionId(sessionId) {
    if (this.isIndexedDBSupported) {
      return await pillDB.setSetting('ai_session_id', sessionId);
    } else {
      localStorage.setItem('pill_reminder_ai_session', JSON.stringify(sessionId));
      return true;
    }
  }

  // Clear all data
  async clearAllData() {
    if (this.isIndexedDBSupported) {
      return await pillDB.clearAllData();
    } else {
      const keys = [
        'pill_reminder_pills',
        'pill_reminder_taken_today',
        'pill_reminder_premium',
        'pill_reminder_ai_session'
      ];
      for (const key of keys) {
        localStorage.removeItem(key);
      }
      return true;
    }
  }

  // Export/Import data
  async exportData() {
    if (this.isIndexedDBSupported) {
      return await pillDB.exportData();
    } else {
      const data = {
        pills: this.getFromLocalStorage('pill_reminder_pills') || [],
        taken_today: this.getFromLocalStorage('pill_reminder_taken_today') || {},
        premium_status: this.getFromLocalStorage('pill_reminder_premium') || false,
        ai_session_id: this.getFromLocalStorage('pill_reminder_ai_session') || null,
        exportedAt: new Date().toISOString(),
        source: 'localStorage'
      };
      return data;
    }
  }

  async importData(data) {
    if (this.isIndexedDBSupported) {
      return await pillDB.importData(data);
    } else {
      // Import to localStorage
      if (data.pills) {
        localStorage.setItem('pill_reminder_pills', JSON.stringify(data.pills));
      }
      if (data.taken_today) {
        localStorage.setItem('pill_reminder_taken_today', JSON.stringify(data.taken_today));
      }
      if (data.premium_status !== undefined) {
        localStorage.setItem('pill_reminder_premium', JSON.stringify(data.premium_status));
      }
      if (data.ai_session_id) {
        localStorage.setItem('pill_reminder_ai_session', JSON.stringify(data.ai_session_id));
      }
      return true;
    }
  }

  // Get database stats
  async getStats() {
    if (this.isIndexedDBSupported) {
      return await pillDB.getStats();
    } else {
      const pills = this.getFromLocalStorage('pill_reminder_pills') || [];
      const taken = this.getFromLocalStorage('pill_reminder_taken_today') || {};
      
      return {
        totalPills: pills.length,
        totalTakenRecords: Object.keys(taken).length,
        totalAIMessages: 0,
        lastUpdated: new Date().toISOString(),
        source: 'localStorage'
      };
    }
  }

  // Check if using IndexedDB
  isUsingIndexedDB() {
    return this.isIndexedDBSupported;
  }

  // Get storage info
  async getStorageInfo() {
    const stats = await this.getStats();
    return {
      type: this.isIndexedDBSupported ? 'IndexedDB' : 'localStorage',
      migrationCompleted: this.migrationCompleted,
      ...stats
    };
  }
}

// Create global storage adapter instance
const storage = new StorageAdapter();

export default storage;