const { userStorage } = require('../database/storage');

/**
 * Track user when they start the bot
 */
function trackUserStart(userId, userData, referralLinkId = null) {
  const existingUser = userStorage.getUser(userId);
  
  const userInfo = {
    user_id: userId,
    username: userData.username || null,
    first_name: userData.first_name || null,
    last_name: userData.last_name || null,
    language_code: userData.language_code || null,
    is_bot: userData.is_bot || false,
    first_seen: existingUser?.first_seen || new Date().toISOString(),
    last_seen: new Date().toISOString(),
    start_count: (existingUser?.start_count || 0) + 1,
    referral_link: referralLinkId || existingUser?.referral_link || null
  };
  
  // Approximate country from language code
  if (userInfo.language_code) {
    userInfo.country = getCountryFromLanguageCode(userInfo.language_code);
  }
  
  userStorage.saveUser(userId, userInfo);
  
  return userInfo;
}

/**
 * Update user's last seen timestamp
 */
function updateUserLastSeen(userId) {
  const user = userStorage.getUser(userId);
  if (user) {
    userStorage.saveUser(userId, {
      last_seen: new Date().toISOString()
    });
  }
}

/**
 * Get user information
 */
function getUserInfo(userId) {
  return userStorage.getUser(userId);
}

/**
 * Get all users
 */
function getAllUsers() {
  return userStorage.getAllUsers();
}

/**
 * Approximate country from language code
 * This is a simple mapping - can be enhanced with more accurate geolocation
 */
function getCountryFromLanguageCode(languageCode) {
  if (!languageCode) return null;
  
  const lang = languageCode.toLowerCase().split('-')[0];
  const countryMap = {
    'en': 'US/UK',
    'es': 'ES/MX',
    'fr': 'FR',
    'de': 'DE',
    'it': 'IT',
    'pt': 'PT/BR',
    'ru': 'RU',
    'zh': 'CN',
    'ja': 'JP',
    'ko': 'KR',
    'ar': 'AR',
    'hi': 'IN',
    'th': 'TH',
    'vi': 'VN',
    'id': 'ID',
    'ms': 'MY',
    'km': 'KH', // Khmer/Cambodia
    'lo': 'LA',
    'my': 'MM'
  };
  
  return countryMap[lang] || languageCode.toUpperCase();
}

/**
 * Get user statistics
 */
function getUserStats(userId) {
  const user = getUserInfo(userId);
  if (!user) return null;
  
  const firstSeen = new Date(user.first_seen);
  const lastSeen = new Date(user.last_seen);
  const daysSinceFirstSeen = Math.floor((Date.now() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLastSeen = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    ...user,
    days_since_first_seen: daysSinceFirstSeen,
    days_since_last_seen: daysSinceLastSeen,
    is_active: daysSinceLastSeen <= 7 // Active if seen within 7 days
  };
}

module.exports = {
  trackUserStart,
  updateUserLastSeen,
  getUserInfo,
  getAllUsers,
  getUserStats,
  getCountryFromLanguageCode
};
