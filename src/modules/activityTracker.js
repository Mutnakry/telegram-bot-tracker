const { activityStorage } = require('../database/storage');
const { updateUserLastSeen } = require('./userTracker');

/**
 * Track command usage
 */
function trackCommand(userId, command, chatId = null, chatTitle = null) {
  updateUserLastSeen(userId);
  
  activityStorage.addActivity(userId, 'command', { command });
  
  if (chatId) {
    activityStorage.addGroupActivity(chatId, 'command', { command });
  }
  
  return true;
}

/**
 * Track button click
 */
function trackButton(userId, buttonId, chatId = null) {
  updateUserLastSeen(userId);
  
  activityStorage.addActivity(userId, 'button', { button: buttonId });
  
  if (chatId) {
    activityStorage.addGroupActivity(chatId, 'button', { button: buttonId });
  }
  
  return true;
}

/**
 * Track message
 */
function trackMessage(userId, chatId = null) {
  updateUserLastSeen(userId);
  
  activityStorage.addActivity(userId, 'message', {});
  
  if (chatId) {
    activityStorage.addGroupActivity(chatId, 'message', {});
  }
  
  return true;
}

/**
 * Track user join group
 */
function trackJoin(userId, chatId, chatTitle) {
  updateUserLastSeen(userId);
  
  activityStorage.addActivity(userId, 'join', { chatId, chatTitle });
  activityStorage.addGroupActivity(chatId, 'join', { userId });
  
  return true;
}

/**
 * Track user leave group
 */
function trackLeave(userId, chatId, chatTitle) {
  updateUserLastSeen(userId);
  
  activityStorage.addActivity(userId, 'leave', { chatId, chatTitle });
  activityStorage.addGroupActivity(chatId, 'leave', { userId });
  
  return true;
}

/**
 * Get user activity
 */
function getUserActivity(userId) {
  return activityStorage.getUserActivity(userId);
}

/**
 * Get group activity
 */
function getGroupActivity(chatId) {
  return activityStorage.getGroupActivity(chatId);
}

/**
 * Get global statistics
 */
function getGlobalStats() {
  return activityStorage.getGlobalStats();
}

/**
 * Get most active users
 */
function getMostActiveUsers(limit = 10) {
  const activities = activityStorage.load();
  const users = activities.users || {};
  
  const userStats = Object.entries(users).map(([userId, activity]) => {
    const totalActivity = 
      Object.values(activity.commands || {}).reduce((a, b) => a + b, 0) +
      Object.values(activity.buttons || {}).reduce((a, b) => a + b, 0) +
      (activity.messages || 0);
    
    return {
      userId,
      totalActivity,
      commands: activity.commands || {},
      buttons: activity.buttons || {},
      messages: activity.messages || 0,
      joins: activity.joins?.length || 0,
      leaves: activity.leaves?.length || 0
    };
  });
  
  return userStats
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .slice(0, limit);
}

/**
 * Get most active groups
 */
function getMostActiveGroups(limit = 10) {
  const activities = activityStorage.load();
  const groups = activities.groups || {};
  
  const groupStats = Object.entries(groups).map(([chatId, activity]) => {
    // Handle members array (converted from Set for JSON)
    const membersCount = Array.isArray(activity.members) 
      ? activity.members.length 
      : (activity.members?.size || 0);
    
    const totalActivity = 
      Object.values(activity.commands || {}).reduce((a, b) => a + b, 0) +
      Object.values(activity.buttons || {}).reduce((a, b) => a + b, 0) +
      (activity.messages || 0) +
      (activity.joins || 0);
    
    return {
      chatId,
      totalActivity,
      commands: activity.commands || {},
      buttons: activity.buttons || {},
      messages: activity.messages || 0,
      joins: activity.joins || 0,
      leaves: activity.leaves || 0,
      members: membersCount
    };
  });
  
  return groupStats
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .slice(0, limit);
}

module.exports = {
  trackCommand,
  trackButton,
  trackMessage,
  trackJoin,
  trackLeave,
  getUserActivity,
  getGroupActivity,
  getGlobalStats,
  getMostActiveUsers,
  getMostActiveGroups
};
