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

// PWA Status Component
const PWAStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if PWA is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-white text-center py-2 text-sm">
        📶 Offline mode - Data saved locally
      </div>
    );
  }

  return null;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">💊 Add Medication</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medication name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Medication Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vitamin D, Aspirin, Omega-3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              autoComplete="off"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Time to Take *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            <p className="text-xs text-gray-500">
              You'll get a notification at this time
            </p>
          </div>

          {/* Days of week */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Days to Take *
            </label>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    days.includes(day.id)
                      ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>
            {days.length > 0 && (
              <p className="text-xs text-green-600">
                ✓ Selected {days.length} day{days.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Free version limit */}
          {!isPremium && pillCount >= 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <span className="text-amber-600">⚠️</span>
                <div>
                  <p className="text-amber-800 text-sm font-medium">
                    Free Version Limit
                  </p>
                  <p className="text-amber-700 text-xs">
                    You have {pillCount} of 3 available medications.
                    {pillCount >= 3 && ' Upgrade to PRO for unlimited!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || days.length === 0}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all disabled:transform-none transform hover:scale-105"
            >
              Add Medication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Pill Item Component
const PillItem = ({ pill, isTaken, onTake, onEdit, onDelete }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTake = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onTake(pill.id);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all ${
      isTaken ? 'opacity-75 bg-green-50 border-green-200' : 'hover:shadow-md'
    } ${isAnimating ? 'transform scale-95' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`text-2xl transition-transform ${isAnimating ? 'animate-bounce' : ''}`}>
            {pill.icon}
          </div>
          <div>
            <h3 className={`font-medium ${isTaken ? 'text-green-700' : 'text-gray-900'}`}>
              {pill.name}
            </h3>
            <p className="text-sm text-gray-500 flex items-center">
              🕐 {pill.time}
              {isTaken && (
                <span className="ml-2 text-green-600 text-xs">
                  ✓ Taken today
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isTaken ? (
            <div className="flex items-center text-green-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleTake}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm font-medium transition-all transform hover:scale-105 active:scale-95"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to PRO</h2>
          <p className="text-gray-600 mb-6">Unlock unlimited medications and advanced features</p>
          
          <div className="space-y-4 mb-6 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">Unlimited medications</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">Medication history & analytics</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">Ad-free experience</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">Advanced reminders</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="text-3xl font-bold text-blue-600">
              $2.99<span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Cancel anytime</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 font-medium transition-all transform hover:scale-105"
            >
              🚀 Upgrade to PRO
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe later
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

  // Check URL parameters for shortcuts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
      setShowAddModal(true);
    }
  }, []);

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
        .then((registration) => {
          console.log('✅ SW registered successfully:', registration);
          
          // Handle service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'PILL_TAKEN') {
              takePill(event.data.pillId);
            }
          });
        })
        .catch((error) => {
          console.log('❌ SW registration failed:', error);
        });
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
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

    // Show success message
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Medication Added! 💊', {
        body: `${pill.name} has been added to your schedule`,
        icon: '/manifest-icon-192.maskable.png'
      });
    }
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

    // Find pill name for notification
    const pill = pills.find(p => p.id === pillId);
    if (pill && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Medication Taken! ✅', {
        body: `Great job taking your ${pill.name}!`,
        icon: '/manifest-icon-192.maskable.png'
      });
    }
  };

  // Check if pill is taken today
  const isPillTaken = (pillId) => {
    const today = new Date().toDateString();
    return takenToday[`${today}_${pillId}`] || false;
  };

  // Schedule notifications
  const scheduleNotifications = (pill) => {
    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
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
    
    // Show success notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Welcome to PRO! 🎉', {
        body: 'You now have unlimited access to all features!',
        icon: '/manifest-icon-192.maskable.png'
      });
    }
  };

  const todaysPills = getTodaysPills();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA Status */}
      <PWAStatus />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💊 Pill Reminder</h1>
              <p className="text-gray-600 text-sm">
                Today, {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {!isPremium && (
                <button
                  onClick={() => setShowProModal(true)}
                  className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
                >
                  ⭐ PRO
                </button>
              )}
              {isPremium && (
                <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs rounded-full font-medium">
                  ✨ PRO
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Today's Pills */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Today's Schedule ({todaysPills.length})
            </h2>
            {todaysPills.length > 0 && (
              <div className="text-sm text-gray-500">
                {todaysPills.filter(pill => isPillTaken(pill.id)).length} of {todaysPills.length} taken
              </div>
            )}
          </div>
          
          {todaysPills.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No medications for today!
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Enjoy your medication-free day or add new medications
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all transform hover:scale-105"
              >
                Add First Medication
              </button>
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
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{pills.length}</div>
              <div className="text-xs text-gray-600">Total Meds</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {todaysPills.filter(pill => isPillTaken(pill.id)).length}
              </div>
              <div className="text-xs text-gray-600">Taken Today</div>
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
        {!isPremium && pills.length > 0 && (
          <div className="bg-gray-100 rounded-xl p-4 mb-6 text-center border-2 border-dashed border-gray-300">
            <div className="text-gray-500 text-sm font-medium mb-1">
              📢 Advertisement
            </div>
            <div className="text-xs text-gray-400">
              Support us by viewing ads or upgrade to PRO to remove them
            </div>
            <button
              onClick={() => setShowProModal(true)}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
            >
              Remove Ads
            </button>
          </div>
        )}
      </main>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-2xl z-40 transition-all transform hover:scale-110 active:scale-95"
        title="Add new medication"
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