import React, { useState, useEffect } from 'react';
import './App.css';

// Data storage utilities
const STORAGE_KEYS = {
  PILLS: 'pill_reminder_pills',
  TAKEN_TODAY: 'pill_reminder_taken_today',
  PREMIUM: 'pill_reminder_premium'
};

// Pill data model
const createPill = (name, time, days, icon = '💊') => ({
  id: Date.now() + Math.random(),
  name,
  time, // format "HH:MM"
  days, // array of numbers 0-6 (0 = Sunday)
  icon,
  createdAt: new Date().toISOString()
});

// Local storage utilities
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error('Storage error');
    }
  }
};

// Add Pill Modal Component
const AddPillModal = ({ isOpen, onClose, onAdd, isPremium, pillCount }) => {
  const [name, setName] = useState('');
  const [time, setTime] = useState('09:00');
  const [days, setDays] = useState([]);
  
  const weekDays = [
    { id: 1, name: 'Mon', fullName: 'Monday' },
    { id: 2, name: 'Tue', fullName: 'Tuesday' },
    { id: 3, name: 'Wed', fullName: 'Wednesday' },
    { id: 4, name: 'Thu', fullName: 'Thursday' },
    { id: 5, name: 'Fri', fullName: 'Friday' },
    { id: 6, name: 'Sat', fullName: 'Saturday' },
    { id: 0, name: 'Sun', fullName: 'Sunday' }
  ];

  const toggleDay = (dayId) => {
    setDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || days.length === 0) return;
    
    // Check limit for free version
    if (!isPremium && pillCount >= 3) {
      alert('Free version supports maximum 3 medications. Upgrade to PRO!');
      return;
    }

    const pill = createPill(name.trim(), time, days);
    onAdd(pill);
    
    // Reset form
    setName('');
    setTime('09:00');
    setDays([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Medication</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medication name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medication Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vitamin D"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time to Take
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Days of week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Days to Take
            </label>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                    days.includes(day.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>
          </div>

          {/* Free version limit */}
          {!isPremium && pillCount >= 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">
                You have {pillCount} of 3 available medications in the free version.
                {pillCount >= 3 && ' Upgrade to PRO for unlimited medications!'}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || days.length === 0}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Pill Item Component
const PillItem = ({ pill, isTaken, onTake, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{pill.icon}</div>
          <div>
            <h3 className="font-medium text-gray-900">{pill.name}</h3>
            <p className="text-sm text-gray-500">{pill.time}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isTaken ? (
            <div className="flex items-center text-green-600">
              <span className="text-sm font-medium">Taken</span>
              <div className="ml-2 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onTake(pill.id)}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm font-medium"
            >
              Take
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// PRO Modal Component
const ProModal = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to PRO</h2>
          <p className="text-gray-600 mb-6">Get full access to all features</p>
          
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Unlimited medications</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Medication history</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Ad-free experience</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Advanced analytics</span>
            </div>
          </div>
          
          <div className="text-3xl font-bold text-blue-600 mb-6">
            $2.99<span className="text-sm font-normal text-gray-500">/month</span>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium"
            >
              Upgrade to PRO
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-500 hover:text-gray-700"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [pills, setPills] = useState([]);
  const [takenToday, setTakenToday] = useState({});
  const [isPremium, setIsPremium] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  // Load data on startup
  useEffect(() => {
    const savedPills = storage.get(STORAGE_KEYS.PILLS) || [];
    const savedTaken = storage.get(STORAGE_KEYS.TAKEN_TODAY) || {};
    const savedPremium = storage.get(STORAGE_KEYS.PREMIUM) || false;
    
    setPills(savedPills);
    setTakenToday(savedTaken);
    setIsPremium(savedPremium);
  }, []);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch(() => console.log('SW registration failed'));
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Get today's pills
  const getTodaysPills = () => {
    const today = new Date().getDay();
    return pills.filter(pill => pill.days.includes(today));
  };

  // Add pill
  const addPill = (pill) => {
    const newPills = [...pills, pill];
    setPills(newPills);
    storage.set(STORAGE_KEYS.PILLS, newPills);
    
    // Schedule notifications
    scheduleNotifications(pill);
  };

  // Mark pill as taken
  const takePill = (pillId) => {
    const today = new Date().toDateString();
    const newTaken = {
      ...takenToday,
      [`${today}_${pillId}`]: true
    };
    setTakenToday(newTaken);
    storage.set(STORAGE_KEYS.TAKEN_TODAY, newTaken);
  };

  // Check if pill is taken today
  const isPillTaken = (pillId) => {
    const today = new Date().toDateString();
    return takenToday[`${today}_${pillId}`] || false;
  };

  // Schedule notifications
  const scheduleNotifications = (pill) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        const now = new Date();
        const [hours, minutes] = pill.time.split(':');
        
        // Schedule notifications for the next 7 days
        for (let i = 0; i < 7; i++) {
          const notificationDate = new Date(now);
          notificationDate.setDate(now.getDate() + i);
          notificationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          if (pill.days.includes(notificationDate.getDay()) && notificationDate > now) {
            navigator.serviceWorker.controller?.postMessage({
              type: 'SCHEDULE_NOTIFICATION',
              pill,
              time: notificationDate.toISOString()
            });
          }
        }
      });
    }
  };

  // Upgrade to PRO
  const upgradeToPro = () => {
    // Here will be Google Play Billing integration
    setIsPremium(true);
    storage.set(STORAGE_KEYS.PREMIUM, true);
    setShowProModal(false);
    alert('Congratulations! You upgraded to PRO version! 🎉');
  };

  const todaysPills = getTodaysPills();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💊 Pill Reminder</h1>
              <p className="text-gray-600 text-sm">Today, {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            {!isPremium && (
              <button
                onClick={() => setShowProModal(true)}
                className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium"
              >
                PRO
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Today's Pills */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Schedule ({todaysPills.length})
          </h2>
          
          {todaysPills.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-gray-600">No medications for today!</p>
              <p className="text-gray-500 text-sm">Add a new medication if needed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysPills.map(pill => (
                <PillItem
                  key={pill.id}
                  pill={pill}
                  isTaken={isPillTaken(pill.id)}
                  onTake={takePill}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{pills.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {todaysPills.filter(pill => isPillTaken(pill.id)).length}
              </div>
              <div className="text-xs text-gray-600">Taken</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {todaysPills.filter(pill => !isPillTaken(pill.id)).length}
              </div>
              <div className="text-xs text-gray-600">Remaining</div>
            </div>
          </div>
        </div>

        {/* AdMob Banner Placeholder */}
        {!isPremium && (
          <div className="bg-gray-100 rounded-xl p-4 mb-6 text-center">
            <div className="text-gray-500 text-sm">
              [AdMob Banner]
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Ads removed in PRO version
            </div>
          </div>
        )}
      </main>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center text-2xl z-40"
      >
        +
      </button>

      {/* Modals */}
      <AddPillModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addPill}
        isPremium={isPremium}
        pillCount={pills.length}
      />

      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onUpgrade={upgradeToPro}
      />
    </div>
  );
}

export default App;