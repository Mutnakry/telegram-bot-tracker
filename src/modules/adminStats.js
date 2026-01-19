const { userStorage, groupStorage } = require('../database/storage');
const { getUserStats } = require('./userTracker');
const { getGlobalStats, getMostActiveUsers, getMostActiveGroups } = require('./activityTracker');
const { getReferralStats } = require('./marketingTracker');
const { getAllBanned } = require('./security');

/**
 * Get comprehensive bot statistics
 */
function getBotStats() {
  const users = userStorage.getAllUsers();
  const groups = groupStorage.getAllGroups();
  const globalStats = getGlobalStats();
  const referralStats = getReferralStats();
  const bannedUsers = getAllBanned();
  
  // Calculate user statistics
  const totalUsers = Object.keys(users).length;
  const activeUsers = Object.values(users).filter(user => {
    if (!user.last_seen) return false;
    const daysSinceLastSeen = Math.floor(
      (Date.now() - new Date(user.last_seen).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastSeen <= 7;
  }).length;
  
  const inactiveUsers = totalUsers - activeUsers;
  
  // Calculate group statistics
  const totalGroups = Object.keys(groups).length;
  
  // Get top active users and groups
  const topUsers = getMostActiveUsers(10);
  const topGroups = getMostActiveGroups(10);
  
  // Language distribution
  const languageDistribution = {};
  Object.values(users).forEach(user => {
    const lang = user.language_code || 'unknown';
    languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
  });
  
  // Country distribution
  const countryDistribution = {};
  Object.values(users).forEach(user => {
    const country = user.country || 'unknown';
    countryDistribution[country] = (countryDistribution[country] || 0) + 1;
  });
  
  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      banned: Object.keys(bannedUsers).length
    },
    groups: {
      total: totalGroups
    },
    activity: {
      total_commands: Object.values(globalStats.commands || {}).reduce((a, b) => a + b, 0),
      total_buttons: Object.values(globalStats.buttons || {}).reduce((a, b) => a + b, 0),
      total_messages: globalStats.messages || 0,
      top_commands: Object.entries(globalStats.commands || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cmd, count]) => ({ command: cmd, count })),
      top_buttons: Object.entries(globalStats.buttons || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([btn, count]) => ({ button: btn, count }))
    },
    top_users: topUsers,
    top_groups: topGroups,
    language_distribution: languageDistribution,
    country_distribution: countryDistribution,
    referrals: referralStats
  };
}

/**
 * Get user statistics for admin
 */
function getUserStatsForAdmin(userId) {
  const userStats = getUserStats(userId);
  if (!userStats) return null;
  
  const { getUserActivity } = require('./activityTracker');
  const { getUserReferralSource } = require('./marketingTracker');
  const { getBanInfo } = require('./security');
  
  const activity = getUserActivity(userId);
  const referral = getUserReferralSource(userId);
  const banInfo = getBanInfo(userId);
  
  return {
    ...userStats,
    activity: activity || {
      commands: {},
      buttons: {},
      messages: 0,
      joins: [],
      leaves: []
    },
    referral: referral,
    banned: !!banInfo,
    ban_info: banInfo
  };
}

/**
 * Get group statistics for admin
 */
function getGroupStatsForAdmin(chatId) {
  const group = groupStorage.getGroup(chatId);
  if (!group) return null;
  
  const { getGroupActivity } = require('./activityTracker');
  const activity = getGroupActivity(chatId);
  
  return {
    ...group,
    activity: activity || {
      commands: {},
      buttons: {},
      messages: 0,
      joins: 0,
      leaves: 0,
      members: []
    }
  };
}

/**
 * Format statistics for display
 */
function formatStatsForDisplay(stats) {
  let text = '📊 **Bot Statistics**\n\n';
  
  // Users
  text += '👥 **Users:**\n';
  text += `   Total: ${stats.users.total}\n`;
  text += `   Active: ${stats.users.active}\n`;
  text += `   Inactive: ${stats.users.inactive}\n`;
  text += `   Banned: ${stats.users.banned}\n\n`;
  
  // Groups
  text += '👥 **Groups:**\n';
  text += `   Total: ${stats.groups.total}\n\n`;
  
  // Activity
  text += '📈 **Activity:**\n';
  text += `   Commands: ${stats.activity.total_commands}\n`;
  text += `   Buttons: ${stats.activity.total_buttons}\n`;
  text += `   Messages: ${stats.activity.total_messages}\n\n`;
  
  // Top Commands
  if (stats.activity.top_commands.length > 0) {
    text += '🔥 **Top Commands:**\n';
    stats.activity.top_commands.forEach((item, index) => {
      text += `   ${index + 1}. /${item.command}: ${item.count}\n`;
    });
    text += '\n';
  }
  
  // Top Users
  if (stats.top_users.length > 0) {
    text += '⭐ **Top Active Users:**\n';
    stats.top_users.slice(0, 5).forEach((user, index) => {
      text += `   ${index + 1}. User ${user.userId}: ${user.totalActivity} actions\n`;
    });
    text += '\n';
  }
  
  // Top Groups
  if (stats.top_groups.length > 0) {
    text += '🏆 **Top Active Groups:**\n';
    stats.top_groups.slice(0, 5).forEach((group, index) => {
      text += `   ${index + 1}. Group ${group.chatId}: ${group.totalActivity} actions\n`;
    });
    text += '\n';
  }
  
  // Referrals
  if (stats.referrals.total_links > 0) {
    text += '🔗 **Referrals:**\n';
    text += `   Total Links: ${stats.referrals.total_links}\n`;
    text += `   Total Clicks: ${stats.referrals.total_clicks}\n`;
    text += `   Unique Users: ${stats.referrals.total_unique_users}\n`;
  }
  
  return text;
}

module.exports = {
  getBotStats,
  getUserStatsForAdmin,
  getGroupStatsForAdmin,
  formatStatsForDisplay
};
