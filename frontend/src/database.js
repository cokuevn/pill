// IndexedDB Database Manager для Pill Reminder PWA
// Каждый браузер/устройство имеет свою локальную копию данных

class PillReminderDB {
  constructor() {
    this.dbName = 'PillReminderDB';
    this.version = 1;
    this.db = null;
  }

  // Инициализация базы данных
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB connected successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🔧 IndexedDB upgrading database schema...');

        // Таблица лекарств
        if (!db.objectStoreNames.contains('pills')) {
          const pillsStore = db.createObjectStore('pills', { keyPath: 'id' });
          pillsStore.createIndex('name', 'name', { unique: false });
          pillsStore.createIndex('time', 'time', { unique: false });
          pillsStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('📊 Created pills table');
        }

        // Таблица истории приема
        if (!db.objectStoreNames.contains('taken_history')) {
          const takenStore = db.createObjectStore('taken_history', { keyPath: 'id' });
          takenStore.createIndex('pillId', 'pillId', { unique: false });
          takenStore.createIndex('date', 'date', { unique: false });
          takenStore.createIndex('takenAt', 'takenAt', { unique: false });
          console.log('📊 Created taken_history table');
        }

        // Таблица настроек
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
          console.log('📊 Created settings table');
        }

        // Таблица AI сессий
        if (!db.objectStoreNames.contains('ai_sessions')) {
          const aiStore = db.createObjectStore('ai_sessions', { keyPath: 'id' });
          aiStore.createIndex('sessionId', 'sessionId', { unique: false });
          aiStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('📊 Created ai_sessions table');
        }

        // Таблица пользовательских данных (без авторизации - привязка к устройству)
        if (!db.objectStoreNames.contains('user_data')) {
          const userStore = db.createObjectStore('user_data', { keyPath: 'key' });
          console.log('📊 Created user_data table');
        }
      };
    });
  }

  // Универсальные методы для работы с данными
  async get(storeName, key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Специализированные методы для лекарств
  async getPills() {
    try {
      const pills = await this.getAll('pills');
      return pills || [];
    } catch (error) {
      console.error('Error getting pills:', error);
      return [];
    }
  }

  async savePill(pill) {
    try {
      await this.put('pills', pill);
      console.log('💊 Pill saved:', pill.name);
      return true;
    } catch (error) {
      console.error('Error saving pill:', error);
      return false;
    }
  }

  async deletePill(pillId) {
    try {
      await this.delete('pills', pillId);
      // Также удаляем историю приема этого лекарства
      await this.deleteTakenHistoryForPill(pillId);
      console.log('🗑️ Pill deleted:', pillId);
      return true;
    } catch (error) {
      console.error('Error deleting pill:', error);
      return false;
    }
  }

  // Методы для истории приема
  async getTakenToday() {
    try {
      const today = new Date().toDateString();
      const allTaken = await this.getAll('taken_history');
      const todayTaken = allTaken.filter(record => record.date === today);
      
      // Преобразуем в формат для совместимости
      const result = {};
      todayTaken.forEach(record => {
        result[`${record.date}_${record.pillId}`] = true;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting taken today:', error);
      return {};
    }
  }

  async markPillTaken(pillId) {
    try {
      const now = new Date();
      const record = {
        id: `${now.toDateString()}_${pillId}`,
        pillId: pillId,
        date: now.toDateString(),
        takenAt: now.toISOString(),
        timestamp: now.getTime()
      };
      
      await this.put('taken_history', record);
      console.log('✅ Pill marked as taken:', pillId);
      return true;
    } catch (error) {
      console.error('Error marking pill taken:', error);
      return false;
    }
  }

  async deleteTakenHistoryForPill(pillId) {
    try {
      const allTaken = await this.getAll('taken_history');
      const toDelete = allTaken.filter(record => record.pillId === pillId);
      
      for (const record of toDelete) {
        await this.delete('taken_history', record.id);
      }
      
      console.log('🗑️ Taken history deleted for pill:', pillId);
      return true;
    } catch (error) {
      console.error('Error deleting taken history:', error);
      return false;
    }
  }

  // Методы для настроек
  async getSetting(key, defaultValue = null) {
    try {
      const setting = await this.get('settings', key);
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  async setSetting(key, value) {
    try {
      await this.put('settings', { key, value, updatedAt: new Date().toISOString() });
      console.log('⚙️ Setting saved:', key, value);
      return true;
    } catch (error) {
      console.error('Error saving setting:', error);
      return false;
    }
  }

  // Методы для AI сессий
  async saveAIMessage(sessionId, userMessage, aiResponse, messageType = 'support') {
    try {
      const message = {
        id: Date.now() + Math.random(),
        sessionId,
        userMessage,
        aiResponse,
        messageType,
        createdAt: new Date().toISOString()
      };
      
      await this.put('ai_sessions', message);
      console.log('🤖 AI message saved');
      return true;
    } catch (error) {
      console.error('Error saving AI message:', error);
      return false;
    }
  }

  async getAIHistory(sessionId, limit = 20) {
    try {
      const allMessages = await this.getAll('ai_sessions');
      const sessionMessages = allMessages
        .filter(msg => msg.sessionId === sessionId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
        
      return sessionMessages;
    } catch (error) {
      console.error('Error getting AI history:', error);
      return [];
    }
  }

  // Методы для очистки данных
  async clearAllData() {
    try {
      await this.clear('pills');
      await this.clear('taken_history');
      await this.clear('settings');
      await this.clear('ai_sessions');
      await this.clear('user_data');
      
      console.log('🧹 All data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Методы для экспорта/импорта данных
  async exportData() {
    try {
      const data = {
        pills: await this.getAll('pills'),
        taken_history: await this.getAll('taken_history'),
        settings: await this.getAll('settings'),
        ai_sessions: await this.getAll('ai_sessions'),
        user_data: await this.getAll('user_data'),
        exportedAt: new Date().toISOString(),
        version: this.version
      };
      
      console.log('📦 Data exported');
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  async importData(data) {
    try {
      // Очищаем существующие данные
      await this.clearAllData();
      
      // Импортируем новые данные
      if (data.pills) {
        for (const pill of data.pills) {
          await this.put('pills', pill);
        }
      }
      
      if (data.taken_history) {
        for (const record of data.taken_history) {
          await this.put('taken_history', record);
        }
      }
      
      if (data.settings) {
        for (const setting of data.settings) {
          await this.put('settings', setting);
        }
      }
      
      if (data.user_data) {
        for (const userData of data.user_data) {
          await this.put('user_data', userData);
        }
      }
      
      console.log('📥 Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Получение статистики
  async getStats() {
    try {
      const pills = await this.getPills();
      const takenHistory = await this.getAll('taken_history');
      const aiMessages = await this.getAll('ai_sessions');
      
      return {
        totalPills: pills.length,
        totalTakenRecords: takenHistory.length,
        totalAIMessages: aiMessages.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

// Создаем глобальный экземпляр базы данных
const pillDB = new PillReminderDB();

export default pillDB;