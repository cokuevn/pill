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
        title: 'Medication Adherence Improvement',
        message: `Your current adherence level: ${userContext.adherenceRate}%. I recommend setting additional reminders or trying to take medications at a more convenient time.`,
        action: 'Set up reminders'
      });
    }
    
    // Рекомендации по времени
    if (userContext.hasTimingIssues) {
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        title: 'Schedule Optimization',
        message: `I notice frequent delays in taking medications. Perhaps you should reconsider the timing? Your most active period: ${userContext.preferredTimeSlot}`,
        action: 'Adjust schedule'
      });
    }
    
    // Поощрения за успехи
    if (userContext.celebrateSuccess) {
      recommendations.push({
        type: 'celebration',
        priority: 'positive',
        title: 'Congratulations! 🎉',
        message: userContext.consecutiveDays > 7 
          ? `Amazing! You've been taking medications ${userContext.consecutiveDays} days in a row!`
          : `Excellent discipline! Adherence rate: ${userContext.adherenceRate}%`,
        action: 'Keep up the great work'
      });
    }
    
    // Мотивационные сообщения
    if (userContext.needsMotivation) {
      recommendations.push({
        type: 'motivation',
        priority: 'high',
        title: 'Motivation',
        message: this.getRandomMessage(this.motivationalMessages),
        action: 'Start a new day'
      });
    }
    
    // Рекомендации для новых пользователей
    if (userContext.isNewUser && userContext.needsGuidance) {
      recommendations.push({
        type: 'guidance',
        priority: 'high',
        title: 'Welcome!',
        message: 'Let\'s get started! Add your medications, and I\'ll help you create the perfect medication schedule.',
        action: 'Add medication'
      });
    }
    
    return recommendations;
  }
  
  // Создание проактивных уведомлений
  async generateProactiveInsights(userContext) {
    const insights = [];
    
    // Анализ пропусков - более умная логика
    if (userContext.missedDoses > 3) {
      // Проверяем, не новые ли это лекарства
      const hasNewMedications = userContext.pillStats.some(stat => stat.daysSincePillAdded <= 1);
      
      if (!hasNewMedications) {
        insights.push({
          type: 'concern',
          urgency: 'medium',
          message: `I notice you've missed ${userContext.missedDoses} doses recently. Would you like to talk about what's making it difficult to take medications?`,
          suggestion: 'Let\'s find a solution together',
          emotionalSupport: true
        });
      } else {
        // Для новых лекарств - более мягкое сообщение
        insights.push({
          type: 'guidance',
          urgency: 'low',
          message: 'I see you\'re just getting started with your medication routine. That\'s great! Building a habit takes time.',
          suggestion: 'Set reminders and be patient with yourself as you build this healthy habit',
          emotionalSupport: true
        });
      }
    }
    
    // Поддержка при низкой дисциплине
    if (userContext.adherenceRate < 60) {
      insights.push({
        type: 'support',
        urgency: 'high',
        message: 'I understand that sometimes it can be hard to remember medications. That\'s normal! Every new day is a chance to start fresh.',
        suggestion: 'Try linking medication intake with a daily habit',
        emotionalSupport: true,
        motivational: this.getRandomMessage(this.supportMessages)
      });
    }
    
    // Поощрение прогресса
    if (userContext.consecutiveDays >= 3 && userContext.consecutiveDays <= 7) {
      insights.push({
        type: 'encouragement',
        urgency: 'positive',
        message: `Excellent! ${userContext.consecutiveDays} days in a row - that's a great start to building a habit! 🌟`,
        suggestion: 'Keep going, and it will soon become automatic',
        emotionalSupport: true
      });
    }
    
    // Предупреждения о паттернах
    if (userContext.mostActiveDay === 'Fri' && userContext.timeConsistency < 70) {
      insights.push({
        type: 'pattern',
        urgency: 'medium',
        message: 'I notice that medication intake becomes less regular on weekends. This is quite common!',
        suggestion: 'Set additional reminders for weekends',
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
      support.empathy = "I understand that sometimes it can be difficult to maintain regular medication intake. You're not alone in this, and your efforts matter.";
    }
    
    // Поощрение
    if (userContext.adherenceRate > 0) {
      support.encouragement = `You're already showing care for your health - that's wonderful! Every medication taken on time is a step towards better well-being.`;
    }
    
    // Практические советы
    if (userContext.hasTimingIssues) {
      support.practical = "Try linking medication intake with daily activities: morning coffee, brushing teeth, or checking the news. This helps create a sustainable habit.";
    }
    
    // Мотивация
    if (userContext.consecutiveDays > 0) {
      support.motivation = `Your result of ${userContext.consecutiveDays} consecutive days shows you have willpower! That's inspiring!`;
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