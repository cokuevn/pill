import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Data storage utilities
const STORAGE_KEYS = {
  PILLS: 'pill_reminder_pills',
  TAKEN_TODAY: 'pill_reminder_taken_today',
  AI_SESSION: 'pill_reminder_ai_session'
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

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-white text-center py-2 text-sm">
        📶 Offline mode - AI features unavailable
      </div>
    );
  }

  return null;
};

// AI Chat Component
const AIChatModal = ({ isOpen, onClose, pills }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [chatType, setChatType] = useState('support'); // 'support', 'recommendation', 'general'

  useEffect(() => {
    if (isOpen) {
      // Get or create session ID
      let session = storage.get(STORAGE_KEYS.AI_SESSION);
      if (!session) {
        session = `session_${Date.now()}`;
        storage.set(STORAGE_KEYS.AI_SESSION, session);
      }
      setSessionId(session);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || loading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          message_type: chatType,
          user_medications: pills.map(pill => ({
            id: pill.id,
            name: pill.name,
            time: pill.time,
            days: pill.days
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      setMessages(prev => [...prev, { type: 'ai', content: data.response }]);
    } catch (error) {
      console.error('AI Chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (pills.length === 0) {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: 'You don\'t have any medications added yet. Add some medications first, and I\'ll provide personalized recommendations!' 
      }]);
      return;
    }

    setLoading(true);
    setMessages(prev => [...prev, { type: 'user', content: 'Get personalized recommendations' }]);

    try {
      const response = await fetch(`${API}/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: pills.map(pill => ({
            id: pill.id,
            name: pill.name,
            time: pill.time,
            days: pill.days
          })),
          session_id: sessionId
        })
      });

      if (!response.ok) throw new Error('Failed to get recommendations');

      const data = await response.json();
      setMessages(prev => [...prev, { type: 'ai', content: data.response }]);
    } catch (error) {
      console.error('AI Recommendations error:', error);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: 'Sorry, I couldn\'t generate recommendations right now. Please try again later.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getQuickQuestions = (type) => {
    switch(type) {
      case 'support':
        return [
          "How do I add a new medication?",
          "Why didn't I get a notification?",
          "How do I delete a medication?",
          "Can I change notification times?",
          "What if I miss a dose?",
          "How to install this app on my phone?",
          "How to backup my medication data?"
        ];
      case 'recommendation':
        return [
          "What's the best time to take medications?",
          "How to build a consistent medication routine?",
          "Tips for remembering multiple medications",
          "How to organize my medication schedule?",
          "What to do if I forget a dose?",
          "How to track medication effectiveness?",
          "Best practices for pill organization"
        ];
      case 'general':
        return [
          "How do medications work in the body?",
          "What are drug interactions?",
          "When should I talk to my doctor?",
          "How to store medications properly?",
          "What are generic vs brand medications?",
          "How to read medication labels?",
          "What questions to ask my pharmacist?"
        ];
      default:
        return [];
    }
  };

  const quickQuestions = getQuickQuestions(chatType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md h-[80vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">🤖 AI Assistant</h2>
            <p className="text-sm text-gray-500">Ask me anything about your medications!</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Chat Type Selector */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex space-x-2 text-xs">
            <button
              onClick={() => setChatType('support')}
              className={`px-3 py-1 rounded-full transition-colors ${
                chatType === 'support' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🛠️ Support
            </button>
            <button
              onClick={() => setChatType('recommendation')}
              className={`px-3 py-1 rounded-full transition-colors ${
                chatType === 'recommendation' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💡 Tips
            </button>
            <button
              onClick={() => setChatType('general')}
              className={`px-3 py-1 rounded-full transition-colors ${
                chatType === 'general' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💬 General
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">
                {chatType === 'support' ? '🛠️' : chatType === 'recommendation' ? '💡' : '💬'}
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                {chatType === 'support' ? 'Support Assistant' : 
                 chatType === 'recommendation' ? 'Wellness Tips' : 
                 'General Assistant'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {chatType === 'support' ? 'I can help you with app questions and technical support.' :
                 chatType === 'recommendation' ? 'Get personalized medication tips and wellness advice.' :
                 'Ask me anything about medications and health topics.'}
              </p>
              
              {/* Quick Actions */}
              <div className="space-y-2">
                {chatType === 'recommendation' && (
                  <button
                    onClick={getRecommendations}
                    disabled={pills.length === 0}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
                  >
                    ✨ Analyze My Schedule ({pills.length} medications)
                  </button>
                )}
                {chatType === 'support' && (
                  <button
                    onClick={() => setCurrentMessage("Show me all app features")}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    📱 Show App Features
                  </button>
                )}
                {chatType === 'general' && (
                  <button
                    onClick={() => setCurrentMessage("Tell me about medication safety basics")}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    🏥 Medication Safety Tips
                  </button>
                )}
              </div>

              {/* Quick Questions */}
              <div className="mt-6 text-left">
                <p className="text-xs text-gray-500 mb-2">
                  {chatType === 'support' ? 'Common questions:' :
                   chatType === 'recommendation' ? 'Popular topics:' :
                   'Frequently asked:'}
                </p>
                <div className="space-y-1">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMessage(question)}
                      className="w-full text-left text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : '→'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Pill Modal Component
const AddPillModal = ({ isOpen, onClose, onAdd }) => {
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
const PillItem = ({ pill, isTaken, onTake, onDelete }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleTake = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onTake(pill.id);
      setIsAnimating(false);
    }, 300);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete ${pill.name}?`)) {
      onDelete(pill.id);
    }
    setShowOptions(false);
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
          {/* Options button */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ⋯
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

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

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose, onClearData, pillCount }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearData = () => {
    if (showConfirm) {
      onClearData();
      setShowConfirm(false);
      onClose();
    } else {
      setShowConfirm(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">⚙️ Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* App Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">App Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Total Medications: {pillCount}</p>
              <p>Version: 1.0.0</p>
              <p>Storage: Local (offline-ready)</p>
              <p>AI: GPT-4o powered assistant</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Data Management</h3>
              <button
                onClick={handleClearData}
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all ${
                  showConfirm 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                {showConfirm ? 'Confirm: Delete All Data' : 'Clear All Data'}
              </button>
              {showConfirm && (
                <p className="text-xs text-red-600 mt-2">
                  This will delete all your medications and history. This cannot be undone.
                </p>
              )}
            </div>
          </div>

          {/* AI Features */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-medium text-blue-900 mb-2">🤖 AI Features</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <p>• Smart medication recommendations</p>
              <p>• 24/7 support chat</p>
              <p>• Personalized wellness tips</p>
              <p>• Schedule optimization advice</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
        >
          Close
        </button>
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
          <p className="text-gray-600 mb-6">Unlock unlimited medications and advanced AI features</p>
          
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
              <span className="text-gray-700">Advanced AI health insights</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">AI drug interaction checker</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">Personalized medication schedules</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">AI wellness coaching</span>
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
              <span className="text-gray-700">Priority AI support</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="text-3xl font-bold text-blue-600">
              $2.99<span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Cancel anytime • 7-day free trial</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 font-medium transition-all transform hover:scale-105"
            >
              🚀 Start Free Trial
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

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
    
    setPills(savedPills);
    setTakenToday(savedTaken);
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

  // Delete pill
  const deletePill = (pillId) => {
    const newPills = pills.filter(pill => pill.id !== pillId);
    setPills(newPills);
    storage.set(STORAGE_KEYS.PILLS, newPills);

    // Remove from taken today
    const newTaken = { ...takenToday };
    Object.keys(newTaken).forEach(key => {
      if (key.endsWith(`_${pillId}`)) {
        delete newTaken[key];
      }
    });
    setTakenToday(newTaken);
    storage.set(STORAGE_KEYS.TAKEN_TODAY, newTaken);
  };

  // Clear all data
  const clearAllData = () => {
    setPills([]);
    setTakenToday({});
    storage.set(STORAGE_KEYS.PILLS, []);
    storage.set(STORAGE_KEYS.TAKEN_TODAY, {});
    // Clear AI session too
    localStorage.removeItem(STORAGE_KEYS.AI_SESSION);
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAIChat(true)}
                className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
                title="AI Assistant"
              >
                🤖
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* AI Quick Tips */}
        {pills.length > 0 && navigator.onLine && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900 mb-1">🤖 AI Assistant</h3>
                <p className="text-sm text-blue-700">Get personalized tips and support</p>
              </div>
              <button
                onClick={() => setShowAIChat(true)}
                className="px-3 py-1 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Chat Now
              </button>
            </div>
          </div>
        )}

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
              <div className="space-y-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all transform hover:scale-105"
                >
                  Add First Medication
                </button>
                {navigator.onLine && (
                  <button
                    onClick={() => setShowAIChat(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
                  >
                    🤖 Ask AI for Help
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysPills.map(pill => (
                <PillItem
                  key={pill.id}
                  pill={pill}
                  isTaken={isPillTaken(pill.id)}
                  onTake={takePill}
                  onDelete={deletePill}
                />
              ))}
            </div>
          )}
        </div>

        {/* All Medications */}
        {pills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              All Medications ({pills.length})
            </h2>
            <div className="space-y-3">
              {pills.map(pill => {
                const dayNames = {
                  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 
                  4: 'Thu', 5: 'Fri', 6: 'Sat'
                };
                const daysText = pill.days.map(d => dayNames[d]).join(', ');
                
                return (
                  <div key={pill.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{pill.icon}</div>
                        <div>
                          <h3 className="font-medium text-gray-900">{pill.name}</h3>
                          <p className="text-sm text-gray-500">🕐 {pill.time} • {daysText}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deletePill(pill.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete medication"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
      </main>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-2xl z-40 transition-all transform hover:scale-110 active:scale-95"
        title="Add new medication"
      >
        +
      </button>

      {/* AI Chat Button (floating) */}
      {navigator.onLine && (
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 left-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-lg z-40 transition-all transform hover:scale-110 active:scale-95"
          title="AI Assistant"
        >
          🤖
        </button>
      )}

      {/* Modals */}
      <AddPillModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addPill}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onClearData={clearAllData}
        pillCount={pills.length}
      />

      <AIChatModal
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        pills={pills}
      />
    </div>
  );
}

export default App;