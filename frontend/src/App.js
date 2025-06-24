import React, { useState, useEffect } from 'react';
import './App.css';

// Утилиты для работы с данными
const STORAGE_KEYS = {
  PILLS: 'pill_reminder_pills',
  TAKEN_TODAY: 'pill_reminder_taken_today',
  PREMIUM: 'pill_reminder_premium'
};

// Модель данных для лекарства
const createPill = (name, time, days, icon = '💊') => ({
  id: Date.now() + Math.random(),
  name,
  time, // формат "HH:MM"
  days, // массив чисел 0-6 (0 = воскресенье)
  icon,
  createdAt: new Date().toISOString()
});

// Утилиты для локального хранения
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

// Компонент добавления лекарства
const AddPillModal = ({ isOpen, onClose, onAdd, isPremium, pillCount }) => {
  const [name, setName] = useState('');
  const [time, setTime] = useState('09:00');
  const [days, setDays] = useState([]);
  
  const weekDays = [
    { id: 1, name: 'Пн', fullName: 'Понедельник' },
    { id: 2, name: 'Вт', fullName: 'Вторник' },
    { id: 3, name: 'Ср', fullName: 'Среда' },
    { id: 4, name: 'Чт', fullName: 'Четверг' },
    { id: 5, name: 'Пт', fullName: 'Пятница' },
    { id: 6, name: 'Сб', fullName: 'Суббота' },
    { id: 0, name: 'Вс', fullName: 'Воскресенье' }
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
    
    // Проверка лимита для бесплатной версии
    if (!isPremium && pillCount >= 3) {
      alert('Бесплатная версия поддерживает максимум 3 лекарства. Обновитесь до PRO!');
      return;
    }

    const pill = createPill(name.trim(), time, days);
    onAdd(pill);
    
    // Сброс формы
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
          <h2 className="text-xl font-bold text-gray-900">Добавить лекарство</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название лекарства */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название лекарства
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Витамин D"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Время приема */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Время приема
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Дни недели */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Дни приема
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

          {/* Лимит бесплатной версии */}
          {!isPremium && pillCount >= 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">
                У вас {pillCount} из 3 доступных лекарств в бесплатной версии.
                {pillCount >= 3 && ' Обновитесь до PRO для неограниченного количества!'}
              </p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!name.trim() || days.length === 0}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент элемента лекарства
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
              <span className="text-sm font-medium">Принято</span>
              <div className="ml-2 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onTake(pill.id)}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm font-medium"
            >
              Принято
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент PRO modal
const ProModal = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Обновиться до PRO</h2>
          <p className="text-gray-600 mb-6">Получите полный доступ ко всем функциям</p>
          
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Неограниченное количество лекарств</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">История приема лекарств</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Без рекламы</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Расширенная аналитика</span>
            </div>
          </div>
          
          <div className="text-3xl font-bold text-blue-600 mb-6">
            299 ₽<span className="text-sm font-normal text-gray-500">/месяц</span>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium"
            >
              Обновиться до PRO
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-500 hover:text-gray-700"
            >
              Не сейчас
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Главный компонент приложения
function App() {
  const [pills, setPills] = useState([]);
  const [takenToday, setTakenToday] = useState({});
  const [isPremium, setIsPremium] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  // Загрузка данных при запуске
  useEffect(() => {
    const savedPills = storage.get(STORAGE_KEYS.PILLS) || [];
    const savedTaken = storage.get(STORAGE_KEYS.TAKEN_TODAY) || {};
    const savedPremium = storage.get(STORAGE_KEYS.PREMIUM) || false;
    
    setPills(savedPills);
    setTakenToday(savedTaken);
    setIsPremium(savedPremium);
  }, []);

  // Регистрация Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch(() => console.log('SW registration failed'));
    }
    
    // Запрос разрешения на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Получение лекарств на сегодня
  const getTodaysPills = () => {
    const today = new Date().getDay();
    return pills.filter(pill => pill.days.includes(today));
  };

  // Добавление лекарства
  const addPill = (pill) => {
    const newPills = [...pills, pill];
    setPills(newPills);
    storage.set(STORAGE_KEYS.PILLS, newPills);
    
    // Планирование уведомлений
    scheduleNotifications(pill);
  };

  // Отметка лекарства как принятого
  const takePill = (pillId) => {
    const today = new Date().toDateString();
    const newTaken = {
      ...takenToday,
      [`${today}_${pillId}`]: true
    };
    setTakenToday(newTaken);
    storage.set(STORAGE_KEYS.TAKEN_TODAY, newTaken);
  };

  // Проверка, принято ли лекарство сегодня
  const isPillTaken = (pillId) => {
    const today = new Date().toDateString();
    return takenToday[`${today}_${pillId}`] || false;
  };

  // Планирование уведомлений
  const scheduleNotifications = (pill) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        const now = new Date();
        const [hours, minutes] = pill.time.split(':');
        
        // Планируем уведомления на ближайшие 7 дней
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

  // Обновление до PRO
  const upgradeToPro = () => {
    // Здесь будет интеграция с Google Play Billing
    setIsPremium(true);
    storage.set(STORAGE_KEYS.PREMIUM, true);
    setShowProModal(false);
    alert('Поздравляем! Вы обновились до PRO версии! 🎉');
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
              <p className="text-gray-600 text-sm">Сегодня, {new Date().toLocaleDateString('ru-RU')}</p>
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
            На сегодня ({todaysPills.length})
          </h2>
          
          {todaysPills.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-gray-600">На сегодня лекарств нет!</p>
              <p className="text-gray-500 text-sm">Добавьте новое лекарство, если нужно</p>
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
              <div className="text-xs text-gray-600">Лекарств</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {todaysPills.filter(pill => isPillTaken(pill.id)).length}
              </div>
              <div className="text-xs text-gray-600">Принято</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {todaysPills.filter(pill => !isPillTaken(pill.id)).length}
              </div>
              <div className="text-xs text-gray-600">Осталось</div>
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
              Реклама исчезнет в PRO версии
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