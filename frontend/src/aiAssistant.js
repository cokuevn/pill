// AI Assistant с доступом к локальной базе данных
// Этот модуль предоставляет персонализированные рекомендации и поддержку

import database from './database.js';

class AIAssistant {
  constructor() {
    this.supportMessages = [
      "Remember, taking care of your health is an act of self-love! 💙",
      "Every day you take your medications on time is a small victory! 🏆",
      "You're doing great! Keep up the excellent work! 💪",
      "Healthy habits are built day by day. You're on the right path! 🌟",
      "Your discipline in taking medications is inspiring! Keep it up! ✨"
    ];
    
    this.motivationalMessages = [
      "Today is a new day - new opportunities to take care of yourself! 🌅",
      "You've already taken an important step by adding medications to the app. Now just take them! 📱",
      "Small steps every day lead to big results! 👣",
      "Your health is your wealth. Invest in it every day! 💎",
      "Remember: you're not alone on this journey to health! 🤝"
    ];
  }

  // Анализ состояния пользователя и создание персонализированного контекста
  async createUserContext(pills = []) {
    try {
      const stats = await database.getMedicationStats(30);
      const patterns = await database.getMedicationPatterns();
      const insights = await database.getRecentInsights(7);
      const consecutiveDays = await database.getConsecutiveDays();
      
      const context = {
        // Базовая информация
        totalMedications: pills.length,
        currentTime: new Date().toLocaleTimeString(),
        currentDate: new Date().toDateString(),
        
        // Статистика приема
        adherenceRate: stats?.adherenceRate || 0,
        totalTaken: stats?.totalTaken || 0,
        missedDoses: stats?.missedDoses || 0,
        consecutiveDays: consecutiveDays,
        
        // Паттерны поведения
        preferredTimeSlot: this.getPreferredTimeSlot(patterns.timeOfDay || {}),
        mostActiveDay: this.getMostActiveDay(patterns.dayOfWeek || {}),
        hasTimingIssues: (patterns.delays || []).length > 2,
        
        // Достижения и проблемы
        recentAchievements: insights.achievements || [],
        currentConcerns: insights.concerns || [],
        suggestions: insights.suggestions || [],
        
        // Психологическое состояние
        needsEncouragement: stats?.adherenceRate < 70,
        needsMotivation: consecutiveDays === 0,
        celebrateSuccess: stats?.adherenceRate >= 90 || consecutiveDays > 7,
        
        // Индивидуальная статистика по лекарствам
        pillStats: stats?.pillStats || [],
        
        // Временные паттерны
        frequentDelays: (patterns.delays || []).length,
        timeConsistency: this.calculateTimeConsistency(patterns.delays || [])
      };
      
      return context;
    } catch (error) {
      console.error('Error creating user context:', error);
      return this.getDefaultContext(pills);
    }
  }
  
  // Получение предпочитаемого времени дня
  getPreferredTimeSlot(timeOfDay) {
    const slots = Object.entries(timeOfDay);
    if (slots.length === 0) return 'Morning';
    
    return slots.reduce((max, current) => 
      current[1] > max[1] ? current : max
    )[0];
  }
  
  // Получение самого активного дня
  getMostActiveDay(dayOfWeek) {
    const days = Object.entries(dayOfWeek);
    if (days.length === 0) return 'Monday';
    
    return days.reduce((max, current) => 
      current[1] > max[1] ? current : max
    )[0];
  }
  
  // Расчет консистентности времени приема
  calculateTimeConsistency(delays) {
    if (delays.length === 0) return 100;
    
    const onTimeCount = delays.filter(delay => Math.abs(delay.delayMinutes) <= 15).length;
    return Math.round((onTimeCount / delays.length) * 100);
  }
  
  // Контекст по умолчанию для новых пользователей
  getDefaultContext(pills) {
    return {
      totalMedications: pills.length,
      currentTime: new Date().toLocaleTimeString(),
      currentDate: new Date().toDateString(),
      adherenceRate: 100,
      isNewUser: true,
      needsGuidance: pills.length === 0
    };
  }
  
  // Создание персонализированных рекомендаций
  async generatePersonalizedRecommendations(userContext) {
    const recommendations = [];
    
    // Рекомендации на основе статистики
    if (userContext.adherenceRate < 80) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        title: 'Улучшение приема лекарств',
        message: `Ваш текущий уровень соблюдения: ${userContext.adherenceRate}%. Рекомендую установить дополнительные напоминания или попробовать принимать лекарства в более удобное время.`,
        action: 'Настроить напоминания'
      });
    }
    
    // Рекомендации по времени
    if (userContext.hasTimingIssues) {
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        title: 'Оптимизация расписания',
        message: `Замечаю частые задержки в приеме. Возможно, стоит пересмотреть время приема лекарств? Ваш самый активный период: ${userContext.preferredTimeSlot}`,
        action: 'Изменить расписание'
      });
    }
    
    // Поощрения за успехи
    if (userContext.celebrateSuccess) {
      recommendations.push({
        type: 'celebration',
        priority: 'positive',
        title: 'Поздравляем! 🎉',
        message: userContext.consecutiveDays > 7 
          ? `Невероятно! Вы принимаете лекарства ${userContext.consecutiveDays} дней подряд!`
          : `Отличная дисциплина! Уровень соблюдения: ${userContext.adherenceRate}%`,
        action: 'Продолжать в том же духе'
      });
    }
    
    // Мотивационные сообщения
    if (userContext.needsMotivation) {
      recommendations.push({
        type: 'motivation',
        priority: 'high',
        title: 'Мотивация',
        message: this.getRandomMessage(this.motivationalMessages),
        action: 'Начать новый день'
      });
    }
    
    // Рекомендации для новых пользователей
    if (userContext.isNewUser && userContext.needsGuidance) {
      recommendations.push({
        type: 'guidance',
        priority: 'high',
        title: 'Добро пожаловать!',
        message: 'Давайте начнем! Добавьте ваши лекарства, и я помогу вам создать идеальное расписание приема.',
        action: 'Добавить лекарство'
      });
    }
    
    return recommendations;
  }
  
  // Создание проактивных уведомлений
  async generateProactiveInsights(userContext) {
    const insights = [];
    
    // Анализ пропусков
    if (userContext.missedDoses > 3) {
      insights.push({
        type: 'concern',
        urgency: 'medium',
        message: `Замечаю, что вы пропустили ${userContext.missedDoses} доз за последнее время. Хотите поговорить о том, что затрудняет прием лекарств?`,
        suggestion: 'Давайте найдем решение вместе',
        emotionalSupport: true
      });
    }
    
    // Поддержка при низкой дисциплине
    if (userContext.adherenceRate < 60) {
      insights.push({
        type: 'support',
        urgency: 'high',
        message: 'Понимаю, что иногда бывает сложно не забывать о лекарствах. Это нормально! Каждый новый день - это возможность начать заново.',
        suggestion: 'Попробуйте связать прием лекарств с ежедневной привычкой',
        emotionalSupport: true,
        motivational: this.getRandomMessage(this.supportMessages)
      });
    }
    
    // Поощрение прогресса
    if (userContext.consecutiveDays >= 3 && userContext.consecutiveDays <= 7) {
      insights.push({
        type: 'encouragement',
        urgency: 'positive',
        message: `Прекрасно! ${userContext.consecutiveDays} дня подряд - это отличное начало привычки! 🌟`,
        suggestion: 'Продолжайте, и скоро это станет автоматическим',
        emotionalSupport: true
      });
    }
    
    // Предупреждения о паттернах
    if (userContext.mostActiveDay === 'Fri' && userContext.timeConsistency < 70) {
      insights.push({
        type: 'pattern',
        urgency: 'medium',
        message: 'Замечаю, что в выходные прием лекарств становится менее регулярным. Это довольно обычная ситуация!',
        suggestion: 'Установите дополнительные напоминания на выходные',
        emotionalSupport: false
      });
    }
    
    return insights;
  }
  
  // Психологическая поддержка
  async providePsychologicalSupport(userContext, userMessage = '') {
    const support = {
      empathy: '',
      encouragement: '',
      practical: '',
      motivation: ''
    };
    
    // Эмпатия
    if (userContext.needsEncouragement) {
      support.empathy = "Я понимаю, что иногда бывает трудно поддерживать регулярность приема лекарств. Вы не одиноки в этом, и ваши усилия имеют значение.";
    }
    
    // Поощрение
    if (userContext.adherenceRate > 0) {
      support.encouragement = `Вы уже показываете заботу о своем здоровье - это замечательно! Каждый принятый вовремя препарат - это шаг к лучшему самочувствию.`;
    }
    
    // Практические советы
    if (userContext.hasTimingIssues) {
      support.practical = "Попробуйте связать прием лекарств с повседневными действиями: утренний кофе, чистка зубов или просмотр новостей. Это поможет создать устойчивую привычку.";
    }
    
    // Мотивация
    if (userContext.consecutiveDays > 0) {
      support.motivation = `Ваш результат ${userContext.consecutiveDays} дней подряд показывает, что у вас есть сила воли! Это вдохновляет!`;
    } else {
      support.motivation = this.getRandomMessage(this.motivationalMessages);
    }
    
    return support;
  }
  
  // Получение случайного сообщения
  getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // Создание полного ИИ ответа с контекстом
  async createContextualResponse(userMessage, messageType, pills) {
    try {
      const userContext = await this.createUserContext(pills);
      const recommendations = await this.generatePersonalizedRecommendations(userContext);
      const insights = await this.generateProactiveInsights(userContext);
      const support = await this.providePsychologicalSupport(userContext, userMessage);
      
      return {
        userContext,
        recommendations,
        insights,
        support,
        hasPersonalData: userContext.totalMedications > 0,
        needsMotivation: userContext.needsMotivation,
        shouldCelebrate: userContext.celebrateSuccess
      };
    } catch (error) {
      console.error('Error creating contextual response:', error);
      return null;
    }
  }
}

// Экспорт singleton экземпляра
const aiAssistant = new AIAssistant();
export default aiAssistant;