const { bannedStorage, rateLimitStorage } = require('../database/storage');

// Rate limit configurations
const RATE_LIMITS = {
  commands: { limit: 20, windowMs: 60000 }, // 20 commands per minute
  messages: { limit: 30, windowMs: 60000 }, // 30 messages per minute
  buttons: { limit: 50, windowMs: 60000 }, // 50 button clicks per minute
  spam: { limit: 10, windowMs: 60000 } // 10 actions per minute for spam detection
};

/**
 * Check if user is banned
 */
function isBanned(userId) {
  return bannedStorage.isBanned(userId);
}

/**
 * Get ban information
 */
function getBanInfo(userId) {
  return bannedStorage.getBanInfo(userId);
}

/**
 * Ban a user
 */
function banUser(userId, reason, bannedBy) {
  return bannedStorage.banUser(userId, reason, bannedBy);
}

/**
 * Unban a user
 */
function unbanUser(userId) {
  return bannedStorage.unbanUser(userId);
}

/**
 * Get all banned users
 */
function getAllBanned() {
  return bannedStorage.getAllBanned();
}

/**
 * Check rate limit for an action
 */
function checkRateLimit(userId, action) {
  const config = RATE_LIMITS[action] || RATE_LIMITS.spam;
  return rateLimitStorage.checkRateLimit(
    userId, 
    action, 
    config.limit, 
    config.windowMs
  );
}

/**
 * Reset rate limit for a user
 */
function resetRateLimit(userId, action) {
  return rateLimitStorage.resetRateLimit(userId, action);
}

/**
 * Detect potential spammer based on activity patterns
 */
function detectSpammer(userId, activityData) {
  // Check message rate
  const messageRate = checkRateLimit(userId, 'messages');
  if (!messageRate.allowed) {
    return {
      isSpammer: true,
      reason: 'Message rate limit exceeded',
      details: messageRate
    };
  }
  
  // Check command rate
  const commandRate = checkRateLimit(userId, 'commands');
  if (!commandRate.allowed) {
    return {
      isSpammer: true,
      reason: 'Command rate limit exceeded',
      details: commandRate
    };
  }
  
  // Check button click rate
  const buttonRate = checkRateLimit(userId, 'buttons');
  if (!buttonRate.allowed) {
    return {
      isSpammer: true,
      reason: 'Button click rate limit exceeded',
      details: buttonRate
    };
  }
  
  // Additional spam detection logic can be added here
  // e.g., checking for repetitive messages, suspicious patterns, etc.
  
  return {
    isSpammer: false
  };
}

/**
 * Check if user can perform action (not banned and within rate limits)
 */
function canPerformAction(userId, action) {
  // Check if banned
  if (isBanned(userId)) {
    return {
      allowed: false,
      reason: 'User is banned',
      banInfo: getBanInfo(userId)
    };
  }
  
  // Check rate limit
  const rateLimit = checkRateLimit(userId, action);
  if (!rateLimit.allowed) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      rateLimit
    };
  }
  
  return {
    allowed: true,
    rateLimit
  };
}

module.exports = {
  isBanned,
  getBanInfo,
  banUser,
  unbanUser,
  getAllBanned,
  checkRateLimit,
  resetRateLimit,
  detectSpammer,
  canPerformAction,
  RATE_LIMITS
};
