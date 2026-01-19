const { referralStorage } = require('../database/storage');
const crypto = require('crypto');

/**
 * Generate a referral link ID
 */
function generateReferralLink(source) {
  const linkId = crypto.randomBytes(8).toString('hex');
  referralStorage.createReferralLink(linkId, source);
  return linkId;
}

/**
 * Track referral link click
 */
function trackReferralClick(linkId, userId) {
  return referralStorage.trackReferralClick(linkId, userId);
}

/**
 * Get referral link information
 */
function getReferralLink(linkId) {
  return referralStorage.getReferralLink(linkId);
}

/**
 * Get user's referral source
 */
function getUserReferralSource(userId) {
  return referralStorage.getUserReferral(userId);
}

/**
 * Get all referral statistics
 */
function getReferralStats() {
  const referrals = referralStorage.getAllReferrals();
  const links = referrals.links || {};
  
  const stats = {
    total_links: Object.keys(links).length,
    total_clicks: 0,
    total_unique_users: 0,
    links: []
  };
  
  const uniqueUsers = new Set();
  
  for (const [linkId, linkData] of Object.entries(links)) {
    stats.total_clicks += linkData.clicks || 0;
    linkData.users?.forEach(userId => uniqueUsers.add(userId));
    
    stats.links.push({
      link_id: linkId,
      source: linkData.source,
      clicks: linkData.clicks || 0,
      unique_users: linkData.users?.length || 0,
      created_at: linkData.created_at
    });
  }
  
  stats.total_unique_users = uniqueUsers.size;
  stats.links.sort((a, b) => b.clicks - a.clicks);
  
  return stats;
}

/**
 * Parse referral link from start command
 * Format: /start REFERRAL_ID
 */
function parseReferralFromStart(text) {
  const parts = text.split(' ');
  if (parts.length > 1) {
    return parts[1].trim();
  }
  return null;
}

module.exports = {
  generateReferralLink,
  trackReferralClick,
  getReferralLink,
  getUserReferralSource,
  getReferralStats,
  parseReferralFromStart
};
